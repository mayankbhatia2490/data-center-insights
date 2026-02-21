import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Baseline data center stocks (always included as fallback)
const BASELINE_SYMBOLS = [
  { symbol: "EQIX", name: "Equinix" },
  { symbol: "DLR", name: "Digital Realty" },
  { symbol: "NVDA", name: "NVIDIA" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ALPHA_VANTAGE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "ALPHA_VANTAGE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Get recent article titles to find trending stocks
    let symbolsToFetch = [...BASELINE_SYMBOLS];

    if (lovableApiKey) {
      const yesterday = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      const { data: recentArticles } = await supabase
        .from("articles")
        .select("title, summary")
        .gte("published_at", yesterday)
        .order("published_at", { ascending: false })
        .limit(30);

      if (recentArticles && recentArticles.length > 0) {
        const headlines = recentArticles
          .map((a: any) => `${a.title}${a.summary ? " — " + a.summary : ""}`)
          .join("\n");

        try {
          const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: `You extract US stock ticker symbols from news headlines about the data center, cloud, AI infrastructure, and tech industry.

Return ONLY a JSON array of objects with "symbol" and "name" fields. 
- Only include publicly traded US stocks (NYSE/NASDAQ)
- Maximum 8 stocks total
- Always include EQIX (Equinix), DLR (Digital Realty), NVDA (NVIDIA) as baseline
- Add up to 5 more stocks mentioned or strongly implied in the headlines
- Common mappings: Microsoft=MSFT, Google/Alphabet=GOOGL, Amazon/AWS=AMZN, Meta=META, Vertiv=VRT, Arista=ANET, Dell=DELL, AMD=AMD, Intel=INTC, Broadcom=AVGO, Schneider Electric=SBGSY, CyrusOne=CONE, CoreWeave=CRWV, Super Micro=SMCI, Celestica=CLS, Applied Digital=APLD
- Return raw JSON array, no markdown`,
                },
                { role: "user", content: headlines },
              ],
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            let text = aiData.choices?.[0]?.message?.content || "[]";
            text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            try {
              const extracted = JSON.parse(text);
              if (Array.isArray(extracted) && extracted.length > 0) {
                symbolsToFetch = extracted.slice(0, 8);
                console.log("AI-extracted symbols:", symbolsToFetch.map((s: any) => s.symbol).join(", "));
              }
            } catch {
              console.error("Failed to parse AI stock response:", text.slice(0, 200));
            }
          }
        } catch (e) {
          console.error("AI extraction error:", e);
        }
      }
    }

    // Step 2: Clear old tickers that aren't in the new list
    const newSymbols = symbolsToFetch.map((s) => s.symbol);
    await supabase.from("market_tickers").delete().not("symbol", "in", `(${newSymbols.join(",")})`);

    // Step 3: Fetch stock prices
    let updated = 0;
    for (let i = 0; i < symbolsToFetch.length; i++) {
      const { symbol, name } = symbolsToFetch[i];
      try {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) continue;

        const data = await res.json();
        const quote = data["Global Quote"];
        if (!quote || !quote["05. price"]) {
          console.log(`No quote data for ${symbol}:`, JSON.stringify(data).slice(0, 200));
          continue;
        }

        const price = parseFloat(quote["05. price"]);
        const changePercent = quote["10. change percent"] || "0%";
        const changeNum = parseFloat(changePercent);
        const status = changeNum >= 0 ? "up" : "down";

        const { error } = await supabase
          .from("market_tickers")
          .upsert(
            { symbol, name, price, change_percent: changePercent, status, updated_at: new Date().toISOString() },
            { onConflict: "symbol" }
          );

        if (!error) updated++;
        else console.error(`Upsert error for ${symbol}:`, error);
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
      }

      // Wait 15s between requests to respect rate limits
      if (i < symbolsToFetch.length - 1) {
        await new Promise((r) => setTimeout(r, 15000));
      }
    }

    console.log(`Updated ${updated}/${symbolsToFetch.length} tickers`);

    return new Response(
      JSON.stringify({ success: true, updated, symbols: newSymbols }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("fetch-stocks error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
