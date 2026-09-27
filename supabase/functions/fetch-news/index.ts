import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type SourcePolicy = { source: string; domain: string; feed: string; tier: 1 | 2; type: "primary" | "specialist_media" | "established_business_media"; reliability: number };
type Article = Record<string, any>;

const SOURCES: SourcePolicy[] = [
  { source: "DataCenterDynamics", domain: "datacenterdynamics.com", feed: "https://www.datacenterdynamics.com/en/rss/", tier: 2, type: "specialist_media", reliability: 92 },
  { source: "Data Center Knowledge", domain: "datacenterknowledge.com", feed: "https://www.datacenterknowledge.com/rss.xml", tier: 2, type: "specialist_media", reliability: 90 },
  { source: "Capacity Media", domain: "capacitymedia.com", feed: "https://www.capacitymedia.com/feed", tier: 2, type: "specialist_media", reliability: 88 },
  { source: "Blocks & Files", domain: "blocksandfiles.com", feed: "https://blocksandfiles.com/feed/", tier: 2, type: "specialist_media", reliability: 82 },
  { source: "ServeTheHome", domain: "servethehome.com", feed: "https://www.servethehome.com/feed/", tier: 2, type: "specialist_media", reliability: 80 },
  { source: "The Register", domain: "theregister.com", feed: "https://www.theregister.com/data_centre/headlines.atom", tier: 2, type: "established_business_media", reliability: 86 },
];

const MENA_TERMS = ["dubai", "saudi", "uae", "abu dhabi", "riyadh", "qatar", "bahrain", "oman", "kuwait", "middle east", "gulf", "mena", "neom", "jeddah", "muscat", "g42", "khazna", "stc", "mubadala", "adq"];

async function callAI(messages: { role: string; content: string }[], apiKey: string): Promise<string> {
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemini-3.1-flash-lite", messages }),
  });
  if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function clean(value: string): string { return String(value || "").replace(/<[^>]*>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim(); }
function category(text: string): string {
  const value = text.toLowerCase();
  if (["acquisition", "merger", "investment", "funding", "deal", "ipo"].some((x) => value.includes(x))) return "M&A";
  if (["renewable", "carbon", "solar", "wind", "pue", "water", "sustainability"].some((x) => value.includes(x))) return "Sustainability";
  if (MENA_TERMS.some((x) => value.includes(x))) return "Middle East";
  if (["regulation", "policy", "government", "permit", "legislation"].some((x) => value.includes(x))) return "Policy";
  return "AI";
}

function parseItems(xml: string, atom: boolean, policy: SourcePolicy): Article[] {
  const chunks = xml.split(atom ? "<entry" : "<item").slice(1);
  return chunks.slice(0, 15).flatMap((chunk) => {
    const tag = (name: string) => chunk.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"))?.[1]?.trim() || "";
    const title = clean(tag("title"));
    const link = atom ? chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "" : clean(tag("link") || tag("guid"));
    const summary = clean(tag(atom ? "summary" : "description") || tag("content")).slice(0, 700);
    const published = tag(atom ? "published" : "pubDate") || (atom ? tag("updated") : "");
    if (!title || title.length < 12 || !link || !published) return [];
    const date = new Date(published);
    if (Number.isNaN(date.getTime())) return [];
    const ageDays = (Date.now() - date.getTime()) / 86_400_000;
    if (ageDays < -1 || ageDays > 14) return [];
    try {
      const host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      if (!(host === policy.domain || host.endsWith(`.${policy.domain}`))) return [];
    } catch { return []; }
    return [{ title, summary: summary || null, category: category(`${title} ${summary}`), source: policy.source, source_url: link, source_domain: policy.domain, source_tier: policy.tier, source_type: policy.type, source_reliability_score: policy.reliability, is_primary_source: false, published_at: date.toISOString(), original_published_at: date.toISOString(), read_time: `${Math.max(2, Math.ceil(`${title} ${summary}`.split(/\s+/).length / 200))} min read`, candidate_id: null }];
  });
}

async function fetchSource(policy: SourcePolicy): Promise<Article[]> {
  try {
    const response = await fetch(policy.feed, { headers: { "User-Agent": "DataCenterPulse/2.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    if (!/<(?:rss|feed|channel)/i.test(xml)) throw new Error("Response is not XML feed");
    return parseItems(xml, policy.domain === "theregister.com", policy);
  } catch (error) { console.error(`Source rejected: ${policy.source}`, error); return []; }
}

async function loadTrustedCandidates(supabase: any): Promise<Article[]> {
  const { data, error } = await supabase.from("news_candidates").select("id,canonical_url,title,summary,source_domain,source_tier,source_type,source_reliability_score,published_at").eq("candidate_status", "discovered").not("source_tier", "is", null).order("discovered_at", { ascending: false }).limit(75);
  if (error) { console.error("Candidate load failed:", error); return []; }
  return (data || []).flatMap((row: any) => {
    if (!row.canonical_url || !row.published_at || !row.source_domain) return [];
    const date = new Date(row.published_at);
    if (Number.isNaN(date.getTime())) return [];
    return [{ title: clean(row.title), summary: clean(row.summary || row.title).slice(0, 700), category: category(`${row.title} ${row.summary || ""}`), source: row.source_domain, source_url: row.canonical_url, source_domain: row.source_domain, source_tier: row.source_tier, source_type: row.source_type, source_reliability_score: row.source_reliability_score, is_primary_source: row.source_tier === 1, published_at: date.toISOString(), original_published_at: date.toISOString(), read_time: "3 min read", candidate_id: row.id }];
  });
}

async function qualityGate(articles: Article[], apiKey: string): Promise<Article[]> {
  const approved: Article[] = [];
  for (let i = 0; i < articles.length; i += 15) {
    const batch = articles.slice(i, i + 15);
    const raw = await callAI([
      { role: "system", content: "You are the strict editorial gate for a professional Middle East data-center intelligence publication. Score each item 1-10. Accept only concrete news with a named organization, project, policy, investment, facility, technology, or operational development. Reject opinion, generic explainers, listicles, duplicated summaries, and promotional fluff. Return only a JSON array of integers." },
      { role: "user", content: batch.map((a, index) => `[${index}] ${a.title} — ${a.summary || ""}`).join("\n") },
    ], apiKey);
    const match = raw.match(/\[[\d\s,]+\]/);
    if (!match) throw new Error("Invalid quality-gate response");
    const scores: number[] = JSON.parse(match[0]);
    batch.forEach((article, index) => { const score = Number(scores[index] || 0); if (score >= 7) approved.push({ ...article, validation_score: score, validation_status: article.source_tier === 1 ? "validated_primary" : "validated_specialist" }); });
  }
  return approved;
}

async function generateMeaning(articles: Article[], apiKey: string): Promise<Article[]> {
  const enriched: Article[] = [];
  for (let i = 0; i < articles.length; i += 8) {
    const batch = articles.slice(i, i + 8);
    const raw = await callAI([
      { role: "system", content: "You are a senior Middle East data-center analyst. For every numbered article return one JSON object with: summary (one factual sentence), meaning (why it matters to operators/investors), impact_summary (capacity, power, cloud, regulation, investment, technology, or market impact), claim_type (project, investment, policy, capacity, leadership, technology, operations, market, or other), named_entities (array of company/person/place names), sentiment (Bullish, Bearish, or Neutral), source_excerpt (short fact grounded in the supplied text), and importance_score (1-10). Do not invent facts. Return only a JSON array in the same order." },
      { role: "user", content: batch.map((a, index) => `[${index}] TITLE: ${a.title}\nSOURCE: ${a.source}\nTEXT: ${a.summary || ""}`).join("\n\n") },
    ], apiKey);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Invalid meaning response");
    const insights = JSON.parse(match[0]);
    batch.forEach((article, index) => {
      const insight = insights[index];
      if (!insight?.meaning || !insight?.summary || !insight?.source_excerpt) return;
      const importance = Math.max(1, Math.min(10, Number(insight.importance_score || 1)));
      const confidence = Math.max(0, Math.min(100, Math.round((Number(article.source_reliability_score || 50) * 0.6) + (Number(article.validation_score || 7) * 10 * 0.4))));
      enriched.push({ ...article, summary: String(insight.summary).slice(0, 700), meaning: String(insight.meaning).slice(0, 700), impact_summary: String(insight.impact_summary || "").slice(0, 500), claim_type: String(insight.claim_type || "other"), named_entities: Array.isArray(insight.named_entities) ? insight.named_entities.slice(0, 12) : [], sentiment: ["Bullish", "Bearish", "Neutral"].includes(insight.sentiment) ? insight.sentiment : "Neutral", source_excerpt: String(insight.source_excerpt).slice(0, 300), importance_score: importance, confidence_score: confidence });
    });
  }
  return enriched;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authError = await requireCronSecret(req, corsHeaders);
    if (authError) return authError;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY is required; no article will publish without meaning validation.");
    const feedArticles = (await Promise.all(SOURCES.map(fetchSource))).flat();
    const candidateArticles = await loadTrustedCandidates(supabase);
    const unique = [...new Map([...feedArticles, ...candidateArticles].map((article) => [article.source_url, article])).values()];
    const approved = await qualityGate(unique, apiKey);
    const enriched = await generateMeaning(approved, apiKey);
    let inserted = 0;
    for (const article of enriched) {
      const { data: existing } = await supabase.from("articles").select("id").eq("source_url", article.source_url).maybeSingle();
      if (existing) continue;
      const { data: insertedArticle, error } = await supabase.from("articles").insert({ ...article, publication_status: "published", validated_at: new Date().toISOString(), validation_notes: "Allowlisted Tier 1/2 source or trusted discovery candidate, valid URL/date, strict editorial gate, and meaning extraction passed.", corroboration_count: 0, primary_source_count: article.source_tier === 1 ? 1 : 0, corroboration_urls: [], image_url: null, insight: article.meaning }).select("id").maybeSingle();
      if (!error) {
        inserted++;
        if (article.candidate_id && insertedArticle?.id) await supabase.from("news_candidates").update({ candidate_status: "published", article_id: insertedArticle.id, validated_at: new Date().toISOString() }).eq("id", article.candidate_id);
      } else console.error("Article insert rejected:", error.message);
    }
    return new Response(JSON.stringify({ success: true, trusted_feeds: SOURCES.length, candidates: candidateArticles.length, fetched: unique.length, editorially_approved: approved.length, meaning_enriched: enriched.length, inserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Meaning-aware news ingestion failed closed:", error);
    return new Response(JSON.stringify({ success: false, published: 0, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
