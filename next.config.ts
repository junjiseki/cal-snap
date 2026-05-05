import type { NextConfig } from "next";

/**
 * セキュリティヘッダー・HTML の Cache-Control は `proxy.ts`（Next の Proxy 規約／旧 middleware）で付与。
 * `/_next/static` 等は matcher 外のため proxy を通らない（チャンクは Next 既定のキャッシュ）。
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      ...["avif", "webp", "png", "jpg", "jpeg", "gif", "svg", "ico", "woff2"].map(
        (extension) => ({
          source: `/:path*.${extension}`,
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        }),
      ),
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
