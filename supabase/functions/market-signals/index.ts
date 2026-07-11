import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model = "gemini-2.5-flash-lite"
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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error } = await supabase
      .from("articles")
      .select("title, summary, category, sentiment, insight")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No recent articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await callAI([
      {
        role: "system",
        content: `You are a market intelligence analyst for the data center industry. Detect trends, risks, and opportunities from the provided articles.

For each signal return:
- type: one of "trend", "risk", "opportunity"
- title: short descriptive title (max 10 words)
- region: affected region (UAE, Saudi Arabia, MENA, US, EU, Asia, Global)
- reason: 1-2 sentence explanation
- confidence: 0.0-1.0

Return ONLY a valid JSON array of 5-10 signals. If none found, return [].`,
      },
      {
        role: "user",
        content: JSON.stringify(articles),
      },
    ], apiKey);

    let signals: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) signals = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    let inserted = 0;
    for (const s of signals) {
      if (!s?.title) continue;
      try {
        await supabase.from("market_signals").insert({
          type: s.type || "trend",
          title: s.title,
          region: s.region || "Global",
          reason: s.reason || null,
          confidence: s.confidence || null,
        });
        inserted++;
      } catch (err) {
        console.warn("Insert error:", err);
      }
    }

    console.log(`Market-signals: found ${signals.length}, inserted ${inserted}`);
    return new Response(
      JSON.stringify({ ok: true, found: signals.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("market-signals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
