import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { RosterResponse } from './schema';

export async function fetchRoster(code: string): Promise<RosterResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/roster/${code.toUpperCase()}/current`,
    schema: RosterResponse,
    revalidate: TTL.roster,
  });
}
