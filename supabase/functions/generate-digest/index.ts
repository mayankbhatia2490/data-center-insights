import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];

    // Check if digest already exists for today
    const { data: existing } = await supabase
      .from("daily_digests")
      .select("id")
      .eq("digest_date", today)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Digest already exists for today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch articles from the last 24 hours including insight
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, summary, category, source, source_url, sentiment, insight")
      .gte("published_at", yesterday)
      .order("published_at", { ascending: false })
      .limit(50);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recent articles to digest" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-3.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a senior data center market analyst writing a morning intelligence briefing.

You will receive grouped news articles from the last 24 hours.

Your job:
1. Extract KEY DEVELOPMENTS
2. Identify MARKET SIGNALS
3. Explain WHAT THIS MEANS for:
   - Investors
   - Operators
   - Policymakers
4. Detect TRENDS (growth, slowdown, risk, opportunity)
5. Write in professional Bloomberg / FT tone.

Structure EXACTLY like this:

## Executive Summary (3 bullet points)

## Market Signals
- Signal 1 (with short explanation)
- Signal 2
- Signal 3

## What This Means
**For Investors:** ...
**For Operators:** ...
**For Policymakers:** ...

## Trend Direction
Rate these on a scale of -5 (very bearish) to +5 (very bullish):
- Hyperscale Expansion: X
- AI Infrastructure: X
- Energy & Sustainability: X
- Middle East Data Centers: X
- Regulation & Policy: X

Keep under 450 words.
Avoid repeating article titles.
Focus on interpretation, not listing news.`,
          },
          {
            role: "user",
            content: `Generate today's intelligence briefing from these articles:\n\n${JSON.stringify(articles)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI error:", response.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const digest = aiData.choices?.[0]?.message?.content;

    if (!digest) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store digest
    const { error } = await supabase.from("daily_digests").insert({
      digest_date: today,
      content: digest,
      article_count: articles.length,
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Digest generated for ${today} from ${articles.length} articles`);

    return new Response(
      JSON.stringify({ success: true, date: today, articleCount: articles.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-digest error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
