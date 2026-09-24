import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const normalize = (value: string | null | undefined) => (value || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const has = (text: string, value: string | null | undefined) => !!value && normalize(text).includes(normalize(value));

async function fetchSource(url: string) {
  if (!/^https?:\/\//i.test(url)) return { ok: false, status: null, body: "", error: "unsupported_url" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal, headers: { "User-Agent": "DataCenterPulseVerifier/1.0" } });
    return { ok: response.ok, status: response.status, body: (await response.text()).slice(0, 120_000), error: null };
  } catch (error) {
    return { ok: false, status: null, body: "", error: error instanceof Error ? error.message : "fetch_failed" };
  } finally { clearTimeout(timeout); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: sources, error } = await db.from("data_center_sources").select("id, data_center_id, source_url, source_name, observed_capacity_mw, observed_lifecycle_stage, data_centers(canonical_name, operator_name, country, city)").eq("review_status", "pending").limit(100);
    if (error) throw error;
    let checked = 0; let queued = 0; let accepted = 0;
    for (const source of sources || []) {
      if (!source.source_url) continue;
      const dc = Array.isArray(source.data_centers) ? source.data_centers[0] : source.data_centers;
      const result = await fetchSource(source.source_url);
      const body = `${source.source_name}\n${result.body}`;
      const checks = { source_reachable: result.ok, facility_name_found: has(body, dc?.canonical_name), operator_found: has(body, dc?.operator_name), city_found: has(body, dc?.city), capacity_supported: source.observed_capacity_mw != null };
      const score = (checks.source_reachable ? 30 : 0) + (checks.facility_name_found ? 30 : 0) + (checks.operator_found ? 15 : 0) + (checks.city_found ? 10 : 0) + (checks.capacity_supported ? 15 : 0);
      const acceptedResult = score >= 75;
      await db.from("data_center_sources").update({ checked_at: new Date().toISOString(), automated_score: score, review_status: acceptedResult ? "accepted" : "pending" }).eq("id", source.id);
      await db.from("data_centers").update({ verification_score: score, verification_status: acceptedResult ? "verified" : "needs_review", last_verified_at: new Date().toISOString(), ...(acceptedResult && source.observed_capacity_mw != null ? { capacity_mw: source.observed_capacity_mw, capacity_status: "reported", capacity_basis: "it_load" } : {}) }).eq("id", source.data_center_id);
      if (!acceptedResult) {
        await db.from("data_center_review_queue").upsert({ data_center_id: source.data_center_id, source_id: source.id, status: "pending", reason: "Automated source check did not meet the acceptance threshold." }, { onConflict: "data_center_id,source_id" });
        queued++;
      } else accepted++;
      checked++;
    }
    return new Response(JSON.stringify({ ok: true, checked, accepted, queued_for_review: queued }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers });
  }
});
