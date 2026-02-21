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

    // Get recent articles from last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles, error } = await supabase
      .from("articles")
      .select("id, title, summary, source, source_url, published_at")
      .gte("published_at", since)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No recent articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const articleSummaries = articles.map(a => ({
      title: a.title,
      summary: (a.summary || "").slice(0, 200),
      source: a.source,
      source_url: a.source_url,
    }));

    const raw = await callAI([
      {
        role: "system",
        content: `You are an entity extraction assistant specialized in corporate and government leadership in the data center industry.

Extract notable CEOs, founders, ministers, regulators, and investors from the provided articles.

For each person return:
- name (full name)
- role (CEO, Minister of Energy, CTO, Founder, etc.)
- company (organization they belong to)
- region (UAE, Saudi Arabia, Qatar, MENA, Global, US, EU, Asia)
- country (specific country)
- source_url (the article URL where they were mentioned)

Return ONLY a valid JSON array. If no people found, return [].
Example: [{"name":"Jane Doe","role":"CEO","company":"Acme Data","region":"MENA","country":"UAE","source_url":"https://..."}]`,
      },
      {
        role: "user",
        content: JSON.stringify(articleSummaries),
      },
    ], apiKey);

    let people: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) people = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    let inserted = 0;
    for (const p of people) {
      if (!p?.name) continue;
      try {
        // Check if person already exists
        const { data: existing } = await supabase
          .from("people_leaders")
          .select("id")
          .eq("name", p.name)
          .eq("company", p.company || "")
          .maybeSingle();

        if (existing) {
          // Update last_seen
          await supabase
            .from("people_leaders")
            .update({ last_seen: new Date().toISOString() })
            .eq("id", existing.id);
        } else {
          await supabase.from("people_leaders").insert({
            name: p.name,
            role: p.role || null,
            company: p.company || null,
            region: p.region || null,
            country: p.country || null,
            source_url: p.source_url || null,
            last_seen: new Date().toISOString(),
          });
          inserted++;
        }
      } catch (err) {
        console.warn("Upsert error:", err);
      }
    }

    console.log(`Extract-people: found ${people.length}, inserted ${inserted} new`);
    return new Response(
      JSON.stringify({ ok: true, found: people.length, inserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-people error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
