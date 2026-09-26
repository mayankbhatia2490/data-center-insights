import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireCronSecret } from "../_shared/cronAuth.ts";
import { callAI } from "../_shared/aiClient.ts";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const SUMMARY_SYSTEM = `Generate a short, factual weekly delta for the Middle East Data Center Pipeline.

Output GitHub-flavored markdown only, no preamble or code fences, following exactly this shape:
## Middle East DC Pipeline – Week of {week_start}
- Total Live: {live} MW
- Under Construction: {uc} MW
- Planned: {planned} MW
- Announced: {announced} MW
- Key changes this week:
  - ...
- Notable risks or notes: ...

Only state facts present in the input JSON. If a list is empty, say "No new or updated projects this week" instead of inventing an entry. Do not restate the raw JSON.`;

function mostRecentMonday(d: Date): string {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - diff);
  return monday.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers });

  const authError = await requireCronSecret(req, headers);
  if (authError) return authError;

  try {
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const now = new Date();
    const weekStart = mostRecentMonday(now);
    const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: allFacilities, error: allError } = await db
      .from("data_centers")
      .select("id, canonical_name, country, lifecycle_stage, capacity_mw, created_at, updated_at");
    if (allError) throw allError;

    const rows = allFacilities || [];
    const sumBy = (stage: string) => rows.filter((r) => r.lifecycle_stage === stage).reduce((acc, r) => acc + (Number(r.capacity_mw) || 0), 0);
    const totals = {
      total_live_mw: sumBy("operational"),
      total_uc_mw: sumBy("under_construction"),
      total_planned_mw: sumBy("planned"),
      total_announced_mw: sumBy("announced"),
    };

    const newProjects = rows.filter((r) => r.created_at >= since);
    const newIds = new Set(newProjects.map((r) => r.id));
    const updatedProjects = rows.filter((r) => !newIds.has(r.id) && r.updated_at >= since);

    const toSummary = (r: (typeof rows)[number]) => ({ name: r.canonical_name, country: r.country, stage: r.lifecycle_stage, mw: r.capacity_mw });

    const summaryRaw = await callAI([
      { role: "system", content: SUMMARY_SYSTEM },
      {
        role: "user",
        content: JSON.stringify({
          week_start: weekStart,
          totals,
          new_projects: newProjects.map(toSummary),
          updated_projects: updatedProjects.map(toSummary),
        }),
      },
    ], "gemini-3.5-flash");

    const markdown = summaryRaw.trim() || `## Middle East DC Pipeline – Week of ${weekStart}\n\nNo summary generated.`;

    const { error: upsertError } = await db.from("data_center_weekly_briefs").upsert(
      {
        week_start: weekStart,
        markdown,
        total_live_mw: totals.total_live_mw,
        total_uc_mw: totals.total_uc_mw,
        total_planned_mw: totals.total_planned_mw,
        total_announced_mw: totals.total_announced_mw,
        projects_added: newProjects.length,
        projects_updated: updatedProjects.length,
      },
      { onConflict: "week_start" }
    );
    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ ok: true, week_start: weekStart, projects_added: newProjects.length, projects_updated: updatedProjects.length, totals }),
      { headers }
    );
  } catch (error) {
    console.error("generate-dc-changelog error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), { status: 500, headers });
  }
});
