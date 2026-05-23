"use client";

import { useSyncExternalStore } from "react";
import { useMatchMedia } from "@/lib/use-match-media";

const TABS = ["plays", "box", "shots", "breakdowns"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  plays: "Plays",
  box: "Box",
  shots: "Shots",
  breakdowns: "Breakdowns",
};

export type GameBodyProps = {
  plays: React.ReactNode;
  box: React.ReactNode;
  rink: React.ReactNode;
  breakdowns: React.ReactNode;
};

// Body layout for /game/[id]: tabs on mobile, 3-pane grid on desktop.
// The lg breakpoint matches the AppShell's pivot. On desktop the right column
// shows Breakdowns (Box becomes mobile-only via the "Box" tab).
export function GameBody({ plays, box, rink, breakdowns }: GameBodyProps) {
  const isDesktop = useMatchMedia("(min-width: 1024px)");

  if (isDesktop) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="grid h-[calc(100vh-12rem)] grid-cols-[1.2fr_1fr_1fr] gap-4">
          <Pane>{rink}</Pane>
          <Pane>{plays}</Pane>
          <Pane>{breakdowns}</Pane>
        </div>
      </div>
    );
  }

  return <Tabs plays={plays} box={box} rink={rink} breakdowns={breakdowns} />;
}

function Pane({ children }: { children: React.ReactNode }) {
  return (
    <section className="overflow-y-auto rounded-lg border border-(--border) bg-(--surface)">
      {children}
    </section>
  );
}

function Tabs({ plays, box, rink, breakdowns }: GameBodyProps) {
  const [tab, setTab] = useHashTab();

  const content =
    tab === "plays"
      ? plays
      : tab === "box"
        ? box
        : tab === "breakdowns"
          ? breakdowns
          : rink;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div
        role="tablist"
        className="sticky top-[calc(theme(spacing.12)+5.5rem)] z-10 flex border-b border-(--border) bg-(--bg)"
      >
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-2 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-(--accent) font-semibold text-(--text)"
                : "border-b-2 border-transparent text-(--text-muted)"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>
      <div className="px-4 py-4" role="tabpanel">
        {content}
      </div>
    </div>
  );
}

function isTab(value: string): value is Tab {
  return (TABS as readonly string[]).includes(value);
}

function readHashTab(): Tab {
  if (typeof window === "undefined") return "plays";
  const raw = window.location.hash.slice(1);
  return isTab(raw) ? raw : "plays";
}

function useHashTab(): [Tab, (next: Tab) => void] {
  // Subscribe to window's hashchange so the tab state mirrors the URL even
  // across history navigation (back/forward). useSyncExternalStore is the
  // React-blessed pattern for "external mutable state in the browser".
  const tab = useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("hashchange", cb);
      return () => window.removeEventListener("hashchange", cb);
    },
    readHashTab,
    () => "plays" as Tab,
  );

  const setTab = (next: Tab) => {
    if (typeof window === "undefined") return;
    const base = window.location.pathname + window.location.search;
    const url = next === "plays" ? base : base + "#" + next;
    history.replaceState(null, "", url);
    // replaceState doesn't fire hashchange; nudge the subscribers manually so
    // useSyncExternalStore re-reads the snapshot.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return [tab, setTab];
}
