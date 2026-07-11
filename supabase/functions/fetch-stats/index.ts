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

    // Get recent articles for context
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, summary, insight")
      .gte("published_at", since)
      .limit(50);

    const raw = await callAI([
      {
        role: "system",
        content: `You are a data center industry statistics analyst. Based on the latest industry news and your knowledge, provide current estimated statistics.

Return ONLY valid JSON with these fields:
- global_capacity_gw: total global data center capacity in GW (number)
- growth_rate_pct: year-over-year growth rate percentage (number)
- energy_consumption_twh: global data center energy consumption in TWh (number)
- percent_of_electricity: percentage of global electricity used by data centers (number)
- investment_usd: total annual investment in billions USD (number)
- investment_growth_pct: year-over-year investment growth percentage (number)
- top_companies: array of top 5 companies by capacity [{company, capacity_gw, region}]

Example: {"global_capacity_gw":35,"growth_rate_pct":12,"energy_consumption_twh":500,"percent_of_electricity":3.5,"investment_usd":350,"investment_growth_pct":25,"top_companies":[{"company":"Equinix","capacity_gw":4.5,"region":"Global"}]}`,
      },
      {
        role: "user",
        content: `Recent industry context:\n${JSON.stringify((articles || []).slice(0, 20).map(a => a.title))}`,
      },
    ], apiKey);

    let stats: any = null;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) stats = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    if (!stats) {
      return new Response(
        JSON.stringify({ ok: false, error: "Could not parse stats" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const year = new Date().getFullYear();

    // Insert capacity stats
    await supabase.from("dc_capacity_stats").insert({
      region: "Global",
      total_capacity_gw: stats.global_capacity_gw,
      growth_rate_pct: stats.growth_rate_pct,
      last_updated: today,
      source: "AI Analysis",
    });

    // Insert energy usage
    await supabase.from("dc_energy_usage").insert({
      region: "Global",
      consumption_twh: stats.energy_consumption_twh,
      percent_of_electricity: stats.percent_of_electricity,
      last_updated: today,
      source: "AI Analysis",
    });

    // Insert investment stats
    await supabase.from("dc_investment_stats").insert({
      year,
      total_investment_usd: stats.investment_usd,
      growth_pct: stats.investment_growth_pct,
      source: "AI Analysis",
    });

    // Insert company capacity stats
    if (stats.top_companies && Array.isArray(stats.top_companies)) {
      for (let idx = 0; idx < stats.top_companies.length; idx++) {
        const c = stats.top_companies[idx];
        if (!c?.company) continue;
        await supabase.from("dc_company_capacity_stats").insert({
          company: c.company,
          total_capacity_gw: c.capacity_gw || null,
          region: c.region || "Global",
          rank: idx + 1,
          last_updated: today,
          source: "AI Analysis",
        });
      }
    }

    console.log("Fetch-stats: all statistics updated");
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("fetch-stats error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
