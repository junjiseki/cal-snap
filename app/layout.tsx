import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Geist, Noto_Sans_JP } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import { CleanupStaleSession } from "@/components/auth/cleanup-stale-session";
import { AppHeader } from "@/components/layout/app-header";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const noto = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-jp",
});

export const metadata: Metadata = {
  title: {
    default: "カロリースナップ | 食事写真で摂取カロリー記録",
    template: "%s | カロリースナップ",
  },
  description:
    "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
  applicationName: "カロリースナップ",
  metadataBase: new URL(getSiteUrl()),
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
    icon: [{ url: "/logo.png", type: "image/png" }],
    shortcut: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "カロリースナップ",
    title: "カロリースナップ | 食事写真で摂取カロリー記録",
    description:
      "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "カロリースナップ | 食事写真で摂取カロリー記録",
    description:
      "食事写真をAIで解析し、1日の摂取カロリーとPFCバランスを記録・可視化できる食事管理アプリです。",
    images: ["/logo.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
      className={cn("h-full antialiased", "font-sans", geist.variable, noto.variable)}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <CleanupStaleSession />
          <AppHeader />
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="border-t border-border bg-card pb-20 md:pb-0">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <p>© {new Date().getFullYear()} カロリースナップ</p>
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
      </body>
    </html>
  );
}
