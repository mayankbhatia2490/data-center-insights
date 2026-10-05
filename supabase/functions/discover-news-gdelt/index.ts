import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "./_shared/cronAuth.ts";
import { sourceForHost } from "./_shared/sourceRegistry.ts";

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

function policyFor(hostname: string) {
  const policy = sourceForHost(hostname);
  return policy ? { domain: policy.domain, tier: policy.tier, type: policy.type, reliability: policy.reliability } : null;
}

function cleanTitle(value: string): string {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authError = await requireCronSecret(req, corsHeaders);
    if (authError) return authError;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let discovered = 0;
    let trusted = 0;

    for (const query of QUERIES) {
      const params = new URLSearchParams({ query, mode: "artlist", format: "json", maxrecords: "75", sort: "datedesc", timespan: "24h" });
      const response = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`, { headers: { "User-Agent": "DataCenterPulse/2.0" } });
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of data.articles || []) {
        if (!item.url || !item.title) continue;
        let hostname = "";
        try { hostname = new URL(item.url).hostname.toLowerCase().replace(/^www\./, ""); } catch { continue; }
        const policy = policyFor(hostname);
        const published = item.seendate ? new Date(String(item.seendate).replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2}).*$/, "$1-$2-$3T$4:$5:$6Z")) : null;
        const row = {
          discovery_source: "gdelt",
          discovered_url: item.url,
          canonical_url: item.url,
          title: cleanTitle(item.title),
          summary: cleanTitle(item.title),
          source_domain: policy?.domain || hostname,
          source_tier: policy?.tier || null,
          source_type: policy?.type || "discovery",
          source_reliability_score: policy?.reliability || null,
          published_at: published && !Number.isNaN(published.getTime()) ? published.toISOString() : null,
          candidate_status: "discovered",
          raw_payload: item,
        };
        const { error } = await supabase.from("news_candidates").upsert(row, { onConflict: "discovery_source,discovered_url", ignoreDuplicates: true });
        if (!error) {
          discovered++;
          if (policy) trusted++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, discovered, trusted_candidates: trusted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("GDELT discovery failed:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
