"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

const categories = [
  { value: "support", label: "使い方について" },
  { value: "billing", label: "料金・プランについて" },
  { value: "bug", label: "不具合報告" },
  { value: "privacy", label: "個人情報・プライバシー" },
  { value: "other", label: "その他" },
] as const;

type FormState = {
  name: string;
  email: string;
  category: (typeof categories)[number]["value"];
  message: string;
  website: string;
  submittedAt: number;
};

function createInitialForm(): FormState {
  return {
    name: "",
    email: "",
    category: "support",
    message: "",
    website: "",
    submittedAt: Date.now(),
  };
}

const japaneseNamePattern =
  /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}々〆ヶー・　\s]+$/u;

export function ContactForm() {
  const [form, setForm] = useState<FormState>(() => createInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);

    if (!japaneseNamePattern.test(form.name.trim())) {
      setError("お名前は日本語で入力してください。");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("お問い合わせ内容は10文字以上で入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "お問い合わせを送信できませんでした。");
      }
      setForm(createInitialForm());
      setSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "お問い合わせを送信できませんでした。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border border-border bg-card p-5 sm:p-6">
      {sent ? (
        <div className="flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>お問い合わせを受け付けました。内容を確認のうえ対応します。</p>
        </div>
      ) : null}

      {error ? (
        <p className="border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          aria-hidden="true"
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
        >
          <label>
            会社URL
            <input
              type="text"
              value={form.website}
              onChange={(event) => setForm({ ...form, website: event.target.value })}
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        <input type="hidden" value={form.submittedAt} readOnly />

        <label className="text-sm font-medium">
          お名前
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            maxLength={80}
            pattern="[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々〆ヶー・　\s]+"
            title="お名前は日本語で入力してください。"
            autoComplete="name"
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            ひらがな・カタカナ・漢字
          </span>
        </label>

        <label className="text-sm font-medium">
          メールアドレス
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
            maxLength={160}
            autoComplete="email"
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <label className="text-sm font-medium">
        種別
        <select
          value={form.category}
          onChange={(event) =>
            setForm({
              ...form,
              category: event.target.value as FormState["category"],
            })
          }
          className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium">
        お問い合わせ内容
        <textarea
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          required
          minLength={10}
          maxLength={2000}
          rows={8}
          className="mt-2 w-full resize-y rounded-md border border-input bg-background px-3 py-3 text-sm leading-7 outline-none focus:border-primary"
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-6 text-muted-foreground">
          送信内容はお問い合わせ対応のために保存されます。
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
        >
          <Send className="size-4" />
          {isSubmitting ? "送信中" : "送信する"}
        </button>
      </div>
    </form>
  );
}
