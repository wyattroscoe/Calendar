import { describe, expect, it } from "vitest";
import { occurrenceInMonth, rotationOption } from "@/lib/rotation";

describe("occurrenceInMonth", () => {
  it("counts which occurrence of the weekday this is", () => {
    expect(occurrenceInMonth("2026-10-01")).toBe(1);
    expect(occurrenceInMonth("2026-10-07")).toBe(1);
    expect(occurrenceInMonth("2026-10-08")).toBe(2);
    expect(occurrenceInMonth("2026-10-29")).toBe(5);
  });
});

describe("rotationOption", () => {
  // October 2026 Thursdays: 1, 8, 15, 22, 29
  it("gives 3 Adventures and 1 Guys' night in the first four Thursdays", () => {
    const options = ["2026-10-01", "2026-10-08", "2026-10-15", "2026-10-22"].map((d) => rotationOption("thursday", d));
    expect(options.filter((o) => o === "adventure")).toHaveLength(3);
    expect(options.filter((o) => o === "guys-night")).toHaveLength(1);
  });

  it("defaults a fifth Thursday to Adventure", () => {
    expect(rotationOption("thursday", "2026-10-29")).toBe("adventure");
  });

  // October 2026 Saturdays: 3, 10, 17, 24, 31
  it("cycles Saturdays through 2 Family days, 1 Gianna and 1 Wyatt adventure", () => {
    const options = ["2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24"].map((d) => rotationOption("saturday", d));
    expect(options.filter((o) => o === "family")).toHaveLength(2);
    expect(options).toContain("gianna-adventure");
    expect(options).toContain("wyatt-adventure");
  });

  it("defaults a fifth Saturday to Family day", () => {
    expect(rotationOption("saturday", "2026-10-31")).toBe("family");
  });

  it("gives 1–2 Home project Sundays a month", () => {
    const sundays = ["2026-11-01", "2026-11-08", "2026-11-15", "2026-11-22", "2026-11-29"];
    const home = sundays.map((d) => rotationOption("sunday", d)).filter((o) => o === "home-projects");
    expect(home.length).toBeGreaterThanOrEqual(1);
    expect(home.length).toBeLessThanOrEqual(2);
  });

  it("returns null on the wrong weekday", () => {
    expect(rotationOption("thursday", "2026-10-05")).toBeNull();
  });

  it("respects an override (e.g. a swap made in the debrief)", () => {
    expect(rotationOption("thursday", "2026-10-01", "guys-night")).toBe("guys-night");
  });
});
