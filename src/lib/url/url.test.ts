import { describe, expect, it } from "vitest";
import {
  DEFAULT_STATS_KIND,
  formatScoreboardDate,
  formatStatsKind,
  parseScoreboardDate,
  parseStatsKind,
  todayUtcDate,
} from "./index";

describe("parseStatsKind", () => {
  it("returns the kind verbatim when valid", () => {
    expect(parseStatsKind("skater")).toBe("skater");
    expect(parseStatsKind("goalie")).toBe("goalie");
    expect(parseStatsKind("team")).toBe("team");
  });

  it("falls back to the default when null, empty, or unknown", () => {
    expect(parseStatsKind(null)).toBe(DEFAULT_STATS_KIND);
    expect(parseStatsKind("")).toBe(DEFAULT_STATS_KIND);
    expect(parseStatsKind("BOGUS")).toBe(DEFAULT_STATS_KIND);
  });
});

describe("formatStatsKind", () => {
  it("returns null for the default kind", () => {
    expect(formatStatsKind(DEFAULT_STATS_KIND)).toBeNull();
  });

  it("returns the kind for non-default kinds", () => {
    expect(formatStatsKind("goalie")).toBe("goalie");
    expect(formatStatsKind("team")).toBe("team");
  });
});

describe("parseScoreboardDate", () => {
  it("returns the date when well-formed", () => {
    expect(parseScoreboardDate("2026-05-09")).toBe("2026-05-09");
  });

  it("returns null for missing/empty/malformed values", () => {
    expect(parseScoreboardDate(null)).toBeNull();
    expect(parseScoreboardDate("")).toBeNull();
    expect(parseScoreboardDate("2026-5-9")).toBeNull();
    expect(parseScoreboardDate("yesterday")).toBeNull();
    expect(parseScoreboardDate("2026/05/09")).toBeNull();
  });
});

describe("formatScoreboardDate", () => {
  it("returns the date when well-formed", () => {
    expect(formatScoreboardDate("2026-05-09")).toBe("2026-05-09");
  });

  it("returns null for invalid values", () => {
    expect(formatScoreboardDate(null)).toBeNull();
    expect(formatScoreboardDate("nope")).toBeNull();
  });
});

describe("todayUtcDate", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayUtcDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
