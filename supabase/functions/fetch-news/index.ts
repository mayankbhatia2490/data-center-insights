import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SourcePolicy = {
  source: string;
  domain: string;
  feed: string;
  tier: 1 | 2;
  type: "primary" | "specialist_media" | "established_business_media";
  reliability: number;
};

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
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gemini-3.1-flash-lite", messages }),
  });
  if (!response.ok) throw new Error(`AI quality gate failed: ${response.status}`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

function clean(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/&[a-z0-9#]+;/gi, " ").replace(/\s+/g, " ").trim();
}

function category(text: string): string {
  const value = text.toLowerCase();
  if (["acquisition", "merger", "investment", "funding", "deal", "ipo"].some((x) => value.includes(x))) return "M&A";
  if (["renewable", "carbon", "solar", "wind", "pue", "water", "sustainability"].some((x) => value.includes(x))) return "Sustainability";
  if (MENA_TERMS.some((x) => value.includes(x))) return "Middle East";
  if (["regulation", "policy", "government", "permit", "legislation"].some((x) => value.includes(x))) return "Policy";
  return "AI";
}

function parseItems(xml: string, atom: boolean, policy: SourcePolicy): any[] {
  const chunks = xml.split(atom ? "<entry" : "<item").slice(1);
  return chunks.slice(0, 15).flatMap((chunk) => {
    const tag = (name: string) => {
      const match = chunk.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${name}>`, "i"));
      return match?.[1]?.trim() || "";
    };
    const title = clean(tag("title"));
    const link = atom ? chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || "" : clean(tag("link") || tag("guid"));
    const summary = clean(tag(atom ? "summary" : "description") || tag("content")).slice(0, 500);
    const published = tag(atom ? "published" : "pubDate") || (atom ? tag("updated") : "");
    if (!title || title.length < 12 || !link || !published) return [];
    const date = new Date(published);
    if (Number.isNaN(date.getTime())) return [];
    const ageDays = (Date.now() - date.getTime()) / 86_400_000;
    if (ageDays < -1 || ageDays > 14) return [];
    try {
      const hostname = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
      if (!(hostname === policy.domain || hostname.endsWith(`.${policy.domain}`))) return [];
    } catch { return []; }
    return [{
      title, summary: summary || null, category: category(`${title} ${summary}`), source: policy.source, source_url: link,
      source_domain: policy.domain, source_tier: policy.tier, source_type: policy.type,
      source_reliability_score: policy.reliability, is_primary_source: policy.tier === 1,
      published_at: date.toISOString(), original_published_at: date.toISOString(),
      read_time: `${Math.max(2, Math.ceil(`${title} ${summary}`.split(/\s+/).length / 200))} min read`,
    }];
  });
}

async function fetchSource(policy: SourcePolicy): Promise<any[]> {
  try {
    const response = await fetch(policy.feed, { headers: { "User-Agent": "DataCenterPulse/2.0" } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const xml = await response.text();
    if (!/<(?:rss|feed|channel)/i.test(xml)) throw new Error("Response is not a feed");
    return parseItems(xml, policy.domain === "theregister.com", policy);
  } catch (error) {
    console.error(`Source rejected: ${policy.source}`, error);
    return [];
  }
}

async function qualityGate(articles: any[], apiKey: string): Promise<any[]> {
  const approved: any[] = [];
  for (let i = 0; i < articles.length; i += 15) {
    const batch = articles.slice(i, i + 15);
    const prompt = batch.map((a, index) => `[${index}] ${a.title} — ${a.summary || ""}`).join("\n");
    const raw = await callAI([
      { role: "system", content: "You are the strict editorial gate for a professional Middle East data-center intelligence publication. Score each item 1-10. Accept only concrete industry news with a named organization, project, policy, investment, facility, technology, or operational development. Reject opinion, generic explainers, listicles, duplicated summaries, and promotional fluff. MENA relevance is useful but never substitutes for evidence. Return only a JSON array of integers." },
      { role: "user", content: prompt },
    ], apiKey);
    const match = raw.match(/\[[\d\s,]+\]/);
    if (!match) throw new Error("Invalid AI quality-gate response");
    const scores: number[] = JSON.parse(match[0]);
    batch.forEach((article, index) => {
      const score = Number(scores[index] || 0);
      if (score >= 7) approved.push({ ...article, validation_score: score, validation_status: "validated_specialist" });
    });
  }
  return approved;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) throw new Error("GEMINI_API_KEY is required; no article will be auto-published without validation.");

    const fetched = (await Promise.all(SOURCES.map(fetchSource))).flat();
    const unique = [...new Map(fetched.map((article) => [article.source_url, article])).values()];
    const approved = await qualityGate(unique, geminiKey);
    let inserted = 0;

    for (const article of approved) {
      const { data: existing } = await supabase.from("articles").select("id").eq("source_url", article.source_url).maybeSingle();
      if (existing) continue;
      const { error } = await supabase.from("articles").insert({
        ...article,
        publication_status: "published",
        validation_status: article.validation_status,
        validated_at: new Date().toISOString(),
        validation_notes: "Allowlisted Tier 2 source, valid canonical-domain URL, publication date within 14 days, and strict AI editorial gate passed.",
        corroboration_count: 0,
        image_url: null,
        sentiment: null,
        insight: null,
        source_excerpt: null,
      });
      if (!error) inserted++;
    }

    return new Response(JSON.stringify({ success: true, trusted_sources: SOURCES.length, fetched: unique.length, approved: approved.length, inserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Validated news ingestion failed closed:", error);
    return new Response(JSON.stringify({ success: false, published: 0, error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
