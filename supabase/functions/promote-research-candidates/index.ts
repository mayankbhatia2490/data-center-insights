import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "./_shared/cronAuth.ts";

/**
 * Promote trusted discovery candidates into the evidence-first research pipeline.
 *
 * Safety rules:
 * - Only candidates with a non-null source_tier are processed.
 * - The original page is fetched and preserved as source_documents.
 * - Only existing facilities with a strong entity match receive claims.
 * - No data_center row is updated here.
 * - Every claim remains review_status = pending.
 * - New/unmatched facilities are left for discover-data-centers/manual review.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const MAX_CANDIDATES = 50;
const MAX_FACILITIES = 2500;
const MAX_PAGE_BYTES = 1_500_000;
const MIN_MATCH_SCORE = 58;
const USER_AGENT = "DataCenterPulseResearch/1.0 (+evidence pipeline)";

const COUNTRY_ALIASES: Record<string, string[]> = {
  "United Arab Emirates": ["uae", "united arab emirates", "dubai", "abu dhabi", "abudhabi", "jebel ali"],
  "Saudi Arabia": ["saudi", "saudi arabia", "riyadh", "jeddah", "dammam", "neom"],
  Qatar: ["qatar", "doha"],
  Bahrain: ["bahrain", "manama"],
  Oman: ["oman", "muscat", "salalah"],
  Kuwait: ["kuwait", "kuwait city"],
  India: ["india", "mumbai", "delhi", "hyderabad", "chennai", "bengaluru", "bangalore", "pune"],
};

type Candidate = {
  id: string;
  canonical_url: string;
  discovered_url: string;
  title: string | null;
  summary: string | null;
  source_domain: string | null;
  source_tier: number | null;
  source_type: string | null;
  source_reliability_score: number | null;
  published_at: string | null;
  raw_payload: Record<string, unknown> | null;
};

type Facility = {
  id: string;
  canonical_name: string;
  country: string;
  city: string | null;
  operator_name: string | null;
  aliases: string[] | null;
  operators: string[] | null;
  lifecycle_stage: string | null;
};

type ExtractedClaim = {
  field_name: "capacity_mw" | "lifecycle_stage" | "operator_name" | "estimated_energization";
  proposed_value: unknown;
  unit: string | null;
  excerpt: string;
  confidence: number;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function cleanText(value: unknown, max = 12000): string {
  return String(value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function htmlMeta(html: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return cleanText(match[1], 1000);
  }
  return null;
}

function pageTitle(html: string): string | null {
  return htmlMeta(html, "og:title") || html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || null;
}

function parsePublishedAt(html: string, fallback: string | null): string | null {
  const value = htmlMeta(html, "article:published_time") || htmlMeta(html, "datePublished") || htmlMeta(html, "pubdate");
  if (value && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  if (fallback && !Number.isNaN(Date.parse(fallback))) return new Date(fallback).toISOString();
  return null;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(data|center|centre|dc|the|and|of|for|project|facility)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: unknown): Set<string> {
  return new Set(normalize(value).split(" ").filter((token) => token.length >= 3));
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / Math.max(1, Math.min(a.size, b.size));
}

function countryMention(text: string, country: string): boolean {
  const lower = text.toLowerCase();
  return (COUNTRY_ALIASES[country] || [country.toLowerCase()]).some((alias) => lower.includes(alias));
}

function matchFacility(candidate: Candidate, text: string, facilities: Facility[]): { facility: Facility; score: number } | null {
  const haystack = `${candidate.title || ""} ${candidate.summary || ""} ${text}`;
  const candidateTokens = tokens(haystack);
  let best: { facility: Facility; score: number } | null = null;

  for (const facility of facilities) {
    const names = [facility.canonical_name, ...(facility.aliases || []), ...(facility.operators || []), facility.operator_name || ""];
    const nameScore = Math.max(...names.map((name) => overlap(candidateTokens, tokens(name))), 0);
    const cityScore = facility.city && candidateTokens.size && haystack.toLowerCase().includes(facility.city.toLowerCase()) ? 18 : 0;
    const countryScore = countryMention(haystack, facility.country) ? 12 : 0;
    const operatorScore = facility.operator_name && haystack.toLowerCase().includes(facility.operator_name.toLowerCase()) ? 25 : 0;
    const score = Math.round(Math.min(100, nameScore * 60 + cityScore + countryScore + operatorScore));
    if (!best || score > best.score) best = { facility, score };
  }
  return best && best.score >= MIN_MATCH_SCORE ? best : null;
}

function evidenceExcerpt(text: string, regex: RegExp, fallback: string): string {
  const match = text.match(regex);
  if (!match?.index) return fallback.slice(0, 900);
  const start = Math.max(0, match.index - 220);
  return text.slice(start, Math.min(text.length, match.index + match[0].length + 420)).trim().slice(0, 900);
}

function extractClaims(text: string, facility: Facility, matchScore: number): ExtractedClaim[] {
  const claims: ExtractedClaim[] = [];
  const capacity = text.match(/\b(\d{1,5}(?:\.\d+)?)\s*(MW|megawatts?)\b/gi);
  if (capacity?.length) {
    const values = capacity.map((item) => Number(item.match(/\d+(?:\.\d+)?/)?.[0])).filter((value) => Number.isFinite(value) && value > 0 && value < 100000);
    const value = values[0];
    if (value) claims.push({ field_name: "capacity_mw", proposed_value: value, unit: "MW", excerpt: evidenceExcerpt(text, /\b\d{1,5}(?:\.\d+)?\s*(?:MW|megawatts?)\b/i, text), confidence: Math.min(92, 55 + Math.round(matchScore * 0.25)) });
  }

  const lifecyclePatterns: Array<[RegExp, string]> = [
    [/under construction|construction has begun|being built|groundbreaking/i, "under_construction"],
    [/planned|proposed|will build|announced project|to be developed/i, "planned"],
    [/operational|in operation|now live|opened|launched|online/i, "operational"],
    [/expansion|being expanded|phase [two2]|second phase/i, "expansion"],
  ];
  for (const [pattern, stage] of lifecyclePatterns) {
    if (pattern.test(text)) {
      claims.push({ field_name: "lifecycle_stage", proposed_value: stage, unit: null, excerpt: evidenceExcerpt(text, pattern, text), confidence: Math.min(88, 52 + Math.round(matchScore * 0.25)) });
      break;
    }
  }

  const energization = text.match(/(?:operational|online|energiz(?:ed|ation)|launch(?:ed)?|open(?:ed)?)\D{0,80}(20\d{2})/i) || text.match(/(?:by|in|during)\s+(20\d{2})/i);
  if (energization?.[1]) {
    const year = Number(energization[1]);
    if (year >= 2020 && year <= 2040) claims.push({ field_name: "estimated_energization", proposed_value: `${year}-01-01`, unit: null, excerpt: evidenceExcerpt(text, /20\d{2}/, text), confidence: Math.min(78, 48 + Math.round(matchScore * 0.2)) });
  }

  if (facility.operator_name && text.toLowerCase().includes(facility.operator_name.toLowerCase())) {
    claims.push({ field_name: "operator_name", proposed_value: facility.operator_name, unit: null, excerpt: evidenceExcerpt(text, new RegExp(facility.operator_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), text), confidence: Math.min(94, 65 + Math.round(matchScore * 0.25)) });
  }
  return claims;
}

async function fetchPage(url: string): Promise<{ html: string; status: number; finalUrl: string }> {
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" }, redirect: "follow" });
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > MAX_PAGE_BYTES) throw new Error("page_too_large");
  const reader = response.body?.getReader();
  if (!reader) return { html: await response.text(), status: response.status, finalUrl: response.url };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_PAGE_BYTES) {
    const part = await reader.read();
    if (part.done) break;
    chunks.push(part.value);
    total += part.value.length;
    if (total >= MAX_PAGE_BYTES) break;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return { html: new TextDecoder().decode(bytes), status: response.status, finalUrl: response.url };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  const authError = await requireCronSecret(req, CORS_HEADERS);
  if (authError) return authError;

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const startedAt = new Date().toISOString();
  let runId: string | null = null;

  try {
    const { data: run, error: runError } = await db.from("research_runs").insert({ run_type: "claim_extraction", status: "running", mode: "live", started_at: startedAt, metadata: { function: "promote-research-candidates", version: "v1" } }).select("id").single();
    if (runError) throw runError;
    runId = run.id;

    const { data: candidates, error: candidateError } = await db.from("news_candidates").select("id,canonical_url,discovered_url,title,summary,source_domain,source_tier,source_type,source_reliability_score,published_at,raw_payload").eq("candidate_status", "discovered").not("source_tier", "is", null).order("published_at", { ascending: false }).limit(MAX_CANDIDATES);
    if (candidateError) throw candidateError;

    const { data: facilities, error: facilityError } = await db.from("data_centers").select("id,canonical_name,country,city,operator_name,aliases,operators,lifecycle_stage").limit(MAX_FACILITIES);
    if (facilityError) throw facilityError;

    let processed = 0, documents = 0, matched = 0, claims = 0, skipped = 0, failed = 0;

    for (const candidate of (candidates || []) as Candidate[]) {
      processed++;
      try {
        const url = candidate.canonical_url || candidate.discovered_url;
        if (!url) { skipped++; continue; }
        const page = await fetchPage(url);
        if (page.status < 200 || page.status >= 400) { skipped++; await db.from("news_candidates").update({ candidate_status: "rejected", failure_reason: `original_http_${page.status}`, validated_at: new Date().toISOString() }).eq("id", candidate.id); continue; }
        const title = pageTitle(page.html) || candidate.title || "Untitled source";
        const text = cleanText(page.html);
        if (text.length < 120) { skipped++; continue; }
        const canonicalUrl = page.finalUrl || url;
        const contentHash = await sha256(`${canonicalUrl}\n${title}\n${text}`);
        const publishedAt = parsePublishedAt(page.html, candidate.published_at);
        const { data: document, error: documentError } = await db.from("source_documents").upsert({ source_url: url, canonical_url: canonicalUrl, source_name: candidate.source_domain, source_type: candidate.source_type || "discovery", source_tier: candidate.source_tier, title, publisher: candidate.source_domain, published_at: publishedAt, retrieved_at: new Date().toISOString(), content_text: text, evidence_excerpt: text.slice(0, 900), content_hash: contentHash, http_status: page.status, fetch_status: "fetched", discovered_by: "gdelt_candidate" }, { onConflict: "canonical_url,content_hash" }).select("id").single();
        if (documentError || !document) throw documentError || new Error("document_insert_failed");
        documents++;

        const match = matchFacility(candidate, text, (facilities || []) as Facility[]);
        if (!match) { skipped++; await db.from("news_candidates").update({ candidate_status: "pending_review", failure_reason: "no_existing_facility_match", validated_at: new Date().toISOString() }).eq("id", candidate.id); continue; }
        matched++;
        const extracted = extractClaims(text, match.facility, match.score);
        if (!extracted.length) { skipped++; await db.from("news_candidates").update({ candidate_status: "pending_review", failure_reason: `facility_match_${match.score}_no_supported_field_claim`, validated_at: new Date().toISOString() }).eq("id", candidate.id); continue; }

        for (const claim of extracted) {
          const { data: insertedClaim, error: claimError } = await db.from("research_claims").upsert({ source_document_id: document.id, data_center_id: match.facility.id, entity_name: match.facility.canonical_name, field_name: claim.field_name, proposed_value: claim.proposed_value, normalized_value: claim.proposed_value, unit: claim.unit, evidence_excerpt: claim.excerpt, extraction_confidence: claim.confidence, match_confidence: match.score, validation_status: claim.confidence >= 75 && match.score >= 70 ? "passed" : "needs_review", review_status: "pending", conflict_status: "not_checked", prompt_version: "promote-research-candidates-v1", run_id: runId, updated_at: new Date().toISOString() }, { onConflict: "source_document_id,data_center_id,field_name" }).select("id").single();
          if (claimError || !insertedClaim) { console.error("claim_insert", claimError); continue; }
          claims++;
          const { error: taskError } = await db.from("research_review_tasks").upsert({ claim_id: insertedClaim.id, task_type: "claim_review", priority: claim.field_name === "capacity_mw" ? 90 : 80, status: "pending", reason: `GDELT-discovered trusted source matched ${match.facility.canonical_name} with entity score ${match.score}/100. Original source fetched and preserved; human approval required.` }, { onConflict: "claim_id" });
          if (taskError) console.error("review_task_insert", taskError);
          await db.from("research_audit_log").insert({ claim_id: insertedClaim.id, actor_type: "automation", action: "candidate_promoted_to_claim", detail: { candidate_id: candidate.id, source_url: canonicalUrl, facility_id: match.facility.id, match_score: match.score, extraction_confidence: claim.confidence } });
        }
        await db.from("news_candidates").update({ candidate_status: "pending_review", validated_at: new Date().toISOString() }).eq("id", candidate.id);
      } catch (error) {
        failed++;
        console.error("candidate_failed", candidate.id, error);
        await db.from("news_candidates").update({ failure_reason: error instanceof Error ? error.message.slice(0, 500) : "promotion_failed" }).eq("id", candidate.id);
      }
    }

    await db.from("research_runs").update({ status: "completed", records_seen: processed, records_created: claims, records_flagged: Math.max(0, claims), finished_at: new Date().toISOString(), metadata: { function: "promote-research-candidates", documents, matched, skipped, failed } }).eq("id", runId);
    return json({ ok: true, run_id: runId, processed, documents, matched, claims, skipped, failed });
  } catch (error) {
    if (runId) await db.from("research_runs").update({ status: "failed", error_message: error instanceof Error ? error.message : "Unknown error", finished_at: new Date().toISOString() }).eq("id", runId);
    return json({ ok: false, error: error instanceof Error ? error.message : "Unknown error", run_id: runId }, 500);
  }
});
