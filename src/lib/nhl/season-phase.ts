'use client';

import { useScheduleNow, type ScheduleNowResponse } from './scheduleNow';

// Where the league is in its calendar, used to pick the homepage's hero module.
//  - 'playoffs'  → at least one postseason game in the current week (gameType 3)
//  - 'regular'   → games scheduled, but none are postseason (preseason/regular)
//  - 'offseason' → no games at all in the week (summer)
export type SeasonPhase = 'playoffs' | 'regular' | 'offseason';

// NHL gameType: 1 = preseason, 2 = regular season, 3 = playoffs.
const PLAYOFF_GAME_TYPE = 3;

// Pure so it can be unit-tested without React. Returns null while data is absent.
export function derivePhase(data: ScheduleNowResponse | undefined): SeasonPhase | null {
  if (!data) return null;
  const games = data.gameWeek.flatMap((day) => day.games);
  if (games.length === 0) return 'offseason';
  if (games.some((game) => game.gameType === PLAYOFF_GAME_TYPE)) return 'playoffs';
  return 'regular';
}

export function useSeasonPhase() {
  const query = useScheduleNow();
  return { phase: derivePhase(query.data), query };
}
