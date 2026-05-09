export { NhlQueryProvider } from './client';
export { type NhlApiError, isNhlApiError } from './errors';
export { useVisibility, usePollingInterval } from './visibility';
export { HOSTS } from './hosts';
export { TTL, STALE, POLL, isLiveGameState, isTodayUtc } from './cache';
export { nhlFetch, type NhlFetchOpts } from './fetcher';

// Endpoint modules — server fetchers (escape hatch for Server Components / scripts).
// UI should prefer the per-module hooks (`useSchedule`, etc.) imported directly
// from each module's index.ts.
export { fetchSchedule } from './schedule/fetcher';
export { fetchGame } from './game/fetcher';
export { fetchPlayByPlay } from './playByPlay/fetcher';
export { fetchBoxscore } from './boxscore/fetcher';
export { normalizeShot, type NormalizedShot } from './playByPlay/normalizeShot';
