import { forbiddenOriginResponse, isAllowedOrigin } from "@/lib/security/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";
import type Stripe from "stripe";

export const runtime = "nodejs";
const PAID_PLAN_TRIAL_DAYS = 14;
const AUTH_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMINAL_SUBSCRIPTION_STATUSES = new Set<Stripe.Subscription.Status>([
  "canceled",
  "incomplete_expired",
]);

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

  if (!AUTH_USER_UUID_RE.test(user.id)) {
    return errorResponse("ユーザー情報を確認できません。", 400, "INVALID_USER_ID");
  }

  let existingSubscriptions: Awaited<ReturnType<typeof stripe.subscriptions.search>>;
  try {
    existingSubscriptions = await stripe.subscriptions.search({
      query: `metadata['userId']:'${user.id}'`,
      limit: 20,
    });
  } catch (error) {
    console.error("[stripe-checkout] subscription search failed", error);
    return errorResponse(
      "サブスクリプション情報の確認に失敗しました。しばらくしてから再度お試しください。",
      502,
      "STRIPE_SEARCH_FAILED",
    );
  }
  const hasNonTerminalSubscription = existingSubscriptions.data.some(
    (subscription) => !TERMINAL_SUBSCRIPTION_STATUSES.has(subscription.status),
  );

  if (hasNonTerminalSubscription) {
    return errorResponse(
      "既に有効なサブスクリプションがあります。プラン管理画面から確認してください。",
      409,
      "SUBSCRIPTION_ALREADY_EXISTS",
    );
  }

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
