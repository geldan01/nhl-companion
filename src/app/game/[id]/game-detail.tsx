"use client";

import { useEffect, useState } from "react";
import { DataState } from "@/components/data-state";
import { BoxPane } from "@/components/game/box-pane";
import { BreakdownsPane } from "@/components/game/breakdowns-pane";
import { GameBody } from "@/components/game/game-body";
import { PlayerPane } from "@/components/game/player-pane";
import { PlaysPane } from "@/components/game/plays-pane";
import { PreGamePane } from "@/components/game/pre-game-pane";
import { ScoreHeader } from "@/components/game/score-header";
import { RinkPane } from "@/components/rink/RinkPane";
import { Skeleton } from "@/components/skeleton";
import { useGame } from "@/lib/nhl/game";
import { useWatching } from "@/lib/watching";

export function GameDetail({ id }: { id: number }) {
  // useGame is the canonical "is this game even valid" query — a 404 here
  // means the empty state for the whole page. usePlayByPlay/useBoxscore are
  // wired by the panes themselves so they can render skeletons independently
  // (added in 2.6 / 2.7).
  const game = useGame(id);
  const { setWatching } = useWatching();
  const data = game.data;

  // Seed the Now-watching pill from the URL: on a deep link or refresh, this
  // runs once `useGame` lands. The `dataReady` boolean flips false→true once
  // and never flips back, so the effect runs on (a) URL id change and (b)
  // initial data arrival — not on every poll. Live score updates are the
  // pill's own job via its own useGame subscription (2.10).
  const dataReady = data !== undefined;
  useEffect(() => {
    if (!data) return;
    setWatching({
      gameId: data.id,
      away: data.awayTeam.abbrev,
      home: data.homeTeam.abbrev,
      awayScore: data.awayTeam.score ?? 0,
      homeScore: data.homeTeam.score ?? 0,
      state: data.gameState,
    });
    // dataReady is in deps so the effect fires once on data arrival; `data`
    // itself is intentionally NOT a dep (would re-fire on every poll).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, dataReady, setWatching]);

  // Lifted state for the bidirectional shot ↔ play link. RinkPane sets it
  // when a dot is clicked; PlaysPane scrolls to and highlights the matching
  // row; the right pane swaps from BoxPane to PlayerPane. Selection persists
  // until the user picks another play or clicks the same row/dot again to
  // toggle off (handled inside PlaysPane and RinkPane).
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

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
          <ScoreHeader
            game={game.data}
            updatedAt={game.dataUpdatedAt}
            isFetching={game.isFetching}
          />
          {game.data.gameState === "FUT" || game.data.gameState === "PRE" ? (
            <PreGamePane game={game.data} />
          ) : (
            <GameBody
              plays={
                <PlaysPane
                  id={id}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                />
              }
              box={<BoxPane id={id} />}
              breakdowns={
                selectedEventId !== null ? (
                  <PlayerPane
                    id={id}
                    eventId={selectedEventId}
                    onClose={() => setSelectedEventId(null)}
                  />
                ) : (
                  <BreakdownsPane id={id} />
                )
              }
              rink={
                <RinkPane
                  id={id}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                />
              }
            />
          )}
        </>
      ) : null}
    </DataState>
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
