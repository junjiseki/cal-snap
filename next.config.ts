import type { NextConfig } from "next";

/**
 * Cloudflare 等の CDN では、HTML / RSC / データ取得を「Cache Everything」で長期キャッシュしないこと。
 * 古い HTML と新しい `/_next/static` チャンクの組み合わせで実行時エラーになり得る。
 *
 * App Router のドキュメント（メタデータ manifest）とホーム画面追加は manifest のみでも利用可能。
 */
const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
