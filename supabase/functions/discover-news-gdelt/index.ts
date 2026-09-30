import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const TRUSTED: Record<string, { tier: 1 | 2; type: string; reliability: number }> = {
  // Tier 2 — specialist/business media with a direct RSS feed (also polled live in fetch-news)
  "datacenterdynamics.com": { tier: 2, type: "specialist_media", reliability: 92 },
  "datacenterknowledge.com": { tier: 2, type: "specialist_media", reliability: 90 },
  "capacitymedia.com": { tier: 2, type: "specialist_media", reliability: 88 },
  "blocksandfiles.com": { tier: 2, type: "specialist_media", reliability: 82 },
  "servethehome.com": { tier: 2, type: "specialist_media", reliability: 80 },
  "theregister.com": { tier: 2, type: "established_business_media", reliability: 86 },
  // Tier 2 — established business media, no direct feed; reached only via GDELT discovery
  "reuters.com": { tier: 2, type: "established_business_media", reliability: 96 },
  "gulfbusiness.com": { tier: 2, type: "established_business_media", reliability: 82 },
  "arabianbusiness.com": { tier: 2, type: "established_business_media", reliability: 82 },
  "meed.com": { tier: 2, type: "established_business_media", reliability: 88 },
  "zawya.com": { tier: 2, type: "established_business_media", reliability: 84 },
  // Tier 1 — cloud/technology provider primary sources
  "news.microsoft.com": { tier: 1, type: "primary", reliability: 98 },
  "aws.amazon.com": { tier: 1, type: "primary", reliability: 98 },
  "cloud.google.com": { tier: 1, type: "primary", reliability: 98 },
  "blogs.oracle.com": { tier: 1, type: "primary", reliability: 97 },
  "equinix.com": { tier: 1, type: "primary", reliability: 95 },
  "digitalrealty.com": { tier: 1, type: "primary", reliability: 95 },
  // Tier 1 — Middle East operators and ecosystem companies
  "meeza.net": { tier: 1, type: "primary", reliability: 90 },
  "khazna.ae": { tier: 1, type: "primary", reliability: 90 },
  "g42.ai": { tier: 1, type: "primary", reliability: 90 },
  "center3.com": { tier: 1, type: "primary", reliability: 90 },
  "core42.ai": { tier: 1, type: "primary", reliability: 90 },
  "eand.com": { tier: 1, type: "primary", reliability: 92 },
  "data-volt.com": { tier: 1, type: "primary", reliability: 88 },
  "morohub.com": { tier: 1, type: "primary", reliability: 88 },
  "gulfdatahub.ae": { tier: 1, type: "primary", reliability: 85 },
  "gbiinc.com": { tier: 1, type: "primary", reliability: 82 },
  "global.ntt": { tier: 1, type: "primary", reliability: 90 },
};

const QUERIES = [
  '"data center" (UAE OR Dubai OR Saudi OR Riyadh OR Qatar OR Bahrain OR Oman OR Kuwait)',
  '(hyperscale OR colocation OR "cloud region") (Middle East OR Gulf OR GCC OR Saudi OR UAE)',
  '(Khazna OR G42 OR MEEZA OR DataVolt OR Center3 OR Core42 OR "e&" OR "Moro Hub" OR "Gulf Data Hub") data center',
  '(data center OR datacentre) (power OR cooling OR renewable OR AI) Middle East',
  '(Equinix OR "Digital Realty" OR NTT OR "Gulf Bridge International") (Middle East OR Gulf OR UAE OR Saudi OR Qatar)',
];

function policyFor(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const match = Object.entries(TRUSTED).find(([domain]) => host === domain || host.endsWith(`.${domain}`));
  return match ? { domain: match[0], ...match[1] } : null;
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
