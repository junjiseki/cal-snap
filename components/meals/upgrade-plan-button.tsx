"use client";

import { useState } from "react";

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
        className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isLoading ? "読み込み中..." : "有料プランにアップグレード"}
      </button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
