import type { NextConfig } from "next";

/**
 * セキュリティヘッダー・HTML の Cache-Control は `proxy.ts`（middleware）で付与。
 * `/_next/static` 等は matcher 外のためミドルウェアを通らない（チャンクは Next 既定のキャッシュ）。
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
