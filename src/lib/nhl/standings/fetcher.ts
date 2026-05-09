import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { StandingsResponse } from './schema';

export async function fetchStandings(): Promise<StandingsResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/standings/now`,
    schema: StandingsResponse,
    revalidate: TTL.standings,
  });
}
