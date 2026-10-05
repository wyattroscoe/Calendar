import { dayOfMonth, weekdayIndex, type ISODate } from "./time";

// Rotations pick which variant of a template block appears on a given day,
// based on which occurrence of that weekday it is in the month (1st–5th).
// The order is a placeholder; the weekly debrief (Phase 4) will confirm or swap it.

export type RotationKey = "thursday" | "saturday" | "sunday";

interface Rotation {
  weekday: number; // 0 = Monday … 6 = Sunday
  order: [string, string, string, string]; // 1st–4th occurrence in the month
  fifth: string;
}

export const ROTATIONS: Record<RotationKey, Rotation> = {
  // 3 Adventures and 1 Guys' night per month
  thursday: { weekday: 3, order: ["adventure", "adventure", "guys-night", "adventure"], fifth: "adventure" },
  // 2 Family days, 1 Gianna adventure day, 1 Wyatt adventure day
  saturday: { weekday: 5, order: ["family", "gianna-adventure", "family", "wyatt-adventure"], fifth: "family" },
  // Family day by default, with 2 half days of Home projects per month
  sunday: { weekday: 6, order: ["family", "home-projects", "family", "home-projects"], fifth: "family" },
};

export function isRotationKey(value: unknown): value is RotationKey {
  return typeof value === "string" && value in ROTATIONS;
}

/** 1 for the first occurrence of this weekday in its month, up to 5. */
export function occurrenceInMonth(date: ISODate): number {
  return Math.ceil(dayOfMonth(date) / 7);
}

/** Which option a rotation lands on for a date, or null if the date is the wrong weekday. */
export function rotationOption(key: RotationKey, date: ISODate, override?: string): string | null {
  const rotation = ROTATIONS[key];
  if (weekdayIndex(date) !== rotation.weekday) return null;
  if (override) return override;
  const n = occurrenceInMonth(date);
  return n === 5 ? rotation.fifth : rotation.order[n - 1];
}
