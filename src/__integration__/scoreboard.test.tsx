import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

// next/navigation is only used by other routes; the Scoreboard at "/"
// doesn't read URL state in Phase 1, so we don't need a mock here.

describe("Scoreboard", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the loading skeleton then game cards from the fixture", async () => {
    renderWithProviders(<HomePage />);

    // Skeleton appears immediately (before fetch resolves).
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

    // After fetch resolves, real game cards appear with team abbreviations.
    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: /[A-Z]{3}/ }).length).toBeGreaterThan(0);
    });
  });

  it("links each game card to /game/[id]", async () => {
    renderWithProviders(<HomePage />);
    await waitFor(() => {
      const gameLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.startsWith("/game/"));
      expect(gameLinks.length).toBeGreaterThan(0);
    });
  });
});
