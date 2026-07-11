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
      .select("title, summary")
      .gte("published_at", since)
      .limit(100);

    if (error) throw error;
    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "No recent articles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const raw = await callAI([
      {
        role: "system",
        content: `You are a keyword extraction specialist for the data center industry. Extract the top 30 most relevant and frequently mentioned keywords/phrases from these articles.

Focus on: company names, technologies, locations, industry terms, deal types.
Exclude generic words like "data", "center", "company", "new", "said".

Return ONLY a valid JSON array of objects with word and count.
Example: [{"word":"Equinix","count":8},{"word":"liquid cooling","count":5}]`,
      },
      {
        role: "user",
        content: JSON.stringify(articles.map(a => `${a.title} ${a.summary || ""}`).join("\n")),
      },
    ], apiKey);

    let words: any[] = [];
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) words = JSON.parse(match[0]);
    } catch (e) {
      console.error("Parse error:", e);
    }

    if (words.length > 0) {
      // Clear old data
      await supabase.from("word_cloud").delete().neq("word", "");

      for (const w of words) {
        if (!w?.word) continue;
        try {
          await supabase.from("word_cloud").upsert({
            word: w.word,
            count: w.count || 1,
            last_updated: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Upsert error:", err);
        }
      }
    }

    console.log(`Word-cloud: extracted ${words.length} keywords`);
    return new Response(
      JSON.stringify({ ok: true, keywords: words.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("word-cloud error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
