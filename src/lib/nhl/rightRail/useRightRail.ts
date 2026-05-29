'use client';

import { useQuery } from '@tanstack/react-query';
import { isLiveGameState, type GameStateInput } from '../cache';
import { useVisibility } from '../visibility';
import type { NhlApiError } from '../errors';
import type { RightRailResponse } from './schema';

const POLL_LIVE_MS = 15_000;

// Series wins only change when a game goes final, so a slower cadence than the
// scoreboard is fine; we still poll while live so the banner flips to "wins
// series" the moment the clinching game ends.
export function rightRailPollMs(state: GameStateInput, visible: boolean): number | false {
  if (!visible) return false;
  return isLiveGameState(state) ? POLL_LIVE_MS : false;
}

async function fetchRightRailClient(id: string | number): Promise<RightRailResponse> {
  const response = await fetch(`/api/nhl/game/${id}/right-rail`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw (
      body?.error ??
      ({
        kind: 'http',
        status: response.status,
        url: response.url,
        message: `Request failed with ${response.status}`,
      } satisfies NhlApiError)
    );
  }
  return response.json();
}

export function useRightRail(id: string | number, gameState?: GameStateInput) {
  const visible = useVisibility();
  return useQuery<RightRailResponse, NhlApiError>({
    queryKey: ['nhl', 'right-rail', String(id)],
    queryFn: () => fetchRightRailClient(id),
    // gameState is passed in (from the game query), so the poll cadence can be
    // computed directly; a visibility change re-renders and recomputes it.
    refetchInterval: rightRailPollMs(gameState, visible),
  });
}
