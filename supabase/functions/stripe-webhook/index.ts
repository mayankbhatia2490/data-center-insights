import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signedPayload = `${timestamp}.${payload}`;
  const sigBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "Billing is not configured yet. Set STRIPE_WEBHOOK_SECRET." }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const sigHeader = req.headers.get("Stripe-Signature");
  const rawBody = await req.text();

  if (!sigHeader || !(await verifyStripeSignature(rawBody, sigHeader, webhookSecret))) {
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const event = JSON.parse(rawBody);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId: string | null = session.client_reference_id;
        const email: string | undefined = session.customer_details?.email;
        if (!userId) break;

        const patch = {
          user_id: userId,
          subscription_tier: "premium",
          subscription_status: "active",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
        };

        const { data: byUser } = await supabase
          .from("subscribers")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (byUser) {
          await supabase.from("subscribers").update(patch).eq("id", byUser.id);
        } else if (email) {
          const { data: byEmail } = await supabase
            .from("subscribers")
            .select("id")
            .eq("email", email.toLowerCase())
            .maybeSingle();

          if (byEmail) {
            await supabase.from("subscribers").update(patch).eq("id", byEmail.id);
          } else {
            await supabase.from("subscribers").insert({ email: email.toLowerCase(), confirmed: true, ...patch });
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const status: string = subscription.status;
        const tier = status === "active" || status === "trialing" ? "premium" : "free";
        await supabase
          .from("subscribers")
          .update({ subscription_status: status, subscription_tier: tier })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
      default:
        break;
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook handling failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
