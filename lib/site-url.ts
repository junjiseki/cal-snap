/** 公開 URL のベース（末尾スラッシュなし）。metadata・sitemap・robots で共通利用。 */
export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

/** `/logo.png` のような pathname から絶対 URL（LINE 等は og:image の相対パスを解釈しないことがある） */
export function absoluteSiteUrl(pathname: string): string {
  return new URL(pathname, getSiteUrl()).href;
}

/** トップページの絶対 URL（`og:url` / canonical 用） */
export function siteHomeAbsoluteUrl(): string {
  return new URL("/", getSiteUrl()).href;
}
