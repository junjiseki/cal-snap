"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

export function ManageSubscriptionButton({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" });
      const body = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !body.url) {
        throw new Error(body.error?.message || "ページを開けませんでした。");
      }
      window.location.href = body.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "処理に失敗しました。");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void openPortal()}
        disabled={isLoading}
        aria-busy={isLoading}
        className={
          className ??
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-semibold shadow-sm hover:bg-muted disabled:opacity-50"
        }
      >
        {isLoading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <CreditCard className="size-4 shrink-0" aria-hidden />
        )}
        {isLoading ? "管理画面を準備中..." : "サブスクの管理・解約"}
      </button>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Stripe の画面で解約・お支払い方法の変更・請求履歴の確認ができます。解約後も請求期間終了までは有料枠が有効な場合があります。
      </p>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
