import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =========================================================
// AI Helper: Direct Google Gemini API (replaces Lovable gateway)
// =========================================================
async function callAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model = "gemini-2.0-flash-lite"
): Promise<string> {
  const systemMsg = messages.find((m) => m.role === "system")?.content ?? "";
  const userMsg = messages.find((m) => m.role === "user")?.content ?? "";
  const prompt = systemMsg ? `${systemMsg}\n\n${userMsg}` : userMsg;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

// =========================================================
// AI: Summarize
// =========================================================
async function aiSummarize(title: string, rawSummary: string, apiKey: string): Promise<string> {
  try {
    return await callAI([
      { role: "system", content: "You are a news summarizer for data center industry professionals focused on the MENA region. Write a concise 1-2 sentence summary. Be factual and informative. Do not use markdown." },
      { role: "user", content: `Article title: ${title}\n\nRaw description: ${rawSummary}` },
    ], apiKey);
  } catch { return rawSummary; }
}

// =========================================================
// AI: Sentiment
// =========================================================
async function aiSentiment(title: string, summary: string, apiKey: string): Promise<string | null> {
  try {
    const raw = await callAI([
      { role: "system", content: "You are a financial sentiment classifier for the data center industry in MENA. Classify the article as exactly one of: Bullish, Bearish, or Neutral. Respond with ONLY that single word." },
      { role: "user", content: `Title: ${title}\nSummary: ${summary}` },
    ], apiKey);
    if (raw?.toLowerCase().includes("bullish")) return "Bullish";
    if (raw?.toLowerCase().includes("bearish")) return "Bearish";
    if (raw?.toLowerCase().includes("neutral")) return "Neutral";
    return null;
  } catch { return null; }
}

// =========================================================
// AI: Insight
// =========================================================
async function aiInsight(
  title: string,
  summary: string,
  source: string,
  apiKey: string
): Promise<{ insight: string | null; source_excerpt: string | null }> {
  try {
    const raw = await callAI([
      {
        role: "system",
        content: `You are a senior data center analyst specializing in MENA markets (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman). Given the title, summary and source below, produce 1-2 concise sentences explaining WHY this news matters to MENA infrastructure investors or operators. Focus on investment impact, capacity demand, energy, regulatory or geopolitical risk. Output ONLY valid JSON: {"insight": "...", "source_excerpt": "..."}. The source_excerpt should be a key quote or fact from the summary (max 50 words).`,
      },
      { role: "user", content: `Title: ${title}\nSource: ${source}\nSummary: ${summary}` },
    ], apiKey);
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return { insight: raw.slice(0, 300), source_excerpt: null };
  } catch { return { insight: null, source_excerpt: null }; }
}

// =========================================================
// AI: People Extraction (MENA-biased)
// =========================================================
async function aiExtractPeople(title: string, summary: string, apiKey: string): Promise<any[]> {
  try {
    const raw = await callAI([
      {
        role: "system",
        content: `You are an entity extraction assistant specialized in corporate and government leadership in the data center industry.\n\nExtract up to 6 people who are relevant (executives, ministers, regulators, investors). STRONGLY PRIORITIZE leaders in MENA (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman, Egypt, Jordan). For each person return:\n- name (full name)\n- title (CEO, Minister of Energy, CTO, etc.)\n- organization\n- region (UAE, Saudi Arabia, Qatar, MENA, Global, US, EU)\n- role_in_article (quoted/announced/appointed/visited)\n- context (<=30 words)\n- confidence (0.0-1.0)\n\nReturn ONLY a valid JSON array. If no people found, return [].`,
      },
      { role: "user", content: `Article title: ${title}\nSummary: ${summary}` },
    ], apiKey);
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    return [];
  } catch { return []; }
}

// =========================================================
// AI: Quality Gate (MENA-focused scoring)
// =========================================================
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
          content: `You are an editorial quality filter for "Data Center Pulse," a premium intelligence platform focused on the MENA region (UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman, Egypt, Jordan).\n\nScore each article 1-10 based on:\n- MENA Relevance: Does it directly mention a MENA country or a company operating in MENA?\n- Global Impact: Is this global news (Microsoft, AWS, Nvidia, regulations) that DIRECTLY affects MENA data center investments?\n- Newsworthiness: Is this a major deal, policy change, capacity announcement, or investment?\n- Executive Relevance: Would a C-suite executive or MENA infrastructure investor find this valuable?\n\nREJECT (score 1-5): Generic global news with no MENA relevance, press release fluff, unrelated tech news.\nACCEPT (score 6-10): MENA investments/deals, hyperscaler expansion in Gulf, Middle East policy, global supply chain news impacting MENA.\n\nRespond with ONLY a JSON array of scores, e.g. [8, 3, 7, 5, 9]. No explanation.`,
        },
        { role: "user", content: articleList },
      ], apiKey);

      const match = raw.match(/\[\d[\d\s,]+\]/);
      if (match) {
        const scores: number[] = JSON.parse(match[0]);
        batch.forEach((article, idx) => {
          if ((scores[idx] ?? 5) >= 6) scored.push(article);
        });
        console.log(`Quality gate batch ${i}: ${batch.length} → ${scores.filter((s) => s >= 6).length} passed`);
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

// =========================================================
// Helpers
// =========================================================
function categorize(text: string): string {
  const lower = text.toLowerCase();
  const rules: [string[], string][] = [
    [["acquisition", "merger", "ipo", "deal", "stake", "buyout", "takeover", "valuation", "financing", "investment", "billion", "million", "funding"], "M&A"],
    [["renewable", "carbon", "pue", "green", "solar", "wind", "sustainability", "energy efficiency", "net zero", "esg", "water usage", "emissions"], "Sustainability"],
    [["dubai", "saudi", "uae", "oman", "qatar", "bahrain", "riyadh", "abu dhabi", "middle east", "gulf", "neom", "jeddah", "muscat", "kuwait", "mena", "dewa", "stc", "mobily", "egypt", "cairo", "jordan", "amman", "iraq", "lebanon"], "Middle East"],
    [["regulation", "policy", "compliance", "legislation", "government", "mandate", "tariff", "subsidy", "permit", "ministry", "authority", "vision 2030"], "Policy"],
    [["ai ", "gpu", "machine learning", "nvidia", "llm", "deep learning", "artificial intelligence", "generative", "cooling", "liquid cooling", "power", "capacity", "hyperscale", "colocation", "edge computing", "chip", "semiconductor"], "AI & Infrastructure"],
  ];
  for (const [keywords, category] of rules) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "Infrastructure";
}

function estimateReadTime(text: string): string {
  const words = text.split(/\s+/).length;
  const mins = Math.max(2, Math.ceil(words / 200));
  return `${mins} min read`;
}

// =========================================================
// SOURCE 1: NewsData.io — MENA Region (Direct Country Filter)
// Countries: UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman, Egypt, Jordan, Lebanon, Iraq
// =========================================================
async function fetchNewsDataMENA(apiKey: string) {
  const articles: any[] = [];
  try {
    const menaCountries = "ae,sa,qa,bh,kw,om,eg,jo,lb,iq";
    const queries = [
      "data center",
      "data centre",
      "hyperscale cloud infrastructure",
      "colocation facility",
    ];

    for (const q of queries) {
      const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&country=${menaCountries}&category=technology,business&q=${encodeURIComponent(q)}&language=en&size=10`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`NewsData MENA [${q}] HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (data.status !== "success") {
        console.error(`NewsData MENA [${q}] API error:`, data.message);
        continue;
      }
      for (const a of data.results || []) {
        if (!a.title || !a.link) continue;
        const fullText = `${a.title} ${a.description || ""}`;
        articles.push({
          title: a.title,
          summary: a.description ? a.description.replace(/<[^>]*>/g, "").trim().slice(0, 500) : null,
          category: categorize(fullText),
          source: a.source_name || a.source_id || "NewsData",
          source_url: a.link,
          image_url: a.image_url || null,
          published_at: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
      // Respect NewsData.io rate limits
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch (e) { console.error("NewsData MENA error:", e); }
  return articles;
}

// =========================================================
// SOURCE 2: NewsData.io — Global News Impacting MENA
// Searches globally for articles that mention MENA/Gulf/GCC
// =========================================================
async function fetchNewsDataGlobalMENA(apiKey: string) {
  const articles: any[] = [];
  try {
    const globalMENAQueries = [
      `"data center" "Middle East" OR UAE OR "Saudi Arabia" OR Gulf`,
      `hyperscale "Abu Dhabi" OR Dubai OR Riyadh OR Doha`,
      `Microsoft OR Google OR Amazon OR Equinix "Middle East" "data center"`,
      `"data center" MENA investment`,
      `cloud infrastructure "Gulf Cooperation Council" OR GCC`,
    ];

    for (const q of globalMENAQueries) {
      const url = `https://newsdata.io/api/1/latest?apikey=${apiKey}&q=${encodeURIComponent(q)}&language=en&category=technology,business&size=5`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status !== "success") continue;
      for (const a of data.results || []) {
        if (!a.title || !a.link) continue;
        const fullText = `${a.title} ${a.description || ""}`;
        articles.push({
          title: a.title,
          summary: a.description ? a.description.replace(/<[^>]*>/g, "").trim().slice(0, 500) : null,
          category: categorize(fullText),
          source: a.source_name || a.source_id || "NewsData",
          source_url: a.link,
          image_url: a.image_url || null,
          published_at: a.pubDate ? new Date(a.pubDate).toISOString() : new Date().toISOString(),
          read_time: estimateReadTime(fullText),
        });
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  } catch (e) { console.error("NewsData Global-MENA error:", e); }
  return articles;
}

// =========================================================
// People Upsert Logic (unchanged)
// =========================================================
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
            importance_score:
              (existingPerson.importance_score || 0) +
              Math.round((p.confidence || 0.6) * 2),
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
    } catch (err) { console.warn("People upsert error:", err); }
  }
}

// =========================================================
// Main Handler
// =========================================================
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const newsDataKey = Deno.env.get("NEWSDATA_API_KEY");

    if (!newsDataKey) {
      return new Response(
        JSON.stringify({ success: false, error: "NEWSDATA_API_KEY is not set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[fetch-news] Starting MENA-first ingestion via NewsData.io...");
    console.log("  Source 1: NewsData.io — MENA country-filtered (ae,sa,qa,bh,kw,om,eg,jo,lb,iq)");
    console.log("  Source 2: NewsData.io — Global news impacting MENA");

    const [ndMena, ndGlobal] = await Promise.allSettled([
      fetchNewsDataMENA(newsDataKey),
      fetchNewsDataGlobalMENA(newsDataKey),
    ]);

    let allArticles = [
      ...(ndMena.status === "fulfilled" ? ndMena.value : []),
      ...(ndGlobal.status === "fulfilled" ? ndGlobal.value : []),
    ];

    const rawCount = allArticles.length;
    console.log(`[fetch-news] Raw fetched: ${rawCount}`);
    console.log(`  NewsData MENA: ${ndMena.status === "fulfilled" ? ndMena.value.length : "FAILED"}`);
    console.log(`  NewsData Global-MENA: ${ndGlobal.status === "fulfilled" ? ndGlobal.value.length : "FAILED"}`);

    // Deduplicate by source_url
    const seen = new Set<string>();
    allArticles = allArticles.filter((a) => {
      if (!a.source_url || seen.has(a.source_url)) return false;
      seen.add(a.source_url);
      return true;
    });
    console.log(`[fetch-news] Unique after dedup: ${allArticles.length}`);

    // AI Quality Gate
    if (geminiApiKey && allArticles.length > 0) {
      const beforeCount = allArticles.length;
      allArticles = await aiQualityFilter(allArticles, geminiApiKey);
      console.log(`[fetch-news] Quality gate: ${beforeCount} → ${allArticles.length} passed`);
    }

    // AI Enhancement pipeline
    if (geminiApiKey) {
      // 1. Summaries (for poor/missing descriptions)
      const needsSummary = allArticles.filter((a) => !a.summary || a.summary.length < 40);
      console.log(`[fetch-news] Generating summaries for ${Math.min(needsSummary.length, 25)} articles...`);
      for (let i = 0; i < Math.min(needsSummary.length, 25); i += 5) {
        const batch = needsSummary.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map((a) => aiSummarize(a.title, a.summary || a.title, geminiApiKey))
        );
        results.forEach((r, j) => { if (r.status === "fulfilled") batch[j].summary = r.value; });
      }

      // 2. Sentiment (top 30)
      console.log("[fetch-news] Running sentiment analysis...");
      for (let i = 0; i < Math.min(allArticles.length, 30); i += 5) {
        const batch = allArticles.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map((a) => aiSentiment(a.title, a.summary || a.title, geminiApiKey))
        );
        results.forEach((r, j) => { if (r.status === "fulfilled" && r.value) batch[j].sentiment = r.value; });
      }

      // 3. Insights (top 20)
      console.log("[fetch-news] Generating insights...");
      for (let i = 0; i < Math.min(allArticles.length, 20); i += 5) {
        const batch = allArticles.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map((a) => aiInsight(a.title, a.summary || "", a.source || "", geminiApiKey))
        );
        results.forEach((r, j) => {
          if (r.status === "fulfilled") {
            batch[j].insight = r.value.insight;
            batch[j].source_excerpt = r.value.source_excerpt;
          }
        });
      }
    }

    // Upsert to DB + extract MENA leaders
    let inserted = 0;
    let skipped = 0;
    let peopleExtracted = 0;

    for (const article of allArticles) {
      const { data: existing } = await supabase
        .from("articles")
        .select("id")
        .eq("source_url", article.source_url)
        .maybeSingle();

      if (existing) { skipped++; continue; }

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

      if (error || !insertedArticle) {
        console.error("Insert error:", error?.message);
        continue;
      }
      inserted++;

      // Extract MENA leaders from article
      if (geminiApiKey) {
        try {
          const people = await aiExtractPeople(
            article.title,
            article.summary || "",
            geminiApiKey
          );
          if (people.length > 0) {
            await upsertPeople(supabase, insertedArticle.id, article.published_at, people);
            peopleExtracted += people.filter((p: any) => (p.confidence ?? 0) >= 0.6).length;
          }
        } catch (err) { console.warn("People extraction error:", err); }
      }
    }

    console.log(`[fetch-news] Complete. inserted=${inserted}, skipped=${skipped}, people=${peopleExtracted}`);

    return new Response(
      JSON.stringify({
        success: true,
        sources: {
          newsdata_mena: ndMena.status === "fulfilled" ? ndMena.value.length : 0,
          newsdata_global_mena: ndGlobal.status === "fulfilled" ? ndGlobal.value.length : 0,
        },
        raw: rawCount,
        unique: seen.size,
        passed_quality: allArticles.length,
        inserted,
        skipped,
        peopleExtracted,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[fetch-news] Fatal error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
