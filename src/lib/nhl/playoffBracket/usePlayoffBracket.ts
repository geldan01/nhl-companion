'use client';

import { useQuery } from '@tanstack/react-query';
import { POLL, STALE } from '../cache';
import { usePollingInterval } from '../visibility';
import type { NhlApiError } from '../errors';
import type { PlayoffBracketResponse } from './schema';
import { currentPlayoffYear } from './season';

async function fetchPlayoffBracketClient(year: number): Promise<PlayoffBracketResponse> {
  const response = await fetch(`/api/nhl/playoff-bracket/${year}`);
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

export function usePlayoffBracket(year: number = currentPlayoffYear()) {
  return useQuery<PlayoffBracketResponse, NhlApiError>({
    queryKey: ['nhl', 'playoff-bracket', year],
    queryFn: () => fetchPlayoffBracketClient(year),
    staleTime: STALE.playoffBracket,
    refetchInterval: usePollingInterval(POLL.playoffBracket),
  });
}
