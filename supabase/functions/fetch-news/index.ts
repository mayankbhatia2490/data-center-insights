import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- AI Summarization ---
async function aiSummarize(title: string, rawSummary: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a news summarizer for data center industry professionals. Write a concise 1-2 sentence summary of the article. Be factual and informative. Do not use markdown.",
          },
          {
            role: "user",
            content: `Article title: ${title}\n\nRaw description: ${rawSummary}`,
          },
        ],
      }),
    });
    if (!res.ok) return rawSummary;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || rawSummary;
  } catch {
    return rawSummary;
  }
}

// --- AI Sentiment Analysis ---
async function aiSentiment(title: string, summary: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "You are a financial sentiment classifier for the data center industry. Classify the article as exactly one of: Bullish, Bearish, or Neutral. Respond with ONLY that single word.",
          },
          {
            role: "user",
            content: `Title: ${title}\nSummary: ${summary}`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim()?.toLowerCase();
    if (raw?.includes("bullish")) return "Bullish";
    if (raw?.includes("bearish")) return "Bearish";
    if (raw?.includes("neutral")) return "Neutral";
    return null;
  } catch {
    return null;
  }
}

// --- AI Quality Gate: Score articles 1-10, keep only 6+ ---
async function aiQualityFilter(
  articles: any[],
  apiKey: string
): Promise<any[]> {
  if (articles.length === 0) return [];

  const batchSize = 15;
  const scored: any[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const articleList = batch
      .map((a, idx) => `[${idx}] "${a.title}" — ${(a.summary || "").slice(0, 120)}`)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            {
              role: "system",
              content: `You are an editorial quality filter for "Data Center Pulse," a premium industry newsletter targeting executives, investors, and decision-makers.

Score each article 1-10 based on:
- Newsworthiness: Is this breaking news, a major deal, policy change, or significant development? (not generic site descriptions or listicles)
- Industry Impact: Does this affect data center investment, operations, technology adoption, or strategy?
- Specificity: Does it contain concrete facts, numbers, company names, or deal values? (not vague marketing copy)
- Executive Relevance: Would a C-suite executive or investor find this valuable?

REJECT (score 1-5): Generic website homepages, press release fluff, recycled listicles, vague "industry overview" pages, content farm articles, articles with no concrete information.
ACCEPT (score 6-10): M&A deals with values, new facility announcements with MW/location, policy changes, earnings data, technology breakthroughs with specifics, executive moves.

Respond with ONLY a JSON array of scores in order, e.g. [8, 3, 7, 5, 9]. No explanation.`,
            },
            {
              role: "user",
              content: articleList,
            },
          ],
        }),
      });

      if (!res.ok) {
        // If AI fails, keep all articles from this batch
        scored.push(...batch);
        continue;
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content?.trim() || "";
      // Parse JSON array of scores
      const match = raw.match(/\[[\d\s,]+\]/);
      if (match) {
        const scores: number[] = JSON.parse(match[0]);
        batch.forEach((article, idx) => {
          const score = scores[idx] ?? 5;
          if (score >= 6) {
            scored.push(article);
          }
        });
        console.log(
          `Quality gate batch: ${batch.length} articles → ${scores.filter((s) => s >= 6).length} passed (scores: ${scores.join(",")})`
        );
      } else {
        // Can't parse, keep all
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
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "DataCenterPulse/1.0" },
    });
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
          title,
          summary: description || null,
          category: categorize(fullText),
          source: sourceName,
          source_url: link,
          image_url: null,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) {
    console.error(`RSS error (${sourceName}):`, e);
  }
  return articles;
}

// --- Atom Feed Parsing ---
async function fetchAtom(feedUrl: string, sourceName: string) {
  const articles: any[] = [];
  try {
    const res = await fetch(feedUrl, {
      headers: { "User-Agent": "DataCenterPulse/1.0" },
    });
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
          title,
          summary: summary || null,
          category: categorize(fullText),
          source: sourceName,
          source_url: link,
          image_url: null,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) {
    console.error(`Atom error (${sourceName}):`, e);
  }
  return articles;
}

// --- News API ---
async function fetchNewsAPI(apiKey: string) {
  const articles: any[] = [];
  try {
    const queries = [
      "data center",
      "hyperscale cloud infrastructure",
      "data center M&A acquisition",
      "data center sustainability energy",
    ];
    for (const q of queries) {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      for (const a of data.articles || []) {
        if (!a.title || a.title === "[Removed]") continue;
        const fullText = `${a.title} ${a.description || ""}`;
        articles.push({
          title: a.title,
          summary: a.description || null,
          category: categorize(fullText),
          source: a.source?.name || "News API",
          source_url: a.url,
          image_url: a.urlToImage || null,
          published_at: a.publishedAt || new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) {
    console.error("News API error:", e);
  }
  return articles;
}

// --- Firecrawl Search ---
async function fetchFirecrawl(apiKey: string) {
  const articles: any[] = [];
  try {
    const queries = [
      "data center news today",
      "hyperscale data center deals acquisition",
      "data center sustainability renewable energy",
      "Middle East data center developments",
      "data center policy regulation",
      "liquid cooling GPU data center",
    ];
    for (const query of queries) {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 5, tbs: "qdr:d" }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.data || []) {
        if (!item.title || !item.url) continue;
        const fullText = `${item.title} ${item.description || ""}`;
        articles.push({
          title: item.title,
          summary: item.description || null,
          category: categorize(fullText),
          source: new URL(item.url).hostname.replace("www.", ""),
          source_url: item.url,
          image_url: null,
          published_at: new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
    }
  } catch (e) {
    console.error("Firecrawl error:", e);
  }
  return articles;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // --- EXPANDED RSS FEEDS: Premium data center sources ---
    const rssFeeds: [string, string][] = [
      // Tier 1: Core industry publications
      ["https://www.datacenterdynamics.com/en/rss/", "DataCenterDynamics"],
      ["https://www.datacenterknowledge.com/rss.xml", "Data Center Knowledge"],
      ["https://datacenterfrontier.com/feed/", "Datacenter Frontier"],
      // Tier 2: Infrastructure & real estate
      ["https://www.capacitymedia.com/feed", "Capacity Media"],
      ["https://www.datacenterhawk.com/blog/rss.xml", "DataCenter Hawk"],
      ["https://www.baxtel.com/blog/feed", "Baxtel"],
      // Tier 3: Broader tech with DC coverage
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

    // --- DEDUPLICATE by source_url before quality gate ---
    const seen = new Set<string>();
    allArticles = allArticles.filter((a) => {
      if (!a.source_url || seen.has(a.source_url)) return false;
      seen.add(a.source_url);
      return true;
    });
    console.log(`${allArticles.length} unique articles after dedup`);

    // --- AI QUALITY GATE: Only keep high-quality, newsworthy articles ---
    if (lovableApiKey && allArticles.length > 0) {
      const beforeCount = allArticles.length;
      allArticles = await aiQualityFilter(allArticles, lovableApiKey);
      console.log(`Quality gate: ${beforeCount} → ${allArticles.length} articles passed`);
    }

    // AI-enhance summaries and sentiment for remaining articles
    if (lovableApiKey) {
      const needsSummary = allArticles.filter(
        (a) => !a.summary || a.summary === a.title || a.summary.length < 30
      );
      console.log(`${needsSummary.length} articles need AI summaries`);
      
      for (let i = 0; i < Math.min(needsSummary.length, 20); i += 5) {
        const batch = needsSummary.slice(i, i + 5);
        const summaryPromises = batch.map((a) =>
          aiSummarize(a.title, a.summary || a.title, lovableApiKey)
        );
        const summaries = await Promise.allSettled(summaryPromises);
        summaries.forEach((result, j) => {
          if (result.status === "fulfilled") {
            batch[j].summary = result.value;
          }
        });
      }

      console.log("Running sentiment analysis...");
      for (let i = 0; i < Math.min(allArticles.length, 30); i += 5) {
        const batch = allArticles.slice(i, i + 5);
        const sentimentPromises = batch.map((a) =>
          aiSentiment(a.title, a.summary || a.title, lovableApiKey)
        );
        const sentiments = await Promise.allSettled(sentimentPromises);
        sentiments.forEach((result, j) => {
          if (result.status === "fulfilled" && result.value) {
            batch[j].sentiment = result.value;
          }
        });
      }
    }

    // Upsert to database
    let inserted = 0;
    for (const article of allArticles) {
      const { error } = await supabase
        .from("articles")
        .upsert(article, { onConflict: "source_url", ignoreDuplicates: false });
      if (!error) inserted++;
    }

    console.log(`Inserted/updated ${inserted} high-quality articles`);

    return new Response(
      JSON.stringify({
        success: true,
        fetched_raw: seen.size,
        passed_quality: allArticles.length,
        inserted,
      }),
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
