'use client';

import { useQuery, type Query } from '@tanstack/react-query';
import { isLiveGameState, type GameStateInput } from '../cache';
import { useVisibility } from '../visibility';
import type { NhlApiError } from '../errors';
import type { BoxscoreResponse } from './schema';

const POLL_LIVE_MS = 10_000;

export function boxscorePollMs(state: GameStateInput, visible: boolean): number | false {
  if (!visible) return false;
  return isLiveGameState(state) ? POLL_LIVE_MS : false;
}

async function fetchBoxscoreClient(id: string | number): Promise<BoxscoreResponse> {
  const response = await fetch(`/api/nhl/game/${id}/boxscore`);
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

export function useBoxscore(id: string | number) {
  const visible = useVisibility();
  return useQuery<BoxscoreResponse, NhlApiError>({
    queryKey: ['nhl', 'boxscore', String(id)],
    queryFn: () => fetchBoxscoreClient(id),
    refetchInterval: (query: Query<BoxscoreResponse, NhlApiError>) =>
      boxscorePollMs(query.state.data?.gameState, visible),
  });
}
