import { describe, it, expect } from "vitest";
import { buildTrend, toSvgPoints } from "../trend";

const item = (score: number, day: number) => ({
  score,
  createdAt: `2026-11-${String(day).padStart(2, "0")}T10:00:00Z`,
});

describe("buildTrend", () => {
  it("returns an empty summary for no history", () => {
    const t = buildTrend([]);
    expect(t.points).toHaveLength(0);
    expect(t.change).toBeNull();
  });

  it("orders points oldest first even when given newest first", () => {
    const t = buildTrend([item(80, 3), item(60, 2), item(40, 1)]);
    expect(t.points.map((p) => p.score)).toEqual([40, 60, 80]);
  });

  it("computes average, best, worst and change", () => {
    const t = buildTrend([item(90, 3), item(60, 2), item(30, 1)]);
    expect(t.average).toBe(60);
    expect(t.best).toBe(90);
    expect(t.worst).toBe(30);
    expect(t.change).toBe(60);
  });

  it("reports a negative change when quality drops", () => {
    expect(buildTrend([item(50, 2), item(70, 1)]).change).toBe(-20);
  });

  it("has no change for a single review", () => {
    expect(buildTrend([item(55, 1)]).change).toBeNull();
  });

  it("drops invalid scores and clamps out-of-range ones", () => {
    const t = buildTrend([item(NaN, 1), item(150, 2), item(-5, 3)]);
    expect(t.points.map((p) => p.score)).toEqual([100, 0]);
  });
});

describe("toSvgPoints", () => {
  it("puts 100 at the top and 0 at the bottom", () => {
    const pts = toSvgPoints(
      [
        { index: 0, score: 100, createdAt: "" },
        { index: 1, score: 0, createdAt: "" },
      ],
      300,
      100,
      10
    );
    expect(pts[0].y).toBe(10);
    expect(pts[1].y).toBe(90);
    expect(pts[0].x).toBe(10);
    expect(pts[1].x).toBe(290);
  });

  it("centres a single point", () => {
    const pts = toSvgPoints([{ index: 0, score: 50, createdAt: "" }], 300, 100);
    expect(pts[0].x).toBe(150);
  });
});