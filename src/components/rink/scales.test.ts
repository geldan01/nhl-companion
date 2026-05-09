import { describe, expect, it } from "vitest";
import {
  GOAL_X_FT,
  GOAL_Y_FT,
  RINK_LENGTH_FT,
  RINK_WIDTH_FT,
  distanceFromGoal,
  isShotKind,
  shotKindOf,
  xScale,
  yScale,
} from "./scales";

describe("scales", () => {
  it("xScale maps 0 → 0 and 1 → 100", () => {
    expect(xScale(0)).toBe(0);
    expect(xScale(1)).toBe(RINK_LENGTH_FT);
  });

  it("yScale maps 0 → 0 and 1 → 85", () => {
    expect(yScale(0)).toBe(0);
    expect(yScale(1)).toBe(RINK_WIDTH_FT);
  });

  it("xScale + yScale at the center map (0.5, 0.5) → (50, 42.5)", () => {
    expect(xScale(0.5)).toBe(50);
    expect(yScale(0.5)).toBe(42.5);
  });
});

describe("distanceFromGoal", () => {
  it("is 0 at the goal point", () => {
    expect(distanceFromGoal(GOAL_X_FT, GOAL_Y_FT)).toBe(0);
  });

  it("is positive away from the goal", () => {
    expect(distanceFromGoal(0, 0)).toBeGreaterThan(0);
    expect(distanceFromGoal(50, 42.5)).toBeGreaterThan(0);
  });

  it("matches a hand-computed Pythagorean distance", () => {
    // 3-4-5 triangle from the goal.
    expect(distanceFromGoal(GOAL_X_FT - 3, GOAL_Y_FT - 4)).toBeCloseTo(5);
  });
});

describe("isShotKind / shotKindOf", () => {
  it("recognizes the four shot kinds", () => {
    for (const k of ["goal", "shot-on-goal", "missed-shot", "blocked-shot"]) {
      expect(isShotKind(k), k).toBe(true);
      expect(shotKindOf(k), k).toBe(k);
    }
  });

  it("rejects non-shot kinds", () => {
    for (const k of ["faceoff", "hit", "penalty", "stoppage", "period-start", "takeaway"]) {
      expect(isShotKind(k), k).toBe(false);
      expect(shotKindOf(k), k).toBeNull();
    }
  });
});
