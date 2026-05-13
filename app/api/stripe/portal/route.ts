import {
  forbiddenOriginResponse,
  isAllowedOrigin,
} from "@/lib/security/request";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getStripeServer } from "@/lib/stripe/server";

export const runtime = "nodejs";

function errorResponse(message: string, status: number, code: string) {
  return Response.json({ error: { message, code } }, { status });
}

function subscriptionCustomerId(subscription: {
  customer: string | { id: string };
}) {
  return typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return forbiddenOriginResponse();
  }

  const { user } = await getAuthenticatedUser();
  if (!user) {
    return errorResponse("ログインが必要です。", 401, "UNAUTHENTICATED");
  }

  const stripe = getStripeServer();
  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  let searchResult: Awaited<ReturnType<typeof stripe.subscriptions.search>>;
  try {
    searchResult = await stripe.subscriptions.search({
      query: `metadata['userId']:'${user.id}'`,
      limit: 20,
    });
  } catch (error) {
    console.error("[stripe-portal] subscription search failed", error);
    return errorResponse(
      "サブスクリプション情報の取得に失敗しました。しばらくしてから再度お試しください。",
      502,
      "STRIPE_SEARCH_FAILED",
    );
  }

  const subscriptions = searchResult.data;
  if (subscriptions.length === 0) {
    return errorResponse(
      "Stripe 上にサブスクリプションが見つかりません。有料プラン購入後にご利用いただくか、サポートへお問い合わせください。",
      404,
      "NO_SUBSCRIPTION",
    );
  }

  const preferredOrder = [
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "incomplete_expired",
  ];
  const subscription = [...subscriptions].sort(
    (a, b) =>
      preferredOrder.indexOf(a.status) - preferredOrder.indexOf(b.status),
  )[0];

  const customerId = subscriptionCustomerId(subscription);

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
    });
    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error(
      "[stripe-portal] billingPortal.sessions.create failed",
      error,
    );
    return errorResponse(
      "お客様ポータルを開けませんでした。Stripe ダッシュボードで Customer portal を有効化しているか確認してください。",
      502,
      "PORTAL_CREATE_FAILED",
    );
  }
}
