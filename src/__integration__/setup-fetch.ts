import { vi } from "vitest";
import boxscore from "@/lib/nhl/boxscore/__fixtures__/boxscore.json";
import game from "@/lib/nhl/game/__fixtures__/game.json";
import playByPlay from "@/lib/nhl/playByPlay/__fixtures__/playByPlay.json";
import player from "@/lib/nhl/player/__fixtures__/player.json";
import roster from "@/lib/nhl/roster/__fixtures__/roster.json";
import schedule from "@/lib/nhl/schedule/__fixtures__/schedule.json";
import scheduleNow from "@/lib/nhl/scheduleNow/__fixtures__/scheduleNow.json";
import standings from "@/lib/nhl/standings/__fixtures__/standings.json";
import goalie from "@/lib/nhl/stats/__fixtures__/goalie.json";
import skater from "@/lib/nhl/stats/__fixtures__/skater.json";
import teamStats from "@/lib/nhl/stats/__fixtures__/team.json";
import team from "@/lib/nhl/team/__fixtures__/team.json";

type Route = { match: (u: URL) => boolean; data: unknown };

// Pattern-matches /api/nhl/<resource> URLs against the data layer's recorded
// fixtures. Order matters only in that more-specific paths must come before
// catch-alls; everything here is mutually exclusive so order is for taste.
const ROUTES: Route[] = [
  { match: (u) => u.pathname === "/api/nhl/schedule-now", data: scheduleNow },
  {
    match: (u) => /^\/api\/nhl\/schedule\/\d{4}-\d{2}-\d{2}$/.test(u.pathname),
    data: schedule,
  },
  { match: (u) => u.pathname === "/api/nhl/standings", data: standings },
  {
    match: (u) =>
      u.pathname === "/api/nhl/stats" && u.searchParams.get("kind") === "skater",
    data: skater,
  },
  {
    match: (u) =>
      u.pathname === "/api/nhl/stats" && u.searchParams.get("kind") === "goalie",
    data: goalie,
  },
  {
    match: (u) =>
      u.pathname === "/api/nhl/stats" && u.searchParams.get("kind") === "team",
    data: teamStats,
  },
  {
    match: (u) =>
      /^\/api\/nhl\/game\/\d+\/play-by-play$/.test(u.pathname),
    data: playByPlay,
  },
  {
    match: (u) => /^\/api\/nhl\/game\/\d+\/boxscore$/.test(u.pathname),
    data: boxscore,
  },
  { match: (u) => /^\/api\/nhl\/game\/\d+$/.test(u.pathname), data: game },
  {
    match: (u) => /^\/api\/nhl\/team\/[A-Z]+\/roster$/.test(u.pathname),
    data: roster,
  },
  { match: (u) => /^\/api\/nhl\/team\/[A-Z]+$/.test(u.pathname), data: team },
  { match: (u) => /^\/api\/nhl\/player\/\d+$/.test(u.pathname), data: player },
];

export function installFetchMock() {
  const original = global.fetch;
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(href, "http://localhost:3000");
    const route = ROUTES.find((r) => r.match(url));
    if (!route) {
      return new Response(
        JSON.stringify({
          error: { kind: "http", status: 404, url: url.href, message: "Not found" },
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(route.data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof global.fetch;

  return () => {
    global.fetch = original;
  };
}
