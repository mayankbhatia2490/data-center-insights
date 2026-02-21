import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// --- Auto-categorization ---
function categorize(text: string): string {
  const lower = text.toLowerCase();
  const rules: [string[], string][] = [
    [["acquisition", "merger", "ipo", "deal", "stake", "buyout", "takeover", "valuation"], "M&A"],
    [["ai ", "gpu", "machine learning", "nvidia", "llm", "deep learning", "artificial intelligence", "generative"], "AI"],
    [["renewable", "carbon", "pue", "green", "solar", "wind", "sustainability", "energy efficiency", "net zero"], "Sustainability"],
    [["dubai", "saudi", "uae", "oman", "qatar", "bahrain", "riyadh", "abu dhabi", "middle east", "gulf"], "Middle East"],
    [["regulation", "policy", "eu ", "compliance", "legislation", "government", "mandate"], "Policy"],
  ];
  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "AI"; // default
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

    // Simple XML parsing for RSS items
    const items = xml.split("<item>").slice(1);
    for (const item of items.slice(0, 10)) {
      const getTag = (tag: string) => {
        const match = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, "s"));
        return match ? match[1].trim() : "";
      };
      const title = getTag("title");
      const link = getTag("link") || getTag("guid");
      const description = getTag("description").replace(/<[^>]+>/g, "").slice(0, 300);
      const pubDate = getTag("pubDate");

      if (title && link) {
        const fullText = `${title} ${description}`;
        articles.push({
          title,
          summary: description || title,
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

// --- News API ---
async function fetchNewsAPI(apiKey: string) {
  const articles: any[] = [];
  try {
    const queries = ["data center", "hyperscale cloud infrastructure"];
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
          summary: a.description || a.title,
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
    const queries = ["data center news", "hyperscale data center deals"];
    for (const query of queries) {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, limit: 5 }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.data || []) {
        if (!item.title || !item.url) continue;
        const fullText = `${item.title} ${item.description || ""}`;
        articles.push({
          title: item.title,
          summary: item.description || item.title,
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

    // Fetch from all sources in parallel
    const rssFeeds = [
      ["https://www.datacenterdynamics.com/en/rss/", "DataCenterDynamics"],
      ["https://www.datacenterknowledge.com/rss.xml", "Data Center Knowledge"],
      ["https://www.theregister.com/data_centre/headlines.atom", "The Register"],
      ["https://datacenterfrontier.com/feed/", "Datacenter Frontier"],
    ] as const;

    const newsApiKey = Deno.env.get("NEWS_API_KEY");
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

    const promises: Promise<any[]>[] = rssFeeds.map(([url, name]) =>
      fetchRSS(url, name)
    );
    if (newsApiKey) promises.push(fetchNewsAPI(newsApiKey));
    if (firecrawlKey) promises.push(fetchFirecrawl(firecrawlKey));

    const results = await Promise.allSettled(promises);
    const allArticles = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => (r as PromiseFulfilledResult<any[]>).value);

    console.log(`Fetched ${allArticles.length} articles total`);

    // Deduplicate and upsert
    let inserted = 0;
    for (const article of allArticles) {
      const { error } = await supabase
        .from("articles")
        .upsert(article, { onConflict: "source_url", ignoreDuplicates: true });
      if (!error) inserted++;
    }

    console.log(`Inserted/updated ${inserted} articles`);

    return new Response(
      JSON.stringify({ success: true, fetched: allArticles.length, inserted }),
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
