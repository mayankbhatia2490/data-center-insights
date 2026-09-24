import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const OVERPASS = "https://overpass-api.de/api/interpreter";
const COUNTRY_BBOX: Record<string, string> = {
  "Saudi Arabia": "16,34,32,56", "United Arab Emirates": "22,51,27,57", Qatar: "24,50,27,52",
  Bahrain: "25,50,27,51", Kuwait: "28,46,31,49", Oman: "16,52,27,60"
};
const normalize = (v: string | null | undefined) => (v || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (v: string | null | undefined) => normalize(v).split(" ").filter((x) => x.length > 2);
const overlap = (a: string, b: string) => { const aa = new Set(tokens(a)); const bb = new Set(tokens(b)); return [...aa].filter((x) => bb.has(x)).length; };

async function queryOverpass(bbox: string) {
  const q = `[out:json][timeout:45];(nwr["telecom"="data_center"](${bbox});nwr["man_made"="data_center"](${bbox});nwr["name"~"data.?center|datacentre|data park",i](${bbox}););out center tags;`;
  const response = await fetch(OVERPASS, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "DataCenterInsights/1.0" }, body: `data=${encodeURIComponent(q)}` });
  if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
  return await response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: facilities, error } = await db.from("data_centers").select("id,canonical_name,operator_name,country,city,latitude,longitude,address").is("latitude", null).in("country", Object.keys(COUNTRY_BBOX)).limit(100);
    if (error) throw error;
    const byCountry = new Map<string, any[]>();
    for (const f of facilities || []) byCountry.set(f.country, [...(byCountry.get(f.country) || []), f]);
    let queried = 0, candidates = 0, enriched = 0;
    for (const [country, missing] of byCountry) {
      const payload = await queryOverpass(COUNTRY_BBOX[country]); queried++;
      const elements = Array.isArray(payload.elements) ? payload.elements : [];
      for (const f of missing) {
        let best: any = null; let bestScore = 0;
        for (const e of elements) {
          const t = e.tags || {}; const name = t.name || t["name:en"] || ""; const op = t.operator || t.owner || "";
          const score = Math.min(60, overlap(f.canonical_name, name) * 20) + (f.operator_name && overlap(f.operator_name, op) > 0 ? 20 : 0) + (f.city && overlap(f.city, `${name} ${t["addr:city"] || ""}`) > 0 ? 10 : 0) + (t.telecom === "data_center" || t.man_made === "data_center" ? 10 : 0);
          if (score > bestScore) bestScore = score, best = { e, name, op };
        }
        if (!best || bestScore < 60) continue;
        const lat = best.e.lat ?? best.e.center?.lat; const lon = best.e.lon ?? best.e.center?.lon;
        if (typeof lat !== "number" || typeof lon !== "number") continue;
        candidates++;
        const excerpt = `OSM/Overpass candidate: ${best.name}${best.op ? `; operator ${best.op}` : ""}; match score ${bestScore}.`;
        const { data: source } = await db.from("data_center_sources").insert({ data_center_id: f.id, source_url: OVERPASS, source_name: "OpenStreetMap via Overpass API", source_type: "manual_research", source_title: best.name, evidence_excerpt: excerpt, automated_score: bestScore, review_status: "pending" }).select("id").single();
        await db.from("data_centers").update({ latitude: lat, longitude: lon, location_precision: "approximate", verification_status: "needs_review", updated_at: new Date().toISOString() }).eq("id", f.id).is("latitude", null);
        if (source?.id) await db.from("data_center_review_queue").upsert({ data_center_id: f.id, source_id: source.id, status: "pending", reason: "Overpass supplied a candidate coordinate; human confirmation required." }, { onConflict: "data_center_id,source_id" });
        enriched++;
      }
    }
    return new Response(JSON.stringify({ ok: true, queried_countries: queried, candidates, enriched, note: "Coordinates are never treated as exact and remain pending human review." }), { headers });
  } catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers }); }
});
