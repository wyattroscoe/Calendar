import { describe, expect, it } from "vitest";
import { SEED_WEEK } from "@/db/template";
import { generateWeek, type TemplateBlockLike } from "@/lib/generate-week";
import { findOverlaps } from "@/lib/overlap";
import { parseTime } from "@/lib/time";

const template: TemplateBlockLike[] = SEED_WEEK.flatMap((day, weekday) =>
  day.map((s, i) => ({
    id: weekday * 100 + i,
    weekday,
    startMin: parseTime(s.start),
    endMin: parseTime(s.end),
    projectId: null,
    title: s.title,
    tags: s.tags ?? [],
    rotationKey: s.rotation?.[0] ?? null,
    rotationOption: s.rotation?.[1] ?? null,
  })),
);

describe("generateWeek", () => {
  it("dates every block within the Monday–Sunday week", () => {
    const blocks = generateWeek(template, "2026-10-05");
    expect(new Set(blocks.map((b) => b.date))).toEqual(
      new Set(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"]),
    );
  });

  it("keeps exactly one rotation variant per day", () => {
    const blocks = generateWeek(template, "2026-10-12"); // 2nd Thursday & Saturday of October
    const thursday = blocks.filter((b) => b.date === "2026-10-15" && b.startMin === parseTime("14:00"));
    expect(thursday.map((b) => b.title)).toEqual(["Guys' night"]);
    const saturday = blocks.filter((b) => b.date === "2026-10-17");
    expect(saturday.map((b) => b.title)).toEqual(["Family day"]);
  });

  it("produces a seeded week with no overlaps", () => {
    for (const weekStart of ["2026-09-28", "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]) {
      const blocks = generateWeek(template, weekStart).map((b, id) => ({ ...b, id }));
      expect(findOverlaps(blocks).size).toBe(0);
    }
  });

  it("stays inside 5:00am–10:00pm on 15-minute increments", () => {
    for (const b of generateWeek(template, "2026-10-05")) {
      expect(b.startMin).toBeGreaterThanOrEqual(5 * 60);
      expect(b.endMin).toBeLessThanOrEqual(22 * 60);
      expect(b.startMin % 15).toBe(0);
      expect(b.endMin % 15).toBe(0);
    }
  });
});
