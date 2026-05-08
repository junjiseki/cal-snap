"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";

const PUSH_ACTION_TIMEOUT_MS = 20_000;
const PUSH_STEP_TIMEOUT_MS = 15_000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function rejectAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

function withTimeLimit<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([promise, rejectAfter(ms, message)]);
}

function fetchWithTimeout(init: RequestInit & { timeoutMs?: number }): RequestInit {
  const { timeoutMs = PUSH_STEP_TIMEOUT_MS, ...rest } = init;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return { ...rest, signal: AbortSignal.timeout(timeoutMs) };
  }
  return rest;
}

function isAbortError(caught: unknown): boolean {
  return (
    (caught instanceof DOMException && caught.name === "AbortError") ||
    (caught instanceof Error && caught.name === "AbortError")
  );
}

async function getCurrentSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const registration = await ensureServiceWorkerRegistration();
  return registration.pushManager.getSubscription();
}

async function ensureServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("このブラウザではサービスワーカーを利用できません。");
  }

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing?.active || existing?.installing || existing?.waiting) {
    return existing;
  }

  const registration = await withTimeLimit(
    navigator.serviceWorker.register("/sw-passive.js", { scope: "/" }),
    PUSH_STEP_TIMEOUT_MS,
    "通知の準備がタイムアウトしました。ページを再読み込みしてから再度お試しください。",
  );

  return registration;
}

async function requestNotificationPermission() {
  if (Notification.permission === "granted") {
    return "granted" satisfies NotificationPermission;
  }

  return withTimeLimit(
    Notification.requestPermission(),
    PUSH_STEP_TIMEOUT_MS,
    "通知の許可確認が完了しませんでした。ページを再読み込みしてから再度お試しください。",
  );
}

export function PushNotificationSettings({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startBusy() {
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
    }
    setIsBusy(true);
    busyTimerRef.current = setTimeout(() => {
      setIsBusy(false);
      setError("通知設定の処理がタイムアウトしました。ページを再読み込みしてから再度お試しください。");
    }, PUSH_ACTION_TIMEOUT_MS);
  }

  function stopBusy() {
    if (busyTimerRef.current) {
      clearTimeout(busyTimerRef.current);
      busyTimerRef.current = null;
    }
    setIsBusy(false);
  }

  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      Boolean(vapidPublicKey);
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);
    void getCurrentSubscription()
      .then((subscription) => setIsSubscribed(Boolean(subscription)))
      .catch(() => setIsSubscribed(false));
  }, [vapidPublicKey]);

  useEffect(() => {
    return () => {
      if (busyTimerRef.current) {
        clearTimeout(busyTimerRef.current);
      }
    };
  }, []);

  async function enableNotification() {
    if (!isSupported || isBusy) return;

    startBusy();
    setMessage(null);
    setError(null);

    try {
      const nextPermission = await requestNotificationPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setError("通知が許可されませんでした。ブラウザ設定から許可できます。");
        return;
      }

      const registration = await ensureServiceWorkerRegistration();
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await withTimeLimit(
          registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          }),
          PUSH_STEP_TIMEOUT_MS,
          "通知の登録がタイムアウトしました。通信状況を確認してから再度お試しください。",
        ));

      const response = await fetch(
        "/api/push-subscriptions",
        fetchWithTimeout({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
          timeoutMs: PUSH_STEP_TIMEOUT_MS,
        }),
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? "通知設定を保存できませんでした。");
      }

      setIsSubscribed(true);
      setMessage("この端末で通知を受け取れるようになりました。");
    } catch (caught) {
      if (isAbortError(caught)) {
        setError("サーバーへの接続がタイムアウトしました。通信状況を確認してから再度お試しください。");
      } else {
        setError(caught instanceof Error ? caught.message : "通知を有効にできませんでした。");
      }
    } finally {
      stopBusy();
    }
  }

  async function disableNotification() {
    if (!isSupported || isBusy) return;

    startBusy();
    setMessage(null);
    setError(null);

    try {
      const subscription = await getCurrentSubscription();
      if (subscription) {
        await fetch(
          "/api/push-subscriptions",
          fetchWithTimeout({
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
            timeoutMs: PUSH_STEP_TIMEOUT_MS,
          }),
        );
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setMessage("この端末の通知を解除しました。");
    } catch (caught) {
      if (isAbortError(caught)) {
        setError("サーバーへの接続がタイムアウトしました。通信状況を確認してから再度お試しください。");
      } else {
        setError("通知を解除できませんでした。");
      }
    } finally {
      stopBusy();
    }
  }

  if (!vapidPublicKey) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
        Web Pushの公開鍵が未設定です。`NEXT_PUBLIC_VAPID_PUBLIC_KEY` を設定してください。
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="rounded-md border border-border bg-muted/25 p-3 text-sm leading-6 text-muted-foreground">
        このブラウザではWeb Push通知を利用できません。iPhoneではホーム画面に追加したPWAから利用できます。
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BellRing className="size-4 text-primary" />
            この端末で通知を受け取る
          </h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            登録した食事時間に、ブラウザ通知で記録を促します。
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            現在の許可状態: {permission === "granted" ? "許可済み" : permission === "denied" ? "拒否" : "未設定"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void (isSubscribed ? disableNotification() : enableNotification())}
          disabled={isBusy || permission === "denied"}
          aria-busy={isBusy}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="size-4 animate-spin" /> : null}
          {isBusy ? "処理中..." : isSubscribed ? "通知を解除" : "通知を有効にする"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-primary">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
