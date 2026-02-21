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

    // Fetch articles from the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, summary, category, source")
      .gte("published_at", yesterday)
      .order("published_at", { ascending: false })
      .limit(50);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No recent articles to digest" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by category
    const byCategory: Record<string, any[]> = {};
    for (const a of articles) {
      const cat = a.category || "Other";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(a);
    }

    const articleList = Object.entries(byCategory)
      .map(([cat, items]) => {
        const headlines = items
          .slice(0, 5)
          .map((a: any) => `- ${a.title} (${a.source}): ${a.summary}`)
          .join("\n");
        return `## ${cat}\n${headlines}`;
      })
      .join("\n\n");

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
            content: `You are the editor of "Data Center Pulse," a premium daily newsletter for data center industry executives. Write a compelling morning briefing digest.

FORMAT:
- Start with a one-line bold hook that captures the day's biggest theme
- Then cover each category with 2-3 sentences summarizing the key developments, trends, and implications
- Categories: M&A, AI, Sustainability, Middle East, Policy (only include categories that have articles)
- Use a professional, analytical tone — think Bloomberg or Financial Times
- End with a "Watch Today" bullet of 1-2 things to keep an eye on
- Use markdown formatting (bold, headers, bullet points)
- Keep the total digest under 400 words`,
          },
          {
            role: "user",
            content: `Generate today's digest from these articles:\n\n${articleList}`,
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
