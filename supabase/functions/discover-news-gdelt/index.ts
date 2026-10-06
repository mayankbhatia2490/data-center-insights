import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};
const QUERIES = [
  '"data center" (UAE OR Dubai OR Saudi OR Riyadh OR Qatar OR Bahrain OR Oman OR Kuwait)',
  '(hyperscale OR colocation OR "cloud region") (Middle East OR Gulf OR GCC OR Saudi OR UAE)',
  '(Khazna OR G42 OR MEEZA OR DataVolt OR Center3 OR Core42 OR "e&" OR "Moro Hub" OR "Gulf Data Hub") data center',
  '(data center OR datacentre) (power OR cooling OR renewable OR AI) Middle East',
  '(Equinix OR "Digital Realty" OR NTT OR "Gulf Bridge International") (Middle East OR Gulf OR UAE OR Saudi OR Qatar)',
];

async function requireCronSecret(req: Request): Promise<Response | null> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: expected, error } = await db.rpc("get_cron_secret");
  if (error || !expected || expected !== provided) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  return null;
}
function cleanTitle(value: string) { return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500); }
function parseSeenDate(value: string | undefined) {
  if (!value) return null;
  const normalized = String(value).replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).*$/, "$1-$2-$3T$4:$5:$6Z");
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const authError = await requireCronSecret(req);
  if (authError) return authError;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    const { data: registry, error: registryError } = await supabase.from("news_sources").select("domain,source_tier,source_type,reliability_score,is_active,allowed_for_auto_publish").eq("is_active", true).limit(200);
    if (registryError) throw registryError;
    const policies = new Map((registry || []).map((row: any) => [row.domain, row]));
    let discovered = 0;
    let trusted = 0;
    let quarantined = 0;
    for (const query of QUERIES) {
      const params = new URLSearchParams({ query, mode: "artlist", format: "json", maxrecords: "75", sort: "datedesc", timespan: "24h" });
      const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, { headers: { "User-Agent": "DataCenterPulse/2.1" } });
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of data.articles || []) {
        if (!item.url || !item.title) continue;
        let hostname = "";
        try { hostname = new URL(item.url).hostname.toLowerCase().replace(/^www\./, ""); } catch { continue; }
        const exact = policies.get(hostname);
        const policy = exact || [...policies.entries()].find(([domain]) => hostname.endsWith(`.${domain}`))?.[1];
        const published = parseSeenDate(item.seendate);
        if (!policy) {
          const { error } = await supabase.from("news_candidate_quarantine").upsert({ discovery_source: "gdelt", discovered_url: item.url, source_domain: hostname, title: cleanTitle(item.title), published_at: published, reason: "Domain is not active in public.news_sources", raw_payload: item }, { onConflict: "discovery_source,discovered_url", ignoreDuplicates: true });
          if (!error) quarantined++;
          continue;
        }
        const row = { discovery_source: "gdelt", discovered_url: item.url, canonical_url: item.url, title: cleanTitle(item.title), summary: cleanTitle(item.title), source_domain: policy.domain || hostname, source_tier: policy.source_tier, source_type: policy.source_type, source_reliability_score: policy.reliability_score, published_at: published, candidate_status: "discovered", raw_payload: item };
        const { error } = await supabase.from("news_candidates").upsert(row, { onConflict: "discovery_source,discovered_url", ignoreDuplicates: true });
        if (!error) { discovered++; trusted++; }
      }
    }
    return new Response(JSON.stringify({ ok: true, discovered, trusted_candidates: trusted, quarantined, approved_domains: policies.size }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("GDELT discovery failed:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
