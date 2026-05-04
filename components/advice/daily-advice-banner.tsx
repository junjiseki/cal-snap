"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

type AdviceResponse =
  | {
      status: "ok";
      advice: {
        advice_text: string;
        reason_text: string;
        action_text: string;
      };
    }
  | {
      status: "insufficient_data";
      message: string;
    };

type CachedAdviceState = {
  dismissed?: boolean;
  response?: AdviceResponse;
};

function todayYmdInJapan() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function storageKey(userId: string, date: string) {
  return `daily_advice:${userId}:${date}`;
}

function readCachedAdvice(userId: string, date: string): CachedAdviceState | null {
  try {
    const raw = window.localStorage.getItem(storageKey(userId, date));
    return raw ? (JSON.parse(raw) as CachedAdviceState) : null;
  } catch {
    return null;
  }
}

function writeCachedAdvice(userId: string, date: string, value: CachedAdviceState) {
  try {
    window.localStorage.setItem(storageKey(userId, date), JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function DailyAdviceBanner({
  userId,
  plan,
}: {
  userId: string | null;
  plan: "free" | "paid" | null;
}) {
  const [date] = useState(() => todayYmdInJapan());
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDismissedToday, setIsDismissedToday] = useState(false);

  async function openAdvice() {
    if (!userId || plan !== "paid") return;

    const cached = readCachedAdvice(userId, date);
    setIsOpen(true);
    setErrorMessage(null);

    if (cached?.response) {
      setAdvice(cached.response);
      return;
    }

    if (advice || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/daily-advice", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) {
        setErrorMessage("いまはアドバイスを表示できません。少し時間をおいて試してください。");
        return;
      }
      const body = (await response.json()) as AdviceResponse;
      const prev = readCachedAdvice(userId, date) ?? {};
      writeCachedAdvice(userId, date, { ...prev, response: body });
      setAdvice(body);
    } catch {
      setErrorMessage("通信に失敗しました。接続を確認してもう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!userId || plan !== "paid") return;

    const cached = readCachedAdvice(userId, date);
    if (cached?.dismissed) {
      setIsDismissedToday(true);
    }
    if (cached?.response) {
      setAdvice(cached.response);
    }
  }, [date, plan, userId]);

  if (!userId || plan !== "paid") return null;

  if (isDismissedToday) return null;

  const isInsufficient = advice?.status === "insufficient_data";

  function close() {
    setIsOpen(false);
    if (!userId) return;
    const prev = readCachedAdvice(userId, date) ?? {};
    writeCachedAdvice(userId, date, { ...prev, dismissed: true });
    setIsDismissedToday(true);
  }

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-3 z-50 md:bottom-4 md:right-4">
      {isOpen ? (
        <aside className="relative mb-3 w-[min(calc(100vw-1.5rem),26rem)] rounded-lg border border-emerald-200 bg-[#fffdf4] p-3 shadow-lg">
          <button
            type="button"
            onClick={close}
            aria-label="今日のAIアドバイスを閉じる"
            className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition active:scale-95 active:bg-emerald-50"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            <div className="shrink-0">
              <div className="relative size-16 overflow-hidden rounded-full border-2 border-[#075c55] bg-[#fff3c7] shadow-sm">
                <Image
                  src="/advice-mascot.webp"
                  alt="カロスナの案内キャラクター"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover object-top"
                  sizes="64px"
                />
              </div>
              <p className="mt-1 text-center text-[10px] font-bold text-primary">AI案内</p>
            </div>

            <div className="relative flex-1 rounded-md border border-emerald-100 bg-white p-3 shadow-sm before:absolute before:left-[-7px] before:top-5 before:size-3 before:rotate-45 before:border-b before:border-l before:border-emerald-100 before:bg-white">
              <p className="text-xs font-bold text-primary">カロちゃん</p>
              <p className="text-[11px] font-medium text-muted-foreground">
                カロスナ コンシェルジュ
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">今日のAIアドバイス</p>
              {isLoading ? (
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  今日の食事データを見ています...
                </p>
              ) : errorMessage ? (
                <p className="mt-2 text-sm leading-7 text-destructive">{errorMessage}</p>
              ) : isInsufficient ? (
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{advice.message}</p>
              ) : advice ? (
                <div className="mt-2 space-y-2 text-sm leading-7">
                  <p className="font-semibold text-foreground">{advice.advice.advice_text}</p>
                  <p className="text-muted-foreground">{advice.advice.reason_text}</p>
                  <p className="rounded-md bg-emerald-50 p-2 font-medium text-primary">
                    {advice.advice.action_text}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  ボタンを押すと、今日の食事記録から一言アドバイスします。
                </p>
              )}
            </div>
          </div>
        </aside>
      ) : null}

      <button
        type="button"
        onClick={openAdvice}
        aria-label="今日のAIアドバイスを開く"
        className="ml-auto flex items-center gap-2 rounded-full border border-emerald-200 bg-[#fffdf4] py-2 pl-2 pr-4 text-sm font-bold text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-95"
      >
          <Image
            src="/advice-mascot.webp"
            alt="カロちゃん"
            width={120}
            height={120}
            className="h-full w-full object-cover object-top"
            sizes="48px"
          />
      </button>
    </div>
  );
}
