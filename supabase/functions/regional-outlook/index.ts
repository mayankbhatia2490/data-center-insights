import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function callAI(
  messages: { role: string; content: string }[],
  apiKey: string,
  model = "google/gemini-2.5-flash-lite"
): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const regions = ["UAE", "Saudi Arabia", "Europe", "USA", "Asia"];

    for (const region of regions) {
      // Get recent articles and signals for this region
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [articlesRes, signalsRes, capacityRes] = await Promise.all([
        supabase
          .from("articles")
          .select("title, summary, sentiment, insight")
          .or(`category.ilike.%${region}%,title.ilike.%${region}%,summary.ilike.%${region}%`)
          .gte("published_at", since)
          .limit(20),
        supabase
          .from("market_signals")
          .select("type, title, reason, confidence")
          .eq("region", region)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("company_capacity")
          .select("company, capacity_mw, city")
          .eq("region", region)
          .limit(10),
      ]);

      const contextData = {
        articles: articlesRes.data || [],
        signals: signalsRes.data || [],
        capacity: capacityRes.data || [],
      };

      const raw = await callAI([
        {
          role: "system",
          content: `You are a regional market analyst for the data center industry. Generate an outlook for the specified region.

Return ONLY valid JSON with these fields:
- outlook: 2-3 sentence outlook paragraph
- demand_score: 1-100 (how strong is demand)
- risk_score: 1-100 (how risky is the market)
- opportunity_score: 1-100 (how much opportunity exists)

Example: {"outlook":"...","demand_score":75,"risk_score":30,"opportunity_score":85}`,
        },
        {
          role: "user",
          content: `Region: ${region}\nContext:\n${JSON.stringify(contextData)}`,
        },
      ], apiKey);

      try {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const o = JSON.parse(match[0]);

          // Check if region exists
          const { data: existing } = await supabase
            .from("regional_outlook")
            .select("id")
            .eq("region", region)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("regional_outlook")
              .update({
                outlook: o.outlook,
                demand_score: o.demand_score,
                risk_score: o.risk_score,
                opportunity_score: o.opportunity_score,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("regional_outlook").insert({
              region,
              outlook: o.outlook,
              demand_score: o.demand_score,
              risk_score: o.risk_score,
              opportunity_score: o.opportunity_score,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (parseErr) {
        console.warn(`Parse error for ${region}:`, parseErr);
      }
    }

    console.log("Regional outlook updated for all regions");
    return new Response(
      JSON.stringify({ ok: true, regions: regions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("regional-outlook error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
