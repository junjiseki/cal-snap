"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GoogleMark } from "@/components/auth/google-mark";
import { mapSupabaseSignInError } from "@/lib/auth/sign-in-errors";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

export function LoginForm({
  next = "/dashboard",
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
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);
    setIsLoggingIn(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(mapSupabaseSignInError(signInError));
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("ログインに失敗しました。もう一度お試しください。");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("deleted_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[login-form] profile deleted_at fetch failed", profileError);
        await supabase.auth.signOut();
        setError("アカウント状態の確認に失敗しました。時間をおいて再度お試しください。");
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
        let detail = "アカウントの整理に失敗しました。時間をおいて再度お試しください。";
        try {
          const body = (await res.json()) as { error?: { message?: string } };
          if (body.error?.message) detail = body.error.message;
        } catch {
          /* ignore */
        }
        setError(detail);
        return;
      }

      window.location.href = safeInternalPath(next, "/dashboard");
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
          このアカウントは利用停止のためログインできません。以前メールとパスワードで登録している場合は、下のフォームでログインすると利用停止の整理が行われ、その後同じメールで新規登録できます。Google のみの場合はお問い合わせください。
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
