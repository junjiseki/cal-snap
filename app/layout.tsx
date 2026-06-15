import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { DailyAdvice } from "@/components/advice/daily-advice";
import { AppHeader } from "@/components/layout/app-header";
import { DeferredClientEffects } from "@/components/layout/deferred-client-effects";
import { DeferredVitals } from "@/components/layout/deferred-vitals";
import { ThemeProvider } from "@/components/theme-provider";
import { APPLE_TOUCH_ICON_METADATA } from "@/lib/pwa-static-icon-paths";
import { PWA_THEME_COLOR_DARK, PWA_THEME_COLOR_LIGHT } from "@/lib/pwa-theme";
import { getRequestOrigin } from "@/lib/request-origin";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

const APP_NAME = "カロスナ";
const SITE_TITLE = `${APP_NAME} - 3秒で終わる食事管理`;
const SITE_DESCRIPTION =
  "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。";
const PWA_SPLASH_IMAGE = "/splash.png";
const KEYWORDS = [
  "カロリー管理",
  "食事管理",
  "PFC",
  "栄養管理",
  "ダイエット",
  "食事写真",
  "AI解析",
  "筋トレ",
  "ジム",
];
const FOOTER_LINKS = [
  { href: "/contact", label: "お問い合わせ" },
  { href: "/terms", label: "利用規約" },
  { href: "/privacy", label: "プライバシーポリシー" },
  { href: "/commerce-disclosure", label: "特商法表記" },
] as const;

function AppHeaderFallback() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Image
              src="/logo.webp"
              alt="カロスナ AI ロゴ"
              width={48}
              height={48}
              className="size-10 shrink-0 rounded-md sm:size-12"
              sizes="(min-width: 640px) 48px, 40px"
              priority
            />
            <span className="truncate text-base font-semibold sm:text-lg">
              カロスナ
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-md px-2 py-2 text-sm font-semibold text-primary hover:bg-muted/50"
            >
              新規登録
            </Link>
          </div>
          <div className="size-10 rounded-md border border-border bg-background shadow-sm md:hidden" />
        </div>
      </div>
    </header>
  );
}

/** OGP / Twitter / LINE 用（実ファイルと寸法を一致。url はリクエストオリジン基準の絶対 URL） */
function socialShareLogo(alt: string, origin: string) {
  return {
    url: new URL("/logo.png", origin).href,
    width: 1024,
    height: 1024,
    alt,
  } as const;
}

export async function generateMetadata(): Promise<Metadata> {
  const origin = await getRequestOrigin();
  const siteBase = new URL(origin);
  const homeUrl = new URL("/", origin).href;
  const shareLogo = socialShareLogo(`${APP_NAME}のロゴ`, origin);

  return {
    title: {
      default: SITE_TITLE,
      template: `%s | ${APP_NAME}`,
    },
    manifest: "/manifest.json",
    description: SITE_DESCRIPTION,
    applicationName: APP_NAME,
    metadataBase: siteBase,
    keywords: [...KEYWORDS],
    alternates: {
      canonical: homeUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: [...APPLE_TOUCH_ICON_METADATA],
    },
    appleWebApp: {
      capable: true,
      title: APP_NAME,
      startupImage: [
        PWA_SPLASH_IMAGE,
        {
          url: PWA_SPLASH_IMAGE,
          media:
            "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: PWA_SPLASH_IMAGE,
          media:
            "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: PWA_SPLASH_IMAGE,
          media:
            "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
        {
          url: PWA_SPLASH_IMAGE,
          media:
            "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
        },
      ],
      statusBarStyle: "default",
    },
    formatDetection: {
      telephone: false,
    },
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-title": APP_NAME,
    },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      url: homeUrl,
      siteName: APP_NAME,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [shareLogo],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [shareLogo],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PWA_THEME_COLOR_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: PWA_THEME_COLOR_DARK },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning className="h-full antialiased">
      <body className={`${geist.className} flex min-h-full flex-col`}>
        <ThemeProvider>
          <DeferredClientEffects />
          <Suspense fallback={<AppHeaderFallback />}>
            <AppHeader />
          </Suspense>
          <div className="flex flex-1 flex-col">{children}</div>
          <Suspense fallback={null}>
            <DailyAdvice />
          </Suspense>
          <footer className="border-t border-border bg-card pb-20 md:pb-0">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p>
                © {new Date().getFullYear()} {APP_NAME}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left sm:flex sm:items-center sm:gap-4">
                {FOOTER_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="hover:text-foreground sm:whitespace-nowrap"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </ThemeProvider>
        <DeferredVitals />
      </body>
    </html>
  );
}
