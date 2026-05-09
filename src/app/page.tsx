"use client";

import { DataState } from "@/components/data-state";
import { GameCard } from "@/components/game-card";
import { Skeleton } from "@/components/skeleton";
import type { ScheduleGame } from "@/lib/nhl/schedule";
import { useScheduleNow } from "@/lib/nhl/scheduleNow";

const STATE_GROUPS = [
  { id: "live", label: "Live", states: ["LIVE", "CRIT"] },
  { id: "upcoming", label: "Upcoming", states: ["PRE", "FUT"] },
  { id: "final", label: "Final", states: ["FINAL", "OFF"] },
] as const;

export default function HomePage() {
  const query = useScheduleNow();
  const today = query.data?.gameWeek[0];
  const games = today?.games ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <DataState
        isLoading={query.isLoading}
        error={query.error ?? null}
        hasData={Boolean(today)}
        skeleton={<ScoreboardSkeleton />}
      >
        {games.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-(--text-muted)">
            No games scheduled today.
          </p>
        ) : (
          <Groups games={games} />
        )}
      </DataState>
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

function ScoreboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Skeleton variant="card" count={6} />
    </div>
  );
}
