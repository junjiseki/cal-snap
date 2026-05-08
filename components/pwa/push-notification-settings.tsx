"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2 } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

async function getCurrentSubscription() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export function PushNotificationSettings({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function enableNotification() {
    if (!isSupported || isBusy) return;

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setError("通知が許可されませんでした。ブラウザ設定から許可できます。");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const response = await fetch("/api/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!response.ok) {
        throw new Error("通知設定を保存できませんでした。");
      }

      setIsSubscribed(true);
      setMessage("この端末で通知を受け取れるようになりました。");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "通知を有効にできませんでした。");
    } finally {
      setIsBusy(false);
    }
  }

  async function disableNotification() {
    if (!isSupported || isBusy) return;

    setIsBusy(true);
    setMessage(null);
    setError(null);

    try {
      const subscription = await getCurrentSubscription();
      if (subscription) {
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setMessage("この端末の通知を解除しました。");
    } catch {
      setError("通知を解除できませんでした。");
    } finally {
      setIsBusy(false);
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
