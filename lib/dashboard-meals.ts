/** ダッシュボード「選択日の食事一覧」1ページあたりの件数（レスポンス・描画負荷の上限） */
export const DASHBOARD_DAY_MEALS_PAGE_SIZE = 40;

const MAX_MEALS_PAGE = 200;

export function parseDashboardMealsPage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) return 1;
  return Math.min(n, MAX_MEALS_PAGE);
}
