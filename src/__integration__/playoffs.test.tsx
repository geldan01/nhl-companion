import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

// next/link reaches for the navigation hooks during render; stub them so the
// bracket's series links mount without a real router.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/playoffs",
}));

import { PlayoffsView } from "@/app/playoffs/playoffs-view";

describe("Playoffs", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the bracket grouped by round from the fixture", async () => {
    renderWithProviders(<PlayoffsView />);

    await waitFor(() => {
      expect(screen.getByText("First Round")).toBeInTheDocument();
    });
    expect(screen.getByText("Second Round")).toBeInTheDocument();
    expect(screen.getByText("Conference Finals")).toBeInTheDocument();
    expect(screen.getByText("Stanley Cup Final")).toBeInTheDocument();
  });

  it("shows a series result derived from the seed wins", async () => {
    renderWithProviders(<PlayoffsView />);

    // Series C in the fixture: CAR 4, OTT 0 → decided.
    await waitFor(() => {
      expect(screen.getAllByText(/CAR wins 4–0/).length).toBeGreaterThan(0);
    });
  });

  it("renders a TBD placeholder for an undecided matchup", async () => {
    renderWithProviders(<PlayoffsView />);

    // The Stanley Cup Final's bottom seed is still TBD in the fixture.
    await waitFor(() => {
      expect(screen.getByText("TBD")).toBeInTheDocument();
    });
  });
});
