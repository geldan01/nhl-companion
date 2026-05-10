import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL } from '../cache';
import { TeamScheduleResponse } from './schema';

// `/now` 307-redirects to the current season (20252026 today). Node's fetch
// follows redirects by default; same pattern as the other /now endpoints.
export async function fetchTeamSchedule(code: string): Promise<TeamScheduleResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/club-schedule-season/${code.toUpperCase()}/now`,
    schema: TeamScheduleResponse,
    revalidate: TTL.teamSchedule,
  });
}
