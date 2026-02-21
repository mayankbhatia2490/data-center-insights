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

    // Calculate Monday of this week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    const weekStartISO = weekStart.toISOString().slice(0, 10);

    // Check if already computed
    const { data: existing } = await supabase
      .from("weekly_index")
      .select("id")
      .eq("week_start", weekStartISO)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, message: "Weekly index already exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pull this week's articles
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, summary, insight, source, sentiment")
      .gte("published_at", since);

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No articles this week" }),
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
            content: `You are creating the "Data Center Pulse Index" for week starting ${weekStartISO}.

Task:
1) Provide a score -100..+100 for overall industry sentiment.
2) Identify the 3 strongest positive drivers this week.
3) Identify the 3 strongest risks this week.
4) Write a 1-paragraph outlook (<=80 words).

Return ONLY valid JSON:
{"score": 23, "drivers":["...","...","..."], "risks":["...","...","..."], "outlook":"..."}`,
          },
          {
            role: "user",
            content: `Articles this week:\n${JSON.stringify(articles.slice(0, 40))}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI error:", response.status);
      return new Response(
        JSON.stringify({ success: false, error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim() || "";

    let parsed;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not parse weekly index" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase.from("weekly_index").insert({
      week_start: weekStartISO,
      score: parsed.score,
      drivers: parsed.drivers,
      risks: parsed.risks,
      outlook: parsed.outlook,
    });

    console.log(`Weekly index generated for ${weekStartISO}: score=${parsed.score}`);

    return new Response(
      JSON.stringify({ success: true, week_start: weekStartISO, score: parsed.score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("compute-trending error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
