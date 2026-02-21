import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STOP_WORDS = new Set([
  "about", "which", "there", "their", "between", "after", "before", "under",
  "above", "from", "this", "that", "with", "have", "will", "were", "would",
  "could", "should", "the", "and", "for", "are", "our", "but", "not", "you",
  "your", "has", "its", "they", "them", "been", "being", "more", "than",
  "also", "into", "over", "such", "what", "when", "where", "while", "some",
  "other", "each", "only", "said", "says", "just", "like", "make", "made",
  "well", "back", "even", "most", "much", "then", "these", "those", "through",
  "very", "can", "does", "did", "doing", "done", "here", "going", "come",
  "came", "take", "took", "give", "gave", "look", "know", "want", "tell",
  "told", "think", "thought", "help", "need", "may", "might", "shall",
  "data", "center", "centres", "centers", "centre", // too generic for this context
]);

function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]+/gu, " ");
  return cleaned.split(/\s+/).filter((t) => t.length > 3 && !STOP_WORDS.has(t));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: articles } = await supabase
      .from("articles")
      .select("title, summary")
      .gte("published_at", since);

    const text = (articles || []).map((a) => `${a.title} ${a.summary || ""}`).join(" ");
    const tokens = tokenize(text);
    const counts: Record<string, number> = {};
    for (const t of tokens) counts[t] = (counts[t] || 0) + 1;

    const top = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 60)
      .map(([word, count]) => ({ word, count }));

    return new Response(JSON.stringify(top), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=600" },
    });
  } catch (error) {
    console.error("word-bubble error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
