import { nhlFetch } from '../fetcher';
import { HOSTS } from '../hosts';
import { TTL, type GameStateInput } from '../cache';
import { GameResponse } from './schema';

export async function fetchGame(
  id: string | number,
  state?: GameStateInput,
): Promise<GameResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/gamecenter/${id}/landing`,
    schema: GameResponse,
    revalidate: TTL.game(state ?? 'LIVE'),
  });
}
