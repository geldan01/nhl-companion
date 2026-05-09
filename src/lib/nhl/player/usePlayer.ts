'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { PlayerResponse } from './schema';

async function fetchPlayerClient(id: string | number): Promise<PlayerResponse> {
  const response = await fetch(`/api/nhl/player/${id}`);
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

export function usePlayer(id: string | number) {
  return useQuery<PlayerResponse, NhlApiError>({
    queryKey: ['nhl', 'player', String(id)],
    queryFn: () => fetchPlayerClient(id),
    staleTime: STALE.player,
    refetchInterval: usePollingInterval(POLL.player),
  });
}
