import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";
import { CleanupStaleSession } from "@/components/auth/cleanup-stale-session";
import { DailyAdvice } from "@/components/advice/daily-advice";
import { AppHeader } from "@/components/layout/app-header";
import { PassiveServiceWorkerRegister } from "@/components/pwa/passive-service-worker-register";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerLegacyCleanup } from "@/components/pwa/service-worker-legacy-cleanup";
import { ThemeProvider } from "@/components/theme-provider";
import { Geist } from 'next/font/google'

const geist = Geist({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const siteBase = new URL(getSiteUrl());

export const metadata: Metadata = {
  title: {
    default: "カロスナ - 3秒で終わる食事管理",
    template: "%s | カロスナ",
  },
  manifest: "/manifest.json",
  description:
    "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
  applicationName: "カロスナ",
  metadataBase: siteBase,
  keywords: [
    "カロリー管理",
    "食事管理",
    "PFC",
    "栄養管理",
    "ダイエット",
    "食事写真",
    "AI解析",
    "筋トレ",
    "ジム",
    "健康",
    "生活",
  ],
  alternates: {
    canonical: "/",
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
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [
      {
        url: new URL("/apple-touch-icon.png", siteBase).href,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "カロスナ",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "カロスナ",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "カロスナ",
    title: "カロスナ - 3秒で終わる食事管理",
    description:
      "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "カロスナ - 3秒で終わる食事管理",
    description:
      "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#fff3c7",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className={`${geist.className} flex min-h-full flex-col`}>
        <ThemeProvider>
          <CleanupStaleSession />
          <ServiceWorkerLegacyCleanup />
          <PassiveServiceWorkerRegister />
          <AppHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <Suspense fallback={null}>
            <DailyAdvice />
          </Suspense>
          <PwaInstallPrompt />
          <footer className="border-t border-border bg-card pb-20 md:pb-0">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p>© {new Date().getFullYear()} カロスナ</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-left sm:flex sm:items-center sm:gap-4">
                <Link href="/contact" className="hover:text-foreground sm:whitespace-nowrap">
                  お問い合わせ
                </Link>
                <Link href="/terms" className="hover:text-foreground sm:whitespace-nowrap">
                  利用規約
                </Link>
                <Link href="/privacy" className="hover:text-foreground sm:whitespace-nowrap">
                  プライバシーポリシー
                </Link>
                <Link href="/commerce-disclosure" className="hover:text-foreground sm:whitespace-nowrap">
                  特商法表記
                </Link>
              </div>
            </div>
          </footer>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
