import { describe, expect, it } from "vitest";
import { actualHours, isCounted, plannedHours, score, type ScorableBlock } from "@/lib/scoring";

const block = (overrides: Partial<ScorableBlock> = {}): ScorableBlock => ({
  date: "2026-10-05",
  startMin: 9 * 60,
  endMin: 11 * 60,
  percent: null,
  source: "template",
  tags: [],
  ...overrides,
});

const now = { date: "2026-10-07", minutes: 12 * 60 };

describe("hours", () => {
  it("actual hours = planned hours × percent complete", () => {
    expect(plannedHours(block())).toBe(2);
    expect(actualHours(block({ percent: 50 }))).toBe(1);
    expect(actualHours(block({ percent: 100 }))).toBe(2);
    expect(actualHours(block())).toBe(0);
  });
});

describe("isCounted", () => {
  it("counts a marked block", () => {
    expect(isCounted(block({ percent: 0 }), now)).toBe(true);
  });

  it("counts an unmarked block that ended under 5 days ago (as 0%)", () => {
    expect(isCounted(block(), now)).toBe(true);
  });

  it("excludes blocks still unmarked 5+ days later", () => {
    expect(isCounted(block(), { date: "2026-10-09", minutes: 0 })).toBe(true); // 4 days
    expect(isCounted(block(), { date: "2026-10-10", minutes: 0 })).toBe(false); // 5 days
  });

  it("still counts a marked block after 5 days", () => {
    expect(isCounted(block({ percent: 80 }), { date: "2026-12-01", minutes: 0 })).toBe(true);
  });

  it("ignores unmarked blocks that haven't ended yet", () => {
    expect(isCounted(block({ date: "2026-10-07", endMin: 13 * 60 }), now)).toBe(false);
    expect(isCounted(block({ date: "2026-10-07", endMin: 12 * 60 }), now)).toBe(true);
    expect(isCounted(block({ date: "2026-10-08" }), now)).toBe(false);
  });

  it("never counts buffers or imported Google/Teams events", () => {
    expect(isCounted(block({ tags: ["buffer"], percent: 100 }), now)).toBe(false);
    expect(isCounted(block({ source: "google", percent: 100 }), now)).toBe(false);
    expect(isCounted(block({ source: "teams", percent: 100 }), now)).toBe(false);
  });
});

describe("score", () => {
  it("is Σ actual ÷ Σ planned over counted blocks", () => {
    const result = score(
      [
        block({ percent: 100 }), // 2 of 2
        block({ percent: 50, startMin: 13 * 60, endMin: 15 * 60 }), // 1 of 2
        block({ date: "2026-10-06" }), // unmarked, counts as 0 of 2
        block({ date: "2026-09-28" }), // unmarked 9 days → excluded
        block({ tags: ["buffer"] }), // excluded
      ],
      now,
    );
    expect(result.planned).toBe(6);
    expect(result.actual).toBe(3);
    expect(result.consistency).toBe(0.5);
  });

  it("is null when nothing counts yet", () => {
    expect(score([block({ date: "2026-10-09" })], now).consistency).toBeNull();
  });
});
