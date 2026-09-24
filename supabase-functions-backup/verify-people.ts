import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const MAX_RECORDS = 100;

const normalize = (value: string | null | undefined) =>
  (value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const includesPhrase = (haystack: string, needle: string | null | undefined) => {
  const target = normalize(needle);
  return !!target && normalize(haystack).includes(target);
};

async function checkSource(url: string) {
  if (!/^https?:\/\//i.test(url)) {
    return { reachable: false, status: null, body: "", error: "unsupported_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "DataCenterPulseVerifier/1.0" },
    });
    const body = (await response.text()).slice(0, 120_000);
    return { reachable: response.ok, status: response.status, body, error: null };
  } catch (error) {
    return {
      reachable: false,
      status: null,
      body: "",
      error: error instanceof Error ? error.message : "fetch_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await supabase
      .from("article_people")
      .select(`
        person_id,
        context_excerpt,
        people!inner(id, name, title, organization, verification_status),
        articles!inner(id, title, summary, source, source_url, source_excerpt, published_at)
      `)
      .not("articles.source_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_RECORDS);

    if (error) throw error;

    const processed: string[] = [];
    const needsReview: string[] = [];
    const automaticallyVerified: string[] = [];

    for (const row of rows || []) {
      const person = Array.isArray(row.people) ? row.people[0] : row.people;
      const article = Array.isArray(row.articles) ? row.articles[0] : row.articles;
      if (!person?.id || !article?.source_url) continue;

      const source = await checkSource(article.source_url);
      const articleText = [
        article.title,
        article.summary,
        article.source_excerpt,
        row.context_excerpt,
        source.body,
      ].filter(Boolean).join("\n");

      const checks = {
        source_url_present: true,
        source_reachable: source.reachable,
        name_present: includesPhrase(articleText, person.name),
        organization_present: includesPhrase(articleText, person.organization),
        title_present: includesPhrase(articleText, person.title),
        recent_article: !!article.published_at && new Date(article.published_at).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000,
      };

      let score = 0;
      if (checks.source_url_present) score += 15;
      if (checks.source_reachable) score += 25;
      if (checks.name_present) score += 35;
      if (checks.organization_present) score += 15;
      if (checks.title_present) score += 5;
      if (checks.recent_article) score += 5;

      const result = score >= 80 ? "verified" : score >= 45 ? "needs_review" : "rejected";
      const { data: evidence, error: evidenceError } = await supabase
        .from("people_verification_sources")
        .upsert({
          person_id: person.id,
          article_id: article.id,
          source_url: article.source_url,
          source_name: article.source,
          source_title: article.title,
          evidence_excerpt: row.context_excerpt || article.source_excerpt || article.summary,
          observed_name: person.name,
          observed_title: person.title,
          observed_organization: person.organization,
          source_published_at: article.published_at,
          http_status: source.status,
          automated_score: score,
          automated_result: result,
          checks: { ...checks, fetch_error: source.error },
          checked_at: new Date().toISOString(),
        }, { onConflict: "person_id,source_url" })
        .select("id")
        .single();
      if (evidenceError) throw evidenceError;

      const nextStatus = result === "verified" ? "verified" : result === "needs_review" ? "needs_review" : "rejected";
      await supabase.from("people").update({
        verification_status: nextStatus,
        verification_score: score,
        last_verified_at: new Date().toISOString(),
        verification_notes: result === "verified" ? "Automatically verified from a reachable source containing the person and organization." : "Automation could not establish sufficient evidence; human review required.",
      }).eq("id", person.id);

      await supabase.from("people_verification_audit").insert({
        person_id: person.id,
        actor_type: "automation",
        action: "source_check",
        from_status: person.verification_status,
        to_status: nextStatus,
        score,
        detail: { source_url: article.source_url, checks },
      });

      if (result === "needs_review") {
        await supabase.from("people_verification_queue").upsert({
          person_id: person.id,
          source_id: evidence.id,
          status: "pending",
          reason: "Automated evidence is incomplete or conflicting.",
        }, { onConflict: "person_id,source_id" });
        needsReview.push(person.id);
      } else if (result === "verified") {
        automaticallyVerified.push(person.id);
      }
      processed.push(person.id);
    }

    return new Response(JSON.stringify({
      ok: true,
      processed: processed.length,
      automatically_verified: [...new Set(automaticallyVerified)].length,
      queued_for_human_review: [...new Set(needsReview)].length,
    }), { headers: corsHeaders });
  } catch (error) {
    console.error("verify-people error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
