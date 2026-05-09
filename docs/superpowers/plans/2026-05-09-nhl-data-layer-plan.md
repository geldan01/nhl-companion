# NHL Data Layer — Implementation Plan

**Spec:** [`docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md`](../specs/2026-05-09-nhl-data-layer-design.md)
**Status:** Complete 2026-05-09

Phases run top-to-bottom. Each step lists files touched, acceptance criteria, and any verification commands. Tick the checkbox when the step is done **and** its acceptance criteria pass.

The plan is structured so an interruption between phases leaves the codebase in a working state (`npm run lint`, `npm run build`, `npm test` all green).

---

## Phase 0 — Dependencies & test runner

Bootstrap the toolchain so every later phase has somewhere to land.

- [x] **0.1 Install runtime dependencies.** Done.
- [x] **0.2 Install Vitest + React Testing Library.** Done. Also installed `@testing-library/jest-dom` and `vite-tsconfig-paths`.
- [x] **0.3 Configure Vitest.** Done with two deviations: (a) config is `vitest.config.mts` (not `.ts`) so Vite loads it as ESM — needed because `vite-tsconfig-paths` is ESM-only and Vite's CJS loader can't require it on Node 20.18. (b) Vitest pinned to `^3` instead of `^4`; v4 requires Node ≥20.19 / 22.13 which aren't installed. Both choices are personal-project-friendly; revisit on Node upgrade. Also added `passWithNoTests: true` so an empty test run exits 0.
- [x] **0.4 Mount `<NhlQueryProvider>`.** Done. Lifted `errors.ts` forward from Phase 1.1 because the retry policy needs the `NhlApiError` type — Phase 1 will treat 1.1 as already done.
- [x] **0.5 Commit Phase 0.** Commit `c636731`.

---

## Phase 1 — Shared infrastructure (`src/lib/nhl/`)

The pieces every endpoint module reuses. Keep these tiny and well-tested — bugs here propagate everywhere.

- [x] **1.1 `errors.ts`.** Done in Phase 0.4 (lifted forward because the provider's retry needed it). Tagged `NhlApiError` union + `toNhlApiError(unknown, url)` + `isNhlApiError(value)` typeguard. No tests yet — covered by fetcher tests.

- [x] **1.2 `hosts.ts`.** Done.
- [x] **1.3 `cache.ts`.** Done. 8 tests covering live/final flip and today/other-date schedule branching. Helper `isTodayUtc` added (used by both schedule branches).
- [x] **1.4 `fetcher.ts`.** Done. 8 tests (happy path, headers/cache directive, no-store, http 500/404, network, timeout, schema mismatch).
- [x] **1.5 `visibility.ts`.** Done. 5 tests (initial visible, flip to hidden via event, ms passthrough, hidden→false, false passthrough).
- [x] **1.6 Top-level `index.ts`.** Done. Re-exports `NhlQueryProvider`, `NhlApiError`/`isNhlApiError`, `useVisibility`/`usePollingInterval`, `HOSTS`, `TTL`/`STALE`/`POLL`/`isLiveGameState`/`isTodayUtc`, `nhlFetch`/`NhlFetchOpts`. Server fetchers will be added per phase as endpoints land.
- [x] **1.7 Commit Phase 1.** Commit `91edae2`. 21 tests green, lint green, build green.

---

## Phase 2 — First endpoint: `schedule` (reference module)

The module that establishes the five-file pattern. Implement it carefully because every later module copies its shape.

- [x] **2.1 Record fixture.** `scripts/record-fixture.ts` (manual tool, takes `<url> <output-path>`); `schedule.json` recorded against 2026-05-09.
- [x] **2.2 `schedule/schema.ts` + test.** Schemas for `ScheduleResponse`, `GameWeekDay`, `GameSummary`, `TeamSummary`, `TvBroadcast`, `PeriodDescriptor`, `LocalizedString` — all `.passthrough()`. `team.score` is optional (only present for live/final games).
- [x] **2.3 `schedule/fetcher.ts`.** `fetchSchedule(date)` done.
- [x] **2.4 `schedule/route.ts`.** Done. Uses Next 16's `RouteContext<'/api/nhl/schedule/[date]'>` (await ctx.params). `statusForError` helper maps `NhlApiError.kind` → HTTP status.
- [x] **2.5 `app/api/nhl/schedule/[date]/route.ts`.** One-line re-export. Verified live: `GET /api/nhl/schedule/2026-05-09` returns parsed NHL JSON; bad date → 404 with structured error body.
- [x] **2.6 `schedule/useSchedule.ts`.** Done. Hits our route handler, types as `useQuery<ScheduleResponse, NhlApiError>`. Server error body shape `{ error: NhlApiError }` rethrown by the client fetcher — RQ retry policy in the provider can branch on it.
- [x] **2.7 `schedule/index.ts`.** Re-exports the hook + 3 types (`ScheduleResponse`, `ScheduleGame`, `ScheduleGameWeekDay`).
- [x] **2.8 Update top-level `lib/nhl/index.ts`.** `fetchSchedule` added to escape-hatch re-exports.
- [x] **2.9 Commit Phase 2.** Commit `aad01ad`. 22 tests green, lint + build clean.

---

## Phase 3 — Live-game core: `game`, `playByPlay`, `boxscore`

The three endpoints that exercise the live/final cadence flip. Implementing all three in this phase because they share the same hook pattern (read `gameState`, branch the polling).

For each module, repeat the steps from Phase 2 (record fixture, schema + test, fetcher, route, app re-export, hook, index). Plus:

- [x] **3.0 Fixtures.** Recorded against game `2025030221` (PHI @ CAR, FINAL/OFF). Sizes: `game.json` 878 lines, `playByPlay.json` 8821 lines (359 plays + 40 rosterSpots), `boxscore.json` 1000 lines.
- [x] **3.1 `game` module.** Done.
- [x] **3.2 `playByPlay` module.** Done. Schema validates 359 plays + 40 rosterSpots; goal events expose `details.xCoord`/`yCoord`/`zoneCode` and `homeTeamDefendingSide`.
- [x] **3.3 `boxscore` module.** Done. `playerByGameStats` split by team into forwards/defense/goalies.
- [x] **3.4 `playByPlay/normalizeShot.ts`.** Pure helper. 9 tests cover home/away shooters, both defending sides, period rotation (y flips with x via 180° rotation), out-of-rink clamping, and missing-coord null cases.
- [x] **3.5 Hook cadence-flip tests.** Implemented as pure-function tests on `gamePollMs`, `playByPlayPollMs`, `boxscorePollMs` exported from each hook — avoids React Query / fake-timer fragility. Single `cadence.test.ts`, 6 tests, covers LIVE/CRIT/FINAL/OFF/FUT/PRE/hidden-tab/undefined-state.
- [x] **3.6 Update `lib/nhl/index.ts`.** Done — `fetchGame`, `fetchPlayByPlay`, `fetchBoxscore`, `normalizeShot` re-exported.
- [x] **3.7 Commit Phase 3.** Commit `9d461e9`. 41 tests green, lint + build clean. All three routes verified live.

---

## Phase 4 — Static-ish endpoints

These all share the same boring pattern — no live cadence flip. Quick to land in one phase.

- [x] **4.1 `scheduleNow` module.** Done. Wraps `/v1/schedule/now` (NOT `/v1/schedule-now` as the spec said — that path 404s; spec corrected). Reuses `ScheduleResponse` from the schedule module since shape is identical.
- [x] **4.2 `team` module.** Done. Wraps `/v1/club-stats/{CODE}/now`. Schema accepts `season: string` (NHL inconsistency vs. number elsewhere). No regex validation on team code at the route — invalid codes naturally surface as upstream 404 with a clean error body.
- [x] **4.3 `roster` module.** Done. Wraps `/v1/roster/{CODE}/current`. forwards/defensemen/goalies arrays.
- [x] **4.4 `player` module.** Done. Wraps `/v1/player/{id}/landing`. Route rejects non-numeric `id` with a 400 before reaching NHL.
- [x] **4.5 `standings` module.** Done. Wraps `/v1/standings/now`. `teamAbbrev`/`teamName`/`teamCommonName`/`placeName` are all `LocalizedString` shaped (`{ default, ... }`), not plain strings.
- [x] **4.6 Update `lib/nhl/index.ts`.** Done — `fetchScheduleNow`, `fetchTeam`, `fetchRoster`, `fetchPlayer`, `fetchStandings` re-exported.
- [x] **4.7 Commit Phase 4.** Commit `0d10d8e`. 46 tests green, lint + build clean, all 5 endpoints verified live.

---

## Phase 5 — `stats` module (the deviation)

The only module that bends the five-file pattern. One fetcher + one route handler keyed by `?kind=`, three schemas + three hooks.

- [x] **5.1 Record three fixtures.** `__fixtures__/skater.json` (top-10 by points), `goalie.json` (top-10 by wins), `team.json` (all 32). Stats endpoints require `cayenneExp=seasonId=… and gameTypeId=…`; without it they 500.
- [x] **5.2 `schema.skater.ts` / `schema.goalie.ts` / `schema.team.ts` + combined `schema.test.ts`.** All `{ total, data: [...] }`-shaped. `shootingPct` is nullable for 0-shot skaters.
- [x] **5.3 `stats/fetcher.ts`.** `fetchStats<K extends StatsKind>(kind, params)` with `StatsResponseFor<K>` conditional return type. `currentSeasonId()` helper computes the active NHL season from `now` (July onward = next season's id). Defaults: seasonId=current, gameTypeId=2, limit=25.
- [x] **5.4 `stats/route.ts`.** Validates `?kind=` against `STATS_KINDS` tuple (400 on bad/missing), parses optional `seasonId`/`gameTypeId`/`limit`/`sort` from query string and forwards.
- [x] **5.5 `app/api/nhl/stats/route.ts`.** One-line re-export.
- [x] **5.6 Three hooks in `useStats.ts`.** Shared internal `useStats(kind, params)` plus exported `useSkaterStats` / `useGoalieStats` / `useTeamStats` wrappers, each defaulting `sort` to a JSON-encoded `[{property, direction:'DESC'}]` spec — NHL's stats API treats a bare property name as ascending, useless for "top N" leaderboards.
- [x] **5.7 `stats/index.ts`.** Done — three hooks + three response/row types + `STATS_KINDS`/`StatsKind`/`StatsParams`/`currentSeasonId`.
- [x] **5.8 Update `lib/nhl/index.ts`.** `fetchStats` and `currentSeasonId` re-exported.
- [x] **5.9 Commit Phase 5.** Commit `d4affa7`. 49 tests green, lint + build clean. Verified McDavid 138 / Kucherov 130 / MacKinnon 127 atop the skater board.

---

## Phase 6 — Verification

Stuff that's easy to forget but matters.

- [x] **6.1 `README.md` update.** Done. Quick-reference snippet, full endpoint table, module-pattern walkthrough, "adding a new endpoint" recipe, fixture-recording instructions, error model.
- [x] **6.2 `CLAUDE.md` update.** Already done in Phase 0; added a one-line note about the `stats` deviation now that it's implemented.
- [x] **6.3 `next.config.ts` review.** Untouched as expected — no images rendered yet, no `images.remotePatterns` needed. Spec "out of scope" deferral still holds; image host allow-listing lands with the first feature that renders headshots/logos.
- [x] **6.4 End-to-end manual smoke.** Compile-level check only: throwaway `/smoke` page imported `useSchedule`, `useGame`, `useStandings`, `useSkaterStats`, built and rendered HTTP 200 with all four queries in `pending` (correct — RQ is client-only and SSR can't fetch). Page deleted before commit. **Could not visually verify the polling cadence flip in React Query devtools** — that needs a browser session; revisit during the first UI feature build. Discovery during this step: Next 16 excludes underscore-prefixed folders (`_smoke/`) from routing, so the throwaway page must use a non-underscored name.
- [x] **6.5 Final CI check.** `npm run lint`, `npm run test:run` (15 files, 49 tests), `npm run build` (10 dynamic API routes registered, type check clean) all green. Closing commit captures Phase 6 docs + final tick.

---

## Out of plan (deferred)

- SSR prefetching for static endpoints (per-page `dehydrate` setup). Adopt only when a page actually benefits.
- Rate-limit handling beyond per-endpoint TTL. Revisit if NHL starts 429ing us.
- Polling cadence tuning. Spec values are best-guess; tune empirically once a live-game UI exists (open question in spec).
- Image host allow-listing. Land with the first image-rendering feature.
- Playwright. Land with the first UI feature.

---

## Working notes (live)

Use this section as a scratchpad while implementing — surprises, decisions, things to revisit. Keep it terse.

- **2026-05-09 — Phase 0.** Vitest 4 needs Node ≥20.19; pinned to v3 since dev box is 20.18. Revisit on Node upgrade.
- **2026-05-09 — Phase 0.** `vitest.config.ts` had to become `vitest.config.mts` so Vite loads it as ESM (needed for `vite-tsconfig-paths`).
- **2026-05-09 — Phase 0.** Lifted `errors.ts` (Phase 1.1) forward into Phase 0.4 because the retry policy in `<NhlQueryProvider>` needs the `NhlApiError` type. Phase 1.1 is now a no-op.
- **2026-05-09 — Phase 0.** Devtools toggle not visually verified (no browser session); plumbing compiles + page returns 200. Re-check next time the dev server is up.
- **2026-05-09 — Phase 1.** jsdom pinned to `^25` — v27 hits the same Node 20.18 ESM/CJS issue as Vitest 4. Same revisit-on-Node-upgrade note.
- **2026-05-09 — Phase 1.** `cache.ts` mixes units: TTL in seconds (Next's `next.revalidate`), STALE/POLL in milliseconds (React Query). Comment at top of file documents this.
- **2026-05-09 — Phase 1.** "Today" is computed via UTC `YYYY-MM-DD` — server and client agree, but it'll flip a few hours off local time near midnight. Acceptable for a freshness/poll heuristic; revisit if it ever surfaces a real bug.
- **2026-05-09 — Phase 2.** Next 16 route handler params are async — `RouteContext<'/path/[param]'>` + `await ctx.params`. Documented in `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`. Worth re-reading before adding more routes.
- **2026-05-09 — Phase 2.** Schema is intentionally narrow: we only `require` the fields the UI plans to consume; everything else flows through unchanged via `.passthrough()`. `awayTeam.score`/`homeTeam.score` are optional because they're absent on FUT (future) games — reproduce only when both are non-FUT.
- **2026-05-09 — Phase 3.** Server-side TTL for game/playByPlay/boxscore: the route handler doesn't know `gameState` ahead of fetch. The route accepts `?state=` from the client as a hint; if absent, the fetcher defaults to `'LIVE'` (i.e. `no-store`). The cadence flip lives in the hook, which is canonical. Server cache is a best-effort optimization for finished games and not currently exercised — minor extra upstream calls only.
- **2026-05-09 — Phase 3.** Cadence-flip tests: implemented as pure-function unit tests on each hook's exported `<thing>PollMs(state, visible)` instead of rendering the hook + manipulating fake timers. Cleaner, deterministic, and the hook composes the helper trivially via `query.state.data?.gameState`.
- **2026-05-09 — Phase 3.** `normalizeShot` rotates by 180° (flips both x and y) when shooter attacks left, not just x. Reasoning: the rink is symmetric about both axes and the canonical "shooter attacks right" view is a 180° rotation of the alternate side, not a horizontal mirror. Test 4 in `normalizeShot.test.ts` is the assertion that y flips.
- **2026-05-09 — Phase 4.** Spec deviation: `/v1/schedule-now` (as listed in the design doc) doesn't exist; the working endpoint is `/v1/schedule/now`. Several other "/now" endpoints (`/v1/club-stats/{code}/now`, `/v1/standings/now`, `/v1/roster/{code}/current`) return 307 redirects to season/date-specific URLs, but Node's built-in fetch follows redirects by default — runtime behavior is fine.
- **2026-05-09 — Phase 4.** NHL inconsistency: `season` is a `number` in `schedule`/`game`/`playByPlay`/`boxscore` but a `string` in `team` (`/club-stats/.../now`). Schema reflects this. Watch for similar drift in future endpoints.
- **2026-05-09 — Phase 4.** Skipped Zod regex validation on `[code]` in `team`/`roster` routes. Invalid codes get a clean upstream 404 anyway and the validation would be UX polish, not safety.
- **2026-05-09 — Phase 5.** Stats endpoints (`api.nhle.com/stats/rest/en/...`) 500 without `cayenneExp` — they're not browseable. Always set `seasonId` + `gameTypeId`.
- **2026-05-09 — Phase 5.** Sort param: `sort=points` is ascending. To get descending you must JSON-encode `[{"property":"points","direction":"DESC"}]`. Hooks default to descending; route handler forwards whatever the client sends.
- **2026-05-09 — Phase 5.** TS conditional-type cast in stats fetcher needed `as unknown as z.ZodType<StatsResponseFor<K>>` — the schema map's union type doesn't narrow against the generic `K`. Same `as unknown as` pattern as Phase 0.
- **2026-05-09 — Phase 6.** Next 16 treats folders prefixed with `_` as private (excluded from routing). A throwaway `_smoke/` page won't be reachable; use a regular folder name and remember to delete it.
- **2026-05-09 — Phase 6.** Visual verification of the React Query devtools polling cadence flip is the one item the autonomous workflow can't do — flagged for the first real UI build to revisit. The pure-function tests (`cadence.test.ts`) cover the rule itself; the only thing untested is the integration with React Query's `refetchInterval` callback, which is library behavior.
