// Dates are plain "YYYY-MM-DD" strings and times are minutes since midnight,
// so nothing depends on the server's time zone.

export type ISODate = string;

export const DAY_START = 5 * 60; // 5:00am
export const DAY_END = 22 * 60; // 10:00pm
export const SLOT = 15;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toUTC(date: ISODate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function isISODate(value: unknown): value is ISODate {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(toUTC(value).getTime());
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = toUTC(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

/** 0 = Monday … 6 = Sunday */
export function weekdayIndex(date: ISODate): number {
  return (toUTC(date).getUTCDay() + 6) % 7;
}

export function startOfWeek(date: ISODate): ISODate {
  return addDays(date, -weekdayIndex(date));
}

export function weekDates(weekStart: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function dayOfMonth(date: ISODate): number {
  return toUTC(date).getUTCDate();
}

export function snap(minutes: number): number {
  return Math.round(minutes / SLOT) * SLOT;
}

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 570 → "9:30", 780 → "1:00" */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")}`;
}

/** 570 → "9:30am" */
export function formatTimeAmPm(minutes: number): string {
  return formatTime(minutes) + (minutes < 12 * 60 ? "am" : "pm");
}

export function formatDayLabel(date: ISODate): string {
  return toUTC(date).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export interface LocalNow {
  date: ISODate;
  minutes: number;
}

/** The current date and minute in the given IANA time zone. */
export function localNow(timeZone: string, at: Date = new Date()): LocalNow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}
