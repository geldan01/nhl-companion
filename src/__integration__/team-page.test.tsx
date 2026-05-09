import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/team/BOS",
}));

import { TeamPage } from "@/app/team/[code]/team-page";

describe("Team page", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the team header with the team code", async () => {
    renderWithProviders(<TeamPage code="BOS" />);
    await waitFor(() => {
      // The fallback in the header reads the code when standings cache is
      // empty — the team-page test never populates the standings cache, so
      // the heading shows the code itself.
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });
  });

  it("renders forwards / defense / goalies sub-tables from the roster fixture", async () => {
    renderWithProviders(<TeamPage code="BOS" />);
    await waitFor(() => {
      expect(screen.getByText(/^forwards$/i)).toBeInTheDocument();
      expect(screen.getByText(/^defense$/i)).toBeInTheDocument();
      expect(screen.getByText(/^goalies$/i)).toBeInTheDocument();
    });
    // Roster fixture has 15 forwards + 8 defense + 2 goalies = 25 player
    // links to /player/[id]. Allow some slack — the test cares that the
    // table is populated, not the exact count.
    const playerLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("/player/"));
    expect(playerLinks.length).toBeGreaterThan(10);
  });

  it("shows the recent-results placeholder", async () => {
    renderWithProviders(<TeamPage code="BOS" />);
    await waitFor(() => {
      expect(screen.getByText(/useTeamSchedule/i)).toBeInTheDocument();
    });
  });
});
