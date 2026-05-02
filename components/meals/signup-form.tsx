"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleMark } from "@/components/auth/google-mark";

export function SignupForm({ next = "/dashboard" }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (session) {
        router.push(next);
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
      const message =
        caught instanceof Error ? caught.message.toLowerCase() : "";

      if (message.includes("already registered") || message.includes("already exists")) {
        setError(
          "このメールアドレスは既に登録済みです。以前アカウントを利用停止にした場合は、一度ログイン画面から同じメールでログインすると整理され、その後に再度新規登録できます。",
        );
      } else {
        setError(caught instanceof Error ? caught.message : "ユーザー登録に失敗しました。");
      }
    } finally {
      setIsSigningUp(false);
    }
  }

  return (
    <form onSubmit={signUpWithEmail} className="space-y-4 border border-border bg-card p-6">
      <div>
        <h1 className="text-2xl font-semibold">新規登録</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          placeholder="確認用パスワード"
        />
      </label>
      <button
        type="submit"
        disabled={isSigningUp || isGoogleLoading}
        aria-busy={isSigningUp}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isSigningUp ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSigningUp ? "登録中..." : "メールで新規登録"}
      </button>
      <button
        type="button"
        onClick={() => void signUpWithGoogle()}
        disabled={isSigningUp || isGoogleLoading}
        aria-busy={isGoogleLoading}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Googleへ移動中..." : "Google で登録"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        すでにアカウントがある場合は{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-primary underline-offset-4 hover:underline">
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
