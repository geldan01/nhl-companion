import { scaleLinear } from "d3-scale";

// SVG-feet half rink: 100ft long axis (attacking direction) × 85ft wide.
// `normalizeShot` from the data layer outputs (x,y) ∈ [0,1]² in attacking
// coordinates — these scales project them to feet for SVG positioning.
export const RINK_LENGTH_FT = 100;
export const RINK_WIDTH_FT = 85;
// In our simplified half-rink model, the attacking goal sits at the right
// edge of the SVG (matches `normalizeShot`'s "x = 1 means at the attacking
// goal" convention). Real NHL geometry has the goal line ~11ft from the end
// boards; the rink art also fudges that to keep math and visuals aligned.
// Acceptable for a v1 shot map.
export const GOAL_X_FT = RINK_LENGTH_FT;
export const GOAL_Y_FT = RINK_WIDTH_FT / 2;

export const xScale = scaleLinear().domain([0, 1]).range([0, RINK_LENGTH_FT]);
export const yScale = scaleLinear().domain([0, 1]).range([0, RINK_WIDTH_FT]);

export function distanceFromGoal(x_ft: number, y_ft: number): number {
  // Euclidean distance in feet.
  return Math.hypot(GOAL_X_FT - x_ft, GOAL_Y_FT - y_ft);
}

export type ShotKind = "goal" | "shot-on-goal" | "missed-shot" | "blocked-shot";

const SHOT_TYPES: Record<string, ShotKind> = {
  goal: "goal",
  "shot-on-goal": "shot-on-goal",
  "missed-shot": "missed-shot",
  "blocked-shot": "blocked-shot",
};

export function isShotKind(typeDescKey: string): boolean {
  return typeDescKey in SHOT_TYPES;
}

export function shotKindOf(typeDescKey: string): ShotKind | null {
  return SHOT_TYPES[typeDescKey] ?? null;
}
