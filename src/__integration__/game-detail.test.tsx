import { screen, waitFor, within } from "@testing-library/react";
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
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the score header with both teams from the fixture", async () => {
    renderWithProviders(<GameDetail id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      // Fixture: PHI 0, CAR 3.
      const header = screen.getByRole("banner", { name: /game header/i });
      expect(within(header).getByText("0")).toBeInTheDocument();
      expect(within(header).getByText("3")).toBeInTheDocument();
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

  it("renders the empty state when the game id has no fixture (404 from setup-fetch)", async () => {
    renderWithProviders(<GameDetail id={9999999999} />);
    await waitFor(() => {
      expect(screen.getByText(/game not found/i)).toBeInTheDocument();
    });
    // Score header shouldn't render when the page is showing the empty state.
    expect(screen.queryByRole("banner", { name: /game header/i })).not.toBeInTheDocument();
  });
});
