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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a senior market analyst writing "Data Center Pulse," a concise intelligence briefing for C-level readers in the data center industry.

FORMAT:
1) **Executive Summary** — 3 bullet points (high-level)
2) **Market Signals** — 3-5 short signals with 1-line evidence citing (source)
3) **What This Means:**
   - For Investors: 2 lines
   - For Operators: 2 lines
   - For Policymakers: 1 line
4) **Trend Scores** (scale -5..+5): Hyperscale Expansion, AI Infrastructure, Energy & Sustainability, Middle East Growth, Regulation
5) **Watch Today** — 1-2 bullets of things to keep an eye on

CONSTRAINTS:
- Use the 'insight' fields as factual support. When citing, append the source name in parentheses.
- Keep total length < 450 words.
- Use markdown formatting (bold, headers, bullet points).
- Use a professional, analytical tone — think Bloomberg or Financial Times.`,
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
