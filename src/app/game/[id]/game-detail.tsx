"use client";

import { DataState } from "@/components/data-state";
import { GameBody } from "@/components/game/game-body";
import { PlaysPane } from "@/components/game/plays-pane";
import { ScoreHeader } from "@/components/game/score-header";
import { Skeleton } from "@/components/skeleton";
import { useGame } from "@/lib/nhl/game";

export function GameDetail({ id }: { id: number }) {
  // useGame is the canonical "is this game even valid" query — a 404 here
  // means the empty state for the whole page. usePlayByPlay/useBoxscore are
  // wired by the panes themselves so they can render skeletons independently
  // (added in 2.6 / 2.7).
  const game = useGame(id);

  return (
    <DataState
      isLoading={game.isLoading}
      error={game.error ?? null}
      hasData={Boolean(game.data)}
      skeleton={<GameDetailSkeleton />}
      emptyState={
        <div className="px-4 py-12 text-center text-sm text-(--text-muted)">
          Game not found.
        </div>
      }
    >
      {game.data ? (
        <>
          <ScoreHeader game={game.data} />
          <GameBody
            plays={<PlaysPane id={id} />}
            box={<PanePlaceholder>Box pane lands in 2.7.</PanePlaceholder>}
            rink={<PanePlaceholder>Shot map lands in Phase 4.</PanePlaceholder>}
          />
        </>
      ) : null}
    </DataState>
  );
}

function PanePlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 text-sm text-(--text-muted)">{children}</div>
  );
}

function GameDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <Skeleton variant="card" />
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
        <Skeleton variant="rink" />
        <Skeleton variant="row" count={6} />
        <Skeleton variant="row" count={6} />
      </div>
    </div>
  );
}
