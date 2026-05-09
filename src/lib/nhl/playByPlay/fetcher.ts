import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL, type GameStateInput } from '../cache';
import { PlayByPlayResponse } from './schema';

export async function fetchPlayByPlay(
  id: string | number,
  state?: GameStateInput,
): Promise<PlayByPlayResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/gamecenter/${id}/play-by-play`,
    schema: PlayByPlayResponse,
    revalidate: TTL.playByPlay(state ?? 'LIVE'),
  });
}
