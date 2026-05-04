import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";
const PAID_PLAN_TRIAL_DAYS = 14;

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return errorResponse("STRIPE_PRICE_ID が設定されていません。", 500, "STRIPE_NOT_CONFIGURED");
  }

  const stripe = getStripeServer();
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/dashboard?billing=cancel`,
    client_reference_id: user.id,
    metadata: {
      userId: user.id,
    },
    customer_email: user.email ?? undefined,
    subscription_data: {
      trial_period_days: PAID_PLAN_TRIAL_DAYS,
      metadata: {
        userId: user.id,
      },
    },
  });

  return Response.json({ url: session.url });
}
