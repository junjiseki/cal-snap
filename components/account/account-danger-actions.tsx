"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getAccountDeleteConfirmMessage } from "@/lib/account-delete";
import type { Plan } from "@/lib/supabase/database.types";

export function AccountDangerActions({ plan = "free" }: { plan?: Plan }) {
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
    if (!window.confirm(getAccountDeleteConfirmMessage(plan))) return;

    setDeletingAccount(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        let detail = "アカウントを削除できませんでした。";
        try {
          const body = (await res.json()) as { error?: { message?: string } };
          if (body.error?.message) detail = body.error.message;
        } catch {
          /* ignore */
        }
        window.alert(detail);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login?deleted=1");
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
        aria-busy={signingOut}
        className="h-11 gap-2 border-border"
      >
        {signingOut ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <LogOut className="size-4" />
        )}
        {signingOut ? "ログアウト中..." : "ログアウト"}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={signingOut || deletingAccount}
        onClick={() => void handleDeleteAccount()}
        aria-busy={deletingAccount}
        className="h-11 gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
      >
        {deletingAccount ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <UserX className="size-4" />
        )}
        {deletingAccount ? "削除処理中..." : "アカウントを削除"}
      </Button>
    </div>
  );
}
