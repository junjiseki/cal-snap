import type { NextConfig } from "next";

/** HTML をエッジ長期キャッシュしない（デプロイ直後に旧 HTML + 新チャンクで不整合になるのを防ぐ） */
const documentCacheControl = {
  key: "Cache-Control",
  value: "private, no-cache, must-revalidate, max-age=0, s-maxage=0",
} as const;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // セキュリティヘッダーはここと proxy.ts（middleware 相当）で揃える — Permissions-Policy は proxy.ts と同一文字列にすること
  async headers() {
    const permissionsPolicy =
      "camera=(self), microphone=(), geolocation=(), payment=()";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: permissionsPolicy,
          },
        ],
      },
      {
        // api / ビルド成果物 / ルートの静的ファイルは除外（ページ HTML のみ弱キャッシュ）
        source:
          "/:path((?!api/|_next/|favicon\\.ico|manifest\\.json|robots\\.txt|sitemap\\.xml|sw\\.js|sw-passive\\.js|.*\\.[\\w.-]+$).*)",
        headers: [documentCacheControl],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
