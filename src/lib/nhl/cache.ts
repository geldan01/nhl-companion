// All TTL values are in seconds (Next.js `next.revalidate` unit).
// All STALE/POLL values are in milliseconds (React Query unit).
// `false` for TTL means `cache: 'no-store'`. `false` for POLL means polling disabled.

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export type GameStateInput = string | undefined | null;

export function isLiveGameState(state: GameStateInput): boolean {
  return state === 'LIVE' || state === 'CRIT';
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isTodayUtc(date: string): boolean {
  return date === todayUtc();
}

export const TTL = {
  schedule: (date: string): number => (isTodayUtc(date) ? 60 : 60 * 60),
  scheduleNow: 60,
  game: (state: GameStateInput): number | false => (isLiveGameState(state) ? false : 60 * 60),
  playByPlay: (state: GameStateInput): number | false => (isLiveGameState(state) ? false : 60 * 60),
  boxscore: (state: GameStateInput): number | false => (isLiveGameState(state) ? false : 60 * 60),
  rightRail: (state: GameStateInput): number | false => (isLiveGameState(state) ? false : 60 * 60),
  standings: 5 * 60,
  playoffBracket: 5 * 60,
  team: 60 * 60,
  roster: 60 * 60,
  teamSchedule: 60 * 60,
  player: 24 * 60 * 60,
  stats: 5 * 60,
};

export const STALE = {
  schedule: (date: string): number => (isTodayUtc(date) ? 30 * SECOND : HOUR),
  scheduleNow: 30 * SECOND,
  game: (state: GameStateInput): number => (isLiveGameState(state) ? 0 : 5 * MINUTE),
  playByPlay: (state: GameStateInput): number => (isLiveGameState(state) ? 0 : 5 * MINUTE),
  boxscore: (state: GameStateInput): number => (isLiveGameState(state) ? 0 : 5 * MINUTE),
  rightRail: (state: GameStateInput): number => (isLiveGameState(state) ? 0 : 5 * MINUTE),
  standings: MINUTE,
  playoffBracket: MINUTE,
  team: 30 * MINUTE,
  roster: 30 * MINUTE,
  teamSchedule: 30 * MINUTE,
  player: HOUR,
  stats: MINUTE,
};

export const POLL = {
  schedule: (date: string): number | false => (isTodayUtc(date) ? 60 * SECOND : false),
  scheduleNow: 60 * SECOND,
  game: (state: GameStateInput): number | false => (isLiveGameState(state) ? 5 * SECOND : false),
  playByPlay: (state: GameStateInput): number | false => (isLiveGameState(state) ? 5 * SECOND : false),
  boxscore: (state: GameStateInput): number | false => (isLiveGameState(state) ? 10 * SECOND : false),
  standings: false as const,
  playoffBracket: false as const,
  team: false as const,
  roster: false as const,
  teamSchedule: false as const,
  player: false as const,
  stats: false as const,
};
