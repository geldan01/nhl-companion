// When NHL_FIXTURES_MODE=1, nhlFetch short-circuits the upstream call and
// returns a recorded fixture instead. Used by Playwright e2e to keep CI
// hermetic and offline. Maps upstream NHL URLs to fixtures by pattern.
//
// This file is only imported by `nhlFetch` and only when the env var is set,
// so the fixture JSON is tree-shaken out of production bundles.

import boxscore from "./boxscore/__fixtures__/boxscore.json";
import game from "./game/__fixtures__/game.json";
import playByPlay from "./playByPlay/__fixtures__/playByPlay.json";
import player from "./player/__fixtures__/player.json";
import roster from "./roster/__fixtures__/roster.json";
import schedule from "./schedule/__fixtures__/schedule.json";
import scheduleNow from "./scheduleNow/__fixtures__/scheduleNow.json";
import standings from "./standings/__fixtures__/standings.json";
import goalie from "./stats/__fixtures__/goalie.json";
import skater from "./stats/__fixtures__/skater.json";
import teamStats from "./stats/__fixtures__/team.json";
import team from "./team/__fixtures__/team.json";
import teamSchedule from "./teamSchedule/__fixtures__/teamSchedule.json";

type Match = (u: URL) => boolean;
type Entry = { match: Match; data: unknown };

const ENTRIES: Entry[] = [
  { match: (u) => u.pathname === "/v1/schedule/now", data: scheduleNow },
  {
    match: (u) => /^\/v1\/schedule\/\d{4}-\d{2}-\d{2}$/.test(u.pathname),
    data: schedule,
  },
  { match: (u) => u.pathname === "/v1/standings/now", data: standings },
  {
    match: (u) =>
      /^\/v1\/gamecenter\/\d+\/play-by-play$/.test(u.pathname),
    data: playByPlay,
  },
  {
    match: (u) => /^\/v1\/gamecenter\/\d+\/boxscore$/.test(u.pathname),
    data: boxscore,
  },
  {
    match: (u) => /^\/v1\/gamecenter\/\d+\/landing$/.test(u.pathname),
    data: game,
  },
  {
    match: (u) => /^\/v1\/club-stats\/[A-Z]+\/now$/.test(u.pathname),
    data: team,
  },
  {
    match: (u) => /^\/v1\/roster\/[A-Z]+\/current$/.test(u.pathname),
    data: roster,
  },
  {
    match: (u) => /^\/v1\/club-schedule-season\/[A-Z]+\/now$/.test(u.pathname),
    data: teamSchedule,
  },
  {
    match: (u) => /^\/v1\/player\/\d+\/landing$/.test(u.pathname),
    data: player,
  },
  {
    match: (u) => /^\/stats\/rest\/en\/skater\//.test(u.pathname),
    data: skater,
  },
  {
    match: (u) => /^\/stats\/rest\/en\/goalie\//.test(u.pathname),
    data: goalie,
  },
  {
    match: (u) => /^\/stats\/rest\/en\/team\//.test(u.pathname),
    data: teamStats,
  },
];

export function isFixturesMode(): boolean {
  return process.env.NHL_FIXTURES_MODE === "1";
}

export function tryFixtureFor(url: string): unknown | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const entry = ENTRIES.find((e) => e.match(parsed));
  return entry ? entry.data : null;
}
