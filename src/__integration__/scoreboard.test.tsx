import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

let mockSearch = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => mockSearch,
  usePathname: () => "/scoreboard",
}));

// Pin "today" to a date that exists in the schedule fixture. Mocking
// todayUtcDate is cleaner than vi.useFakeTimers, which would also stall
// React Query's internal timers and break waitFor.
vi.mock("@/lib/url", async () => {
  const actual = await vi.importActual<typeof import("@/lib/url")>("@/lib/url");
  return { ...actual, todayUtcDate: () => "2026-05-09" };
});

import ScoreboardPage from "@/app/scoreboard/page";

describe("Scoreboard", () => {
  let teardown: () => void;

  let replaceState: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    teardown = installFetchMock();
    mockSearch = new URLSearchParams();
    replaceState = vi.spyOn(window.history, "replaceState");
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the loading skeleton then game cards from the fixture", async () => {
    renderWithProviders(<ScoreboardPage />);

    // Skeleton appears immediately (before fetch resolves).
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

    // After fetch resolves, real game cards appear with team abbreviations.
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /[A-Z]{3}/ }).length).toBeGreaterThan(0);
    });
  });

  it("links each game card to /game/[id]", async () => {
    renderWithProviders(<ScoreboardPage />);
    await waitFor(() => {
      const gameLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.startsWith("/game/"));
      expect(gameLinks.length).toBeGreaterThan(0);
    });
  });

  it("clicking the next-day chevron updates the URL to ?date= one day later", async () => {
    renderWithProviders(<ScoreboardPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /next day/i })).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /next day/i }).click();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/?date=2026-05-10");
  });

  it("with ?date=YYYY-MM-DD shows that date's games and a Today link", async () => {
    mockSearch = new URLSearchParams("date=2026-05-11");
    renderWithProviders(<ScoreboardPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
    });
  });

  it("clicking the Today link drops the date param", async () => {
    mockSearch = new URLSearchParams("date=2026-05-12");
    renderWithProviders(<ScoreboardPage />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /today/i }).click();
    expect(replaceState).toHaveBeenCalledWith(null, "", "/");
  });
});
