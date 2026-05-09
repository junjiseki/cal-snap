import type { NextConfig } from "next";
import { PWA_SHORT_CACHE_PATHS } from "./lib/pwa-static-icon-paths";

/**
 * セキュリティヘッダー・HTML の Cache-Control は `proxy.ts`（Next の Proxy 規約／旧 middleware）で付与。
 * `/_next/static` 等は matcher 外のため proxy を通らない（チャンクは Next 既定のキャッシュ）。
 */
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      ...PWA_SHORT_CACHE_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
        ],
      })),
      ...[
        "avif",
        "webp",
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg",
        "ico",
        "woff2",
      ].map((extension) => ({
        source: `/:path*.${extension}`,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      })),
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 90,
  },
};

export default nextConfig;
