import Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function resolveUserIdFromCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
) {
  let userId =
    (session.metadata?.userId as string | undefined) ??
    (session.client_reference_id as string | undefined);

  if (userId) {
    return userId;
  }

  if (session.subscription && typeof session.subscription === "string") {
    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      userId = subscription.metadata?.userId;
    } catch (error) {
      console.error("[stripe-webhook] failed to resolve user from subscription", error);
    }
  }

  return userId;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log("[stripe-webhook] received", {
    hasSignature: Boolean(signature),
    hasWebhookSecret: Boolean(webhookSecret),
  });

  if (!signature || !webhookSecret) {
    console.warn("[stripe-webhook] missing signature or webhook secret");
    return new Response("Webhook is not configured.", { status: 400 });
  }

  const stripe = getStripeServer();
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("[stripe-webhook] verified event", {
      type: event.type,
      id: event.id,
    });
  } catch (error) {
    console.error("[stripe-webhook] signature verification failed", error);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = await resolveUserIdFromCheckoutSession(stripe, session);
      console.log("[stripe-webhook] checkout.session.completed userId", { userId });
      if (userId) {
        const { error } = await supabase.from("profiles").upsert(
          {
            id: userId,
            plan: "paid",
          },
          { onConflict: "id" },
        );
        if (error) throw error;
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (userId) {
        const activeStatuses = new Set(["active", "trialing", "past_due"]);
        const nextPlan = activeStatuses.has(subscription.status) ? "paid" : "free";
        const { error } = await supabase.from("profiles").upsert(
          {
            id: userId,
            plan: nextPlan,
          },
          { onConflict: "id" },
        );
        if (error) throw error;
      }
    }
  } catch (error) {
    console.error("[stripe-webhook] handler failed", error);
    return new Response("Webhook handling failed", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
