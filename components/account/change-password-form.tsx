"use client";

import { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapSupabaseSignInError } from "@/lib/auth/sign-in-errors";
import { Button } from "@/components/ui/button";
import { TurnstileWidget } from "@/components/contact/turnstile-widget";

export function ChangePasswordForm({ userEmail }: { userEmail: string }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  const handleCaptchaTokenChange = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (newPassword.length < 8) {
      setError("新しいパスワードは8文字以上で入力してください。");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("新しいパスワード（確認）が一致しません。");
      return;
    }
    if (newPassword === currentPassword) {
      setError("新しいパスワードは現在のパスワードと別のものにしてください。");
      return;
    }

    const trimmedCaptcha = captchaToken.trim();
    if (!trimmedCaptcha) {
      setError("下の「人間による操作の確認」を完了してから、もう一度お試しください。");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
        options: { captchaToken: trimmedCaptcha },
      });
      if (verifyError) {
        setCaptchaResetSignal((n) => n + 1);
        const raw = verifyError.message?.toLowerCase() ?? "";
        if (raw.includes("captcha")) {
          setError(
            "ボット対策の検証に失敗しました。確認ウィジェットをやり直してから再度お試しください。",
          );
          return;
        }
        setError(mapSupabaseSignInError(verifyError));
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setCaptchaResetSignal((n) => n + 1);
        setError(updateError.message || "パスワードを更新できませんでした。");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotice("パスワードを変更しました。");
      setCaptchaResetSignal((n) => n + 1);
    } catch (caught) {
      setCaptchaResetSignal((n) => n + 1);
      setError(caught instanceof Error ? caught.message : "パスワードを変更できませんでした。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-4">
      <label className="block text-sm font-medium">
        現在のパスワード
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            setError(null);
            setNotice(null);
          }}
          className="mt-2 h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          required
        />
      </label>
      <label className="block text-sm font-medium">
        新しいパスワード（8文字以上）
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setError(null);
            setNotice(null);
          }}
          className="mt-2 h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          required
          minLength={8}
        />
      </label>
      <label className="block text-sm font-medium">
        新しいパスワード（確認）
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError(null);
            setNotice(null);
          }}
          className="mt-2 h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
          required
          minLength={8}
        />
      </label>
      <TurnstileWidget onTokenChange={handleCaptchaTokenChange} resetSignal={captchaResetSignal} />
      <Button type="submit" disabled={isSaving} aria-busy={isSaving} className="h-10 gap-2">
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
        {isSaving ? "変更中..." : "パスワードを変更"}
      </Button>
      {notice ? (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">{notice}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
