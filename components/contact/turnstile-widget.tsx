"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  getTurnstileSiteKeyForBrowser,
  isTurnstileProductionWidgetMode,
} from "@/lib/security/turnstile-config";

const TURNSTILE_SITE_KEY = getTurnstileSiteKeyForBrowser();

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          /** 失敗時、Cloudflare がエラーコード文字列を渡すことがある（例: 400020 = 無効なサイトキー） */
          "error-callback": (errorCode?: string | number) => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  onTokenChange,
  resetSignal = 0,
}: {
  onTokenChange: (token: string) => void;
  /** 成功送信後にインクリメントするとウィジェットを reset し、再送信可能にする */
  resetSignal?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" =
    resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    setWidgetError(null);
  }, [theme]);

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }
    if (widgetIdRef.current && window.turnstile?.reset) {
      window.turnstile.reset(widgetIdRef.current);
      setWidgetError(null);
      onTokenChange("");
    }
  }, [resetSignal, onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    function renderWidget() {
      if (cancelled || widgetIdRef.current || !containerRef.current) {
        return;
      }
      if (!TURNSTILE_SITE_KEY) {
        onTokenChange("");
        return;
      }
      if (!window.turnstile) {
        attempts += 1;
        if (attempts < 80) {
          window.setTimeout(renderWidget, 100);
        }
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme,
        callback: (token: string) => {
          setWidgetError(null);
          onTokenChange(token);
        },
        "expired-callback": () => onTokenChange(""),
        "error-callback": (errorCode?: string | number) => {
          onTokenChange("");
          const code = String(errorCode ?? "").trim();
          if (code === "400020" || code === "110100" || code === "110110") {
            setWidgetError(
              "サイトキーが無効です。Cloudflare Turnstile のウィジェットから「サイトキー」だけをコピーし、NEXT_PUBLIC_TURNSTILE_SITE_KEY に設定してください。シークレットキーと入れ違えていないかも確認してください。",
            );
            return;
          }
          if (code === "110200") {
            setWidgetError(
              "このドメインは Turnstile で許可されていません。Cloudflare のホスト名管理に、今アクセスしているホスト（例: localhost）を追加してください。",
            );
            return;
          }
          if (code === "400070") {
            setWidgetError(
              "このサイトキーは Cloudflare 上で無効化されています。ダッシュボードでウィジェットの状態を確認してください。",
            );
            return;
          }
          if (code) {
            setWidgetError(
              `Turnstile でエラーが発生しました（コード: ${code}）。公式のエラーコード一覧と、広告ブロッカー・拡張機能の無効化も試してください。`,
            );
          }
        },
      });
    }

    renderWidget();

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, theme]);

  if (!TURNSTILE_SITE_KEY) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        Turnstileのサイトキーが未設定です。
      </p>
    );
  }

  return (
    <div>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} />
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        スパム対策のためCloudflare Turnstileで確認します。
      </p>
      {!isTurnstileProductionWidgetMode() ? (
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          開発サーバーではテスト用ウィジェットを表示しています。本番キーで試す場合は{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">
            NEXT_PUBLIC_TURNSTILE_USE_PRODUCTION_WIDGET=true
          </code>{" "}
          を設定し、Cloudflare のホスト名に <code className="rounded bg-muted px-1 font-mono text-[10px]">localhost</code>{" "}
          を追加してください。Supabase の Bot Protection をオンにしている場合、検証用シークレットは Cloudflare のテスト用シークレットと揃えるか、ローカルではオフにしてください。
        </p>
      ) : null}
      {widgetError ? (
        <p className="mt-2 text-xs leading-relaxed text-destructive">{widgetError}</p>
      ) : null}
    </div>
  );
}
