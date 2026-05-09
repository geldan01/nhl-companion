# NHL Data Layer — Design

**Status:** Approved 2026-05-09
**Scope:** Foundational data layer covering the full set of NHL endpoints the companion app will need. UI features for live game view, schedule, shot maps, etc. are out of scope and consume this layer.

## Goals

1. A single, typed, validated path from NHL APIs to React components.
2. Live-game data refreshes automatically while a game is in progress; quiet for finished/scheduled games.
3. Schema drift surfaces as a clear error, not a confusing UI bug.
4. Adding a new NHL endpoint is a small, repeatable diff — one folder, five files.
5. UI components never see URLs, polling intervals, query keys, or response shapes outside the inferred type.

## Non-goals

- UI for any feature (visualizations, layouts, navigation) — separate specs.
- Mutations / writes — the NHL APIs are read-only and so is this layer. User-side state (favorites, preferences) is local UI state, not in this layer.
- SSR prefetching with `dehydrate`. Live data is stale the moment it's serialized; static-ish endpoints can add prefetch per-page later when a page needs it.
- Authentication. NHL endpoints used here are public.
- Background jobs / cron / cached snapshots in a database. The two-cache stack (Next fetch cache + React Query) is sufficient.

## Architecture

### Data flow

```
NHL upstream (api-web.nhle.com / api.nhle.com)
      │  server-side fetch with per-endpoint TTL
      ▼
Route Handler (src/app/api/nhl/<resource>/route.ts)
      │  Zod parse → typed JSON
      ▼
React Query hook (src/lib/nhl/<resource>/use<Thing>.ts)
      │  refetchInterval, staleTime per hook
      ▼
React component
```

Two caches sit in this chain:

- **Server cache** — Next's built-in `fetch` cache, configured per endpoint via `next: { revalidate }` or `cache: 'no-store'`. Shared across all clients hitting our app, dampens load on the NHL host.
- **Client cache** — React Query in the browser. Drives polling cadence and hands components stable data between refetches.

### Folder layout

```
src/
  app/
    api/nhl/
      schedule/[date]/route.ts
      schedule-now/route.ts
      game/[id]/route.ts
      game/[id]/play-by-play/route.ts
      game/[id]/boxscore/route.ts
      team/[code]/route.ts
      team/[code]/roster/route.ts
      player/[id]/route.ts
      standings/route.ts
      stats/route.ts
  lib/
    nhl/
      client.ts                 // QueryClient + <NhlQueryProvider>
      fetcher.ts                // server-side nhlFetch wrapper
      cache.ts                  // TTL / staleTime / poll constants
      errors.ts                 // NhlApiError tagged union
      hosts.ts                  // HOSTS = { web, stats }
      visibility.ts             // useVisibility / usePollingInterval
      schedule/
        schema.ts
        fetcher.ts
        route.ts
        useSchedule.ts
        index.ts
      scheduleNow/
      game/
      playByPlay/
      boxscore/
      team/
      roster/
      player/
      standings/
      stats/
```

The `app/api/nhl/<resource>/route.ts` files are one-liners — they re-export a handler factory built in `lib/nhl/<resource>/route.ts`. URL routing stays in `app/` (Next's convention); logic and types live with the rest of the module.

## Module pattern

Every endpoint folder under `src/lib/nhl/<resource>/` contains the same five files. The `stats` module is the only documented exception (see Endpoint inventory).

### `schema.ts`

Zod schema(s) for the response. Schemas use `.passthrough()` so unexpected fields don't break us, but every field we *use* is required. The exported TS type is `z.infer<typeof Schema>`.

```ts
export const ScheduleResponse = z.object({
  gameWeek: z.array(GameWeekDay),
  games: z.array(GameSummary),
}).passthrough();
export type ScheduleResponse = z.infer<typeof ScheduleResponse>;
```

### `fetcher.ts`

Server-side function: input parameters → typed response. Calls `nhlFetch` with the schema and TTL. Throws a typed `NhlApiError` on any failure. Reusable from Route Handlers, Server Components, or one-off scripts. No knowledge of HTTP responses or `NextResponse`.

```ts
export async function fetchSchedule(date: string): Promise<ScheduleResponse> {
  return nhlFetch({
    url: `${HOSTS.web}/v1/schedule/${date}`,
    schema: ScheduleResponse,
    revalidate: TTL.schedule,
  });
}
```

### `route.ts`

Route Handler factory. Calls the fetcher, returns `NextResponse.json`, maps `NhlApiError` to the right HTTP status (see Errors). The actual `app/api/nhl/<resource>/route.ts` is one line:

```ts
export { GET } from '@/lib/nhl/schedule/route';
```

### `use<Thing>.ts`

Typed React Query hook. Owns the query key, polling interval, stale time. Hits *our* Route Handler, not the NHL host. The component-facing API.

```ts
export function useSchedule(date: string) {
  return useQuery({
    queryKey: ['nhl', 'schedule', date],
    queryFn: () => fetch(`/api/nhl/schedule/${date}`).then(r => r.json()) as Promise<ScheduleResponse>,
    refetchInterval: usePollingInterval(POLL.schedule(date)),
    staleTime: STALE.schedule(date),
  });
}
```

### `index.ts`

Public surface: re-exports the hook and the type. UI imports only from here. `schema.ts`, `fetcher.ts`, and `route.ts` are private to the module.

## Server fetch wrapper

`src/lib/nhl/fetcher.ts` is the single chokepoint for outbound NHL traffic. Nothing else fetches NHL directly.

```ts
type NhlFetchOpts<T> = {
  url: string;
  schema: z.ZodType<T>;
  revalidate?: number | false;   // false → cache: 'no-store'
  signal?: AbortSignal;
};

export async function nhlFetch<T>(opts: NhlFetchOpts<T>): Promise<T> { /* … */ }
```

It does five things:

1. Adds standard headers (`Accept: application/json`, a UA we own).
2. Applies the cache directive: `cache: 'no-store'` if `revalidate === false`, else `next: { revalidate }`.
3. Enforces a 5s timeout via `AbortController`.
4. Maps failures to `NhlApiError` (see below).
5. Parses the response body with the supplied Zod schema and returns the typed value.

## Errors

`src/lib/nhl/errors.ts`:

```ts
export type NhlApiError =
  | { kind: 'http';    status: number;        url: string; message: string }
  | { kind: 'network'; cause: unknown;        url: string; message: string }
  | { kind: 'schema';  issues: z.ZodIssue[];  url: string; message: string }
  | { kind: 'timeout';                        url: string; message: string };
```

**Route Handler mapping:**
- `http` → pass through the upstream status (so a 404 stays a 404).
- `schema` → 502 (we got bytes but they're wrong).
- `network` → 504.
- `timeout` → 504.

Response body is always `{ error: { kind, message } }`. No upstream payload leakage on errors.

**Hook surface:** React Query's `error: NhlApiError | null`. UI patterns:
- `network` / `timeout` — transient, RQ keeps polling. Show a small "data delayed" indicator. Stale data stays visible.
- `schema` / `http 5xx` — hard error. Banner; show stale data if available.
- `http 4xx` — game/player/team not found. Empty state for that view.

## Caching & polling

All freshness configuration lives in `src/lib/nhl/cache.ts` so it can be reasoned about on one screen.

| Resource | Server `revalidate` | RQ `staleTime` | RQ `refetchInterval` |
|---|---|---|---|
| `schedule` (today) | 60s | 30s | 60s |
| `schedule` (other dates) | 1h | 1h | off |
| `scheduleNow` | 60s | 30s | 60s |
| `game` (live) | `no-store` | 0 | 5s |
| `game` (final / pre-game) | 1h | 5m | off |
| `playByPlay` (live) | `no-store` | 0 | 5s |
| `playByPlay` (final) | 1h | 5m | off |
| `boxscore` (live) | `no-store` | 0 | 10s |
| `boxscore` (final) | 1h | 5m | off |
| `standings` | 5m | 1m | off |
| `team` | 1h | 30m | off |
| `roster` | 1h | 30m | off |
| `player` | 24h | 1h | off |
| `stats` (any kind) | 5m | 1m | off |

Two refinements baked into the relevant hooks:

- **Live vs. final flip.** `useGame`, `usePlayByPlay`, `useBoxscore` read `gameState` from their response and switch cadence: states `LIVE` and `CRIT` poll; `FINAL`, `OFF`, `FUT`, `PRE` don't. One hook, one query key, cadence flips automatically when the game ends.
- **Today vs. other dates.** `useSchedule` and its server-side counterpart compare the `date` param against today (server time) to pick the row above. The fetcher accepts `date: string`; the hook accepts the same.

## React Query setup

`src/lib/nhl/client.ts` exports `<NhlQueryProvider>`, mounted once in `src/app/layout.tsx`.

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: NhlApiError) => {
        if (error?.kind === 'schema') return false;                  // won't get better
        if (error?.kind === 'http' && error.status < 500) return false; // 4xx is final
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

`@tanstack/react-query-devtools` mounted only when `process.env.NODE_ENV === 'development'`.

**Query keys.** Structured arrays, not strings. `['nhl', <resource>, …params]`. Each hook owns its key construction; UI never builds keys manually. This shape supports broad invalidation (`['nhl', 'game']`) or narrow (`['nhl', 'game', '2025020001']`).

**Visibility-aware polling.** A small helper in `src/lib/nhl/visibility.ts`:

```ts
export function useVisibility(): boolean { /* document.visibilityState === 'visible' */ }
export function usePollingInterval(ms: number | false): number | false {
  const visible = useVisibility();
  return visible ? ms : false;
}
```

Hooks compose it: `refetchInterval: usePollingInterval(POLL.game(state))`. Stops a forgotten background tab from polling forever.

**No SSR prefetching in this layer.** Pages can call the typed `fetch<Resource>` server-side and pass data via a separate per-page `dehydrate` setup later if/when needed; not part of this spec.

**No mutations.** This is a read-only data layer. No `useMutation`, no cache writes from UI. Anything that resembles a write (favoriting a team, etc.) is local UI state, not in this layer.

**Escape hatch.** The typed server fetchers are re-exported from `src/lib/nhl/index.ts` so a Server Component or script can import `fetchGame` directly. Not the recommended path for normal UI use.

## Endpoint inventory

Each row is one module unless noted. Paths show the upstream NHL endpoint we wrap.

| Module | Upstream | Notes |
|---|---|---|
| `schedule` | `api-web /v1/schedule/{date}` | Date in `YYYY-MM-DD`. |
| `scheduleNow` | `api-web /v1/schedule/now` | Convenience for "current week starting today." |
| `game` | `api-web /v1/gamecenter/{id}/landing` | Top-level game state — score, period, clock, teams, scratches. |
| `playByPlay` | `api-web /v1/gamecenter/{id}/play-by-play` | All plays + shot coordinates. The big one. |
| `boxscore` | `api-web /v1/gamecenter/{id}/boxscore` | Per-skater + per-goalie stats. |
| `team` | `api-web /v1/club-stats/{code}/now` | Team identity + season stats. Code = `BOS`, `TOR`, etc. |
| `roster` | `api-web /v1/roster/{code}/current` | Current roster per team. |
| `player` | `api-web /v1/player/{id}/landing` | Player profile + season stats. |
| `standings` | `api-web /v1/standings/now` | League-wide. |
| `stats` | `api /stats/rest/en/{kind}/summary` | Skater / goalie / team leaderboards. See note. |

**Hosts** in `src/lib/nhl/hosts.ts`:

```ts
export const HOSTS = {
  web: 'https://api-web.nhle.com',
  stats: 'https://api.nhle.com',
} as const;
```

**`stats` module exception.** This is the only module with internal sub-endpoints. It exposes one fetcher and one Route Handler keyed by `?kind=skater|goalie|team`, but one schema and one hook per kind: `useSkaterStats`, `useGoalieStats`, `useTeamStats`. The five-file pattern bends to: one `fetcher.ts`, one `route.ts`, three `schema.<kind>.ts`, three `use<Kind>Stats.ts`, one `index.ts`. No other module needs this shape.

## Coordinate normalization

NHL plays carry `xCoord`/`yCoord` in the rink coordinate system (200×85 ft, origin center ice). Handedness flips by period, which is a property of the data, not of the UI.

The `playByPlay` schema keeps the raw values. The module also exports a pure helper:

```ts
export function normalizeShot(play: Play, homeTeamSide: 'left' | 'right'): {
  x: number;        // 0..1, left → right, in attacking direction
  y: number;        // 0..1, near → far rail
  side: 'home' | 'away';
};
```

Future shot-map UI imports `normalizeShot` from `lib/nhl/playByPlay` and never sees raw coords or period parity. Lives in the data layer because it's a property of the API surface.

## Testing

No test runner is wired up yet. This spec adds **Vitest** for unit tests and configures it to run via `npm test`. No Playwright in this spec — there's no UI to test yet; we'll add it in a later spec when there is one.

Tests live next to the code they cover (`schema.test.ts` next to `schema.ts`).

### Three test layers

1. **Schema tests (mandatory, one per endpoint).** Capture a real NHL response in `__fixtures__/<resource>.json`; assert `Schema.parse(fixture)` succeeds. Run in CI. Failing means "NHL changed something, look."
2. **Fetcher tests.** Mock `global.fetch` with `vi.fn`. Cover happy path, http 500, network throw, timeout via `AbortController`, schema parse failure. Each maps to the correct `NhlApiError` kind. ~5 tests per module.
3. **Hook tests for the live/final cadence flip.** One file. Renders `useGame` with a `final` fixture → assert `refetchInterval` resolves to `false`. Renders with a `live` fixture → asserts it polls. Visibility flip too. ~3 tests, covers the only nontrivial hook logic.

Route Handlers don't get their own tests — they're one-line re-exports of factories tested via the fetcher tests. If a handler grows real logic, it gets tests.

### Recording fixtures

A small `scripts/record-fixture.ts` (one-time, manual) hits live NHL endpoints and writes pretty-printed JSON to the right `__fixtures__/` dir. Documented in `README.md`. Not part of CI; tests are not coupled to network.

## Dependencies to add

- `@tanstack/react-query` — query/cache primitives.
- `@tanstack/react-query-devtools` — dev-only.
- `zod` — schema validation.
- `vitest`, `@vitejs/plugin-react`, `jsdom` — test runner.
- `@testing-library/react`, `@testing-library/dom` — only for the hook test.

`package.json` gets a `"test": "vitest"` script.

## Out of scope (explicitly)

- Any UI surface. Live-game view, shot map, schedule list — all separate specs that consume this layer.
- Authentication, user accounts, favorites.
- Server-pushed updates (SSE / WebSockets). Client polling is sufficient at the NHL data refresh rate; revisit only if poll volume becomes a real cost.
- Image handling. `next.config.ts` `images.remotePatterns` for NHL CDN domains will be added in the spec for the first feature that renders an image.
- Internationalization. Endpoints are called with the `en` locale where applicable; this is hard-coded for now.
- Persisting any NHL data in our own database.

## Open questions

None gating this spec. Items to revisit in later specs:

- Do we want a per-page SSR prefetch helper for static endpoints (`useSchedule(today)`) once we build the schedule page?
- Is 5s polling on `playByPlay` too aggressive for actual NHL update cadence? Tune empirically once a live game view exists.
