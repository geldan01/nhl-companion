"use client";

import { useSyncExternalStore } from "react";

// SSR-safe matchMedia hook. Returns false during SSR/hydration so the server
// HTML matches the client's first render; the actual value updates on the
// next tick (no hydration warning), and the layout self-corrects then.
export function useMatchMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia(query).matches),
    () => false,
  );
}
