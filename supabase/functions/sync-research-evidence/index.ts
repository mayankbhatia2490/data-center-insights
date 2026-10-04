import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret" };
const sha256 = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const numberValue = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const confidenceFor = (score: number) => Math.max(0, Math.min(100, score || 0));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  const authError = await requireCronSecret(req, headers);
  if (authError) return authError;
  const started = new Date().toISOString();
  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: run, error: runError } = await db.from("research_runs").insert({ run_type: "source_sync", status: "running", mode: "live", started_at: started }).select("id").single();
    if (runError) throw runError;
    const { data: sources, error: sourceError } = await db.from("data_center_sources").select("id,data_center_id,source_url,source_name,source_type,source_title,evidence_excerpt,observed_capacity_mw,observed_lifecycle_stage,automated_score,review_status,created_at,data_centers(id,canonical_name,country,city,operator_name)").order("created_at", { ascending: false }).limit(250);
    if (sourceError) throw sourceError;
    let documents = 0, claims = 0, flagged = 0;
    for (const source of sources || []) {
      const dc = Array.isArray(source.data_centers) ? source.data_centers[0] : source.data_centers;
      if (!dc || !source.evidence_excerpt) continue;
      const canonicalUrl = source.source_url || `data-center-source://${source.id}`;
      const material = `${canonicalUrl}\n${source.source_title || ""}\n${source.evidence_excerpt}`;
      const contentHash = await sha256(material);
      const { data: document, error: documentError } = await db.from("source_documents").upsert({ source_url: canonicalUrl, canonical_url: canonicalUrl, source_name: source.source_name, source_type: source.source_type, source_tier: source.source_type === "operator" || source.source_type === "government" || source.source_type === "regulatory" ? 1 : 2, title: source.source_title, publisher: source.source_name, content_text: source.evidence_excerpt, evidence_excerpt: source.evidence_excerpt, content_hash: contentHash, http_status: source.source_url ? 200 : null, fetch_status: "fetched", discovered_by: "data_center_sources", retrieved_at: new Date().toISOString() }, { onConflict: "canonical_url,content_hash" }).select("id").single();
      if (documentError) { console.error("document", documentError); continue; }
      documents++;
      const values: Array<{ field_name: string; value: unknown; unit?: string }> = [];
      const capacity = numberValue(source.observed_capacity_mw);
      if (capacity !== null) values.push({ field_name: "capacity_mw", value: capacity, unit: "MW" });
      if (source.observed_lifecycle_stage) values.push({ field_name: "lifecycle_stage", value: source.observed_lifecycle_stage });
      if (!values.length) continue;
      for (const item of values) {
        const normalized = JSON.stringify(item.value);
        const { data: claim, error: claimError } = await db.from("research_claims").upsert({ source_document_id: document.id, data_center_id: dc.id, entity_name: dc.canonical_name, field_name: item.field_name, proposed_value: item.value, normalized_value: item.value, unit: item.unit || null, evidence_excerpt: source.evidence_excerpt, extraction_confidence: confidenceFor(source.automated_score), match_confidence: 100, validation_status: source.automated_score >= 75 ? "passed" : "needs_review", review_status: "pending", conflict_status: "not_checked", prompt_version: "deterministic-source-bridge-v1", run_id: run.id, updated_at: new Date().toISOString() }, { onConflict: "source_document_id,data_center_id,field_name" }).select("id,validation_status").single();
        if (claimError) { console.error("claim", claimError); continue; }
        claims++;
        const reason = source.automated_score >= 75 ? "Source-backed claim is ready for editorial approval." : "Automated source score is below the approval threshold.";
        const priority = item.field_name === "capacity_mw" || item.field_name === "lifecycle_stage" ? 85 : 60;
        const { error: taskError } = await db.from("research_review_tasks").upsert({ claim_id: claim.id, task_type: source.automated_score >= 75 ? "claim_review" : "conflict_review", priority, status: "pending", reason }, { onConflict: "claim_id" });
        if (taskError) console.error("task", taskError);
        if (source.automated_score < 75) flagged++;
        await db.from("research_audit_log").insert({ claim_id: claim.id, actor_type: "automation", action: "claim_synced", detail: { source_id: source.id, field_name: item.field_name, score: source.automated_score, normalized } });
      }
    }
    await db.from("research_runs").update({ status: "completed", records_seen: sources?.length || 0, records_created: claims, records_flagged: flagged, finished_at: new Date().toISOString() }).eq("id", run.id);
    return new Response(JSON.stringify({ ok: true, run_id: run.id, source_rows: sources?.length || 0, documents, claims, flagged }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers });
  }
});
