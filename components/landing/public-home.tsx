import Link from "next/link";
import Image from "next/image";
import { CalorieOverLegend } from "@/components/calorie-over-legend";
import { FavoriteFoodSlideshow } from "@/components/landing/favorite-food-slideshow";
import {
  ArrowRight,
  BarChart3,
  BellRing,
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
    title: "3秒で記録完了",
    body: "食事写真を選んで解析するだけ。毎食の入力負担を小さくします。",
  },
  {
    icon: Utensils,
    title: "外食でもOK",
    body: "ラーメン、定食、コンビニ飯も写真からざっくり把握できます。",
  },
  {
    icon: BarChart3,
    title: "PFCも自動で見える",
    body: "カロリーだけでなく、たんぱく質・脂質・炭水化物も確認できます。",
  },
  {
    icon: Edit3,
    title: "修正もできるから安心",
    body: "AI推定を保存前に確認し、量やメモを直してから登録できます。",
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

const mobilePreviewSlides = [
  {
    src: "/home-mobile-preview.webp",
    alt: "スマホで今日の摂取カロリーと次の行動を確認している画面",
    width: 392,
    height: 785,
  },
  {
    src: "/1.webp",
    alt: "スマホでPFC合計と摂取カロリー推移を確認している画面",
    width: 389,
    height: 845,
  },
  {
    src: "/2.webp",
    alt: "スマホで食事提案の結果を確認している画面",
    width: 389,
    height: 845,
  },
] as const;

const premiumHighlights = [
  ["無料", "標準AIで1日1回"],
  ["有料", "高精度AIで1日3回"],
  ["体験", "14日間無料"],
] as const;

export function PublicHome() {
  return (
    <main className="flex-1 bg-[#fffaf0]">
      <section className="border-b-2 border-[#17231f] bg-[#fff3c7]">
        <div className="mx-auto grid min-h-[calc(100vh-73px)] w-full max-w-7xl gap-8 px-4 py-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-10">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-md border-2 border-[#17231f] bg-[#d6fff2] px-3 py-1.5 text-sm font-semibold text-[#036854] shadow-[3px_3px_0_#17231f]">
              <Smartphone className="size-4" />
              カロリー管理、続かなかった人へ
            </p>
            <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-[#17231f] sm:text-6xl">
              3秒で終わる
              <br />
              <span className="inline-block -rotate-1 bg-[#ff6b6b] px-2 text-white">
                食事記録
              </span>
            </h1>
            <p className="mt-6 text-base font-medium leading-8 text-[#42504b] sm:text-lg">
              面倒な入力が続かなかった人でも、写真なら始めやすい。カロスナは食事写真からカロリーとPFCを推定し、今日の摂取量をすぐ見える化します。
            </p>
            <div className="mt-5 grid gap-2 text-sm font-bold text-[#17231f] sm:grid-cols-2">
              {[
                "3秒で記録完了",
                "外食でもOK",
                "PFCも自動で見える",
                "修正もできるから安心",
              ].map((label) => (
                <p key={label} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#00a878]" />
                  {label}
                </p>
              ))}
            </div>

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

            <div className="mt-6 flex items-center gap-3 rounded-md border-2 border-[#17231f] bg-white p-3 shadow-[4px_4px_0_#17231f]">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-[#075c55] bg-[#fff3c7]">
                <Image
                  src="/advice-mascot.webp"
                  alt="カロちゃん"
                  width={160}
                  height={160}
                  sizes="64px"
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div>
                <p className="text-xs font-black text-[#036854]">カロちゃん</p>
                <p className="text-[11px] font-bold text-[#6b756f]">
                  カロスナ コンシェルジュ
                </p>
                <p className="mt-1 text-sm font-bold leading-6 text-[#17231f]">
                  食べたら写真を1枚。今日のカロリーとPFCをすぐ案内します。
                </p>
              </div>
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="mx-auto w-[min(78vw,19rem)] rotate-2 rounded-[2rem] border-2 border-[#17231f] bg-white p-2 shadow-[8px_8px_0_#17231f] sm:absolute sm:-right-2 sm:bottom-[-1.5rem] sm:z-10 sm:w-[13.5rem] lg:w-[15rem]">
              <div
                className="flex snap-x snap-mandatory overflow-x-auto rounded-[1.5rem] border border-border"
                aria-label="スマホ画面プレビューを横にスライドして確認"
              >
                {mobilePreviewSlides.map((slide, index) => (
                  <Image
                    key={slide.src}
                    src={slide.src}
                    alt={slide.alt}
                    width={slide.width}
                    height={slide.height}
                    priority={index === 0}
                    loading={index === 0 ? undefined : "lazy"}
                    sizes="(min-width: 1024px) 15rem, (min-width: 640px) 13.5rem, min(78vw, 19rem)"
                    className="h-auto min-w-full snap-center"
                  />
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] font-bold text-[#036854] sm:hidden">
                横にスライドして画面を確認
              </p>
            </div>
            <div className="mt-6 hidden -rotate-1 rounded-md border-2 border-[#17231f] bg-white p-2 shadow-[8px_8px_0_#17231f] sm:block sm:pr-28 lg:pr-36">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-[#17231f] px-2 py-2">
                <CalorieOverLegend />
                <span className="rounded-md bg-[#ffe66d] px-2 py-1 text-xs font-bold text-[#17231f]">
                  PCでも編集しやすい登録画面
                </span>
              </div>
              <Image
                src="/home-preview.webp"
                alt="食事写真をAI解析して確認・修正している画面"
                width={1357}
                height={1281}
                loading="lazy"
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
                    [
                      "bg-[#ffe66d]",
                      "bg-[#ffb4a2]",
                      "bg-[#a5d8ff]",
                      "bg-[#b8f7d4]",
                    ][index],
                  ].join(" ")}
                >
                  <Icon className="size-4" />
                </span>
              </div>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b-2 border-[#17231f] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-md border-2 border-[#17231f] bg-[#ffb4a2] px-3 py-1.5 text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f]">
              続かない理由に合わせました
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#17231f] sm:text-4xl">
              記録が面倒だと、正しい方法でも続かない。
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-[#42504b]">
              カロリー管理で大切なのは、完璧な入力よりも「今日も記録できた」こと。だから、毎食のハードルを写真1枚まで下げています。
            </p>
          </div>
          <div className="rounded-md border-2 border-[#17231f] bg-[#fff3c7] p-5 shadow-[6px_6px_0_#17231f]">
            <p className="text-sm font-semibold text-primary">
              太る理由はシンプル
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-[#17231f] sm:text-3xl">
              摂取カロリー ＞ 消費カロリー
            </p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              だからまずは、食べた量をざっくり把握することから。写真でOKなら、外食の日も記録を途切れさせにくくなります。
            </p>
          </div>
        </div>
      </section>

      <section className="border-b-2 border-[#17231f] bg-[#fffaf0]">
        <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-10 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <FavoriteFoodSlideshow />

          <div className="max-w-2xl lg:pl-4">
            <p className="inline-flex rounded-md border-2 border-[#17231f] bg-[#ffe66d] px-3 py-1.5 text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f]">
              写真でOK
            </p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#17231f] sm:text-4xl">
              好きな物も、記録すれば調整できる。
            </h2>
            <p className="mt-4 text-base font-medium leading-8 text-[#42504b]">
              ラーメンも外食も、食べたら失敗ではありません。カロリーを把握して1日の中で調整できれば、好きな物を楽しみながらダイエットを続けられます。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]">
                <p className="font-semibold">撮る</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  食事写真を選ぶだけ。細かいメニュー検索から始めません。
                </p>
              </div>
              <div className="rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]">
                <p className="font-semibold">3秒で見る</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  推定カロリーとPFCを確認し、違うところだけ直せます。
                </p>
              </div>
            </div>
            <Link
              href="/signup"
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-[#17231f] bg-[#ff6b6b] px-6 text-base font-bold text-white shadow-[4px_4px_0_#17231f] sm:w-auto"
            >
              3秒記録を試す
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
              外食・自炊・コンビニを選び、朝ご飯・昼食・夜ご飯を指定するだけ。過去の食事傾向から、AIが今日の残りカロリーに合わせたメニュー候補を提案します。有料プランではより高精度なAIモデルを使い、写真解析や提案の品質を高めます。さらに食事時間を登録すると、記録忘れを通知で思い出せます。有料プランは14日間無料で試せます。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {premiumHighlights.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border-2 border-[#17231f] bg-white px-4 py-3 shadow-[3px_3px_0_#17231f]"
                >
                  <p className="text-xs font-black text-[#036854]">{label}</p>
                  <p className="mt-1 text-sm font-black text-[#17231f]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-md border-2 border-[#17231f] bg-white p-4 shadow-[4px_4px_0_#17231f]">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-[#075c55] bg-[#fff3c7]">
                  <Image
                    src="/advice-mascot.webp"
                    alt=""
                    width={140}
                    height={140}
                    sizes="56px"
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <p className="text-sm font-bold leading-7 text-[#17231f]">
                  「今日は外食」「夜ご飯」などを選ぶだけで、次の食事を一緒に考えます。
                </p>
              </div>
              <div className="flex items-start gap-3 rounded-md border-2 border-[#17231f] bg-[#fff3c7] p-4 shadow-[4px_4px_0_#17231f]">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border-2 border-[#17231f] bg-[#d6fff2] text-[#036854]">
                  <BellRing className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#17231f]">
                    食事時間を通知
                  </p>
                  <p className="mt-1 text-sm font-bold leading-7 text-[#42504b]">
                    登録した時間に記録を促します。iPhoneはホーム画面に追加したアプリ版で利用できます。
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["外食", "自炊", "コンビニ"].map((label) => (
                <div
                  key={label}
                  className="rounded-md border-2 border-[#17231f] bg-white p-3 text-center text-sm font-bold shadow-[3px_3px_0_#17231f]"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {["朝ご飯", "昼食", "夜ご飯"].map((label) => (
                <div
                  key={label}
                  className="rounded-md border-2 border-[#17231f] bg-[#ffe66d] p-3 text-center text-sm font-bold text-[#17231f] shadow-[3px_3px_0_#17231f]"
                >
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
                [
                  "コンビニの候補",
                  "おにぎり + サラダチキン + 味噌汁",
                  "約520 kcal",
                ],
              ].map(([title, menu, calories]) => (
                <article
                  key={title}
                  className="rounded-md border border-border bg-[#fffaf0] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {title}
                      </p>
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
              <p className="inline-flex rounded-md border-2 border-[#17231f] bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-[3px_3px_0_#17231f]">
                目的から始める
              </p>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-[#17231f] sm:text-3xl">
                続くから、結果につながる。
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-[#42504b] sm:text-base">
                結婚式までに、夏までに、健康のために。まずは今日の1食を3秒で残すところから始められます。
              </p>
            </div>

            <div className="rounded-md border-2 border-[#17231f] bg-white p-5 shadow-[5px_5px_0_#17231f]">
              <p className="text-sm font-semibold text-primary">
                続けるための設計
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-[#17231f] sm:text-3xl">
                完璧より、途切れない記録。
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                食べすぎた日も、外食の日も、記録できれば次の食事で調整できます。
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {goalPromotions.map(({ icon: Icon, title, body }, index) => (
              <article
                key={title}
                className="rounded-md border-2 border-[#17231f] bg-white p-5 shadow-[4px_4px_0_#17231f]"
              >
                <span
                  className={[
                    "inline-flex size-10 items-center justify-center rounded-md border-2 border-[#17231f] text-[#17231f]",
                    ["bg-[#ffb4a2]", "bg-[#ffe66d]", "bg-[#b8f7d4]"][index],
                  ].join(" ")}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
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
            <h2 className="mt-3 text-2xl font-black text-[#17231f]">
              次の食事から、健康的に記録。
            </h2>
            <p className="mt-2 text-sm font-medium text-[#42504b]">
              カロリー管理が続かなかった人でも、写真1枚なら始められます。
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
