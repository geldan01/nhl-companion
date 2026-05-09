import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { TeamResponse } from './schema';

export async function fetchTeam(code: string): Promise<TeamResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/club-stats/${code.toUpperCase()}/now`,
    schema: TeamResponse,
    revalidate: TTL.team,
  });
}
