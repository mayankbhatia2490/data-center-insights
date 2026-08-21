import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const apiKey = Deno.env.get("GEMINI_API_KEY")!;

    // Get recent articles directly (not market_signals, which is itself AI-derived —
    // reading articles avoids compounding AI-on-AI interpretation)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, summary, category, sentiment, insight")
      .gte("published_at", sevenDaysAgo)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No articles to analyze" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceArticleIds = articles.map((a) => a.id);

    const raw = await callAI([
      {
        role: "system",
        content: `You are a strategic advisor for the data center industry. Generate actionable business insights from this week's articles.

For each insight return:
- insight: 1-2 sentence actionable insight
- sector: relevant sector (Hyperscale, Colocation, Edge, Energy, AI Infrastructure, Policy)
- region: relevant region (UAE, Saudi Arabia, MENA, US, EU, Asia, Global)
- horizon: time horizon (short-term, medium-term, long-term)

Return ONLY a valid JSON array of 5-8 insights. If none found, return [].`,
      },
      {
        role: "user",
        content: JSON.stringify(articles),
      },
    ], apiKey);

    let insights: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) insights = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    // Dedup against existing insights (same insight+sector+region combo)
    const { data: existingInsights } = await supabase
      .from("strategic_insights")
      .select("insight, sector, region")
      .order("created_at", { ascending: false })
      .limit(200);
    const existingKeys = new Set(
      (existingInsights || []).map((e) => `${e.insight}|${e.sector}|${e.region}`)
    );

    let inserted = 0;
    for (const i of insights) {
      if (!i?.insight) continue;
      const key = `${i.insight}|${i.sector || null}|${i.region || "Global"}`;
      if (existingKeys.has(key)) continue;
      try {
        await supabase.from("strategic_insights").insert({
          insight: i.insight,
          sector: i.sector || null,
          region: i.region || "Global",
          horizon: i.horizon || "medium-term",
          source_article_ids: sourceArticleIds,
        });
        existingKeys.add(key);
        inserted++;
      } catch (err) {
        console.warn("Insert error:", err);
      }
    }

    console.log(`Strategic-insights: generated ${insights.length}, inserted ${inserted}`);
    return new Response(
      JSON.stringify({ ok: true, generated: insights.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("strategic-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
