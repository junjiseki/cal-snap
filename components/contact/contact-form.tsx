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
};

const initialForm: FormState = {
  name: "",
  email: "",
  category: "support",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSent(false);

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
      setForm(initialForm);
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
        <label className="text-sm font-medium">
          お名前
          <input
            type="text"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
            maxLength={80}
            autoComplete="name"
            className="mt-2 h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
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
