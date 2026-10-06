import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

async function requireCronSecret(req: Request): Promise<Response | null> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: expected, error } = await db.rpc("get_cron_secret");
  if (error || !expected || expected !== provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}

function clean(value: string) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
}
function tag(xml: string, name: string) {
  return xml.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"))?.[1]?.trim() || "";
}
function parseFeed(xml: string, source: any, lookbackDays: number) {
  const atom = source.domain === "theregister.com";
  return xml.split(atom ? "<entry" : "<item").slice(1, 31).flatMap((chunk: string) => {
    const title = clean(tag(chunk, "title"));
    const link = atom ? chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "" : clean(tag(chunk, "link") || tag(chunk, "guid"));
    const summary = clean(tag(chunk, atom ? "summary" : "description") || tag(chunk, "content")).slice(0, 700);
    const date = new Date(tag(chunk, atom ? "published" : "pubDate") || (atom ? tag(chunk, "updated") : ""));
    if (!title || title.length < 12 || !link || Number.isNaN(date.getTime())) return [];
    const age = (Date.now() - date.getTime()) / 86400000;
    if (age < -1 || age > lookbackDays) return [];
    try {
      const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      if (!(host === source.domain || host.endsWith(`.${source.domain}`))) return [];
    } catch { return []; }
    return [{
      discovery_source: "rss",
      discovered_url: link,
      canonical_url: link,
      title,
      summary: summary || title,
      source_domain: source.domain,
      source_tier: source.source_tier,
      source_type: source.source_type,
      source_reliability_score: source.reliability_score,
      published_at: date.toISOString(),
      candidate_status: "discovered",
      raw_payload: { source: source.source_name, feed: source.feed_url },
    }];
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authError = await requireCronSecret(req);
  if (authError) return authError;
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const lookbackDays = Number(Deno.env.get("NEWS_FEED_LOOKBACK_DAYS") || 45);
  try {
    const { data: sources, error: sourceError } = await db.from("news_sources").select("source_name,domain,feed_url,source_tier,source_type,reliability_score,is_active,direct_monitor,consecutive_failures").eq("is_active", true).eq("direct_monitor", true).not("feed_url", "is", null).limit(100);
    if (sourceError) throw sourceError;
    const results: any[] = [];
    let discovered = 0;
    for (const source of sources || []) {
      const started = Date.now();
      try {
        const response = await fetch(source.feed_url, { headers: { "User-Agent": "DataCenterPulse/2.1" } });
        const xml = await response.text();
        if (!response.ok || !/<(?:rss|feed|channel)/i.test(xml)) throw new Error(`HTTP ${response.status}; non-XML response`);
        const rows = parseFeed(xml, source, lookbackDays);
        for (const row of rows) {
          const { error } = await db.from("news_candidates").upsert(row, { onConflict: "discovery_source,discovered_url", ignoreDuplicates: true });
          if (!error) discovered++;
        }
        await db.from("news_sources").update({ last_checked_at: new Date().toISOString(), last_http_status: response.status, last_feed_error: null, last_item_count: rows.length, last_success_at: new Date().toISOString(), consecutive_failures: 0, updated_at: new Date().toISOString() }).eq("domain", source.domain);
        results.push({ source: source.source_name, ok: true, http_status: response.status, items_in_window: rows.length, latency_ms: Date.now() - started });
      } catch (error) {
        const message = String(error);
        await db.from("news_sources").update({ last_checked_at: new Date().toISOString(), last_feed_error: message.slice(0, 500), consecutive_failures: (source.consecutive_failures || 0) + 1, updated_at: new Date().toISOString() }).eq("domain", source.domain);
        results.push({ source: source.source_name, ok: false, error: message, latency_ms: Date.now() - started });
      }
    }
    return new Response(JSON.stringify({ ok: true, source_count: sources?.length || 0, lookback_days: lookbackDays, discovered, feeds: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("fetch-news failed", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
