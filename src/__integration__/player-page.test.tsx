import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/player/8478402",
}));

import { PlayerPage } from "@/app/player/[id]/player-page";

const FIXTURE_PLAYER_ID = 8478402;

describe("Player page", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the player name and current team chip", async () => {
    renderWithProviders(<PlayerPage id={FIXTURE_PLAYER_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /connor mcdavid/i })).toBeInTheDocument();
    });
    const teamLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("/team/"));
    expect(teamLinks.length).toBeGreaterThan(0);
  });

  it("renders the NHL regular-season stats table", async () => {
    renderWithProviders(<PlayerPage id={FIXTURE_PLAYER_ID} />);
    await waitFor(() => {
      expect(screen.getByText(/NHL — Regular season/i)).toBeInTheDocument();
    });
    // Career row appended at the bottom — the word "Career" appears both
    // in the season cell and the team cell, so just assert presence.
    expect(screen.getAllByText(/^career$/i).length).toBeGreaterThan(0);
  });

  it("renders the empty state when the player id has no fixture", async () => {
    renderWithProviders(<PlayerPage id={9999999999} />);
    await waitFor(() => {
      expect(screen.getByText(/player not found/i)).toBeInTheDocument();
    });
  });
});
