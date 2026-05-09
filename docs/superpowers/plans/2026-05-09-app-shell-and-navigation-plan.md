# NHL App Shell & Navigation — Implementation Plan

**Spec:** [`docs/superpowers/specs/2026-05-09-app-shell-and-navigation-design.md`](../specs/2026-05-09-app-shell-and-navigation-design.md)
**Status:** Not started.

Phases run top-to-bottom. Each step lists files touched, acceptance criteria, and any verification commands. Tick the checkbox when the step is done **and** its acceptance criteria pass.

The plan is structured so an interruption between phases leaves the codebase in a working state (`npm run lint`, `npm run build`, `npm run test:run` all green). Phase 2 is the first to introduce Playwright; from Phase 2 onward, `npm run test:e2e` must also pass.

Each phase produces a short stack of small commits (one feature per commit) and ends with a phase-closing commit that's the natural rebase point.

---

## Phase 0 — Foundation

Everything every later phase depends on: image hosts, design tokens, the team-color map, and the shared component primitives. No routes change yet; `app/page.tsx` keeps its boilerplate until Phase 1.

- [x] **0.1 Allow-list NHL CDN hosts in `next.config.ts`.** Done. Single host (`assets.nhle.com`); two patterns: `/logos/**` and `/mugs/**`. Two non-obvious deviations from the step description: (a) team logos are SVG, which Next blocks by default, so set `dangerouslyAllowSVG: true` + a script-blocking CSP (`default-src 'self'; script-src 'none'; sandbox;`); (b) used the **object form** (not the `new URL(...)` shorthand) and **omitted `search`** so logo URLs with `?season=YYYYYYYY` are accepted — the shorthand pins `search: ''` and rejects all queries. Verified by curling `/_next/image?url=...` against a running `npm run dev`: SVG logo (with and without query string), PNG mug, and JPG actionshot all → 200; an unallowed host and an unallowed path under the same host both → 400. No throwaway page needed.

- [ ] **0.2 Define color tokens in `src/app/globals.css`.** Add CSS variables under `:root` and `.dark` for `--bg`, `--surface`, `--surface-hover`, `--border`, `--text`, `--text-muted`, `--accent`, `--live`, `--rink-line`, `--home`, `--away`. Pick reasonable values (the spec doesn't dictate exact hex). Confirm with a quick visual smoke check that the existing `app/page.tsx` still renders sanely under both color schemes — these tokens shouldn't affect Tailwind utility classes already in use.

- [ ] **0.3 `src/lib/team-colors.ts`.** Static `Record<TeamCode, { primary: string; secondary: string }>` for all 32 teams. `TeamCode` is the 3-letter abbreviation (TOR, BOS, MTL, ...). Use the official team primaries; fall back to a neutral grey if a code is missing at runtime. Export `TeamCode` and `TEAM_COLORS`. Tiny unit test (`team-colors.test.ts`) asserts all 32 codes are present and every value parses as a valid CSS color.

- [ ] **0.4 `<DataState>` in `src/components/data-state.tsx` + test.** Props per the spec (`isLoading`, `error`, `hasData`, `skeleton`, `children`). Maps `error.kind` to: `network`/`timeout` → small "delayed" badge over `children`; `schema` or `http` ≥ 500 → top banner + stale `children` if any; `http` 4xx → empty state slot. Export an `EmptyState` slot prop too. Test (`data-state.test.tsx`) covers each branch with a fake `NhlApiError` and a stub `<Skeleton>`/`<EmptyState>`/children.

- [ ] **0.5 `<Skeleton>` in `src/components/skeleton.tsx`.** Variants: `card`, `row`, `rink`, `pill`. Each variant is a fixed-shape placeholder (Tailwind `animate-pulse` + `bg-[var(--surface)]`) sized to match the eventual content. No props besides `variant` and an optional `count` for repeating rows.

- [ ] **0.6 `<TeamLogo>` in `src/components/team-logo.tsx`.** Wraps `next/image`. Props: `code: TeamCode`, `size?: number` (default 32). Source URL uses the NHL CDN convention surfaced in 0.1; `alt` is the team code. Renders a colored square fallback (`bg-[primary]`) until the image loads.

- [ ] **0.7 `<TeamChip>` in `src/components/team-chip.tsx`.** `<TeamLogo>` + abbreviation + optional record (`12-4-1`). Used in scoreboard cards, plays, boxscore rows.

- [ ] **0.8 `<PlayerChip>` in `src/components/player-chip.tsx`.** Round headshot (`next/image`) + name. Props: `id: number`, `name: string`. Headshot URL convention surfaced in 0.1.

- [ ] **0.9 `<GameStatePill>` in `src/components/game-state-pill.tsx` + test.** Props: `state: GameState`, `period?: number`, `clock?: string`, `startTimeUTC?: string`. Renders `LIVE 2P 8:14` for `LIVE`/`CRIT`, `FINAL` for `FINAL`/`OFF`, the formatted local time for `PRE`/`FUT`. Test covers each state. Color uses `--live` for LIVE/CRIT, muted text for everything else.

- [ ] **0.10 Update `src/lib/nhl/index.ts` if needed.** No new exports expected — all components consume hooks from `src/lib/nhl/<resource>/`. Confirm and skip if untouched.

- [ ] **0.11 Commit Phase 0.** `npm run lint`, `npm run test:run`, `npm run build` all green. Commit message: `feat(ui): foundation — image hosts, design tokens, shared components`.

---

## Phase 1 — App shell + three nav surfaces

The skeleton: header, breakpoint nav, and the three top-level pages (Scoreboard / Standings / Stats), all wired through `<DataState>` and using the Phase 0 components. The "Now watching" pill renders nothing yet — `WatchingProvider` is mounted but no setter is wired (Phase 2).

- [ ] **1.1 Delete the create-next-app boilerplate.** Replace `src/app/page.tsx` with a minimal placeholder (`return null` or a one-line "Loading scoreboard..." while step 1.5 lands). Confirm `npm run build` still succeeds.

- [ ] **1.2 `WatchingProvider` in `src/lib/watching/provider.tsx`.** React Context: `Watching | null`, `setWatching(snapshot)`, `clearWatching()`. Hook `useWatching()` returns `{ watching, setWatching, clearWatching }`. Throws if used outside the provider. No `useGame` subscription here — that's the pill's job. Test (`provider.test.tsx`) covers set/clear/reset.

- [ ] **1.3 Mount `WatchingProvider` in `src/app/layout.tsx`.** Wraps `{children}` inside the existing `<NhlQueryProvider>`. Safe — pure client-side state.

- [ ] **1.4 `<AppShell>` in `src/components/app-shell.tsx`.** Renders the header (logo on the left, `<NowWatchingPill>` slot on the right) + the breakpoint nav (bottom bar `<lg`, sidebar `>=lg`) + `<main>`. Used by `app/layout.tsx` to wrap `{children}`. Use Tailwind `lg:` breakpoint and `fixed bottom-0` for the bottom bar with `pb-[env(safe-area-inset-bottom)]`.

- [ ] **1.5 `<NowWatchingPill>` in `src/components/now-watching-pill.tsx` (Phase 1 stub).** Reads `useWatching()`. Returns `null` if `watching === null`. In Phase 1, since nothing ever calls `setWatching`, the pill never renders. Phase 2 wires it properly. Why ship the stub now: it lets `<AppShell>`'s slot exist with a real component instead of `<div>` + later refactor.

- [ ] **1.6 Scoreboard at `src/app/page.tsx`.** Uses `useScheduleNow()`. Renders `<DataState>` wrapping a list/grid of `<GameCard>` components. `<GameCard>` is a small file colocated under `src/components/game-card.tsx`: away `<TeamChip>` + score, home `<TeamChip>` + score, `<GameStatePill>`, whole card is a `<Link href={'/game/' + id}>`. Section dividers (`Live` / `Upcoming` / `Final`) when the date has games across status groups. Mobile = 1 column, `md:` 2-column grid, `xl:` 3-column. Empty state: "No games scheduled today."

- [ ] **1.7 `/standings` route at `src/app/standings/page.tsx`.** Uses `useStandings()`. Top of route: a small segmented control toggling division view (Atlantic / Metro / Central / Pacific — 4 cards) vs wild-card view (East / West — 2 cards). Each card is a table of teams. Columns mobile-prioritized (rank, team, GP, PTS); `md:` adds W/L/OTL; `lg:` adds P%. Tap row → `/team/[code]` (link works in Phase 1; the route 404s until Phase 3).

- [ ] **1.8 `/stats` route at `src/app/stats/page.tsx`.** 3-tab segmented control (`Skaters` / `Goalies` / `Teams`). Tab state in URL: `?kind=skater|goalie|team`. Default `skater`. Use `useSkaterStats()` / `useGoalieStats()` / `useTeamStats()` based on the param. Table per kind, top 50 sorted by points / SV% / points respectively. Mobile-prioritized columns (rank, name, key stat); progressively reveal more at `md:` and `lg:`. Tap player row → `/player/[id]` (link works; route 404s until Phase 3). Tap team row → `/team/[code]`.

- [ ] **1.9 URL state helpers in `src/lib/url/`.** `parseStatsKind(searchParams) → StatsKind`, `formatStatsKind(kind) → string`. Plus `parseScoreboardDate` / `formatScoreboardDate` (used in Phase 3 but easier to land here so the integration tests don't need to know about them later). Unit tests for each.

- [ ] **1.10 Integration tests in `src/__integration__/`.** A `setupFetch(fixtures)` helper that intercepts `/api/nhl/<resource>` URLs and returns the corresponding `__fixtures__/` JSON. Tests for: Scoreboard renders cards from fixture, Standings renders 4 division cards by default + flips to 2 wild-card cards, Stats defaults to skater + flips kind via URL. Each test asserts the loading skeleton appears, then the populated UI, then one interaction.

- [ ] **1.11 Commit Phase 1.** All tests green; `npm run build` green; manually open `npm run dev`, navigate between the three routes on both viewports. Commit message: `feat(ui): app shell + scoreboard / standings / stats routes`.

---

## Phase 2 — Game detail + "Now watching" wired end-to-end

The headline screen plus the persistent pill behavior. This is also where Playwright lands.

- [ ] **2.1 Install Playwright.** `npm install -D @playwright/test`; `npx playwright install --with-deps chromium` (Chromium only — Firefox/WebKit not needed for a personal-project smoke layer). Add `test:e2e` script to `package.json`: `"test:e2e": "playwright test"`. Commit.

- [ ] **2.2 `playwright.config.ts` + fixtures-server.** Config boots `npm run dev` on a fixed port for tests. The dev server is configured (via env var `NHL_FIXTURES_MODE=1` read in route handlers) to short-circuit upstream NHL calls and serve from `__fixtures__/` directly — no real network in CI. Keep the env-var branching tiny: a single helper in `src/lib/nhl/fetcher.ts` (`if (process.env.NHL_FIXTURES_MODE) return readFixture(...)`) avoids spreading the conditional across every fetcher. Verify locally: `NHL_FIXTURES_MODE=1 npm run dev` then `curl http://localhost:3000/api/nhl/standings` returns the fixture content.

- [ ] **2.3 `/game/[id]` route at `src/app/game/[id]/page.tsx`.** Uses `useGame(id)`, `usePlayByPlay(id)`, `useBoxscore(id)`. Wraps everything in `<DataState>` keyed on `useGame` (the canonical "is this game even valid" hook; if it 404s, the whole page shows empty state). Awaits `params` per Next 16 conventions.

- [ ] **2.4 `<ScoreHeader>` in `src/components/game/score-header.tsx`.** Always pinned at the top of `/game/[id]`. Layout: away `<TeamLogo>` + team name + score, center status (`<GameStatePill>` with period/clock), home `<TeamLogo>` + team name + score. `X` button on the right calls `clearWatching()` and `router.push('/')`. Props: derived from `useGame` data.

- [ ] **2.5 Tabs/multi-pane layout container.** Use a `useMatchMedia('(min-width: 1024px)')` hook (write it in `src/lib/use-match-media.ts`, ssr-safe with `useSyncExternalStore`). On mobile, render 3 tabs (`Plays` / `Box` / `Shots`) with state in URL hash (`#plays | #box | #shots`, default `plays`). On desktop, render the 3-pane grid (`grid-cols-[1.2fr_1fr_1fr] gap-4`). Each pane scrolls inside `h-[calc(100vh-var(--header-h))]`. The `<RinkPane>` slot is a placeholder ("Shot map coming") in this phase.

- [ ] **2.6 `<PlaysPane>` in `src/components/game/plays-pane.tsx`.** Chronological list, newest first, from `usePlayByPlay`. Each row: time + team color stripe + one-line description + optional `<PlayerChip>`s. Goal rows use `bg-[var(--accent)]/10` highlight; penalty rows tinted differently. Each row has `id="play-{eventId}"` for Phase 4's scroll-into-view.

- [ ] **2.7 `<BoxPane>` in `src/components/game/box-pane.tsx`.** Top: team-stat table (Shots / PP / FO% / Hits / PIM / Blocks / Giveaways / Takeaways) computed from `useBoxscore`. Below: collapsed-by-default per-team skater + goalie tables (`<details>` + `<summary>` is fine — no JS state needed). Tap any player row → `<Link href={'/player/' + id}>` (route exists Phase 3).

- [ ] **2.8 Wire scoreboard tap → set watching + navigate.** Update `<GameCard>` so its click handler calls `setWatching(snapshot)` then `router.push('/game/' + id)`. The snapshot is built from the schedule data already in hand — no extra fetch.

- [ ] **2.9 Wire game-detail mount effect.** Inside `app/game/[id]/page.tsx` (or a small client component), `useEffect` keyed on `params.id` calls `setWatching(snapshotFromUseGame)` once `useGame` data lands. Handles deep links + refreshes. Effect re-runs only when the URL game id changes.

- [ ] **2.10 Wire `<NowWatchingPill>` for real.** Replace the Phase 1 stub. When `watching !== null`, render the pill: away abbrev + away score + `–` + home score + home abbrev + state pill. Wrap in `<Link href={'/game/' + watching.gameId}>`. Subscribe to `useGame(watching.gameId, { enabled: watching !== null })` and update displayed scores from the live data (the pill's `watching` snapshot is the seed; the live values come from React Query's shared cache).

- [ ] **2.11 Integration tests for game detail.** Mocked-fetch tests asserting: (a) score header renders with correct teams + score, (b) all three panes appear on a desktop-width viewport (mocked `matchMedia`), (c) tab switching works on mobile, (d) the X button clears watching + navigates, (e) the scoreboard → game → pill → standings → click pill → game flow keeps the right state.

- [ ] **2.12 Playwright specs in `e2e/`.** `scoreboard.spec.ts` (load `/`, click first card, land on `/game/[id]`), `game.spec.ts` (load `/game/[id]`, score header visible; on mobile viewport all three tabs reachable; on desktop viewport all three panes reachable), `now-watching.spec.ts` (full pill lifecycle from spec section "Testing"). Each runs against `NHL_FIXTURES_MODE=1`.

- [ ] **2.13 Commit Phase 2.** All tests green: `npm run lint && npm run test:run && npm run build && npm run test:e2e`. Commit message: `feat(ui): game detail + Now-watching pill end-to-end + Playwright`.

---

## Phase 3 — Team + Player + Date picker

Fills out the contextual deep-link routes and adds historical scoreboard navigation. After this phase, every "tap-through" link from prior phases works.

- [ ] **3.1 `/team/[code]` route at `src/app/team/[code]/page.tsx`.** Uses `useTeam(code)` and `useRoster(code)`. Header: color band using `TEAM_COLORS[code].primary`, big logo, full team name, division/conference, current record + standings position (read from `useStandings` if cached — opportunistic, don't fetch on demand). Two collapsible sections (`<details>`, open by default on `lg:` via `open` attr controlled by `useMatchMedia`):
  - **Roster**: forwards / defense / goalies as 3 sub-tables, sourced from `useRoster`. Each row tappable → `/player/[id]`.
  - **Recent results**: literal `<p>useTeamSchedule not yet implemented — see plan</p>` placeholder. No spinner, no data hook.

- [ ] **3.2 `/player/[id]` route at `src/app/player/[id]/page.tsx`.** Uses `usePlayer(id)`. Layout: `lg:` side-by-side, mobile stacked. Left/top: headshot (`next/image`, large), full name, position, shoots/catches, height, weight, age, current `<TeamChip>` linking to `/team/[code]`. Right/bottom: career stat table from `usePlayer` data (regular season default; toggle to playoffs if data exists). Most recent season row highlighted.

- [ ] **3.3 Date picker on Scoreboard.** Update `src/app/page.tsx` to read `?date` via `useSearchParams`. When `?date` is present and not today, switch from `useScheduleNow()` to `useSchedule(date)`. Render a date control above the game list: `«` chevron + `<input type="date">` (native, no dep) + `»` chevron. `router.replace` updates `?date` on change. "Today" link visible when `?date !== today`.

- [ ] **3.4 Inbound link sweep.** Confirm every previously-stubbed link works: Scoreboard cards → `/game/[id]` ✓ (Phase 2), Standings rows → `/team/[code]` ✓, Stats player rows → `/player/[id]` ✓, Stats team rows → `/team/[code]` ✓, Box-pane player rows → `/player/[id]` ✓, ScoreHeader logos → `/team/[code]` ✓ (this requires updating `<ScoreHeader>` in step 3.4 to wrap each logo in a `<Link>`).

- [ ] **3.5 Integration tests.** Team page renders header + roster sections from fixtures; placeholder text for recent results is present. Player page renders headshot + bio + career table. Scoreboard with `?date=2025-01-15` switches hooks correctly (`useSchedule(date)` is called, `useScheduleNow` is not).

- [ ] **3.6 Commit Phase 3.** All tests green. Commit message: `feat(ui): team + player routes + scoreboard date picker`.

---

## Phase 4 — Shot map

Replaces the Phase 2 `<RinkPane>` placeholder with the real visualization. Introduces D3 as a runtime dep.

- [ ] **4.1 Install D3.** `npm install d3 @types/d3`. (Could narrow to `d3-scale` + `d3-array` later if bundle size matters; full `d3` is ~25kb gzipped and we'll likely use more of it for future overlays.)

- [ ] **4.2 `src/components/rink/scales.ts` + test.** Exports `xScale`, `yScale` (D3 linear scales 0..1 → 0..100 / 0..85), `distanceFromGoal(x, y)` (in feet), `isShotKind(typeDescKey): boolean`, and `shotKindOf(typeDescKey): 'goal' | 'shot-on-goal' | 'missed-shot' | 'blocked-shot'`. Test: assert (0.5, 0.5) maps to (50, 42.5); assert distance from (1.0, 0.5) to the goal at (100, 42.5) is 0; assert classifier handles all NHL `typeDescKey` values that should count as shots.

- [ ] **4.3 `src/components/rink/RinkBackdrop.tsx`.** Pure-static SVG component. `<svg viewBox="0 0 100 85" preserveAspectRatio="xMidYMid meet" class="aspect-[100/85]">` containing: red goal line at `x=89`, blue line at `x=25`, faceoff dots at `(69, 22)` and `(69, 63)`, faceoff circles, center-zone hash marks, the crease arc in front of the goal, the goal rectangle, the trapezoid lines behind the net, net hash marks. All strokes use `var(--rink-line)`. No props besides `className` for layout overrides.

- [ ] **4.4 `src/components/rink/ShotDot.tsx`.** Renders a single shot dot. Props: `cx`, `cy`, `kind`, `side`, `focused?`, `onClick?`. Switches on `kind` to render filled circle (goal — r=2.2, gold ring), filled circle (sog — r=1.5), open ring (miss — r=1.5 stroke only), small "x" path (block — ~r=1.2). Color via `var(--home)` / `var(--away)`. Includes an `<title>` child for accessible default tooltip.

- [ ] **4.5 `src/components/rink/RinkControls.tsx`.** Filter toggles above the rink: `Home` / `Away` (both on by default), `Goals` / `SOG` / `Missed` / `Blocked` (all on by default), period filter `All / 1P / 2P / 3P / OT` (segmented). Pure controlled component — state is owned by `<RinkPane>`.

- [ ] **4.6 `<RinkPane>` in `src/components/rink/RinkPane.tsx`.** Replaces the Phase 2 placeholder. Consumes `useGame(id)` (for `homeTeam.id`) and `usePlayByPlay(id)` (for plays). Memoized derive: `plays.filter(isShotKind).map(p => ({ id: p.eventId, ...normalizeShot(p, homeTeamId), kind: shotKindOf(p.typeDescKey), period: p.periodDescriptor.number, shooter: ..., clock: p.timeInPeriod }))`. Apply filter state to the list. Render `<RinkBackdrop />` overlaid with `{positions.map(<ShotDot ...>)}`.

- [ ] **4.7 Hover tooltip.** Positioned `<div>` overlay (not `<title>` — that's the fallback). On dot hover/focus, show shooter name, distance to goal (computed via `distanceFromGoal`), kind, period/clock. On touch devices: tap-to-pin tooltip (a second tap dismisses).

- [ ] **4.8 Bidirectional shot ↔ play link.** Click a shot dot → set a `selectedEventId` state in `<RinkPane>` (lifts up to `/game/[id]/page.tsx` so `<PlaysPane>` can react). `<PlaysPane>` listens for `selectedEventId` changes and calls `document.getElementById('play-' + id)?.scrollIntoView({ block: 'center' })`. Click a play row in `<PlaysPane>` → set `selectedEventId` → `<RinkPane>`'s `<ShotDot>` for that id renders with `focused={true}` (bigger radius, outline) for ~2 seconds via a `useEffect` cleanup timer.

- [ ] **4.9 Integration tests.** Test renders `<RinkPane>` with a fixture-derived play list, asserts the right number of dots appear, clicks a dot and asserts a `data-selected-event-id` attribute (or similar test seam) propagates correctly. Filter toggles change visible-dot count.

- [ ] **4.10 Update README.** Add a "Visualizations" subsection under the existing data-layer doc covering: where the rink lives, how to add a new overlay, the React–D3 split rule. Brief — the spec is the source of truth.

- [ ] **4.11 Commit Phase 4.** All tests green: `npm run lint && npm run test:run && npm run build && npm run test:e2e`. Commit message: `feat(ui): shot map (D3 scales + half-rink offensive overlay)`.

---

## Out of plan (deferred)

- **Framer Motion shot-dot animations.** Spec'd as the chosen path; not added to deps until we want them.
- **`useTeamSchedule` hook.** Required for the Team page's "Recent results" section. Separate spec; placeholder in Phase 3 acknowledges the gap.
- **Heatmap / contour overlays.** Future overlays on the rink (`d3.contourDensity()`); the React–D3 split established in Phase 4 makes them additive.
- **Voronoi hover targets.** If shot-dot hover targets feel too small on touch devices, add `d3.Delaunay`-based larger invisible hit regions over the dots.
- **Per-team color band on `<ScoreHeader>`.** Could pull from `TEAM_COLORS` and add a thin gradient strip; nice-to-have, not in MVP.
- **Favorites / follow-a-team.** Out of scope per spec.
- **Auth, notifications, offline.** Out of scope per spec.
- **SSR prefetching for static pages (Standings/Stats/Team).** Worth revisiting if those routes feel sluggish in production.

---

## Working notes (live)

Use this section as a scratchpad while implementing — surprises, decisions, things to revisit. Keep it terse.

- **2026-05-09 — Phase 0.1.** NHL team logos are SVG. Next 16 blocks SVG optimization by default (script-injection risk); enabled with `dangerouslyAllowSVG: true` + the recommended sandboxing CSP. Acceptable risk because the upstream is a single trusted CDN.
- **2026-05-09 — Phase 0.1.** `new URL("https://host/path/**")` shorthand pins `search: ''` (rejects all query strings). NHL serves `…/svg/<TEAM>_light.svg?season=20252026` for some season-variant logos, so I switched to the object form and omitted `search` per the docs ("Omitting the `search` property allows all search parameters"). Acceptable here because the upstream host is trusted; the spec's "minimal surface" instinct loses to the practical "rendered URLs from fixtures must work" requirement.
- **2026-05-09 — Phase 0.1.** Verified the config end-to-end via `curl /_next/image?url=...` against `npm run dev` — `<Image>`-in-throwaway-page is overkill; the optimizer endpoint is the same code path and faster to test. Future image-config changes can use the same shortcut.
