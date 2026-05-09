# NHL Data Layer — Implementation Plan

**Spec:** [`docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md`](../specs/2026-05-09-nhl-data-layer-design.md)
**Status:** Not started 2026-05-09

Phases run top-to-bottom. Each step lists files touched, acceptance criteria, and any verification commands. Tick the checkbox when the step is done **and** its acceptance criteria pass.

The plan is structured so an interruption between phases leaves the codebase in a working state (`npm run lint`, `npm run build`, `npm test` all green).

---

## Phase 0 — Dependencies & test runner

Bootstrap the toolchain so every later phase has somewhere to land.

- [ ] **0.1 Install runtime dependencies.**
  - Run: `npm install zod @tanstack/react-query`
  - Run: `npm install --save-dev @tanstack/react-query-devtools`
  - Acceptance: `package.json` lists all three; `npm run build` still succeeds.

- [ ] **0.2 Install Vitest + React Testing Library.**
  - Run: `npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom`
  - Acceptance: dependencies installed; build still succeeds.

- [ ] **0.3 Configure Vitest.**
  - Create `vitest.config.ts` at repo root with: `@vitejs/plugin-react`, `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./vitest.setup.ts']`.
  - Create `vitest.setup.ts` with `import '@testing-library/jest-dom'` (only if the matchers are wanted — otherwise leave empty file).
  - Resolve `@/*` alias the same way `tsconfig.json` does (`vite-tsconfig-paths` is the easy path: `npm i -D vite-tsconfig-paths`, add to `plugins`).
  - Add `"test": "vitest"` and `"test:run": "vitest run"` to `package.json` scripts.
  - Acceptance: `npm test -- --run` exits 0 with "no test files found." Update `CLAUDE.md`'s "no test framework wired up" note in the same commit.

- [ ] **0.4 Mount `<NhlQueryProvider>` placeholder.**
  - Create `src/lib/nhl/client.tsx` exporting a `<NhlQueryProvider>` client component that wraps children in `QueryClientProvider`. Defaults per spec (retry policy, `refetchOnWindowFocus`, `refetchOnReconnect`). Mount Devtools only when `process.env.NODE_ENV === 'development'`.
  - Edit `src/app/layout.tsx` to wrap `{children}` in `<NhlQueryProvider>`.
  - Acceptance: `npm run build` succeeds; visiting `/` in dev shows the React Query devtools toggle.

- [ ] **0.5 Commit Phase 0.** Single commit: "chore: add zod, react-query, vitest; mount QueryClientProvider".

---

## Phase 1 — Shared infrastructure (`src/lib/nhl/`)

The pieces every endpoint module reuses. Keep these tiny and well-tested — bugs here propagate everywhere.

- [ ] **1.1 `errors.ts`.** Tagged `NhlApiError` union per spec. A `toNhlApiError(unknown)` helper that narrows arbitrary thrown values into the union (used inside `nhlFetch`'s catch). No tests yet — covered by fetcher tests.

- [ ] **1.2 `hosts.ts`.** `HOSTS = { web, stats } as const`. Trivial — no tests.

- [ ] **1.3 `cache.ts`.** Three exports:
  - `TTL` — server-side `revalidate` values keyed by resource (numbers, or `false` for `no-store`). Includes the variable cases as functions: `TTL.schedule(date)`, `TTL.game(state)`, `TTL.playByPlay(state)`, `TTL.boxscore(state)`.
  - `STALE` — RQ `staleTime` per resource, same shape (functions where variable).
  - `POLL` — RQ `refetchInterval` per resource, same shape. Returns `false` when polling should be off.
  - Helper `isLiveGameState(state)` — returns `true` iff state is `LIVE` or `CRIT`. Used by the three live endpoints.
  - Test file `cache.test.ts`: a few asserts on the live/final flip and today/other-date schedule branching. ~5 tests.

- [ ] **1.4 `fetcher.ts`.** The `nhlFetch<T>(opts)` wrapper per spec (headers, timeout, cache directive, error mapping, Zod parse).
  - Test file `fetcher.test.ts`: mock `global.fetch` with `vi.fn`. Cover happy path, http 500 → `kind: 'http'`, network throw → `kind: 'network'`, `AbortError` → `kind: 'timeout'`, schema mismatch → `kind: 'schema'`. ~5 tests.

- [ ] **1.5 `visibility.ts`.** `useVisibility()` and `usePollingInterval(ms)`. Subscribes to `document.visibilitychange`. `usePollingInterval(false)` returns `false`.
  - Test file `visibility.test.ts`: render the hook, fire `visibilitychange`, assert state. ~2 tests.

- [ ] **1.6 Top-level `index.ts`.** Re-exports the public surface: `<NhlQueryProvider>`, `NhlApiError`, `usePollingInterval`. Server-side fetchers re-exported here once they exist (filled in incrementally each phase).

- [ ] **1.7 Commit Phase 1.** Single commit: "feat(nhl): shared data-layer infrastructure (fetcher, errors, cache, visibility)".
  - Acceptance: `npm test -- --run` green with ~12 tests; `npm run build` green; `npm run lint` green.

---

## Phase 2 — First endpoint: `schedule` (reference module)

The module that establishes the five-file pattern. Implement it carefully because every later module copies its shape.

- [ ] **2.1 Record fixture.** Write `scripts/record-fixture.ts` (one-time tool — fetches an NHL endpoint and pretty-prints to a path). Use it to capture `src/lib/nhl/schedule/__fixtures__/schedule.json` from `https://api-web.nhle.com/v1/schedule/2026-05-09` (or any valid date with games).
  - Acceptance: fixture file exists, is valid JSON, ~kilobytes in size.

- [ ] **2.2 `schedule/schema.ts`.** Zod schemas for the response. Use `.passthrough()`. Types via `z.infer`.
  - Test `schedule/schema.test.ts`: `expect(ScheduleResponse.parse(fixture)).not.toThrow()`. 1 test.

- [ ] **2.3 `schedule/fetcher.ts`.** `fetchSchedule(date)` calling `nhlFetch` with the schema and `TTL.schedule(date)`.

- [ ] **2.4 `schedule/route.ts`.** Exported `GET` handler factory: parses `date` from params, calls fetcher, maps errors to HTTP status, returns `NextResponse.json`.

- [ ] **2.5 `app/api/nhl/schedule/[date]/route.ts`.** One-line re-export: `export { GET } from '@/lib/nhl/schedule/route';`.
  - Acceptance: `curl http://localhost:3000/api/nhl/schedule/2026-05-09` (with `npm run dev` running) returns valid JSON.

- [ ] **2.6 `schedule/useSchedule.ts`.** RQ hook per spec; uses `usePollingInterval(POLL.schedule(date))` and `STALE.schedule(date)`.

- [ ] **2.7 `schedule/index.ts`.** Re-exports `useSchedule` and `ScheduleResponse` only.

- [ ] **2.8 Update top-level `lib/nhl/index.ts`.** Add `fetchSchedule` to the escape-hatch re-exports.

- [ ] **2.9 Commit Phase 2.** Single commit: "feat(nhl): schedule endpoint module".
  - Acceptance: tests + lint + build green; manual curl returns NHL data.

---

## Phase 3 — Live-game core: `game`, `playByPlay`, `boxscore`

The three endpoints that exercise the live/final cadence flip. Implementing all three in this phase because they share the same hook pattern (read `gameState`, branch the polling).

For each module, repeat the steps from Phase 2 (record fixture, schema + test, fetcher, route, app re-export, hook, index). Plus:

- [ ] **3.1 `game` module.**
- [ ] **3.2 `playByPlay` module.** Schema must capture `xCoord`, `yCoord`, `details.zoneCode`, `period.periodType`, `period.number`, plus enough context to know home/away sides per period.
- [ ] **3.3 `boxscore` module.**

- [ ] **3.4 `playByPlay/normalizeShot.ts`.** Pure helper per spec. Tests in `normalizeShot.test.ts`: a handful of (rawX, rawY, period, homeTeamSide) → expected (x, y, side) cases. Covers the period-flip logic.

- [ ] **3.5 Hook cadence-flip test.** Single test file `useGame.test.ts` (or a shared one for all three): render the hook with a `final` fixture → `refetchInterval` resolves to `false`; render with a `live` fixture → resolves to a number. Visibility flip too.
  - Acceptance: ~3 tests pass.

- [ ] **3.6 Update `lib/nhl/index.ts`.** Add `fetchGame`, `fetchPlayByPlay`, `fetchBoxscore`, `normalizeShot` to escape-hatch exports.

- [ ] **3.7 Commit Phase 3.** Single commit: "feat(nhl): live-game endpoints (game, playByPlay, boxscore) with cadence flip".
  - Acceptance: tests + lint + build green; manual curl on each endpoint with a real game ID returns JSON.

---

## Phase 4 — Static-ish endpoints

These all share the same boring pattern — no live cadence flip. Quick to land in one phase.

- [ ] **4.1 `scheduleNow` module.** Wraps `/v1/schedule-now`. Same pattern as `schedule` but no `[date]` param.
- [ ] **4.2 `team` module.** Wraps `/v1/club-stats/{code}/now`. Param is uppercase team code; validate with a Zod regex (`/^[A-Z]{3}$/`).
- [ ] **4.3 `roster` module.** Wraps `/v1/roster/{code}/current`.
- [ ] **4.4 `player` module.** Wraps `/v1/player/{id}/landing`. Param is numeric ID; validate with Zod.
- [ ] **4.5 `standings` module.** Wraps `/v1/standings/now`. No params.
- [ ] **4.6 Update `lib/nhl/index.ts`.** Add server fetchers to escape-hatch exports.
- [ ] **4.7 Commit Phase 4.** Single commit: "feat(nhl): static endpoints (scheduleNow, team, roster, player, standings)".
  - Acceptance: schema test passes for each; tests + lint + build green; one manual curl per route confirms upstream wiring.

---

## Phase 5 — `stats` module (the deviation)

The only module that bends the five-file pattern. One fetcher + one route handler keyed by `?kind=`, three schemas + three hooks.

- [ ] **5.1 Record three fixtures.** `__fixtures__/skater.json`, `goalie.json`, `team.json`.
- [ ] **5.2 `stats/schema.skater.ts`, `schema.goalie.ts`, `schema.team.ts`.** Three Zod schemas, three schema tests.
- [ ] **5.3 `stats/fetcher.ts`.** Single `fetchStats(kind, params?)` that switches schema by `kind`. Returns a discriminated union typed by `kind` (use overloads for ergonomics).
- [ ] **5.4 `stats/route.ts`.** Reads `?kind=` from `URL`, validates against an enum, dispatches to fetcher.
- [ ] **5.5 `app/api/nhl/stats/route.ts`.** One-line re-export.
- [ ] **5.6 `stats/useSkaterStats.ts`, `useGoalieStats.ts`, `useTeamStats.ts`.** Three thin hooks all hitting `/api/nhl/stats?kind=…`.
- [ ] **5.7 `stats/index.ts`.** Re-exports the three hooks and three types.
- [ ] **5.8 Update `lib/nhl/index.ts`.** Add `fetchStats` to escape-hatch exports.
- [ ] **5.9 Commit Phase 5.** Single commit: "feat(nhl): stats endpoint module (skater, goalie, team leaderboards)".

---

## Phase 6 — Verification

Stuff that's easy to forget but matters.

- [ ] **6.1 `README.md` update.** Section on "Working with NHL data" — link the spec, document the five-file module pattern, document the fixture-recording script.
- [ ] **6.2 `CLAUDE.md` update.** Replace the "no test framework wired up" note (already done in Phase 0) and the "decide between client polling vs streaming" note with concrete pointers to the implemented layer + spec doc.
- [ ] **6.3 `next.config.ts` review.** Confirm no NHL CDN allow-listing is needed for this layer (no images yet). Note the deferral in the spec's "Out of scope" still holds.
- [ ] **6.4 End-to-end manual smoke.**
  - Add a throwaway `src/app/_smoke/page.tsx` that calls `useSchedule(today)` and `useGame(<some live game id>)`, just renders raw JSON.
  - Visit it, watch React Query devtools confirm polling cadence flips correctly when a game ends. Then **delete the page** before commit.
  - Acceptance: manual confirmation only; no artifact lands in the repo.
- [ ] **6.5 Final CI check.** `npm run lint && npm run build && npm test -- --run` all green. Tag commit "feat(nhl): data layer complete".

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

_(empty)_
