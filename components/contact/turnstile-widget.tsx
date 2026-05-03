"use client";

import Script from "next/script";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const TEST_TURNSTILE_SITE_KEY = "1x00000000000000000000AA";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
  (process.env.NODE_ENV === "production" ? "" : TEST_TURNSTILE_SITE_KEY);

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
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
  const { resolvedTheme } = useTheme();
  const theme: "light" | "dark" =
    resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (resetSignal === 0) {
      return;
    }
    if (widgetIdRef.current && window.turnstile?.reset) {
      window.turnstile.reset(widgetIdRef.current);
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
        callback: onTokenChange,
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
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
    </div>
  );
}
