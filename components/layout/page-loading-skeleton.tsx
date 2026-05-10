import Image from "next/image";
import { Loader2 } from "lucide-react";

const DEFAULT_MESSAGE = "ページを読み込んでいます…";

export type PageLoadingSkeletonProps = {
  /**
   * 表示・スクリーンリーダー向けの文言。
   * 未指定時はルート非依存の汎用メッセージ。
   */
  message?: string;
};

/**
 * ルート遷移時（app/loading.tsx）用。
 * OS スプラッシュの次に表示する、アプリ側の短いローディング（白背景・ロゴ・軽いスピナー）。
 */
export function PageLoadingSkeleton({ message = DEFAULT_MESSAGE }: PageLoadingSkeletonProps) {
  return (
    <main
      className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-6 bg-white px-6 py-12 dark:bg-background"
      aria-busy="true"
      aria-live="polite"
    >
      <Image
        src="/logo.webp"
        alt="カロスナ"
        width={80}
        height={80}
        className="size-20 shrink-0 rounded-md"
        sizes="80px"
      />
      <div className="flex flex-col items-center gap-3">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden
        />
        <p role="status" className="text-center text-sm font-medium text-muted-foreground">
          {message}
        </p>
      </div>
    </main>
  );
}
