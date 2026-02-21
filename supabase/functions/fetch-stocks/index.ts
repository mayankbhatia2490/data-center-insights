import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYMBOLS = [
  { symbol: "EQIX", name: "Equinix" },
  { symbol: "DLR", name: "Digital Realty" },
  { symbol: "IRM", name: "Iron Mountain" },
  { symbol: "QTS", name: "QTS Realty" },
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let updated = 0;

    for (const { symbol, name } of SYMBOLS) {
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
            {
              symbol,
              name,
              price,
              change_percent: changePercent,
              status,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "symbol" }
          );

        if (!error) updated++;
        else console.error(`Upsert error for ${symbol}:`, error);
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
      }

      // Alpha Vantage free tier: 25 requests/day, must wait between requests
      if (SYMBOLS.indexOf({ symbol, name }) < SYMBOLS.length - 1) {
        await new Promise((r) => setTimeout(r, 20000));
      }
    }
      } catch (e) {
        console.error(`Error fetching ${symbol}:`, e);
      }
    }

    console.log(`Updated ${updated} tickers`);

    return new Response(
      JSON.stringify({ success: true, updated }),
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
