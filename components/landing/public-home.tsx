import Link from "next/link";
import Image from "next/image";
import { CalorieOverLegend } from "@/components/calorie-over-legend";
import { FavoriteFoodSlideshow } from "@/components/landing/favorite-food-slideshow";
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  HeartPulse,
  Edit3,
  PartyPopper,
  Sparkles,
  Smartphone,
  Sun,
  Utensils,
} from "lucide-react";

const valueProps = [
  {
    icon: Camera,
    title: "撮るだけでカロリーを記録",
    body: "入力の手間をなくし、写真からカロリーとPFCの記録ができます。",
  },
  {
    icon: Edit3,
    title: "保存前に直せる",
    body: "AI推定をそのまま確定せず、量やメモを確認してから登録できます。",
  },
  {
    icon: BarChart3,
    title: "今日の目標を達成",
    body: "ダッシュボードで摂取カロリー、PFC、推移をすぐ確認できます。",
  },
  {
    icon: Sparkles,
    title: "次の食事も提案",
    body: "有料プランでは過去の食事から、外食・自炊・コンビニ向けのメニューを提案します。",
  },
] as const;

const goalPromotions = [
  {
    icon: PartyPopper,
    title: "結婚式までに",
    body: "外食や試食の日も、食べた量を見える化して無理のない調整につなげます。",
  },
  {
    icon: Sun,
    title: "夏までに",
    body: "毎日の摂取カロリーを写真で残し、増えやすい日を早めに把握できます。",
  },
  {
    icon: HeartPulse,
    title: "健康のために",
    body: "カロリーだけでなくPFCも確認し、極端に減らしすぎない記録を続けられます。",
  },
] as const;

export function PublicHome() {
  return (
    <main className="flex-1 bg-[#fffaf0]">
      <section className="border-b-2 border-[#17231f] bg-[#fff3c7]">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-10">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-md border-2 border-[#17231f] bg-[#d6fff2] px-3 py-1.5 text-sm font-semibold text-[#036854] shadow-[3px_3px_0_#17231f]">
              <Smartphone className="size-4" />
              健康的に痩せたい人の食事記録
            </p>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-[#17231f] sm:text-6xl">
              あの日までに、
              <br />
              <span className="inline-block -rotate-1 bg-[#ff6b6b] px-2 text-white">
                輝きたい。
              </span>
            </h1>
            <p className="mt-6 text-base font-medium leading-8 text-[#42504b] sm:text-lg">
              結婚式までに、夏までに、健康のために。カロリースナップは食事写真からカロリーとPFCを推定し、摂取カロリーを管理できます。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#00a878] px-6 text-base font-bold text-white shadow-[4px_4px_0_#17231f]"
              >
                無料で始める
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#17231f] bg-white px-6 text-base font-bold text-[#17231f] shadow-[4px_4px_0_#17231f] hover:bg-[#fffaf0]"
              >
                ログイン
              </Link>
            </div>

            <p className="mt-6 flex gap-2 text-sm font-semibold text-[#036854]">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              写真は保存しません。
            </p>
          </div>

          <div className="relative min-w-0">
            <div className="mx-auto w-[min(78vw,19rem)] rotate-2 rounded-[2rem] border-2 border-[#17231f] bg-white p-2 shadow-[8px_8px_0_#17231f] sm:absolute sm:-right-2 sm:bottom-[-1.5rem] sm:z-10 sm:w-[13.5rem] lg:w-[15rem]">
              <div className="overflow-hidden rounded-[1.5rem] border border-border">
                <Image
                  src="/home-mobile-preview.png"
                  alt="スマホで今日の摂取カロリーと次の行動を確認している画面"
                  width={385}
                  height={723}
                  priority
                  sizes="(min-width: 1024px) 15rem, (min-width: 640px) 13.5rem, min(78vw, 19rem)"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div className="mt-6 hidden -rotate-1 rounded-md border-2 border-[#17231f] bg-white p-2 shadow-[8px_8px_0_#17231f] sm:block sm:pr-28 lg:pr-36">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-[#17231f] px-2 py-2">
                <CalorieOverLegend />
                <span className="rounded-md bg-[#ffe66d] px-2 py-1 text-xs font-bold text-[#17231f]">
                  PCでも編集しやすい登録画面
                </span>
              </div>
              <Image
                src="/home-preview.png"
                alt="食事写真をAI解析して確認・修正している画面"
                width={1357}
                height={1281}
                sizes="(min-width: 1024px) 44rem, (min-width: 640px) calc(100vw - 16rem), 0px"
                className="h-auto w-full rounded-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#17231f] bg-[#d6fff2]">
        <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {valueProps.map(({ icon: Icon, title, body }, index) => (
            <article
              key={title}
              className="flex gap-3 rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]"
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    "inline-flex size-10 items-center justify-center rounded-md border-2 border-[#17231f] text-[#17231f]",
                    ["bg-[#ffe66d]", "bg-[#ffb4a2]", "bg-[#a5d8ff]", "bg-[#b8f7d4]"][index],
                  ].join(" ")}
                >
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

      <section className="border-b-2 border-[#17231f] bg-[#fffaf0]">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-10 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <FavoriteFoodSlideshow />

          <div className="max-w-2xl lg:pl-4">
            <p className="inline-flex rounded-md border-2 border-[#17231f] bg-[#ffe66d] px-3 py-1.5 text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f]">
              好きな物も、計画に入れる
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#17231f] sm:text-4xl">
              我慢だけのダイエットは終わりにして
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-[#42504b]">
              ラーメンも外食も、食べたら失敗ではありません。カロリーを把握して1日の中で調整できれば、好きな物を楽しみながらダイエットを続けられます。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]">
                <p className="font-semibold">食べた後に記録</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  写真から推定値を作り、量を直して保存できます。
                </p>
              </div>
              <div className="rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]">
                <p className="font-semibold">今日の残りを確認</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  合計カロリーを見ながら、次の食事を調整できます。
                </p>
              </div>
            </div>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#ff6b6b] px-6 text-base font-bold text-white shadow-[4px_4px_0_#17231f] sm:w-auto"
            >
              好きな物を記録して始める
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#17231f] bg-[#eaf3ff]">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-10 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-md border-2 border-[#17231f] bg-white px-3 py-1.5 text-sm font-bold text-[#036854] shadow-[3px_3px_0_#17231f]">
              <Sparkles className="size-4" />
              有料プラン限定
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#17231f] sm:text-4xl">
              次に何を食べるかも、AIに相談。
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-[#42504b]">
              外食・自炊・コンビニを選び、朝ご飯・昼食・夜ご飯を指定するだけ。過去の食事傾向から、AIが今日の残りカロリーに合わせたメニュー候補を提案します。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["外食", "自炊", "コンビニ"].map((label) => (
                <div key={label} className="rounded-md border-2 border-[#17231f] bg-white p-3 text-center text-sm font-bold shadow-[3px_3px_0_#17231f]">
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {["朝ご飯", "昼食", "夜ご飯"].map((label) => (
                <div key={label} className="rounded-md border-2 border-[#17231f] bg-[#ffe66d] p-3 text-center text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f]">
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[6px_6px_0_#17231f] sm:p-5">
            <div className="rounded-md border-2 border-[#17231f] bg-[#d6fff2] p-4 text-sm font-semibold leading-7 text-[#036854]">
              本日の残りカロリーと過去の傾向から、満足感を保ちながら調整しやすい候補を提案します。
            </div>
            <div className="mt-4 space-y-3">
              {[
                ["外食の候補", "寿司10貫セット + あさり汁", "約720 kcal"],
                ["自炊の候補", "焼き魚定食 + ご飯普通盛り", "約780 kcal"],
                ["コンビニの候補", "おにぎり + サラダチキン + 味噌汁", "約520 kcal"],
              ].map(([title, menu, calories]) => (
                <article key={title} className="rounded-md border border-border bg-[#fffaf0] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">{title}</p>
                      <h3 className="mt-1 font-semibold">{menu}</h3>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#ffb4a2] px-2 py-1 text-xs font-bold text-[#17231f]">
                      {calories}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    好きな物を禁止せず、1日の中で調整しやすい組み合わせを提案します。
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#17231f] bg-[#fff3c7]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-md border-2 border-[#17231f] bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-[3px_3px_0_#17231f]">目的から始める</p>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-[#17231f] sm:text-3xl">
                ただ減らすより、続けられる食事管理。
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-[#42504b] sm:text-base">
                予定がある日までに体を整えたい時も、長く健康を保ちたい時も、まずは今日の食事を把握することから始められます。
              </p>
            </div>

            <div className="rounded-md border-2 border-[#17231f] bg-white p-5 shadow-[5px_5px_0_#17231f]">
              <p className="text-sm font-semibold text-primary">太る理由はシンプル</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[#17231f] sm:text-3xl">
                摂取カロリー ＞ 消費カロリー
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                だからこそ、まずは食べたものをざっくりでも把握することが大切です。写真で記録すれば、毎回ゼロから入力しなくても続けやすくなります。
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {goalPromotions.map(({ icon: Icon, title, body }, index) => (
              <article key={title} className="rounded-md border-2 border-[#17231f] bg-white p-5 shadow-[4px_4px_0_#17231f]">
                <span
                  className={[
                    "inline-flex size-10 items-center justify-center rounded-md border-2 border-[#17231f] text-[#17231f]",
                    ["bg-[#ffb4a2]", "bg-[#ffe66d]", "bg-[#b8f7d4]"][index],
                  ].join(" ")}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#d6fff2]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1 text-sm font-bold text-primary">
              <Utensils className="size-4" />
              まずは1食
            </p>
            <h2 className="mt-3 text-2xl font-black text-[#17231f]">次の食事から、健康的に記録。</h2>
            <p className="mt-2 text-sm font-medium text-[#42504b]">
              まずは無料登録して、食事写真からカロリー管理を始められます。
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#00a878] px-6 text-base font-bold text-white shadow-[4px_4px_0_#17231f]"
          >
            無料で始める
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
