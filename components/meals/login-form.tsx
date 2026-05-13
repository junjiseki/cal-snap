"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleMark } from "@/components/auth/google-mark";
import { mapSupabaseSignInError } from "@/lib/auth/sign-in-errors";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { TurnstileWidget } from "@/components/contact/turnstile-widget";

export function LoginForm({
  next = "/meals/new",
  accountDeleted = false,
  accountInactive = false,
  authConfirmFailed = false,
  profileFetchFailed = false,
}: {
  next?: string;
  accountDeleted?: boolean;
  /** 利用停止アカウントで OAuth などから戻ってきたとき */
  accountInactive?: boolean;
  /** メール確認リンクが無効・期限切れなど */
  authConfirmFailed?: boolean;
  /** profiles 取得失敗など（post-login / パスワードログイン時の fail-safe） */
  profileFetchFailed?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const handleCaptchaTokenChange = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function signInWithGoogle() {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Googleログインを開始できません。",
      );
      setIsGoogleLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    const trimmedCaptcha = captchaToken.trim();
    if (!trimmedCaptcha) {
      setError(
        "下の「人間による操作の確認」を完了してから、もう一度お試しください。",
      );
      return;
    }

    setIsLoggingIn(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: trimmedCaptcha },
      });

      if (signInError) {
        setCaptchaResetSignal((n) => n + 1);
        const raw = signInError.message?.toLowerCase() ?? "";
        if (raw.includes("captcha")) {
          setError(
            "ボット対策の検証に失敗しました。確認ウィジェットをやり直してから再度お試しください。",
          );
          return;
        }
        setError(mapSupabaseSignInError(signInError));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setCaptchaResetSignal((n) => n + 1);
        setError("ログインに失敗しました。もう一度お試しください。");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "[login-form] profile deleted_at fetch failed",
          profileError,
        );
        await supabase.auth.signOut();
        setCaptchaResetSignal((n) => n + 1);
        setError(
          "アカウント状態の確認に失敗しました。時間をおいて再度お試しください。",
        );
        return;
      }

      if (profile?.deleted_at) {
        const res = await fetch("/api/account", { method: "DELETE" });
        await supabase.auth.signOut();
        if (res.ok) {
          setNotice(
            "利用停止されていたアカウントを削除しました。同じメールアドレスで新規登録できます。",
          );
          return;
        }
        let detail =
          "アカウントの整理に失敗しました。時間をおいて再度お試しください。";
        try {
          const body = (await res.json()) as { error?: { message?: string } };
          if (body.error?.message) detail = body.error.message;
        } catch {
          /* ignore */
        }
        setError(detail);
        return;
      }

      window.location.href = safeInternalPath(next, "/meals/new");
    } catch (caught) {
      setCaptchaResetSignal((n) => n + 1);
      setError(
        caught instanceof Error ? caught.message : "ログインに失敗しました。",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-md border-2 border-[#17231f] bg-white p-6 shadow-[6px_6px_0_#17231f]"
    >
      <div>
        <p className="inline-flex rounded-md bg-[#d6fff2] px-3 py-1.5 text-sm font-bold text-[#036854]">
          おかえりなさい
        </p>
        <h1 className="mt-3 text-2xl font-black text-[#17231f]">ログイン</h1>
        <p className="mt-2 text-sm font-medium text-[#42504b]">
          メールアドレスとパスワードでログインします。
        </p>
      </div>
      {profileFetchFailed ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          アカウント状態の確認に失敗しました。通信環境をご確認のうえ、時間をおいて再度ログインしてください。
        </p>
      ) : accountDeleted ? (
        <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          アカウントを削除しました。同じメールアドレスで新規登録し直すこともできます。
        </p>
      ) : accountInactive ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          このアカウントは利用停止のためログインできません。以前メールとパスワードで登録している場合は、下のフォームでログインすると利用停止の整理が行われ、その後同じメールで新規登録できます。Google
          のみの場合はお問い合わせください。
        </p>
      ) : authConfirmFailed ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          メールの確認リンクが無効か期限切れです。未登録の場合は新規登録し、既に登録済みの場合は確認メールを再送するか、ログインをお試しください。
        </p>
      ) : null}
      <label className="block text-sm font-medium">
        メールアドレス
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border-2 border-[#17231f] bg-[#fffaf0] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe66d]"
          placeholder="you@example.com"
        />
      </label>
      <label className="block text-sm font-medium">
        パスワード
        <span className="relative mt-2 block">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-11 w-full rounded-md border-2 border-[#17231f] bg-[#fffaf0] px-3 pr-12 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe66d]"
            placeholder="パスワード"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
            className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#42504b] transition active:scale-95 active:bg-[#ffe66d]/60"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </span>
      </label>
      <TurnstileWidget
        onTokenChange={handleCaptchaTokenChange}
        resetSignal={captchaResetSignal}
      />
      <button
        type="submit"
        disabled={isLoggingIn || isGoogleLoading}
        aria-busy={isLoggingIn}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#00a878] px-4 text-sm font-bold text-white shadow-[3px_3px_0_#17231f] disabled:opacity-50"
      >
        {isLoggingIn ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogIn className="size-4" />
        )}
        {isLoggingIn ? "ログイン中..." : "ログイン"}
      </button>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoggingIn || isGoogleLoading}
        aria-busy={isGoogleLoading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-white px-4 text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f] disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Googleへ移動中..." : "Google でログイン"}
      </button>
      <p className="text-center text-sm font-medium text-[#42504b]">
        アカウントがない場合は{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-bold text-[#036854] underline-offset-4 hover:underline"
        >
          新規登録
        </Link>
      </p>
      {notice ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
