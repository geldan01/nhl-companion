import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

const mockReplace = vi.fn();
let mockSearch = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearch,
  usePathname: () => "/stats",
}));

import { StatsView } from "@/app/stats/stats-view";

describe("Stats", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
    mockReplace.mockReset();
    mockSearch = new URLSearchParams();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("defaults to the skater table", async () => {
    renderWithProviders(<StatsView />);
    await waitFor(() => {
      // Skater table has a "G" header column for goals; goalie has "GP"+"W" but no plain "G".
      expect(screen.getByRole("columnheader", { name: /^G$/ })).toBeInTheDocument();
    });
  });

  it("switches to the goalie table when ?kind=goalie", async () => {
    mockSearch = new URLSearchParams("kind=goalie");
    renderWithProviders(<StatsView />);
    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: /sv%/i })).toBeInTheDocument();
    });
  });

  it("switches to the team table when ?kind=team and links each row to /team/[code]", async () => {
    mockSearch = new URLSearchParams("kind=team");
    renderWithProviders(<StatsView />);
    await waitFor(() => {
      expect(screen.getByRole("columnheader", { name: /pts/i })).toBeInTheDocument();
    });
    // Team rows are linked via teamCodeForName since 3.4.
    const teamLinks = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("/team/"));
    expect(teamLinks.length).toBeGreaterThan(0);
  });

  it("clicking the Goalies tab calls router.replace with ?kind=goalie", async () => {
    renderWithProviders(<StatsView />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /goalies/i })).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /goalies/i }).click();
    expect(mockReplace).toHaveBeenCalledWith("/stats?kind=goalie");
  });

  it("clicking the Skaters tab from a goalie URL drops the kind param", async () => {
    mockSearch = new URLSearchParams("kind=goalie");
    renderWithProviders(<StatsView />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /skaters/i })).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /skaters/i }).click();
    expect(mockReplace).toHaveBeenCalledWith("/stats");
  });
});
