import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";
import { callAI } from "../_shared/aiClient.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

// Same normalize/tokens/overlap shape as enrich-data-center-coordinates, so
// name matching reads the same way across the data_centers pipeline.
const normalize = (v: string | null | undefined) => (v || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const tokens = (v: string | null | undefined) => normalize(v).split(" ").filter((x) => x.length > 2);
const overlap = (a: string, b: string) => { const aa = new Set(tokens(a)); const bb = new Set(tokens(b)); return [...aa].filter((x) => bb.has(x)).length; };

const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Qatar", "Oman", "Bahrain", "Egypt", "Kuwait"];
const LLM_LIFECYCLE_STAGES = ["announced", "planned", "under_construction", "operational", "on_hold", "cancelled", "unknown"];
const CONFIDENCE_SCORE: Record<string, number> = { high: 80, medium: 55, low: 30 };
const CONFIDENCE_SEED_SCORE: Record<string, number> = { high: 40, medium: 25, low: 10 };

interface Candidate {
  name: string;
  aliases?: string[];
  country?: string;
  city_region?: string | null;
  operators?: string[];
  partners?: string[];
  lifecycle_stage?: string;
  capacity_mw?: number | null;
  full_ambition_mw?: number | null;
  power_source?: string;
  power_notes?: string | null;
  estimated_energization?: string | null;
  snippet?: string;
  source_url?: string;
  confidence?: string;
}

interface ExistingDC {
  id: string;
  canonical_name: string;
  aliases: string[] | null;
  operator_name: string | null;
  operators: string[] | null;
  city: string | null;
  lifecycle_stage: string;
  capacity_mw: number | null;
  verification_status: string;
  verification_score: number;
}

const EXTRACTION_SYSTEM = `You are a precise data-center intelligence extractor focused only on the Middle East (${COUNTRIES.join(", ")}).

Extract every data-center or AI-compute facility/campus mention from the article snippets below that names a specific project. Ignore mentions that are only about a cloud "region" with no physical facility described.

Return ONLY a valid JSON array (no markdown, no prose). Each object:
{
  "name": string,
  "aliases": string[],
  "country": ${COUNTRIES.map((c) => `"${c}"`).join("|")}|"OTHER",
  "city_region": string|null,
  "operators": string[],
  "partners": string[],
  "lifecycle_stage": ${LLM_LIFECYCLE_STAGES.map((s) => `"${s}"`).join("|")},
  "capacity_mw": number|null,
  "full_ambition_mw": number|null,
  "power_source": "gas"|"solar"|"nuclear"|"mixed"|"unknown",
  "power_notes": string|null,
  "estimated_energization": string|null,
  "snippet": "exact supporting sentence",
  "source_url": string,
  "confidence": "high"|"medium"|"low"
}

Rules (strict):
- Prefer IT-load / compute capacity in MW. If only total power or "gigawatt-scale" language is used, set capacity_mw to null and put the claim in power_notes.
- If a multi-phase or multi-GW campus is mentioned, extract the nearest concrete phase as capacity_mw AND the full campus ambition as full_ambition_mw.
- confidence = "high" only if name, capacity, and lifecycle_stage are all explicit in the text. Otherwise "medium" or "low".
- country must be one of the listed values; use "OTHER" for anything outside this region.
- If nothing qualifies, return [].`;

const MERGE_SYSTEM = `You are the final authority on data-center project identity for a Middle East facility tracker.

Given one EXISTING record and one NEW candidate mention, decide whether they describe the same physical project and how the record should change.

Return ONLY valid JSON:
{
  "same_project": boolean,
  "reason": string,
  "new_lifecycle_stage": ${LLM_LIFECYCLE_STAGES.map((s) => `"${s}"`).join("|")}|null,
  "new_capacity_mw": number|null,
  "new_estimated_energization": string|null,
  "confidence": "high"|"medium"|"low",
  "action": "update"|"ignore"|"create_new"
}

Rules:
- "update" only when same_project is true and the new mention adds or changes something (stage, capacity, or energization date).
- "ignore" when same_project is true but the new mention adds nothing new.
- "create_new" when same_project is false, even if the name or operator looked similar.
- Never invent a stage or capacity number not supported by the new mention; use null to mean "no change".`;

function parseJsonArray(raw: string): any[] {
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

function parseJsonObject(raw: string): any {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch {
    return null;
  }
}

function scoreMatch(candidate: Candidate, existing: ExistingDC): number {
  const candidateNames = [candidate.name, ...(candidate.aliases || [])].join(" ");
  const existingNames = [existing.canonical_name, ...(existing.aliases || [])];
  const nameOverlap = Math.max(0, ...existingNames.map((n) => overlap(candidateNames, n)));
  const nameScore = Math.min(55, nameOverlap * 18);

  const candidateOperators = candidate.operators || [];
  const existingOperators = [existing.operator_name, ...(existing.operators || [])].filter(Boolean) as string[];
  const operatorScore = candidateOperators.some((op) => existingOperators.some((eo) => overlap(op, eo) > 0)) ? 20 : 0;

  const cityScore = candidate.city_region && existing.city && overlap(candidate.city_region, existing.city) > 0 ? 10 : 0;

  let capacityScore = 0;
  if (typeof candidate.capacity_mw === "number" && typeof existing.capacity_mw === "number" && existing.capacity_mw > 0) {
    const diff = Math.abs(candidate.capacity_mw - existing.capacity_mw) / existing.capacity_mw;
    capacityScore = diff <= 0.25 ? 15 : diff <= 0.5 ? 7 : 0;
  }

  return nameScore + operatorScore + cityScore + capacityScore;
}

function sourceNameFromUrl(url?: string): string {
  if (!url) return "AI extraction";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "AI extraction";
  }
}

function unionArrays(a: string[] | null | undefined, b: string[] | undefined): string[] {
  return [...new Set([...(a || []), ...(b || [])].filter(Boolean))];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });

  const authError = await requireCronSecret(req, headers);
  if (authError) return authError;

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: articles, error: articlesError } = await db
      .from("articles")
      .select("title, summary, source_url")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(50);
    if (articlesError) throw articlesError;

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No recent articles" }), { headers });
    }

    const extractionRaw = await callAI([
      { role: "system", content: EXTRACTION_SYSTEM },
      { role: "user", content: JSON.stringify(articles.map((a) => ({ title: a.title, summary: (a.summary || "").slice(0, 400), source_url: a.source_url }))) },
    ]);

    const candidates: Candidate[] = parseJsonArray(extractionRaw).filter(
      (c) => c?.name && COUNTRIES.includes(c.country)
    );

    let created = 0, updated = 0, ignored = 0, guarded = 0;

    for (const candidate of candidates) {
      const { data: sameCountry, error: dcError } = await db
        .from("data_centers")
        .select("id, canonical_name, aliases, operator_name, operators, city, lifecycle_stage, capacity_mw, verification_status, verification_score")
        .eq("country", candidate.country)
        .limit(200);
      if (dcError) throw dcError;

      let best: { dc: ExistingDC; score: number } | null = null;
      for (const dc of (sameCountry || []) as ExistingDC[]) {
        const score = scoreMatch(candidate, dc);
        if (!best || score > best.score) best = { dc, score };
      }

      const sourceName = sourceNameFromUrl(candidate.source_url);
      const confidenceScore = CONFIDENCE_SCORE[candidate.confidence || "low"] ?? 30;

      if (!best || best.score < 55) {
        // No good match: this is a new facility candidate, not an update to
        // something already tracked.
        const seedScore = CONFIDENCE_SEED_SCORE[candidate.confidence || "low"] ?? 10;
        const { data: inserted, error: insertError } = await db
          .from("data_centers")
          .upsert(
            {
              canonical_name: candidate.name,
              aliases: candidate.aliases || [],
              operators: candidate.operators || [],
              operator_name: candidate.operators?.[0] || null,
              partners: candidate.partners || [],
              country: candidate.country,
              city: candidate.city_region || null,
              lifecycle_stage: LLM_LIFECYCLE_STAGES.includes(candidate.lifecycle_stage || "") ? candidate.lifecycle_stage : "unknown",
              capacity_mw: candidate.capacity_mw ?? null,
              full_ambition_mw: candidate.full_ambition_mw ?? null,
              capacity_basis: candidate.capacity_mw != null ? (candidate.confidence === "high" ? "it_load" : "estimated") : null,
              capacity_status: candidate.capacity_mw != null ? (candidate.confidence === "high" ? "reported" : "estimated") : candidate.full_ambition_mw != null ? "announced" : "not_disclosed",
              power_source: candidate.power_source || "unknown",
              power_notes: candidate.power_notes || null,
              estimated_energization: candidate.estimated_energization || null,
              extraction_confidence: candidate.confidence || "low",
              verification_status: "needs_review",
              verification_score: seedScore,
              location_precision: "undisclosed",
            },
            { onConflict: "canonical_name,country", ignoreDuplicates: true }
          )
          .select("id")
          .maybeSingle();
        if (insertError) { console.error("insert error", insertError); continue; }
        if (inserted?.id) {
          await db.from("data_center_sources").insert({
            data_center_id: inserted.id,
            source_url: candidate.source_url || null,
            source_name: sourceName,
            source_type: "industry",
            evidence_excerpt: candidate.snippet || null,
            observed_capacity_mw: candidate.capacity_mw ?? null,
            observed_lifecycle_stage: candidate.lifecycle_stage || null,
            automated_score: confidenceScore,
            review_status: "pending",
          });
          created++;
        }
        continue;
      }

      // Plausible match: let the LLM make the same-project / merge call
      // rather than auto-applying on a fuzzy score alone.
      const decisionRaw = await callAI([
        { role: "system", content: MERGE_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            existing: {
              name: best.dc.canonical_name,
              operator: best.dc.operator_name,
              city: best.dc.city,
              lifecycle_stage: best.dc.lifecycle_stage,
              capacity_mw: best.dc.capacity_mw,
            },
            candidate,
          }),
        },
      ]);
      const decision = parseJsonObject(decisionRaw);

      if (!decision || decision.action === "ignore") {
        ignored++;
        continue;
      }

      if (decision.action === "create_new") {
        // LLM judged the fuzzy-matched record to actually be a different
        // project; fall through to a fresh insert with a non-conflicting
        // canonical_name (append operator/city to disambiguate).
        const disambiguated = candidate.operators?.[0] ? `${candidate.name} (${candidate.operators[0]})` : candidate.name;
        const seedScore = CONFIDENCE_SEED_SCORE[candidate.confidence || "low"] ?? 10;
        const { error: insertError } = await db.from("data_centers").upsert(
          {
            canonical_name: disambiguated,
            aliases: candidate.aliases || [],
            operators: candidate.operators || [],
            operator_name: candidate.operators?.[0] || null,
            partners: candidate.partners || [],
            country: candidate.country,
            city: candidate.city_region || null,
            lifecycle_stage: LLM_LIFECYCLE_STAGES.includes(candidate.lifecycle_stage || "") ? candidate.lifecycle_stage : "unknown",
            capacity_mw: candidate.capacity_mw ?? null,
            full_ambition_mw: candidate.full_ambition_mw ?? null,
            capacity_status: candidate.capacity_mw != null ? "estimated" : "not_disclosed",
            power_source: candidate.power_source || "unknown",
            estimated_energization: candidate.estimated_energization || null,
            extraction_confidence: candidate.confidence || "low",
            verification_status: "needs_review",
            verification_score: seedScore,
            location_precision: "undisclosed",
          },
          { onConflict: "canonical_name,country", ignoreDuplicates: true }
        );
        if (!insertError) created++;
        continue;
      }

      // action === "update": guard against a low-confidence mention
      // overwriting a record that already passed automated verification.
      if (best.dc.verification_status === "verified" && best.dc.verification_score >= 75 && decision.confidence === "low") {
        await db.from("data_center_sources").insert({
          data_center_id: best.dc.id,
          source_url: candidate.source_url || null,
          source_name: sourceName,
          source_type: "industry",
          evidence_excerpt: candidate.snippet || null,
          observed_capacity_mw: candidate.capacity_mw ?? null,
          observed_lifecycle_stage: candidate.lifecycle_stage || null,
          automated_score: confidenceScore,
          review_status: "pending",
        });
        guarded++;
        continue;
      }

      const patch: Record<string, unknown> = {
        aliases: unionArrays(best.dc.aliases, candidate.aliases),
        operators: unionArrays(best.dc.operators, candidate.operators),
        extraction_confidence: decision.confidence,
        updated_at: new Date().toISOString(),
      };
      const stageChanged = decision.new_lifecycle_stage && decision.new_lifecycle_stage !== best.dc.lifecycle_stage;
      if (stageChanged) patch.lifecycle_stage = decision.new_lifecycle_stage;
      if (typeof decision.new_capacity_mw === "number") {
        patch.capacity_mw = decision.new_capacity_mw;
        patch.capacity_status = decision.confidence === "high" ? "reported" : "estimated";
      }
      if (decision.new_estimated_energization) patch.estimated_energization = decision.new_estimated_energization;

      const { error: updateError } = await db.from("data_centers").update(patch).eq("id", best.dc.id);
      if (updateError) { console.error("update error", updateError); continue; }

      const { data: sourceRow } = await db
        .from("data_center_sources")
        .insert({
          data_center_id: best.dc.id,
          source_url: candidate.source_url || null,
          source_name: sourceName,
          source_type: "industry",
          evidence_excerpt: candidate.snippet || null,
          observed_capacity_mw: candidate.capacity_mw ?? null,
          observed_lifecycle_stage: candidate.lifecycle_stage || null,
          automated_score: confidenceScore,
          review_status: "pending",
        })
        .select("id")
        .maybeSingle();

      if (stageChanged) {
        await db.from("data_center_status_history").insert({
          data_center_id: best.dc.id,
          lifecycle_stage: decision.new_lifecycle_stage,
          source_id: sourceRow?.id || null,
          note: decision.reason || null,
        });
      }
      updated++;
    }

    return new Response(
      JSON.stringify({ ok: true, articles_scanned: articles.length, candidates: candidates.length, created, updated, ignored, guarded }),
      { headers }
    );
  } catch (error) {
    console.error("discover-data-centers error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers });
  }
});
