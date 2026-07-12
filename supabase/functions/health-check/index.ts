import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runChecks, type Check } from "../_shared/dataContract.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// dc_capacity_stats / dc_energy_usage / dc_investment_stats / dc_company_capacity_stats
// are intentionally excluded: fetch-stats-monthly was paused (2026-07-12) pending real
// data sourcing, so those tables are expected to go stale until that work lands.
const CHECKS: Check[] = [
  { functionName: "fetch-news", table: "articles", minRows: 1, requiredFields: ["title"], freshnessColumn: "published_at", maxAgeHours: 6 },
  { functionName: "fetch-news", table: "people", minRows: 1, requiredFields: ["name"], freshnessColumn: "last_mentioned", maxAgeHours: 30 },
  { functionName: "market-signals", table: "market_signals", minRows: 1, requiredFields: ["title", "type"], freshnessColumn: "created_at", maxAgeHours: 30 },
  { functionName: "generate-weekly-index", table: "weekly_index", minRows: 1, requiredFields: ["score", "outlook"], freshnessColumn: "created_at", maxAgeHours: 216 },
  { functionName: "regional-outlook", table: "regional_outlook", minRows: 1, requiredFields: ["outlook"], freshnessColumn: "updated_at", maxAgeHours: 216 },
  { functionName: "strategic-insights", table: "strategic_insights", minRows: 1, requiredFields: ["insight"], freshnessColumn: "created_at", maxAgeHours: 216 },
  { functionName: "word-cloud", table: "word_cloud", minRows: 1, requiredFields: ["word"], freshnessColumn: "last_updated", maxAgeHours: 30 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = await runChecks(supabase, CHECKS);

    const rows = results.map((r) => ({
      function_name: r.function_name,
      table_name: r.table_name,
      status: r.status,
      detail: r.detail,
    }));
    await supabase.from("pipeline_health_checks").insert(rows);

    const failing = results.filter((r) => r.status !== "ok");
    if (failing.length > 0) {
      console.error("Pipeline health check failures:", JSON.stringify(failing));
    }

    return new Response(
      JSON.stringify({ ok: true, checked: results.length, failing: failing.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("health-check error:", error);
    return new Response(JSON.stringify({ ok: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
