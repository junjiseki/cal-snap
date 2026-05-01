import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "カロリースナップへのお問い合わせページです。使い方、料金、個人情報、不具合についてご連絡いただけます。",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
          <p className="text-sm font-semibold text-primary">Contact</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            お問い合わせ
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            カロリースナップの使い方、料金、個人情報、不具合についてはこちらからご連絡ください。
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-5 px-4 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_18rem]">
        <ContactForm />

        <aside className="space-y-4">
          <div className="border border-border bg-card p-5">
            <h2 className="font-semibold">送信前に確認</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              食事写真は保存されません。
              <br />
              お問い合わせに写真や個人情報を含める必要がある場合は、内容を確認してから送信してください。
            </p>
          </div>
          <div className="border border-border bg-card p-5">
            <h2 className="font-semibold">個人情報の扱い</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              お問い合わせ内容の取り扱いは
              <br />
              <Link href="/privacy" className="font-semibold text-primary hover:underline">
                プライバシーポリシー
              </Link>
              <br />
              をご確認ください。
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
