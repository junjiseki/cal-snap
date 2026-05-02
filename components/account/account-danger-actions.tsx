"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function AccountDangerActions() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
      router.refresh();
      router.push("/login");
    }
  }

  async function handleDeleteAccount() {
    const message =
      "アカウントを削除（利用停止）します。ログインできなくなり、データはサーバー上に残りますが参照できません。この操作は取り消せません。続行しますか？";
    if (!window.confirm(message)) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const supabase = createClient();
      await supabase.auth.signOut();
      if (res.ok) {
        router.refresh();
        router.push("/login?deleted=1");
        return;
      }

      let detail = "アカウントを削除できませんでした。";
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        if (body.error?.message) detail = body.error.message;
      } catch {
        /* ignore */
      }
      window.alert(detail);
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Button
        type="button"
        variant="outline"
        disabled={signingOut || deletingAccount}
        onClick={() => void handleSignOut()}
        className="h-11 gap-2 border-border"
      >
        <LogOut className="size-4" />
        {signingOut ? "ログアウト中..." : "ログアウト"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={signingOut || deletingAccount}
        onClick={() => void handleDeleteAccount()}
        className="h-11 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
      >
        <UserX className="size-4" />
        {deletingAccount ? "処理中..." : "アカウントを削除"}
      </Button>
    </div>
  );
}
