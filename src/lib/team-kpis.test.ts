import { describe, expect, it } from "vitest";
import type { TeamScheduleGame } from "@/lib/nhl/teamSchedule";
import type { TeamSkater } from "@/lib/nhl/team";
import { isCompleted, resultFor, splitFor, topScorers, trendGames } from "./team-kpis";

// Minimal game factory — only the fields the KPI math reads.
function game(over: {
  id: number;
  date: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  state?: string;
  type?: number;
  lastPeriodType?: string;
}): TeamScheduleGame {
  return {
    id: over.id,
    season: 20252026,
    gameType: over.type ?? 2,
    gameDate: over.date,
    startTimeUTC: `${over.date}T23:00:00Z`,
    gameState: over.state ?? "OFF",
    gameScheduleState: "OK",
    venue: { default: "Arena" },
    awayTeam: { id: 1, abbrev: over.away, commonName: { default: over.away }, placeName: { default: over.away }, logo: "", score: over.awayScore },
    homeTeam: { id: 2, abbrev: over.home, commonName: { default: over.home }, placeName: { default: over.home }, logo: "", score: over.homeScore },
    gameOutcome: over.lastPeriodType ? { lastPeriodType: over.lastPeriodType } : undefined,
  } as TeamScheduleGame;
}

describe("isCompleted", () => {
  it("accepts final regular-season games with both scores", () => {
    expect(isCompleted(game({ id: 1, date: "2026-01-01", home: "EDM", away: "CGY", homeScore: 3, awayScore: 2 }))).toBe(true);
  });

  it("rejects preseason, scheduled, and score-less games", () => {
    expect(isCompleted(game({ id: 2, date: "2026-01-01", home: "EDM", away: "CGY", homeScore: 3, awayScore: 2, type: 1 }))).toBe(false);
    expect(isCompleted(game({ id: 3, date: "2026-01-01", home: "EDM", away: "CGY", state: "FUT" }))).toBe(false);
    expect(isCompleted(game({ id: 4, date: "2026-01-01", home: "EDM", away: "CGY", homeScore: 3 }))).toBe(false);
  });
});

describe("resultFor", () => {
  it("scores a regulation win from the team's perspective (home and away)", () => {
    const g = game({ id: 1, date: "2026-01-01", home: "EDM", away: "CGY", homeScore: 4, awayScore: 1 });
    expect(resultFor("EDM", g)).toEqual({ gf: 4, ga: 1, outcome: "W" });
    expect(resultFor("CGY", g)).toEqual({ gf: 1, ga: 4, outcome: "L" });
  });

  it("classifies an overtime/shootout loss as OTL, not L", () => {
    const ot = game({ id: 2, date: "2026-01-02", home: "EDM", away: "CGY", homeScore: 2, awayScore: 3, lastPeriodType: "OT" });
    expect(resultFor("EDM", ot)?.outcome).toBe("OTL");
    const so = game({ id: 3, date: "2026-01-03", home: "EDM", away: "CGY", homeScore: 2, awayScore: 3, lastPeriodType: "SO" });
    expect(resultFor("EDM", so)?.outcome).toBe("OTL");
    // The OT/SO winner still records a plain W.
    expect(resultFor("CGY", ot)?.outcome).toBe("W");
  });
});

describe("trendGames", () => {
  const games = [
    game({ id: 1, date: "2026-01-03", home: "EDM", away: "CGY", homeScore: 5, awayScore: 1 }),
    game({ id: 2, date: "2026-01-01", home: "VAN", away: "EDM", homeScore: 2, awayScore: 4 }),
    game({ id: 3, date: "2026-01-05", home: "EDM", away: "SEA", state: "FUT" }), // not completed
  ];

  it("returns completed games oldest→newest, limited, from the team's view", () => {
    const trend = trendGames("EDM", games, 10);
    expect(trend.map((t) => t.id)).toEqual([2, 1]);
    expect(trend[0]).toMatchObject({ opp: "VAN", isHome: false, gf: 4, ga: 2, outcome: "W" });
    expect(trend[1]).toMatchObject({ opp: "CGY", isHome: true, gf: 5, ga: 1, outcome: "W" });
  });

  it("keeps only the most recent N", () => {
    expect(trendGames("EDM", games, 1).map((t) => t.id)).toEqual([1]);
  });
});

describe("splitFor", () => {
  const games = [
    game({ id: 1, date: "2026-01-01", home: "EDM", away: "CGY", homeScore: 3, awayScore: 2 }), // home W
    game({ id: 2, date: "2026-01-02", home: "EDM", away: "VAN", homeScore: 1, awayScore: 4 }), // home L
    game({ id: 3, date: "2026-01-03", home: "SEA", away: "EDM", homeScore: 2, awayScore: 1, lastPeriodType: "OT" }), // away OTL
    game({ id: 4, date: "2026-01-04", home: "LAK", away: "EDM", homeScore: 0, awayScore: 5 }), // away W
  ];

  it("aggregates home games only", () => {
    expect(splitFor("EDM", games, true)).toEqual({ gp: 2, wins: 1, losses: 1, otLosses: 0, gf: 4, ga: 6 });
  });

  it("aggregates away games only, counting OTL separately", () => {
    expect(splitFor("EDM", games, false)).toEqual({ gp: 2, wins: 1, losses: 0, otLosses: 1, gf: 6, ga: 2 });
  });
});

describe("topScorers", () => {
  const skater = (id: number, points: number, goals: number): TeamSkater =>
    ({
      playerId: id,
      headshot: "",
      firstName: { default: `P${id}` },
      lastName: { default: "Last" },
      positionCode: "C",
      points,
      goals,
      assists: points - goals,
    }) as TeamSkater;

  it("sorts by points descending and caps at the limit", () => {
    const rows = topScorers([skater(1, 50, 20), skater(2, 80, 40), skater(3, 65, 30)], 2);
    expect(rows.map((r) => r.id)).toEqual([2, 3]);
    expect(rows[0]).toMatchObject({ goals: 40, assists: 40, points: 80 });
  });
});
