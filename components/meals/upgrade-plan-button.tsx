"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function UpgradePlanButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });
      const body = (await response.json()) as { url?: string; error?: { message?: string } };
      if (!response.ok || !body.url) {
        throw new Error(body.error?.message || "決済ページを開けませんでした。");
      }
      window.location.href = body.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "決済ページの作成に失敗しました。");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={checkout}
        disabled={isLoading}
        aria-busy={isLoading}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
        {isLoading ? "決済ページを準備中..." : "有料プランにアップグレード"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
