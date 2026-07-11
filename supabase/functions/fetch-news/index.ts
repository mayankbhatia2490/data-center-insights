import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- AI Helper: OpenAI-compatible completions ---
async function callAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model = "gemini-3.1-flash-lite"
): Promise<string> {
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// --- AI Summarization ---
async function aiSummarize(title: string, rawSummary: string, apiKey: string): Promise<string> {
  try {
    return await callAI([
      { role: "system", content: "You are a news summarizer for data center industry professionals. Write a concise 1-2 sentence summary of the article. Be factual and informative. Do not use markdown." },
      { role: "user", content: `Article title: ${title}\n\nRaw description: ${rawSummary}` },
    ], apiKey);
  } catch {
    return rawSummary;
  }
}

// --- AI Sentiment Analysis ---
async function aiSentiment(title: string, summary: string, apiKey: string): Promise<string | null> {
  try {
    const raw = await callAI([
      { role: "system", content: "You are a financial sentiment classifier for the data center industry. Classify the article as exactly one of: Bullish, Bearish, or Neutral. Respond with ONLY that single word." },
      { role: "user", content: `Title: ${title}\nSummary: ${summary}` },
    ], apiKey);
    if (raw?.toLowerCase().includes("bullish")) return "Bullish";
    if (raw?.toLowerCase().includes("bearish")) return "Bearish";
    if (raw?.toLowerCase().includes("neutral")) return "Neutral";
    return null;
  } catch {
    return null;
  }
}

// --- AI Insight Generation ---
async function aiInsight(title: string, summary: string, source: string, apiKey: string): Promise<{ insight: string | null; source_excerpt: string | null }> {
  try {
    const raw = await callAI([
      {
        role: "system",
        content: `You are a senior data center analyst. Given the title, summary and source below, produce 1-2 concise sentences explaining WHY this news matters to infrastructure investors or operators. Focus on investment impact, capacity demand, energy/cooling, regulatory or geopolitical risk. Output ONLY valid JSON: {"insight": "...", "source_excerpt": "..."}. The source_excerpt should be a key quote or fact from the summary (max 50 words).`,
      },
      { role: "user", content: `Title: ${title}\nSource: ${source}\nSummary: ${summary}` },
    ], apiKey);
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { insight: raw.slice(0, 300), source_excerpt: null };
  } catch {
    return { insight: null, source_excerpt: null };
  }
}

// --- AI People Extraction ---
async function aiExtractPeople(title: string, summary: string, apiKey: string): Promise<any[]> {
  try {
    const raw = await callAI([
      {
        role: "system",
        content: `You are an entity extraction assistant specialized in corporate and government leadership in the data center industry.

Extract up to 6 people who are relevant (executives, ministers, regulators, investors). For each person return:
- name (full name)
- title (CEO, Minister of Energy, CTO, etc.)
- organization
- region (UAE, Saudi Arabia, Qatar, MENA, Global, US, EU)
- role_in_article (quoted/announced/appointed/visited)
- context (<=30 words)
- confidence (0.0-1.0)

Return ONLY a valid JSON array. If no people found, return [].`,
      },
      { role: "user", content: `Article title: ${title}\nSummary: ${summary}` },
    ], apiKey);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch {
    return [];
  }
}

// --- AI Quality Gate ---
const MENA_KEYWORDS = ["dubai", "saudi", "uae", "abu dhabi", "riyadh", "qatar", "bahrain", "oman", "kuwait", "middle east", "gulf", "mena", "neom", "jeddah", "muscat", "g42", "khazna", "stc", "e&", "mubadala", "adq"];

function isMenaArticle(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  return MENA_KEYWORDS.some((kw) => text.includes(kw));
}

async function aiQualityFilter(articles: any[], apiKey: string): Promise<any[]> {
  if (articles.length === 0) return [];
  const batchSize = 15;
  const scored: any[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const articleList = batch
      .map((a, idx) => `[${idx}] "${a.title}" — ${(a.summary || "").slice(0, 120)}`)
      .join("\n");

    try {
      const raw = await callAI([
        {
          role: "system",
          content: `You are an editorial quality filter for "Data Center Pulse," a MENA-first premium industry newsletter targeting executives, investors, and decision-makers in the Middle East and globally.

Score each article 1-10 based on:
- Newsworthiness: Is this breaking news, a major deal, policy change, or significant development?
- Industry Impact: Does this affect data center investment, operations, technology adoption, or strategy?
- Specificity: Does it contain concrete facts, numbers, company names, or deal values?
- Executive Relevance: Would a C-suite executive or investor find this valuable?
- MENA Relevance: Articles about UAE, Saudi Arabia, Qatar, or broader Middle East get a +2 bonus.

REJECT (score 1-5): Generic website homepages, press release fluff, recycled listicles, vague "industry overview" pages.
ACCEPT (score 6-10): M&A deals with values, new facility announcements with MW/location, policy changes, earnings data, technology breakthroughs.

Respond with ONLY a JSON array of scores in order, e.g. [8, 3, 7, 5, 9]. No explanation.`,
        },
        { role: "user", content: articleList },
      ], apiKey);

      const match = raw.match(/\[[\d\s,]+\]/);
      if (match) {
        const scores: number[] = JSON.parse(match[0]);
        batch.forEach((article, idx) => {
          let score = scores[idx] ?? 5;
          // MENA boost: ensure MENA articles pass more easily
          if (isMenaArticle(article.title || "", article.summary || "")) {
            score = Math.min(10, score + 2);
          }
          if (score >= 6) scored.push(article);
        });
        console.log(`Quality gate batch: ${batch.length} → ${scored.length} passed (with MENA boost)`);
      } else {
        scored.push(...batch);
      }
    } catch (e) {
      console.error("Quality gate error:", e);
      scored.push(...batch);
    }
  }
  return scored;
}

// --- Auto-categorization ---
function categorize(text: string): string {
  const lower = text.toLowerCase();
  const rules: [string[], string][] = [
    [["acquisition", "merger", "ipo", "deal", "stake", "buyout", "takeover", "valuation", "financing", "securitization", "investment", "billion", "million", "funding"], "M&A"],
    [["renewable", "carbon", "pue", "green", "solar", "wind", "sustainability", "energy efficiency", "net zero", "esg", "water usage", "emissions"], "Sustainability"],
    [["dubai", "saudi", "uae", "oman", "qatar", "bahrain", "riyadh", "abu dhabi", "middle east", "gulf", "neom", "jeddah", "muscat", "kuwait"], "Middle East"],
    [["regulation", "policy", "eu ", "compliance", "legislation", "government", "mandate", "tariff", "subsidy", "zoning", "permit"], "Policy"],
    [["ai ", "gpu", "machine learning", "nvidia", "llm", "deep learning", "artificial intelligence", "generative", "cooling", "liquid cooling", "power", "capacity", "hyperscale", "colocation", "edge computing", "chip", "semiconductor"], "AI"],
  ];
  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "AI";
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const mins = Math.max(2, Math.ceil(words / 200));
  return `${mins} min read`;
}

// --- RSS Parsing ---
async function fetchRSS(feedUrl: string, sourceName: string) {
  const articles: any[] = [];
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "DataCenterPulse/1.0" } });
    if (!res.ok) return articles;
    const xml = await res.text();
    const items = xml.split("<item>").slice(1);
    for (const item of items.slice(0, 10)) {
      const getTag = (tag: string) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s"));
        return match ? match[1].trim() : "";
      };
      const title = getTag("title");
      const link = getTag("link") || getTag("guid");
      const description = getTag("description").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      const pubDate = getTag("pubDate");
      if (title && link) {
        const fullText = `${title} ${description}`;
        articles.push({
          title, summary: description || null, category: categorize(fullText),
          source: sourceName, source_url: link, image_url: null,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) { console.error(`RSS error (${sourceName}):`, e); }
  return articles;
}

// --- Atom Feed Parsing ---
async function fetchAtom(feedUrl: string, sourceName: string) {
  const articles: any[] = [];
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "DataCenterPulse/1.0" } });
    if (!res.ok) return articles;
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    for (const entry of entries.slice(0, 10)) {
      const getTag = (tag: string) => {
        const match = entry.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s"));
        return match ? match[1].trim() : "";
      };
      const title = getTag("title");
      const linkMatch = entry.match(/<link[^>]+href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1] : "";
      const summary = getTag("summary").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300) ||
                      getTag("content").replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300);
      const pubDate = getTag("published") || getTag("updated");
      if (title && link) {
        const fullText = `${title} ${summary}`;
        articles.push({
          title, summary: summary || null, category: categorize(fullText),
          source: sourceName, source_url: link, image_url: null,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) { console.error(`Atom error (${sourceName}):`, e); }
  return articles;
}

// --- News API ---
async function fetchNewsAPI(apiKey: string) {
  const articles: any[] = [];
  try {
    const queries = ["data center", "hyperscale cloud infrastructure", "data center M&A acquisition", "data center sustainability energy", "Middle East data center", "Gulf cloud infrastructure"];
    for (const q of queries) {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        const fullText = `${a.title} ${a.description || ""}`;
        articles.push({
          title: a.title, summary: a.description || null, category: categorize(fullText),
          source: a.source?.name || "News API", source_url: a.url,
          image_url: a.urlToImage || null, published_at: a.publishedAt || new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) { console.error("News API error:", e); }
  return articles;
}

// --- Firecrawl Search ---
async function fetchFirecrawl(apiKey: string) {
  const articles: any[] = [];
  try {
    const queries = ["data center news today", "hyperscale data center deals acquisition", "data center sustainability renewable energy", "Middle East data center developments", "UAE data center investment", "Saudi Arabia cloud infrastructure", "G42 Khazna data center", "MENA hyperscale colocation", "Abu Dhabi digital infrastructure", "data center policy regulation", "liquid cooling GPU data center"];
    for (const query of queries) {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 5, tbs: "qdr:d" }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.data || []) {
        if (!item.title || !item.url) continue;
        const fullText = `${item.title} ${item.description || ""}`;
        articles.push({
          title: item.title, summary: item.description || null, category: categorize(fullText),
          source: new URL(item.url).hostname.replace("www.", ""), source_url: item.url,
          image_url: null, published_at: new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) { console.error("Firecrawl error:", e); }
  return articles;
}

// --- People Upsert Logic ---
async function upsertPeople(
  supabase: any,
  articleId: string,
  publishedAt: string,
  people: any[]
) {
  for (const p of people) {
    if (!p || !p.name) continue;
    if ((p.confidence ?? 0) < 0.6) continue;

    try {
      const { data: existingPerson } = await supabase
        .from("people")
        .select("id, mention_count, importance_score")
        .eq("name", p.name)
        .eq("organization", p.organization || "")
        .maybeSingle();

      let personId: string | null = null;

      if (!existingPerson) {
        const { data: inserted } = await supabase
          .from("people")
          .insert({
            name: p.name,
            title: p.title || null,
            organization: p.organization || null,
            region: p.region || null,
            mention_count: 1,
            importance_score: Math.round((p.confidence || 0.6) * 10),
            first_mentioned: publishedAt,
            last_mentioned: publishedAt,
          })
          .select("id")
          .single();
        personId = inserted?.id ?? null;
      } else {
        personId = existingPerson.id;
        await supabase
          .from("people")
          .update({
            mention_count: (existingPerson.mention_count || 0) + 1,
            importance_score: (existingPerson.importance_score || 0) + Math.round((p.confidence || 0.6) * 2),
            last_mentioned: publishedAt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", personId);
      }

      if (personId) {
        await supabase.from("article_people").insert({
          article_id: articleId,
          person_id: personId,
          role_in_article: p.role_in_article || null,
          context_excerpt: p.context || null,
        });
      }
    } catch (err) {
      console.warn("People upsert error:", err);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    // --- RSS & Atom Feeds ---
    const rssFeeds: [string, string][] = [
      // --- MENA-First Sources ---
      ["https://gulfbusiness.com/feed/", "Gulf Business"],
      ["https://www.arabianbusiness.com/feed", "Arabian Business"],
      ["https://www.meed.com/rss", "MEED"],
      ["https://www.zawya.com/en/rss", "Zawya"],
      ["https://www.telecomreviewmena.com/feed", "Telecom Review ME"],
      // --- Global Sources ---
      ["https://www.datacenterdynamics.com/en/rss/", "DataCenterDynamics"],
      ["https://www.datacenterknowledge.com/rss.xml", "Data Center Knowledge"],
      ["https://datacenterfrontier.com/feed/", "Datacenter Frontier"],
      ["https://www.capacitymedia.com/feed", "Capacity Media"],
      ["https://www.datacenterhawk.com/blog/rss.xml", "DataCenter Hawk"],
      ["https://www.baxtel.com/blog/feed", "Baxtel"],
      ["https://siliconangle.com/category/datacenter/feed/", "SiliconANGLE"],
      ["https://www.servethehome.com/feed/", "ServeTheHome"],
      ["https://blocksandfiles.com/feed/", "Blocks & Files"],
    ];
    const atomFeeds: [string, string][] = [
      ["https://www.theregister.com/data_centre/headlines.atom", "The Register"],
    ];

    const newsApiKey = Deno.env.get("NEWS_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    const promises: Promise<any[]>[] = [
      ...rssFeeds.map(([url, name]) => fetchRSS(url, name)),
      ...atomFeeds.map(([url, name]) => fetchAtom(url, name)),
    ];
    if (newsApiKey) promises.push(fetchNewsAPI(newsApiKey));
    if (firecrawlKey) promises.push(fetchFirecrawl(firecrawlKey));

    const results = await Promise.allSettled(promises);
    let allArticles = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);

    console.log(`Fetched ${allArticles.length} raw articles from all sources`);

    // Deduplicate
    const seen = new Set<string>();
    allArticles = allArticles.filter((a) => {
      if (!a.source_url || seen.has(a.source_url)) return false;
      seen.add(a.source_url);
      return true;
    });
    console.log(`${allArticles.length} unique articles after dedup`);

    // Quality Gate
    if (geminiApiKey && allArticles.length > 0) {
      const beforeCount = allArticles.length;
      allArticles = await aiQualityFilter(allArticles, geminiApiKey);
      console.log(`Quality gate: ${beforeCount} → ${allArticles.length} articles passed`);
    }

    // AI-enhance: summaries, sentiment, insight, people
    if (geminiApiKey) {
      // Summaries
      const needsSummary = allArticles.filter(
        (a) => !a.summary || a.summary === a.title || a.summary.length < 30
      );
      for (let i = 0; i < Math.min(needsSummary.length, 20); i += 5) {
        const batch = needsSummary.slice(i, i + 5);
        const summaries = await Promise.allSettled(
          batch.map((a) => aiSummarize(a.title, a.summary || a.title, geminiApiKey))
        );
        summaries.forEach((result, j) => {
          if (result.status === "fulfilled") batch[j].summary = result.value;
        });
      }

      // Sentiment
      console.log("Running sentiment analysis...");
      for (let i = 0; i < Math.min(allArticles.length, 30); i += 5) {
        const batch = allArticles.slice(i, i + 5);
        const sentiments = await Promise.allSettled(
          batch.map((a) => aiSentiment(a.title, a.summary || a.title, geminiApiKey))
        );
        sentiments.forEach((result, j) => {
          if (result.status === "fulfilled" && result.value) batch[j].sentiment = result.value;
        });
      }

      // Insight generation (for top 20 articles)
      console.log("Generating insights...");
      for (let i = 0; i < Math.min(allArticles.length, 20); i += 5) {
        const batch = allArticles.slice(i, i + 5);
        const insights = await Promise.allSettled(
          batch.map((a) => aiInsight(a.title, a.summary || "", a.source || "", geminiApiKey))
        );
        insights.forEach((result, j) => {
          if (result.status === "fulfilled") {
            batch[j].insight = result.value.insight;
            batch[j].source_excerpt = result.value.source_excerpt;
          }
        });
      }
    }

    // Upsert to database and extract people
    let inserted = 0;
    let peopleExtracted = 0;

    for (const article of allArticles) {
      // Check if already exists
      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .eq("source_url", article.source_url)
        .maybeSingle();

      if (existing) continue;

      const { data: insertedArticle, error } = await supabase
        .from("articles")
        .insert({
          title: article.title,
          summary: article.summary,
          category: article.category,
          source: article.source,
          source_url: article.source_url,
          image_url: article.image_url,
          published_at: article.published_at,
          read_time: article.read_time,
          sentiment: article.sentiment || null,
          insight: article.insight || null,
          source_excerpt: article.source_excerpt || null,
        })
        .select("id")
        .single();

      if (error || !insertedArticle) continue;
      inserted++;

      // Extract people for this article
      if (geminiApiKey) {
        try {
          const people = await aiExtractPeople(article.title, article.summary || "", geminiApiKey);
          if (people.length > 0) {
            await upsertPeople(supabase, insertedArticle.id, article.published_at, people);
            peopleExtracted += people.filter((p: any) => (p.confidence ?? 0) >= 0.6).length;
          }
        } catch (err) {
          console.warn("People extraction error:", err);
        }
      }
    }

    console.log(`Inserted ${inserted} articles, extracted ${peopleExtracted} people`);

    return new Response(
      JSON.stringify({ success: true, fetched_raw: seen.size, passed_quality: allArticles.length, inserted, peopleExtracted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-news error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
