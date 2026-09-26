import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (email.trim().length > 255) {
      return new Response(
        JSON.stringify({ error: "Email too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check for existing subscriber
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, confirmed")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          message: existing.confirmed
            ? "You're already subscribed!"
            : "You're already on the list — check your inbox for the confirmation email.",
          already_subscribed: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new subscriber, unconfirmed until they click the emailed link
    const { data: inserted, error } = await supabase
      .from("subscribers")
      .insert({
        email: email.trim().toLowerCase(),
        name: name?.trim()?.slice(0, 100) || null,
        confirmed: false,
      })
      .select("confirmation_token")
      .single();

    if (error || !inserted) {
      console.error("Subscribe error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to subscribe. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      const siteUrl = Deno.env.get("SITE_URL") || "https://data-center-insights-fawn.vercel.app";
      const confirmUrl = `${siteUrl}/confirm?token=${inserted.confirmation_token}`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") || "Data Center Pulse <onboarding@resend.dev>",
            to: [email.trim().toLowerCase()],
            subject: "Confirm your Data Center Pulse subscription",
            html: `<p>One more step — confirm your email to start receiving the daily briefing:</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you didn't request this, you can ignore this email.</p>`,
          }),
        });
      } catch (err) {
        console.error("Failed to send confirmation email:", err);
      }
    } else {
      console.error("RESEND_API_KEY not configured; subscriber inserted but no confirmation email sent.");
    }

    return new Response(
      JSON.stringify({ message: "Almost there — check your email to confirm your subscription.", success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
