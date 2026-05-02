"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleMark } from "@/components/auth/google-mark";

export function LoginForm({
  next = "/dashboard",
  accountDeleted = false,
}: {
  next?: string;
  accountDeleted?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
      setError(caught instanceof Error ? caught.message : "Googleログインを開始できません。");
      setIsGoogleLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoggingIn(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      window.location.href = next;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "ログインに失敗しました。");
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-border bg-card p-6">
      <div>
        <h1 className="text-2xl font-semibold">ログイン</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          メールアドレスとパスワードでログインします。
        </p>
      </div>
      {accountDeleted ? (
        <p className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          アカウントを削除しました。このアカウントではログインできません。新しくご利用になる場合は別のメールアドレスで新規登録してください。
        </p>
      ) : null}
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
          placeholder="パスワード"
        />
      </label>
      <button
        type="submit"
        disabled={isLoggingIn || isGoogleLoading}
        aria-busy={isLoggingIn}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isLoggingIn ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        {isLoggingIn ? "ログイン中..." : "ログイン"}
      </button>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={isLoggingIn || isGoogleLoading}
        aria-busy={isGoogleLoading}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground disabled:opacity-50"
      >
        {isGoogleLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {isGoogleLoading ? "Googleへ移動中..." : "Google でログイン"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        アカウントがない場合は{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-primary underline-offset-4 hover:underline">
          新規登録
        </Link>
      </p>
      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </form>
  );
}
