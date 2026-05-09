'use client';

import { useQuery, type Query } from '@tanstack/react-query';
import { isLiveGameState, type GameStateInput } from '../cache';
import { useVisibility } from '../visibility';
import type { NhlApiError } from '../errors';
import type { GameResponse } from './schema';

const POLL_LIVE_MS = 5_000;

export function gamePollMs(state: GameStateInput, visible: boolean): number | false {
  if (!visible) return false;
  return isLiveGameState(state) ? POLL_LIVE_MS : false;
}

async function fetchGameClient(id: string | number): Promise<GameResponse> {
  const response = await fetch(`/api/nhl/game/${id}`);
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

export function useGame(id: string | number) {
  const visible = useVisibility();
  return useQuery<GameResponse, NhlApiError>({
    queryKey: ['nhl', 'game', String(id)],
    queryFn: () => fetchGameClient(id),
    refetchInterval: (query: Query<GameResponse, NhlApiError>) =>
      gamePollMs(query.state.data?.gameState, visible),
  });
}
