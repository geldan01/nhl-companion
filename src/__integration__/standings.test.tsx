import { screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

// Mock next/navigation with controllable params and a router.replace spy.
const mockReplace = vi.fn();
let mockSearch = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
  useSearchParams: () => mockSearch,
  usePathname: () => "/standings",
}));

// Import AFTER the mock is in place so the module resolves to the stub.
import { StandingsView } from "@/app/standings/standings-view";

describe("Standings", () => {
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

  it("defaults to division view (4 division cards)", async () => {
    renderWithProviders(<StandingsView />);
    await waitFor(() => {
      expect(screen.getByText("Atlantic")).toBeInTheDocument();
      expect(screen.getByText("Metropolitan")).toBeInTheDocument();
      expect(screen.getByText("Central")).toBeInTheDocument();
      expect(screen.getByText("Pacific")).toBeInTheDocument();
    });
  });

  it("renders the conference cards (2) when ?view=wildcard", async () => {
    mockSearch = new URLSearchParams("view=wildcard");
    renderWithProviders(<StandingsView />);
    await waitFor(() => {
      expect(screen.getByText("Eastern")).toBeInTheDocument();
      expect(screen.getByText("Western")).toBeInTheDocument();
    });
    expect(screen.queryByText("Atlantic")).not.toBeInTheDocument();
  });

  it("clicking the Wild Card tab calls router.replace with ?view=wildcard", async () => {
    renderWithProviders(<StandingsView />);
    await waitFor(() => {
      expect(screen.getByText("Atlantic")).toBeInTheDocument();
    });
    screen.getByRole("button", { name: /wild card/i }).click();
    expect(mockReplace).toHaveBeenCalledWith("/standings?view=wildcard");
  });

  it("each team row links to /team/[code]", async () => {
    renderWithProviders(<StandingsView />);
    await waitFor(() => {
      const teamLinks = screen
        .getAllByRole("link")
        .filter((a) => a.getAttribute("href")?.startsWith("/team/"));
      expect(teamLinks.length).toBeGreaterThan(0);
    });
  });
});
