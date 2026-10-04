import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireCronSecret(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response | null> {
  const provided = req.headers.get("x-cron-secret");
  if (!provided) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: expected, error } = await supabase.rpc("get_cron_secret");
  if (error || !expected || expected !== provided) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}
