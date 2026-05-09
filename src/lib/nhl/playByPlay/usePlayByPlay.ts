'use client';

import { useQuery, type Query } from '@tanstack/react-query';
import { isLiveGameState, type GameStateInput } from '../cache';
import { useVisibility } from '../visibility';
import type { NhlApiError } from '../errors';
import type { PlayByPlayResponse } from './schema';

const POLL_LIVE_MS = 5_000;

export function playByPlayPollMs(state: GameStateInput, visible: boolean): number | false {
  if (!visible) return false;
  return isLiveGameState(state) ? POLL_LIVE_MS : false;
}

async function fetchPlayByPlayClient(id: string | number): Promise<PlayByPlayResponse> {
  const response = await fetch(`/api/nhl/game/${id}/play-by-play`);
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

export function usePlayByPlay(id: string | number) {
  const visible = useVisibility();
  return useQuery<PlayByPlayResponse, NhlApiError>({
    queryKey: ['nhl', 'playByPlay', String(id)],
    queryFn: () => fetchPlayByPlayClient(id),
    refetchInterval: (query: Query<PlayByPlayResponse, NhlApiError>) =>
      playByPlayPollMs(query.state.data?.gameState, visible),
  });
}
