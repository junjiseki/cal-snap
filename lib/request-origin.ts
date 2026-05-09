import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/site-url";

/**
 * 現在リクエストのオリジン（metadataBase・apple-touch-icon 用）。
 * NEXT_PUBLIC_APP_URL と実際の Host（www 有無・プレビュー URL）がずれても、
 * Safari「ホーム画面に追加」が正しい絶対 URL でアイコンを取れるようにする。
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const h = await headers();
    const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
    const host = hostRaw.split(",")[0]?.trim() ?? "";
    if (!host) {
      return getSiteUrl();
    }
    let proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "";
    if (!proto) {
      proto =
        host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
    }
    return `${proto}://${host}`;
  } catch {
    return getSiteUrl();
  }
}
