import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface Check {
  functionName: string;
  table: string;
  minRows: number;
  requiredFields: string[];
  freshnessColumn: string;
  maxAgeHours: number;
}

export interface CheckResult {
  function_name: string;
  table_name: string;
  status: "ok" | "stale" | "empty" | "missing_fields";
  detail: Record<string, unknown>;
}

export async function runChecks(
  supabase: SupabaseClient,
  checks: Check[]
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  for (const check of checks) {
    const { data, error, count } = await supabase
      .from(check.table)
      .select("*", { count: "exact" })
      .order(check.freshnessColumn, { ascending: false })
      .limit(1);

    if (error) {
      results.push({
        function_name: check.functionName,
        table_name: check.table,
        status: "empty",
        detail: { error: error.message },
      });
      continue;
    }

    const rowCount = count ?? 0;
    if (rowCount < check.minRows) {
      results.push({
        function_name: check.functionName,
        table_name: check.table,
        status: "empty",
        detail: { rowCount, minRows: check.minRows },
      });
      continue;
    }

    const latest = data?.[0];
    const missing = check.requiredFields.filter((f) => latest?.[f] === null || latest?.[f] === undefined);
    if (missing.length > 0) {
      results.push({
        function_name: check.functionName,
        table_name: check.table,
        status: "missing_fields",
        detail: { missing },
      });
      continue;
    }

    const latestTimestamp = latest?.[check.freshnessColumn];
    const ageHours = latestTimestamp
      ? (Date.now() - new Date(latestTimestamp).getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (ageHours > check.maxAgeHours) {
      results.push({
        function_name: check.functionName,
        table_name: check.table,
        status: "stale",
        detail: { ageHours: Math.round(ageHours), maxAgeHours: check.maxAgeHours },
      });
      continue;
    }

    results.push({
      function_name: check.functionName,
      table_name: check.table,
      status: "ok",
      detail: { ageHours: Math.round(ageHours), rowCount },
    });
  }

  return results;
}
