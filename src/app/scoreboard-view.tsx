"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DataState } from "@/components/data-state";
import { GameCard } from "@/components/game-card";
import { Skeleton } from "@/components/skeleton";
import type { ScheduleGame } from "@/lib/nhl/schedule";
import { useSchedule } from "@/lib/nhl/schedule";
import { parseScoreboardDate, todayUtcDate } from "@/lib/url";

const STATE_GROUPS = [
  { id: "live", label: "Live", states: ["LIVE", "CRIT"] },
  { id: "upcoming", label: "Upcoming", states: ["PRE", "FUT"] },
  { id: "final", label: "Final", states: ["FINAL", "OFF"] },
] as const;

export function ScoreboardView() {
  const router = useRouter();
  const params = useSearchParams();
  const today = todayUtcDate();
  const requested = parseScoreboardDate(params.get("date"));
  const date = requested ?? today;
  const isToday = date === today;

  // useSchedule(date) covers both today and historical dates with one hook —
  // avoids the double-fetch that `useScheduleNow + useSchedule` would cause
  // (rules of hooks force both to be called even though only one is "active").
  // The minor caching tradeoff vs. /v1/schedule/now is acceptable for a
  // personal app; revisit if it ever feels slow.
  const query = useSchedule(date);
  const day = query.data?.gameWeek.find((d) => d.date === date);
  const games = day?.games ?? [];

  const setDate = (next: string | null) => {
    const sp = new URLSearchParams(params);
    if (next === null || next === today) sp.delete("date");
    else sp.set("date", next);
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : "/");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <DateControl date={date} isToday={isToday} onChange={setDate} />
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(query.data)}
        skeleton={
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton variant="card" count={6} />
          </div>
        }
      >
        {games.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-(--text-muted)">
            No games scheduled for {date}.
          </p>
        ) : (
          <Groups games={games} />
        )}
      </DataState>
    </div>
  );
}

function DateControl({
  date,
  isToday,
  onChange,
}: {
  date: string;
  isToday: boolean;
  onChange: (next: string | null) => void;
}) {
  return (
    <div className="mb-6 flex items-center gap-2">
      <button
        type="button"
        aria-label="Previous day"
        onClick={() => onChange(shiftDate(date, -1))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-sm hover:bg-(--surface-hover)"
      >
        ‹
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="rounded-md border border-(--border) bg-(--surface) px-3 py-1.5 text-sm tabular-nums"
        aria-label="Game date"
      />
      <button
        type="button"
        aria-label="Next day"
        onClick={() => onChange(shiftDate(date, 1))}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border) text-sm hover:bg-(--surface-hover)"
      >
        ›
      </button>
      {!isToday ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-auto rounded-full border border-(--border) px-3 py-1 text-xs hover:bg-(--surface-hover)"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}

function Groups({ games }: { games: ScheduleGame[] }) {
  return (
    <div className="flex flex-col gap-8">
      {STATE_GROUPS.map((group) => {
        const inGroup = games
          .filter((g) => (group.states as readonly string[]).includes(g.gameState))
          .sort((a, b) => a.startTimeUTC.localeCompare(b.startTimeUTC));
        if (inGroup.length === 0) return null;
        return (
          <section key={group.id}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {inGroup.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function shiftDate(date: string, days: number): string {
  // Parse at noon UTC to avoid timezone-edge midnight rounding.
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
