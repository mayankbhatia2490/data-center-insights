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
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PREMIUM_PRICE_ID");
    if (!stripeSecretKey || !stripePriceId) {
      return new Response(
        JSON.stringify({
          error: "Billing is not configured yet. Set STRIPE_SECRET_KEY and STRIPE_PREMIUM_PRICE_ID.",
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Sign in required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Sign in required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user = userData.user;
    const siteUrl = Deno.env.get("SITE_URL") || "https://datacenterpulse.com";

    const { data: existingSub } = await supabase
      .from("subscribers")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": stripePriceId,
      "line_items[0][quantity]": "1",
      client_reference_id: user.id,
      success_url: `${siteUrl}/account?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancelled`,
    });

    if (existingSub?.stripe_customer_id) {
      params.set("customer", existingSub.stripe_customer_id);
    } else {
      params.set("customer_email", user.email);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    if (!stripeRes.ok) {
      console.error("Stripe checkout session error:", await stripeRes.text());
      return new Response(
        JSON.stringify({ error: "Failed to start checkout" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripeRes.json();
    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
