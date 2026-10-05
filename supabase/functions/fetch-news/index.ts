import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const SOURCES = [
  { name: "Khazna Data Centers", domain: "khaznadatacenters.com", feed: "https://khaznadatacenters.com/feed/", tier: 1, type: "primary", reliability: 94 },
  { name: "MEEZA", domain: "meeza.net", feed: "https://www.meeza.net/category/news-and-press-releases/feed/", tier: 1, type: "primary", reliability: 92 },
  { name: "Data Center Dynamics", domain: "datacenterdynamics.com", feed: "https://www.datacenterdynamics.com/en/rss/", tier: 2, type: "specialist_media", reliability: 92 },
  { name: "Data Center Knowledge", domain: "datacenterknowledge.com", feed: "https://www.datacenterknowledge.com/rss.xml", tier: 2, type: "specialist_media", reliability: 90 },
  { name: "Capacity Media", domain: "capacitymedia.com", feed: "https://www.capacitymedia.com/feed", tier: 2, type: "specialist_media", reliability: 88 },
  { name: "The Register", domain: "theregister.com", feed: "https://www.theregister.com/data_centre/headlines.atom", tier: 2, type: "established_business_media", reliability: 86 },
];
const LOOKBACK_DAYS = Number(Deno.env.get("NEWS_FEED_LOOKBACK_DAYS") || 45);

async function requireCronSecret(req: Request): Promise<Response | null> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: expected, error } = await db.rpc("get_cron_secret");
  if (error || !expected || expected !== provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}

function clean(value: string) { return String(value || "").replace(/<[^>]*>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim(); }
function tag(xml: string, name: string) { return xml.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"))?.[1]?.trim() || ""; }
function parseFeed(xml: string, source: typeof SOURCES[number]) {
  const atom = source.domain === "theregister.com";
  return xml.split(atom ? "<entry" : "<item").slice(1, 31).flatMap((chunk) => {
    const title = clean(tag(chunk, "title"));
    const link = atom ? chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "" : clean(tag(chunk, "link") || tag(chunk, "guid"));
    const summary = clean(tag(chunk, atom ? "summary" : "description") || tag(chunk, "content")).slice(0, 700);
    const dateText = tag(chunk, atom ? "published" : "pubDate") || (atom ? tag(chunk, "updated") : "");
    const date = new Date(dateText);
    if (!title || title.length < 12 || !link || Number.isNaN(date.getTime())) return [];
    const age = (Date.now() - date.getTime()) / 86400000;
    if (age < -1 || age > LOOKBACK_DAYS) return [];
    try {
      const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      if (!(host === source.domain || host.endsWith(`.${source.domain}`))) return [];
    } catch { return []; }
    return [{ discovery_source: "rss", discovered_url: link, canonical_url: link, title, summary: summary || title, source_domain: source.domain, source_tier: source.tier, source_type: source.type, source_reliability_score: source.reliability, published_at: date.toISOString(), candidate_status: "discovered", raw_payload: { source: source.name, feed: source.feed } }];
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authError = await requireCronSecret(req);
  if (authError) return authError;
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const results: any[] = [];
    let discovered = 0;
    for (const source of SOURCES) {
      const started = Date.now();
      try {
        const response = await fetch(source.feed, { headers: { "User-Agent": "DataCenterPulse/2.0" } });
        const xml = await response.text();
        if (!response.ok || !/<(?:rss|feed|channel)/i.test(xml)) throw new Error(`HTTP ${response.status}; non-XML response`);
        const rows = parseFeed(xml, source);
        for (const row of rows) {
          const { error } = await db.from("news_candidates").upsert(row, { onConflict: "discovery_source,discovered_url", ignoreDuplicates: true });
          if (!error) discovered++;
        }
        results.push({ source: source.name, ok: true, http_status: response.status, items_in_window: rows.length, latency_ms: Date.now() - started });
      } catch (error) {
        console.error(`Feed failed: ${source.name}`, error);
        results.push({ source: source.name, ok: false, error: String(error), latency_ms: Date.now() - started });
      }
    }
    return new Response(JSON.stringify({ ok: true, lookback_days: LOOKBACK_DAYS, discovered, feeds: results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("fetch-news failed", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
