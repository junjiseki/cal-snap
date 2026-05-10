import type { NextConfig } from "next";
import {
  PERMISSIONS_POLICY,
  SERVICE_WORKER_SCRIPT_HEADERS,
} from "./lib/http-security";
import { PWA_SHORT_CACHE_PATHS } from "./lib/pwa-static-icon-paths";

/**
 * セキュリティヘッダー: `/:path*` で全レスポンスに付与（`proxy.ts` の matcher 外の
 * `/_next/static`、`/sw.js` 等も含む）。HTML の Cache-Control と HSTS（HTTPS 時）は `proxy.ts`。
 * Permissions-Policy 等の共有値は `lib/http-security.ts`。
 */
const SERVICE_WORKER_HEADER_SOURCES = ["/sw.js", "/sw-passive.js"] as const;

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  poweredByHeader: false,
  async headers() {
    // 複数ルールがマッチすると後勝ち。`/:path*.png` は `/icon-192.png` 等にもマッチするため、
    // PWA アイコン用の短期キャッシュは一般静的ルールより後ろに置く。
    const staticAssetExtensions = [
      "avif",
      "webp",
      "png",
      "jpg",
      "jpeg",
      "gif",
      "svg",
      "ico",
      "woff2",
    ] as const;

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
        ],
      },
      ...staticAssetExtensions.map((extension) => ({
        source: `/:path*.${extension}`,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      })),
      ...PWA_SHORT_CACHE_PATHS.map((source) => ({
        source,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
        ],
      })),
      ...SERVICE_WORKER_HEADER_SOURCES.map((source) => ({
        source,
        headers: [...SERVICE_WORKER_SCRIPT_HEADERS],
      })),
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 90,
  },
};

export default nextConfig;
