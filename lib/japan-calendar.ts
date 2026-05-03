/** 日本時間（Asia/Tokyo）基準の暦ユーティリティ（ダッシュボードカレンダー用） */

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function daysInJapanMonth(year: number, month: number): number {
  for (let d = 31; d >= 28; d--) {
    const iso = `${year}-${pad2(month)}-${pad2(d)}`;
    const dt = new Date(`${iso}T12:00:00+09:00`);
    const j = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dt);
    if (j === iso) return d;
  }
  return 28;
}

/** ISO 時刻文字列を日本の暦 YYYY-MM-DD に */
export function toJapanYmd(isoTimestamp: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(isoTimestamp));
}

/** 同一「日」を保ったまま月だけ delta だけずらす（日付はその月の日数でクランプ） */
export function shiftMonthJapan(ymd: string, delta: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  let nm = m + delta;
  let ny = y;
  while (nm < 1) {
    nm += 12;
    ny -= 1;
  }
  while (nm > 12) {
    nm -= 12;
    ny += 1;
  }
  const dim = daysInJapanMonth(ny, nm);
  const dd = Math.min(d, dim);
  return `${ny}-${pad2(nm)}-${pad2(dd)}`;
}

/** 日曜 = 0 … 土曜 = 6（その日の JST 暦に対応） */
export function jstWeekdaySun0(ymd: string): number {
  const d = new Date(`${ymd}T12:00:00+09:00`);
  const w = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", weekday: "short" }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[w] ?? 0;
}

export function dashboardDateHref(ymd: string): string {
  return `/dashboard?date=${encodeURIComponent(ymd)}`;
}
