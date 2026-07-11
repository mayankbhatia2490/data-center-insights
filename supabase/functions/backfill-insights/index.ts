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

    // Get articles without insights OR without sentiment
    const { data: articles } = await supabase
      .from("articles")
      .select("id, title, summary, source, insight, sentiment")
      .or("insight.is.null,sentiment.is.null")
      .order("published_at", { ascending: false })
      .limit(50);

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
          const updates: Record<string, string> = {};

          // Backfill insight if missing
          if (!a.insight) {
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${GEMINI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gemini-2.5-flash-lite",
                messages: [
                  {
                    role: "system",
                    content: `You are an industry analyst. Explain in 1–2 sentences why this news matters to the data center industry. Focus on: investment impact, infrastructure demand, power or cooling implications, geopolitical or regulatory risk. Output ONLY the insight sentence(s), no prefix.`,
                  },
                  { role: "user", content: `Title: ${a.title}\nSummary: ${a.summary || ""}` },
                ],
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const insight = data.choices?.[0]?.message?.content?.trim();
              if (insight) updates.insight = insight;
            }
          }

          // Backfill sentiment if missing
          if (!a.sentiment) {
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${GEMINI_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gemini-2.5-flash-lite",
                messages: [
                  {
                    role: "system",
                    content: `You are a financial sentiment classifier for the data center industry. Classify as exactly one of: Bullish, Bearish, or Neutral. Respond with ONLY that single word.`,
                  },
                  { role: "user", content: `Title: ${a.title}\nSummary: ${a.summary || ""}` },
                ],
              }),
            });
            if (res.ok) {
              const data = await res.json();
              const raw = data.choices?.[0]?.message?.content?.trim()?.toLowerCase();
              if (raw?.includes("bullish")) updates.sentiment = "Bullish";
              else if (raw?.includes("bearish")) updates.sentiment = "Bearish";
              else if (raw?.includes("neutral")) updates.sentiment = "Neutral";
            }
          }

          if (Object.keys(updates).length > 0) {
            await supabase.from("articles").update(updates).eq("id", a.id);
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
