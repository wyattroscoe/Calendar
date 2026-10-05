import { describe, expect, it } from "vitest";
import { findOverlaps, layoutColumns, type TimedBlock } from "@/lib/overlap";

const b = (id: number, start: number, end: number, extra: Partial<TimedBlock> = {}): TimedBlock => ({
  id,
  date: "2026-10-05",
  startMin: start,
  endMin: end,
  tags: [],
  ...extra,
});

describe("findOverlaps", () => {
  it("flags double-booked blocks", () => {
    expect(findOverlaps([b(1, 540, 600), b(2, 570, 630), b(3, 700, 760)])).toEqual(new Set([1, 2]));
  });

  it("treats back-to-back blocks as fine", () => {
    expect(findOverlaps([b(1, 540, 600), b(2, 600, 660)]).size).toBe(0);
  });

  it("ignores blocks on different days", () => {
    expect(findOverlaps([b(1, 540, 600), b(2, 540, 600, { date: "2026-10-06" })]).size).toBe(0);
  });

  it("doesn't flag something placed in a buffer", () => {
    expect(findOverlaps([b(1, 480, 510, { tags: ["buffer"] }), b(2, 480, 495)]).size).toBe(0);
  });
});

describe("layoutColumns", () => {
  it("puts overlapping blocks side by side", () => {
    const layout = layoutColumns([b(1, 540, 600), b(2, 570, 630), b(3, 700, 760)]);
    expect(layout.get(1)).toEqual({ col: 0, cols: 2 });
    expect(layout.get(2)).toEqual({ col: 1, cols: 2 });
    expect(layout.get(3)).toEqual({ col: 0, cols: 1 });
  });
});
