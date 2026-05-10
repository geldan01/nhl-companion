import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/game/2025030221",
}));

import { GameDetail } from "@/app/game/[id]/game-detail";

const FIXTURE_GAME_ID = 2025030221;

function setMatchMedia(matches: boolean) {
  // jsdom doesn't ship matchMedia. Use a plain function (not vi.fn) so
  // vi.restoreAllMocks in afterEach doesn't reset the implementation back
  // to a no-op that returns undefined.
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

describe("Game detail", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
    mockReplace.mockReset();
    mockPush.mockReset();
    setMatchMedia(false); // mobile by default; tests can override
    // The mobile tabs use the URL hash; clear any leftover (`#box`, `#shots`)
    // from a previous test so each test starts on the Plays tab.
    if (window.location.hash) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the score header with both teams from the fixture", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      // Fixture: PHI 0, CAR 3. The header is a linescore now (per-period
      // goals + total), so assert the total cells specifically rather than a
      // bare text match — the PHI row has zeros in every column.
      const header = screen.getByRole("banner", { name: /game header/i });
      expect(within(header).getByTestId("team-total-PHI")).toHaveTextContent("0");
      expect(within(header).getByTestId("team-total-CAR")).toHaveTextContent("3");
    });
  });

  it("on mobile, renders only the active tab content (Plays by default)", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /plays/i })).toBeInTheDocument();
    });
    // Plays tab is selected by default; Box content (skater tables) shouldn't render.
    expect(screen.queryByText(/skaters \/ goalies/i)).not.toBeInTheDocument();
  });

  it("on mobile, switching to the Box tab reveals the boxscore content", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /box/i })).toBeInTheDocument();
    });
    screen.getByRole("tab", { name: /box/i }).click();
    await waitFor(() => {
      // Two collapsible team sections appear in the Box tab.
      const sections = screen.getAllByText(/skaters \/ goalies/i);
      expect(sections.length).toBe(2);
    });
  });

  it("on desktop, renders all three panes simultaneously", async () => {
    setMatchMedia(true); // override: desktop
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      // Box pane (Team stats label) AND rink pane (the rink backdrop SVG)
      // are both present at the same time.
      expect(screen.getByText(/team stats/i)).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /rink backdrop/i })).toBeInTheDocument();
    });
  });

  it("clicking the X button calls clearWatching and routes to /", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /stop watching this game/i }),
      ).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /stop watching this game/i }).click();
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("plays list shows committedBy + drawnBy names on a penalty row", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      // The penalty row text uses "drew" between the two players (see plays-pane).
      expect(screen.getAllByText(/drew Mark Jankowski/).length).toBeGreaterThan(0);
    });
  });

  it("plays list shows hitter and hittee on a hit row", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(
        screen.getAllByText(/Hit by Garnet Hathaway on/).length,
      ).toBeGreaterThan(0);
    });
  });

  it("plays list shows the faceoff winner by name", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    // Mark Jankowski wins multiple faceoffs in this fixture, so use getAllByText.
    await waitFor(() => {
      expect(
        screen.getAllByText(/Faceoff won by Mark Jankowski/).length,
      ).toBeGreaterThan(0);
    });
  });

  it("on desktop, clicking a penalty row swaps boxscore for player pane with both players", async () => {
    setMatchMedia(true);
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(screen.getByText(/team stats/i)).toBeInTheDocument();
    });

    // Click the first penalty row.
    const penaltyRow = screen.getByText(/drew Mark Jankowski/).closest("li");
    expect(penaltyRow).not.toBeNull();
    fireEvent.click(penaltyRow!);

    await waitFor(() => {
      // Boxscore is gone …
      expect(screen.queryByText(/team stats/i)).not.toBeInTheDocument();
      // … replaced by the player pane with both role labels.
      expect(screen.getByText(/penalty on/i)).toBeInTheDocument();
      expect(screen.getByText(/drawn by/i)).toBeInTheDocument();
      // The Close button is rendered by PlayerPane.
      expect(
        screen.getByRole("button", { name: /close player details/i }),
      ).toBeInTheDocument();
    });
  });

  it("on desktop, clicking the same row again clears the selection and restores the boxscore", async () => {
    setMatchMedia(true);
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(screen.getByText(/team stats/i)).toBeInTheDocument();
    });

    const row = screen.getByText(/Hit by Garnet Hathaway on Mark Jankowski/).closest("li");
    fireEvent.click(row!);
    await waitFor(() => {
      expect(screen.queryByText(/team stats/i)).not.toBeInTheDocument();
    });
    fireEvent.click(row!);
    await waitFor(() => {
      expect(screen.getByText(/team stats/i)).toBeInTheDocument();
    });
  });

  it("renders the empty state when the game id has no fixture (404 from setup-fetch)", async () => {
    renderWithProviders(<GameDetail id={9999999999} />);
    await waitFor(() => {
      expect(screen.getByText(/game not found/i)).toBeInTheDocument();
    });
    // Score header shouldn't render when the page is showing the empty state.
    expect(screen.queryByRole("banner", { name: /game header/i })).not.toBeInTheDocument();
  });
});
