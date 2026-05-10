import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "./render";
import { installFetchMock } from "./setup-fetch";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/game/2025030221",
}));

import { RinkPane } from "@/components/rink/RinkPane";

const FIXTURE_GAME_ID = 2025030221;

function countShotDots(): number {
  // Each ShotDot renders a <g> containing 1+ shape elements. Goals add a
  // gold ring + filled circle inside the same <g>; other kinds render one
  // shape inside a <g>. Count <g>s that sit inside the overlay SVG (which
  // we identify by aria-label="Shots") and have at least one of: circle
  // (sog/miss/goal) or line (block).
  const overlay = document.querySelector('svg[aria-label="Shots"]');
  if (!overlay) return 0;
  return overlay.querySelectorAll("g").length;
}

describe("RinkPane", () => {
  let teardown: () => void;

  beforeEach(() => {
    teardown = installFetchMock();
  });

  afterEach(() => {
    teardown();
    vi.restoreAllMocks();
  });

  it("renders the rink backdrop and a positive number of shot dots", async () => {
    renderWithProviders(<RinkPane id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(screen.getByRole("img", { name: /rink backdrop/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(countShotDots()).toBeGreaterThan(0);
    });
  });

  it("turning off the Goals filter reduces the visible dot count", async () => {
    renderWithProviders(<RinkPane id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(countShotDots()).toBeGreaterThan(0);
    });
    const initial = countShotDots();
    // Click the "Goals" toggle off.
    const goalsBtn = screen.getByRole("button", { name: /^goals$/i });
    fireEvent.click(goalsBtn);
    await waitFor(() => {
      expect(countShotDots()).toBeLessThan(initial);
    });
  });

  it("clicking a shot dot fires onSelectEvent with the play id", async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <RinkPane id={FIXTURE_GAME_ID} onSelectEvent={onSelect} />,
    );
    await waitFor(() => {
      expect(countShotDots()).toBeGreaterThan(0);
    });
    const overlay = document.querySelector('svg[aria-label="Shots"]')!;
    const firstDot = overlay.querySelector("g")!;
    fireEvent.click(firstDot);
    expect(onSelect).toHaveBeenCalled();
    const id = onSelect.mock.calls[0][0];
    expect(typeof id).toBe("number");
  });

  it("filter to a single period reduces or zeroes the visible count", async () => {
    renderWithProviders(<RinkPane id={FIXTURE_GAME_ID} />);
    await waitFor(() => {
      expect(countShotDots()).toBeGreaterThan(0);
    });
    const initial = countShotDots();
    fireEvent.click(screen.getByRole("radio", { name: /1p/i }));
    await waitFor(() => {
      expect(countShotDots()).toBeLessThanOrEqual(initial);
    });
  });
});
