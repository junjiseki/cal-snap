import type Stripe from "stripe";
import { getStripeServer } from "@/lib/stripe/server";

const TERMINAL_STATUSES = new Set<Stripe.Subscription.Status>(["canceled", "incomplete_expired"]);

/** Supabase Auth の user.id 想定。Stripe Search クエリへ埋め込む前に検証し、' 等でクエリが壊れるのを防ぐ。 */
const AUTH_USER_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isAuthUserUuid(userId: string): boolean {
  return AUTH_USER_UUID_RE.test(userId);
}

function subscriptionSearchQuery(userId: string) {
  return `metadata['userId']:'${userId}'`;
}

/**
 * Stripe が有効なとき、metadata.userId が一致するサブスクリプションのうち
 * 未終了のものを即時解約する。課金の継続を防ぐ。
 * STRIPE_SECRET_KEY 未設定時は何もしない（開発・Stripe 未使用環境）。
 */
export async function cancelStripeSubscriptionsForUser(userId: string): Promise<
  | { ok: true }
  | { ok: false; message: string; code: "STRIPE_SEARCH_FAILED" | "STRIPE_CANCEL_FAILED" }
> {
  if (!process.env.STRIPE_SECRET_KEY?.trim()) {
    return { ok: true };
  }

  if (!isAuthUserUuid(userId)) {
    console.warn("[stripe-cancel-for-user] skip search: user id is not a UUID", {
      prefix: userId.slice(0, 12),
    });
    return { ok: true };
  }

  const stripe = getStripeServer();
  const subscriptions: Stripe.Subscription[] = [];

  try {
    let page: string | undefined;
    for (;;) {
      const res = await stripe.subscriptions.search({
        query: subscriptionSearchQuery(userId),
        limit: 100,
        ...(page ? { page } : {}),
      });
      subscriptions.push(...res.data);
      const next =
        "next_page" in res && res.next_page != null && res.next_page !== ""
          ? String(res.next_page)
          : undefined;
      if (!next) {
        break;
      }
      page = next;
    }
  } catch (error) {
    console.error("[stripe-cancel-for-user] subscription search failed", error);
    return {
      ok: false,
      code: "STRIPE_SEARCH_FAILED",
      message: "サブスクリプションの確認に失敗したため、アカウントを削除できませんでした。しばらくしてから再度お試しください。",
    };
  }

  for (const sub of subscriptions) {
    if (TERMINAL_STATUSES.has(sub.status)) {
      continue;
    }
    try {
      await stripe.subscriptions.cancel(sub.id);
    } catch (error) {
      console.error("[stripe-cancel-for-user] subscription cancel failed", { subscriptionId: sub.id, error });
      return {
        ok: false,
        code: "STRIPE_CANCEL_FAILED",
        message: "Stripe のサブスクリプション解約に失敗したため、アカウントを削除できませんでした。料金・プランから解約を試すか、しばらくしてから再度お試しください。",
      };
    }
  }

  return { ok: true };
}
