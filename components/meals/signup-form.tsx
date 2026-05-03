"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { safeInternalPath } from "@/lib/auth/safe-redirect";
import { GoogleMark } from "@/components/auth/google-mark";
import { TurnstileWidget } from "@/components/contact/turnstile-widget";

export function SignupForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const handleCaptchaTokenChange = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function signUpWithGoogle() {
    setError(null);
    setMessage(null);
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
      setError(caught instanceof Error ? caught.message : "Google登録を開始できません。");
      setIsGoogleLoading(false);
    }
  }

  async function signUpWithEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== passwordConfirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    const trimmedCaptcha = captchaToken.trim();
    if (!trimmedCaptcha) {
      setError("下の「人間による操作の確認」を完了してから、もう一度お試しください。");
      return;
    }

    setIsSigningUp(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const {
        data: { user, session },
        error: signUpError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}`,
          captchaToken: trimmedCaptcha,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (session) {
        router.push(safeInternalPath(next, "/dashboard"));
        router.refresh();
        return;
      }

      if (user) {
        const isLocalApi =
          process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1") ||
          process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost");
        setMessage(
          isLocalApi
            ? "確認メールを送信しました。ローカル開発では Inbucket（Mailpit）で受信できます: http://127.0.0.1:54324 — メール内のリンクから登録を完了してください。"
            : "確認メールを送信しました。受信トレイ（迷惑メールフォルダ含む）をご確認のうえ、メール内リンクから登録を完了してください。",
        );
        return;
      }

      setMessage("登録を受け付けました。画面の案内に従ってください。");
    } catch (caught) {
      setCaptchaResetSignal((n) => n + 1);
      const message =
        caught instanceof Error ? caught.message.toLowerCase() : "";

      if (message.includes("already registered") || message.includes("already exists")) {
        setError(
          "このメールアドレスは既に登録済みです。以前アカウントを利用停止にした場合は、一度ログイン画面から同じメールでログインすると整理され、その後に再度新規登録できます。",
        );
      } else if (message.includes("captcha")) {
        setError(
          "ボット対策の検証に失敗しました。確認ウィジェットをやり直してから再度お試しください。",
        );
      } else {
        setError(caught instanceof Error ? caught.message : "ユーザー登録に失敗しました。");
      }
    } finally {
      setIsSigningUp(false);
    }
  }

  return (
    <form
      onSubmit={signUpWithEmail}
      className="space-y-4 rounded-md border-2 border-[#17231f] bg-white p-6 shadow-[6px_6px_0_#17231f]"
    >
      <div>
        <p className="inline-flex rounded-md bg-[#ffe66d] px-3 py-1.5 text-sm font-bold text-[#17231f]">
          はじめの一歩
        </p>
        <h1 className="mt-3 text-2xl font-black text-[#17231f]">新規登録</h1>
        <p className="mt-2 text-sm font-medium text-[#42504b]">
          メールアドレスとパスワード、または Google でアカウントを作成します。
        </p>
      </div>
      <label className="block text-sm font-medium">
        メールアドレス
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border-2 border-[#17231f] bg-[#fffaf0] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe66d]"
          placeholder="you@example.com"
        />
      </label>
      <label className="block text-sm font-medium">
        パスワード
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border-2 border-[#17231f] bg-[#fffaf0] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe66d]"
          placeholder="8文字以上"
        />
      </label>
      <label className="block text-sm font-medium">
        パスワード確認
        <input
          type="password"
          required
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          className="mt-2 h-11 w-full rounded-md border-2 border-[#17231f] bg-[#fffaf0] px-3 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#ffe66d]"
          placeholder="確認用パスワード"
        />
      </label>
      <TurnstileWidget onTokenChange={handleCaptchaTokenChange} resetSignal={captchaResetSignal} />
      <button
        type="submit"
        disabled={isSigningUp || isGoogleLoading}
        aria-busy={isSigningUp}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#00a878] px-4 text-sm font-bold text-white shadow-[3px_3px_0_#17231f] disabled:opacity-50"
      >
        {isSigningUp ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSigningUp ? "登録中..." : "メールで新規登録"}
      </button>
      <button
        type="button"
        onClick={() => void signUpWithGoogle()}
        disabled={isSigningUp || isGoogleLoading}
        aria-busy={isGoogleLoading}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-white px-4 text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f] disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Googleへ移動中..." : "Google で登録"}
      </button>
      <p className="text-center text-sm font-medium text-[#42504b]">
        すでにアカウントがある場合は{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-bold text-[#036854] underline-offset-4 hover:underline">
          ログイン
        </Link>
      </p>
      {message ? (
        <p className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          {message}
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
