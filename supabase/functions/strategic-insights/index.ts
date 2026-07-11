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

    // Get recent market signals
    const { data: signals, error } = await supabase
      .from("market_signals")
      .select("type, title, region, reason, confidence")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!signals || signals.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No signals to analyze" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await callAI([
      {
        role: "system",
        content: `You are a strategic advisor for the data center industry. Generate actionable business insights from market signals.

For each insight return:
- insight: 1-2 sentence actionable insight
- sector: relevant sector (Hyperscale, Colocation, Edge, Energy, AI Infrastructure, Policy)
- region: relevant region (UAE, Saudi Arabia, MENA, US, EU, Asia, Global)
- horizon: time horizon (short-term, medium-term, long-term)

Return ONLY a valid JSON array of 5-8 insights. If none found, return [].`,
      },
      {
        role: "user",
        content: JSON.stringify(signals),
      },
    ], apiKey);

    let insights: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) insights = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    let inserted = 0;
    for (const i of insights) {
      if (!i?.insight) continue;
      try {
        await supabase.from("strategic_insights").insert({
          insight: i.insight,
          sector: i.sector || null,
          region: i.region || "Global",
          horizon: i.horizon || "medium-term",
        });
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
