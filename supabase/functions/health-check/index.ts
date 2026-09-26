import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runChecks, type Check, type CheckResult } from "../_shared/dataContract.ts";
import { requireCronSecret } from "../_shared/cronAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Alerts on failing checks via Resend, so a pipeline stall (like the
// regional-outlook/strategic-insights/weekly-index jobs silently not
// firing for two months) surfaces immediately instead of only being
// visible to someone who thinks to query pipeline_health_checks. A no-op
// if RESEND_API_KEY or ALERT_EMAIL isn't configured.
async function sendAlert(failing: CheckResult[]): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const alertEmail = Deno.env.get("ALERT_EMAIL");
  if (!resendApiKey || !alertEmail || failing.length === 0) return;

  const rows = failing
    .map((f) => `<li><strong>${f.function_name}</strong> (${f.table_name}): ${f.status} — ${JSON.stringify(f.detail)}</li>`)
    .join("");

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "Data Center Pulse <onboarding@resend.dev>",
        to: [alertEmail],
        subject: `⚠️ Data Center Pulse: ${failing.length} pipeline check${failing.length === 1 ? "" : "s"} failing`,
        html: `<p>The following pipeline health checks are failing:</p><ul>${rows}</ul>`,
      }),
    });
  } catch (err) {
    console.error("Failed to send health-check alert email:", err);
  }
}

// dc_capacity_stats / dc_energy_usage / dc_investment_stats / dc_company_capacity_stats
// are intentionally excluded: fetch-stats-monthly was paused (2026-07-12) pending real
// data sourcing, so those tables are expected to go stale until that work lands.
const CHECKS: Check[] = [
  { functionName: "fetch-news", table: "articles", minRows: 1, requiredFields: ["title"], freshnessColumn: "published_at", maxAgeHours: 6 },
  { functionName: "fetch-news", table: "people", minRows: 1, requiredFields: ["name"], freshnessColumn: "last_mentioned", maxAgeHours: 30 },
  { functionName: "market-signals", table: "market_signals", minRows: 1, requiredFields: ["title", "type"], freshnessColumn: "created_at", maxAgeHours: 30 },
  // These three run daily now (previously weekly-only, which is what let
  // them silently stall for two months undetected -- see 20260926120000
  // migration and the daily reschedule). 48h gives one day of grace.
  { functionName: "generate-weekly-index", table: "weekly_index", minRows: 1, requiredFields: ["score", "outlook"], freshnessColumn: "updated_at", maxAgeHours: 48 },
  { functionName: "regional-outlook", table: "regional_outlook", minRows: 1, requiredFields: ["outlook"], freshnessColumn: "updated_at", maxAgeHours: 48 },
  { functionName: "strategic-insights", table: "strategic_insights", minRows: 1, requiredFields: ["insight"], freshnessColumn: "created_at", maxAgeHours: 48 },
  { functionName: "word-cloud", table: "word_cloud", minRows: 1, requiredFields: ["word"], freshnessColumn: "last_updated", maxAgeHours: 30 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authError = await requireCronSecret(req, corsHeaders);
  if (authError) return authError;

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
      await sendAlert(failing);
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
