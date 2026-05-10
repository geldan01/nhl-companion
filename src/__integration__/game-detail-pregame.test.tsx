import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import gameFixture from "@/lib/nhl/game/__fixtures__/game.json";
import scheduleFixture from "@/lib/nhl/schedule/__fixtures__/schedule.json";
import standingsFixture from "@/lib/nhl/standings/__fixtures__/standings.json";
import teamScheduleFixture from "@/lib/nhl/teamSchedule/__fixtures__/teamSchedule.json";
import { renderWithProviders } from "./render";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/game/2025030221",
}));

import { GameDetail } from "@/app/game/[id]/game-detail";

const FIXTURE_GAME_ID = 2025030221;

// Builds a FUT variant of the recorded game fixture by stripping live/final
// fields (scores, sog, summary, clock state) and overriding gameState.
function buildFutGame() {
  const g = JSON.parse(JSON.stringify(gameFixture));
  g.gameState = "FUT";
  g.gameScheduleState = "OK";
  delete g.awayTeam.score;
  delete g.awayTeam.sog;
  delete g.homeTeam.score;
  delete g.homeTeam.sog;
  delete g.summary;
  g.clock = {
    timeRemaining: "20:00",
    secondsRemaining: 1200,
    running: false,
    inIntermission: false,
  };
  g.periodDescriptor = { maxRegulationPeriods: 3 };
  return g;
}

function installFutFetchMock() {
  const original = global.fetch;
  const futGame = buildFutGame();
  global.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const href =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const url = new URL(href, "http://localhost:3000");
    const pathname = url.pathname;
    let data: unknown;
    if (pathname === `/api/nhl/game/${FIXTURE_GAME_ID}`) data = futGame;
    else if (pathname === "/api/nhl/standings") data = standingsFixture;
    else if (/^\/api\/nhl\/team\/[A-Z]+\/schedule$/.test(pathname))
      data = teamScheduleFixture;
    else if (/^\/api\/nhl\/schedule\/\d{4}-\d{2}-\d{2}$/.test(pathname))
      data = scheduleFixture;
    else {
      return new Response(
        JSON.stringify({
          error: {
            kind: "http",
            status: 404,
            url: url.href,
            message: "Not found",
          },
        }),
        { status: 404, headers: { "content-type": "application/json" } },
      );
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof global.fetch;
  return () => {
    global.fetch = original;
  };
}

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("Game detail — pre-game (FUT)", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFutFetchMock();
    mockReplace.mockReset();
    mockPush.mockReset();
    setMatchMedia(true); // desktop
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the pre-game pane (matchup + venue + season series) and skips the live body", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);

    // Pre-game sections appear.
    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /matchup/i }),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole("region", { name: /game info/i })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /season series/i }),
    ).toBeInTheDocument();
    // Venue from the fixture.
    expect(screen.getByText(/Lenovo Center/i)).toBeInTheDocument();

    // Live body indicators are absent: no Rink backdrop, no Team stats label.
    expect(
      screen.queryByRole("img", { name: /rink backdrop/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/team stats/i)).not.toBeInTheDocument();
  });

  it("score header still mounts with em-dashes for the unplayed scores", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(
        screen.getByRole("banner", { name: /game header/i }),
      ).toBeInTheDocument();
    });
    // No numeric totals yet — both team totals render the placeholder.
    expect(screen.getByTestId("team-total-PHI")).toHaveTextContent("—");
    expect(screen.getByTestId("team-total-CAR")).toHaveTextContent("—");
  });
});
