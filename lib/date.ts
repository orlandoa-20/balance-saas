/** Date helpers (Monday-based weeks). Pure, server+client safe. */

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function today(): Date {
  return new Date();
}
export function todayKey(): string {
  return toKey(today());
}
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
/** 0 = Monday … 6 = Sunday */
export function dayIndex(d: Date = today()): number {
  return (d.getDay() + 6) % 7;
}
export function weekStart(d: Date = today()): Date {
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dayIndex(d));
}
export function weekDays(ref: Date = today()): Date[] {
  const s = weekStart(ref);
  return Array.from({ length: 7 }, (_, i) => addDays(s, i));
}
export function daysLeftInWeek(): number {
  return 7 - dayIndex();
}
export function daysUntil(dateKey: string): number {
  const d = new Date(`${dateKey}T00:00:00`);
  const t = today();
  t.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - t.getTime()) / 86_400_000);
}

export const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const DAYS_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

export function longDate(d: Date = today()): string {
  return `${DAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`;
}
export function shortDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00`);
  return `${WEEKDAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
export function fmtHours(h: number): string {
  if (h <= 0) return "0 h";
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  if (whole === 0) return `${min} min`;
  if (min === 0) return `${whole} h`;
  return `${whole} h${pad(min)}`;
}
export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h${pad(m)}`;
}
