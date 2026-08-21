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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error } = await supabase
      .from("articles")
      .select("title, summary, source_url")
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
        content: `You are a data center infrastructure analyst. Extract data center capacity information from these articles.

For each capacity mention return:
- company (the company building/operating the data center)
- city (specific city if mentioned)
- country (country)
- region (UAE, Saudi Arabia, MENA, US, EU, Asia, Global)
- megawatts (capacity in MW as a number)
- source_url (the article URL)

Return ONLY a valid JSON array. If no capacity data found, return [].
Example: [{"company":"Equinix","city":"Dubai","country":"UAE","region":"MENA","megawatts":100,"source_url":"https://..."}]`,
      },
      {
        role: "user",
        content: JSON.stringify(articles.map(a => ({
          title: a.title,
          summary: (a.summary || "").slice(0, 200),
          source_url: a.source_url,
        }))),
      },
    ], apiKey);

    let capacityData: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) capacityData = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    let inserted = 0;
    for (const row of capacityData) {
      if (!row?.company) continue;
      try {
        await supabase.from("company_capacity").insert({
          company: row.company,
          city: row.city || null,
          country: row.country || null,
          region: row.region || null,
          capacity_mw: row.megawatts || null,
          source_url: row.source_url || null,
          last_updated: new Date().toISOString().slice(0, 10),
        });
        inserted++;
      } catch (err) {
        console.warn("Insert error:", err);
      }
    }

    console.log(`Extract-capacity: found ${capacityData.length}, inserted ${inserted}`);
    return new Response(
      JSON.stringify({ ok: true, found: capacityData.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-capacity error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
