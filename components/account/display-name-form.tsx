"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DisplayNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialName);
    setSavedName(initialName);
  }, [initialName]);

  const trimmedName = name.trim();
  const isValid = trimmedName.length <= 40;
  const isDirty = trimmedName !== savedName;
  const canSubmit = isDirty && isValid && !isSaving;

  async function save() {
    if (!canSubmit) return;

    setIsSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: trimmedName || null,
        },
      });

      if (error) {
        throw error;
      }

      setSavedName(trimmedName);
      setName(trimmedName);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "表示名を保存できませんでした。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={name}
          maxLength={40}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-80"
          placeholder="例: 山田太郎"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={!canSubmit}
          aria-busy={isSaving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSaving ? "保存中..." : "表示名を保存"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        40文字以内。空欄にすると未設定になります。
      </p>
      {!isValid ? (
        <p className="text-sm text-destructive">
          40文字以内で入力してください。
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
