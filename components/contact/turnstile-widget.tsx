"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import {
  getTurnstileSiteKeyForBrowser,
  isTurnstileProductionWidgetMode,
} from "@/lib/security/turnstile-config";
import { TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS } from "@/lib/ui-timing";

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
  const [scriptStatus, setScriptStatus] = useState<
    "loading" | "ready" | "error"
  >("loading");
  const [scriptRetryKey, setScriptRetryKey] = useState(0);
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    void theme;
    setWidgetError(null);
  }, [theme]);

  useEffect(() => {
    if (scriptStatus !== "loading") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (window.turnstile) {
        setScriptStatus("ready");
        setWidgetError(null);
        return;
      }
      setScriptStatus("error");
      onTokenChange("");
      setWidgetError(
        "Turnstileの読み込みに時間がかかっています。通信環境、広告ブロッカー、セキュリティ設定を確認して再読み込みしてください。",
      );
    }, TURNSTILE_SCRIPT_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [scriptStatus, onTokenChange]);

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
    if (scriptStatus !== "ready") {
      return;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled || widgetIdRef.current || !containerRef.current) {
        return;
      }
      if (!TURNSTILE_SITE_KEY) {
        onTokenChange("");
        return;
      }
      if (!window.turnstile) {
        setWidgetError(
          "Turnstile API が利用できません。ページを再読み込みしてください。",
        );
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
  }, [onTokenChange, theme, scriptStatus]);

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
        key={scriptRetryKey}
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => {
          setScriptStatus("ready");
          setWidgetError(null);
        }}
        onError={() => {
          setScriptStatus("error");
          onTokenChange("");
          setWidgetError(
            "Turnstileを読み込めませんでした。広告ブロッカーやネットワーク設定を確認してください。",
          );
        }}
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
          を設定し、Cloudflare のホスト名に{" "}
          <code className="rounded bg-muted px-1 font-mono text-[10px]">
            localhost
          </code>{" "}
          を追加してください。Supabase の Bot Protection
          をオンにしている場合、検証用シークレットは Cloudflare
          のテスト用シークレットと揃えるか、ローカルではオフにしてください。
        </p>
      ) : null}
      {widgetError ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-destructive">
            {widgetError}
          </p>
          {scriptStatus === "error" ? (
            <button
              type="button"
              onClick={() => {
                widgetIdRef.current = null;
                setWidgetError(null);
                setScriptStatus("loading");
                setScriptRetryKey((current) => current + 1);
                onTokenChange("");
              }}
              className="inline-flex min-h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-semibold transition active:scale-95"
            >
              確認ウィジェットを再読み込み
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
