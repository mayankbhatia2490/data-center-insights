import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const allowedFields = new Set(["capacity_mw", "full_ambition_mw", "capacity_basis", "lifecycle_stage", "operator_name", "latitude", "longitude", "location_precision", "estimated_energization"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Authentication required" }), { status: 401, headers });
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers });
    const { data: admin } = await db.from("admin_users").select("user_id").eq("user_id", userData.user.id).maybeSingle();
    if (!admin) return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers });
    const body = await req.json();
    const claimId = String(body.claim_id || "");
    const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : "dismiss";
    const notes = typeof body.notes === "string" ? body.notes.slice(0, 2000) : null;
    if (!claimId) return new Response(JSON.stringify({ error: "claim_id is required" }), { status: 400, headers });
    const { data: claim, error: claimError } = await db.from("research_claims").select("id,data_center_id,field_name,proposed_value,unit,evidence_excerpt,extraction_confidence,source_document_id,review_status,research_review_tasks(id,status)").eq("id", claimId).single();
    if (claimError || !claim) return new Response(JSON.stringify({ error: "Claim not found" }), { status: 404, headers });
    if (!allowedFields.has(claim.field_name)) return new Response(JSON.stringify({ error: "Field is not promotable" }), { status: 400, headers });
    if (claim.review_status !== "pending") return new Response(JSON.stringify({ error: "Claim already decided" }), { status: 409, headers });
    const task = Array.isArray(claim.research_review_tasks) ? claim.research_review_tasks[0] : claim.research_review_tasks;
    if (decision !== "approve") {
      await db.from("research_claims").update({ review_status: decision === "reject" ? "rejected" : "dismissed", updated_at: new Date().toISOString() }).eq("id", claim.id);
      if (task?.id) await db.from("research_review_tasks").update({ status: decision === "reject" ? "rejected" : "dismissed", reviewer_notes: notes, reviewed_by: userData.user.id, reviewed_at: new Date().toISOString() }).eq("id", task.id);
      await db.from("research_audit_log").insert({ claim_id: claim.id, task_id: task?.id || null, actor_type: "human", actor_id: userData.user.id, action: decision, detail: { notes } });
      return new Response(JSON.stringify({ ok: true, decision }), { headers });
    }
    const { data: previous } = await db.from("research_observations").select("id").eq("data_center_id", claim.data_center_id).eq("field_name", claim.field_name).is("valid_until", null).order("approved_at", { ascending: false }).limit(1).maybeSingle();
    const { data: observation, error: observationError } = await db.from("research_observations").insert({ data_center_id: claim.data_center_id, claim_id: claim.id, field_name: claim.field_name, value: claim.proposed_value, unit: claim.unit, evidence_excerpt: claim.evidence_excerpt, verification_status: "approved", confidence_score: Math.max(0, Math.min(100, claim.extraction_confidence || 0)), observed_at: new Date().toISOString(), approved_by: userData.user.id, supersedes_observation_id: previous?.id || null }).select("id").single();
    if (observationError) throw observationError;
    const update: Record<string, unknown> = {};
    if (claim.field_name === "capacity_mw") update.capacity_mw = Number(claim.proposed_value), update.capacity_status = "reported";
    else if (claim.field_name === "full_ambition_mw") update.full_ambition_mw = Number(claim.proposed_value);
    else update[claim.field_name] = claim.proposed_value;
    update.updated_at = new Date().toISOString();
    const { error: facilityError } = await db.from("data_centers").update(update).eq("id", claim.data_center_id);
    if (facilityError) throw facilityError;
    await db.from("research_claims").update({ review_status: "approved", validation_status: "passed", updated_at: new Date().toISOString() }).eq("id", claim.id);
    if (task?.id) await db.from("research_review_tasks").update({ status: "approved", reviewer_notes: notes, reviewed_by: userData.user.id, reviewed_at: new Date().toISOString() }).eq("id", task.id);
    await db.from("research_audit_log").insert({ claim_id: claim.id, task_id: task?.id || null, actor_type: "human", actor_id: userData.user.id, action: "approve", detail: { notes, observation_id: observation.id, field_name: claim.field_name } });
    return new Response(JSON.stringify({ ok: true, decision: "approve", observation_id: observation.id }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers });
  }
});
