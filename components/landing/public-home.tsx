import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Edit3,
  Smartphone,
} from "lucide-react";

const valueProps = [
  {
    icon: Camera,
    title: "撮るだけで始まる",
    body: "食事名を探す手間をなくし、写真からカロリーとPFCのたたき台を作ります。",
  },
  {
    icon: Edit3,
    title: "保存前に直せる",
    body: "AI推定をそのまま確定せず、量やメモを確認してから登録できます。",
  },
  {
    icon: BarChart3,
    title: "今日の残りが見える",
    body: "ダッシュボードで摂取カロリー、PFC、推移をすぐ確認できます。",
  },
  {
    icon: Smartphone,
    title: "スマホで完結",
    body: "外食後や移動中でも、撮影から登録まで短い導線で進められます。",
  },
] as const;

export function PublicHome() {
  return (
    <main className="flex-1 bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-10">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
              <Smartphone className="size-4" />
              スマホで食後すぐ記録
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              撮ってその場で
              <br />
              カロリー管理。
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              カロリースナップは、スマホで撮った食事写真からAIがカロリーとPFCを推定し、保存前に自分で修正できる食事管理アプリです。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm"
              >
                無料で始める
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-border bg-background px-6 text-base font-semibold hover:bg-muted"
              >
                ログイン
              </Link>
            </div>

            <p className="mt-6 flex gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              写真は保存せず、DBには確認後の数値とメモだけを残します。
            </p>
          </div>

          <div className="relative min-w-0">
            <div className="mx-auto w-[min(78vw,19rem)] rounded-[2rem] border border-border bg-background p-2 shadow-xl sm:absolute sm:-right-2 sm:bottom-[-1.5rem] sm:z-10 sm:w-[13.5rem] lg:w-[15rem]">
              <div className="overflow-hidden rounded-[1.5rem] border border-border">
                <Image
                  src="/home-mobile-preview.png"
                  alt="スマホで今日の摂取カロリーと次の行動を確認している画面"
                  width={385}
                  height={723}
                  priority
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="mt-6 hidden rounded-md border border-border bg-background p-2 shadow-lg sm:block sm:pr-28 lg:pr-36">
              <div className="flex items-center gap-1 border-b border-border px-2 py-2">
                <span className="size-2.5 rounded-full bg-red-400" />
                <span className="size-2.5 rounded-full bg-amber-400" />
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span className="ml-3 text-xs font-medium text-muted-foreground">
                  PCでも編集しやすい登録画面
                </span>
              </div>
              <Image
                src="/home-preview.png"
                alt="食事写真をAI解析して確認・修正している画面"
                width={1357}
                height={1281}
                priority
                className="h-auto w-full rounded-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-background">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {valueProps.map(({ icon: Icon, title, body }) => (
            <article key={title} className="flex gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
              </div>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">次の食事から、写真で記録。</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              まずは無料登録して、実際の解析フローを試せます。
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm"
          >
            無料で始める
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
