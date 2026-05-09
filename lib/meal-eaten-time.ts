/** `input type="time"` / `datetime-local` の `step`（秒）。30分刻み。 */
export const MEAL_EATEN_TIME_STEP_SECONDS = 1800;

/** `YYYY-MM-DDTHH:mm` 形式を30分に丸める（分は切り捨て）。 */
export function snapDatetimeLocalToThirtyMinutes(local: string): string {
  const trimmed = local.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})T(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  const [, datePart, hourPart, minutePart] = match;
  let hours = Number.parseInt(hourPart, 10);
  let minutes = Number.parseInt(minutePart, 10);
  if (!Number.isFinite(hours)) hours = 0;
  if (!Number.isFinite(minutes)) minutes = 0;
  hours = Math.min(23, Math.max(0, hours));
  minutes = Math.min(59, Math.max(0, minutes));
  const snapped = Math.floor(minutes / 30) * 30;
  return `${datePart}T${String(hours).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

/** `HH:mm`（日本時間の表示用）を30分に丸める（分は切り捨て）。 */
export function snapTimeHHmmToThirtyMinutes(time: string): string {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  let hours = Number.parseInt(match[1], 10);
  let minutes = Number.parseInt(match[2], 10);
  if (!Number.isFinite(hours)) hours = 0;
  if (!Number.isFinite(minutes)) minutes = 0;
  hours = Math.min(23, Math.max(0, hours));
  minutes = Math.min(59, Math.max(0, minutes));
  const snapped = Math.floor(minutes / 30) * 30;
  return `${String(hours).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}
