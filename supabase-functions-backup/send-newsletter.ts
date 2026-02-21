import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function markdownToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="color:#3b82f6;margin:24px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#e2e8f0;margin:20px 0 8px;font-size:20px;">$1</h2>')
    .replace(/^\*\*(.+?)\*\*/gm, "<strong>$1</strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p style='margin:12px 0;color:#cbd5e1;line-height:1.6;'>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n/g, "<br>");
}

function buildEmailHtml(content: string, date: string, unsubscribeToken: string, siteUrl: string): string {
  const htmlContent = markdownToHtml(content);
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:Inter,system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#1e293b;">
    <div style="background:#1e3a5f;padding:32px;text-align:center;border-bottom:3px solid #3b82f6;">
      <h1 style="margin:0;color:#f1f5f9;font-size:28px;font-weight:800;">⚡ Data Center Pulse</h1>
      <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;">Daily Intelligence Briefing — ${date}</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:12px 0;color:#cbd5e1;line-height:1.6;">${htmlContent}</p>
    </div>
    <div style="padding:24px 32px;text-align:center;">
      <a href="${siteUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:14px 32px;text-decoration:none;font-weight:700;font-size:14px;">
        Read More on Data Center Pulse
      </a>
    </div>
    <div style="padding:24px 32px;border-top:1px solid #334155;text-align:center;">
      <p style="color:#64748b;font-size:11px;margin:0;">
        You're receiving this because you subscribed to Data Center Pulse.<br>
        <a href="${siteUrl}/unsubscribe?token=${unsubscribeToken}" style="color:#64748b;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get latest digest
    const { data: digest, error: digestError } = await supabase
      .from("daily_digests")
      .select("*")
      .order("digest_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (digestError || !digest) {
      return new Response(
        JSON.stringify({ error: "No digest available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all confirmed subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("confirmed", true);

    if (subError || !subscribers?.length) {
      return new Response(
        JSON.stringify({ message: "No subscribers to send to", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://datacenterpulse.com";
    const dateStr = new Date(digest.digest_date).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    let sent = 0;
    let failed = 0;

    // Send emails in batches of 10
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);
      const promises = batch.map(async (sub) => {
        const html = buildEmailHtml(digest.content, dateStr, sub.unsubscribe_token, siteUrl);
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Data Center Pulse <onboarding@resend.dev>",
              to: [sub.email],
              subject: `⚡ Data Center Pulse — ${dateStr}`,
              html,
            }),
          });
          if (res.ok) sent++;
          else {
            failed++;
            console.error("Resend error for", sub.email, await res.text());
          }
        } catch (e) {
          failed++;
          console.error("Send failed for", sub.email, e);
        }
      });
      await Promise.all(promises);
    }

    return new Response(
      JSON.stringify({ message: `Newsletter sent`, sent, failed, total: subscribers.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Newsletter error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to send newsletter" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
