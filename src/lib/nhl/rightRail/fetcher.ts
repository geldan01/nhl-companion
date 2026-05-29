import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL, type GameStateInput } from '../cache';
import { RightRailResponse } from './schema';

export async function fetchRightRail(
  id: string | number,
  state?: GameStateInput,
): Promise<RightRailResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/gamecenter/${id}/right-rail`,
    schema: RightRailResponse,
    revalidate: TTL.rightRail(state ?? 'LIVE'),
  });
}
