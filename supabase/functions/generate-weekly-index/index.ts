import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get articles from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, insight, category, sentiment")
      .gte("created_at", sevenDaysAgo)
      .order("published_at", { ascending: false })
      .limit(100);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: "No recent articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are creating the "Data Center Pulse Index".

Based on this week's news:
1. Determine overall industry direction
2. Score sentiment from -100 to +100
3. Identify 3 strongest positive drivers
4. Identify 3 strongest risks
5. Write a 1-paragraph outlook

Return ONLY valid JSON:
{
  "score": number,
  "drivers": ["string", "string", "string"],
  "risks": ["string", "string", "string"],
  "outlook": "string"
}`,
          },
          {
            role: "user",
            content: `Generate the weekly Pulse Index from these ${articles.length} articles:\n\n${JSON.stringify(articles)}`,
          },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const aiData = await res.json();
    const raw = aiData.choices?.[0]?.message?.content?.trim() || "";

    let result: { score: number; drivers: string[]; risks: string[]; outlook: string };
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Failed to parse AI response", raw }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate week start (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split("T")[0];

    // Upsert for this week
    const { error } = await supabase
      .from("weekly_index")
      .upsert(
        {
          week_start: weekStart,
          score: result.score,
          drivers: result.drivers,
          risks: result.risks,
          outlook: result.outlook,
        },
        { onConflict: "week_start" }
      );

    if (error) {
      // If upsert fails (no unique constraint), just insert
      await supabase.from("weekly_index").insert({
        week_start: weekStart,
        score: result.score,
        drivers: result.drivers,
        risks: result.risks,
        outlook: result.outlook,
      });
    }

    return new Response(
      JSON.stringify({ ok: true, weekStart, score: result.score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
