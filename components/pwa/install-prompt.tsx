"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "cal-snap-pwa-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIphoneSafari() {
  const ua = window.navigator.userAgent;
  const isIphone = /iPhone/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIphone && isSafari;
}

function wasDismissed() {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

function dismissForever() {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

function afterInitialRender(callback: () => void) {
  const run = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(callback, { timeout: 2500 });
      return;
    }
    globalThis.setTimeout(callback, 1200);
  };

  if (document.readyState === "complete") {
    run();
    return;
  }
  window.addEventListener("load", run, { once: true });
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let removeListeners: (() => void) | null = null;

    afterInitialRender(() => {
      if (cancelled || wasDismissed() || isStandalone()) {
        return;
      }

      if (isIphoneSafari()) {
        setShowIosGuide(true);
        setVisible(true);
      }

      function handleBeforeInstallPrompt(event: Event) {
        event.preventDefault();
        if (wasDismissed() || isStandalone()) {
          return;
        }
        setInstallEvent(event as BeforeInstallPromptEvent);
        setShowIosGuide(false);
        setVisible(true);
      }

      function handleAppInstalled() {
        dismissForever();
        setVisible(false);
        setInstallEvent(null);
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);
      removeListeners = () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };

      if (cancelled) {
        removeListeners();
      }
    });

    return () => {
      cancelled = true;
      removeListeners?.();
    };
  }, []);

  if (!visible || (!installEvent && !showIosGuide)) {
    return null;
  }

  async function install() {
    if (!installEvent) {
      return;
    }
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    dismissForever();
    setVisible(false);
    setInstallEvent(null);
  }

  function close() {
    dismissForever();
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 mx-auto max-w-md rounded-md border border-border bg-card p-4 shadow-lg md:bottom-4">
      <button
        type="button"
        onClick={close}
        aria-label="インストール案内を閉じる"
        className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition active:scale-95 active:bg-muted"
      >
        <span aria-hidden>×</span>
      </button>

      <div className="pr-8">
        <p className="text-sm font-semibold text-foreground">カロスナをホーム画面に追加</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          アプリのようにすぐ開けます。プッシュ通知はお知らせ設定でオンにしたときだけ使い、常時バックグラウンドで動き続けることはありません。
        </p>
      </div>

      {installEvent ? (
        <button
          type="button"
          onClick={() => void install()}
          className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[0.99]"
        >
          ホーム画面に追加
        </button>
      ) : (
        <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm leading-7">
          <p className="font-semibold text-foreground">iPhone Safari の追加手順</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>画面下の共有ボタンを押す</li>
            <li>「ホーム画面に追加」を選ぶ</li>
            <li>右上の「追加」を押す</li>
          </ol>
        </div>
      )}
    </div>
  );
}
