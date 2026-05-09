import { act, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WatchingProvider, useWatching, type WatchingSnapshot } from "./provider";

const snapshot: WatchingSnapshot = {
  gameId: 2025020001,
  away: "TOR",
  home: "BOS",
  awayScore: 2,
  homeScore: 1,
  state: "LIVE",
};

describe("useWatching", () => {
  it("starts at null", () => {
    const { result } = renderHook(() => useWatching(), {
      wrapper: WatchingProvider,
    });
    expect(result.current.watching).toBeNull();
  });

  it("setWatching stores the snapshot", () => {
    const { result } = renderHook(() => useWatching(), {
      wrapper: WatchingProvider,
    });
    act(() => result.current.setWatching(snapshot));
    expect(result.current.watching).toEqual(snapshot);
  });

  it("clearWatching resets to null", () => {
    const { result } = renderHook(() => useWatching(), {
      wrapper: WatchingProvider,
    });
    act(() => result.current.setWatching(snapshot));
    act(() => result.current.clearWatching());
    expect(result.current.watching).toBeNull();
  });

  it("multiple consumers stay in sync", () => {
    function Consumer({ id }: { id: string }) {
      const { watching } = useWatching();
      return <span data-testid={id}>{watching ? watching.away : "none"}</span>;
    }
    function Setter() {
      const { setWatching } = useWatching();
      return (
        <button type="button" onClick={() => setWatching(snapshot)}>
          set
        </button>
      );
    }

    render(
      <WatchingProvider>
        <Consumer id="a" />
        <Consumer id="b" />
        <Setter />
      </WatchingProvider>,
    );

    expect(screen.getByTestId("a")).toHaveTextContent("none");
    expect(screen.getByTestId("b")).toHaveTextContent("none");
    act(() => screen.getByText("set").click());
    expect(screen.getByTestId("a")).toHaveTextContent("TOR");
    expect(screen.getByTestId("b")).toHaveTextContent("TOR");
  });

  it("throws when used outside the provider", () => {
    // Suppress React's expected error log for this assertion.
    const orig = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useWatching())).toThrowError(
        /WatchingProvider/,
      );
    } finally {
      console.error = orig;
    }
  });
});
