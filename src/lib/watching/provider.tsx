"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { KnownGameState } from "@/components/game-state-pill";

export type WatchingSnapshot = {
  gameId: number;
  away: string;
  home: string;
  awayScore: number;
  homeScore: number;
  state: KnownGameState | string;
};

export type WatchingContextValue = {
  watching: WatchingSnapshot | null;
  setWatching: (snapshot: WatchingSnapshot) => void;
  clearWatching: () => void;
};

const WatchingContext = createContext<WatchingContextValue | null>(null);

export function WatchingProvider({ children }: { children: ReactNode }) {
  const [watching, setWatchingState] = useState<WatchingSnapshot | null>(null);

  const setWatching = useCallback((snapshot: WatchingSnapshot) => {
    setWatchingState(snapshot);
  }, []);

  const clearWatching = useCallback(() => {
    setWatchingState(null);
  }, []);

  const value = useMemo(
    () => ({ watching, setWatching, clearWatching }),
    [watching, setWatching, clearWatching],
  );

  return (
    <WatchingContext.Provider value={value}>{children}</WatchingContext.Provider>
  );
}

export function useWatching(): WatchingContextValue {
  const value = useContext(WatchingContext);
  if (value === null) {
    throw new Error("useWatching must be used inside <WatchingProvider>");
  }
  return value;
}
