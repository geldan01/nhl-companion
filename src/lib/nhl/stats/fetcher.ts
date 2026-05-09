import type { z } from 'zod';
import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { SkaterStatsResponse, type SkaterStatsResponse as SkaterResp } from './schema.skater';
import { GoalieStatsResponse, type GoalieStatsResponse as GoalieResp } from './schema.goalie';
import { TeamStatsResponse, type TeamStatsResponse as TeamResp } from './schema.team';

export const STATS_KINDS = ['skater', 'goalie', 'team'] as const;
export type StatsKind = (typeof STATS_KINDS)[number];

export type StatsParams = {
  seasonId?: number;          // e.g. 20252026
  gameTypeId?: number;        // 2 = regular, 3 = playoffs
  limit?: number;             // default 25
  sort?: string;              // e.g. 'points', 'wins'
};

export function currentSeasonId(now: Date = new Date()): number {
  // NHL season runs Oct → June. After July starts the next season's id;
  // before, it's the prior year's season.
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const start = month >= 7 ? year : year - 1;
  return start * 10000 + (start + 1);
}

function buildUrl(kind: StatsKind, params: StatsParams): string {
  const url = new URL(`${HOSTS.stats}/stats/rest/en/${kind}/summary`);

  const seasonId = params.seasonId ?? currentSeasonId();
  const gameTypeId = params.gameTypeId ?? 2;
  url.searchParams.set('cayenneExp', `seasonId=${seasonId} and gameTypeId=${gameTypeId}`);
  url.searchParams.set('limit', String(params.limit ?? 25));
  if (params.sort) url.searchParams.set('sort', params.sort);

  return url.toString();
}

const SCHEMAS = {
  skater: SkaterStatsResponse,
  goalie: GoalieStatsResponse,
  team: TeamStatsResponse,
} as const satisfies Record<StatsKind, z.ZodType<unknown>>;

export type StatsResponseFor<K extends StatsKind> = K extends 'skater'
  ? SkaterResp
  : K extends 'goalie'
    ? GoalieResp
    : TeamResp;

export async function fetchStats<K extends StatsKind>(
  kind: K,
  params: StatsParams = {},
): Promise<StatsResponseFor<K>> {
  return nhlFetch({
    url: buildUrl(kind, params),
    schema: SCHEMAS[kind] as unknown as z.ZodType<StatsResponseFor<K>>,
    revalidate: TTL.stats,
  });
}
