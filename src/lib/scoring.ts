import { daysBetween, type ISODate, type LocalNow } from "./time";

// actual hours = planned hours × percent complete
// consistency  = Σ actual ÷ Σ planned, over counted blocks

export const UNMARKED_EXCLUDE_DAYS = 5;

export interface ScorableBlock {
  date: ISODate;
  startMin: number;
  endMin: number;
  percent: number | null;
  source: string;
  tags: string[];
}

const IMPORTED_SOURCES = new Set(["google", "teams"]);

export function plannedHours(b: ScorableBlock): number {
  return (b.endMin - b.startMin) / 60;
}

export function actualHours(b: ScorableBlock): number {
  return (plannedHours(b) * (b.percent ?? 0)) / 100;
}

/**
 * Whether a block counts toward scores as of `now`:
 * - buffers and imported Google/Teams events never count
 * - blocks that haven't ended yet count only once marked
 * - blocks still unmarked 5+ days later are excluded (not counted as 0%)
 */
export function isCounted(b: ScorableBlock, now: LocalNow): boolean {
  if (b.tags.includes("buffer") || IMPORTED_SOURCES.has(b.source)) return false;
  if (b.percent !== null) return true;
  const ended = b.date < now.date || (b.date === now.date && b.endMin <= now.minutes);
  if (!ended) return false;
  return daysBetween(b.date, now.date) < UNMARKED_EXCLUDE_DAYS;
}

export interface Score {
  planned: number;
  actual: number;
  /** actual ÷ planned, or null when nothing counts yet */
  consistency: number | null;
}

export function score(blocks: ScorableBlock[], now: LocalNow): Score {
  let planned = 0;
  let actual = 0;
  for (const b of blocks) {
    if (!isCounted(b, now)) continue;
    planned += plannedHours(b);
    actual += actualHours(b);
  }
  return { planned, actual, consistency: planned > 0 ? actual / planned : null };
}
