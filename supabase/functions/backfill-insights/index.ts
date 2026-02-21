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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get articles without insights
    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, summary, source")
      .is("insight", null)
      .order("published_at", { ascending: false })
      .limit(30);

    if (!articles || articles.length === 0) {
      return new Response(JSON.stringify({ ok: true, updated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    // Process in batches of 5
    for (let i = 0; i < articles.length; i += 5) {
      const batch = articles.slice(i, i + 5);
      const results = await Promise.allSettled(
        batch.map(async (a) => {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You are an industry analyst. Explain in 1–2 sentences why this news matters to the data center industry. Focus on: investment impact, infrastructure demand, power or cooling implications, geopolitical or regulatory risk. Output ONLY the insight sentence(s), no prefix.`,
                },
                {
                  role: "user",
                  content: `Title: ${a.title}\nSummary: ${a.summary || ""}`,
                },
              ],
            }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          const insight = data.choices?.[0]?.message?.content?.trim();
          if (insight) {
            await supabase.from("articles").update({ insight }).eq("id", a.id);
            return true;
          }
          return null;
        })
      );
      updated += results.filter(
        (r) => r.status === "fulfilled" && r.value
      ).length;
    }

    return new Response(JSON.stringify({ ok: true, updated, total: articles.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
