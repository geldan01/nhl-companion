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

- [x] **0.2 Define color tokens in `src/app/globals.css`.** Done. Added all 11 spec tokens under `:root` (light) with overrides under `@media (prefers-color-scheme: dark)`. Deferred the `.dark` class hook from the spec — there's no UI toggle to flip a class yet, and adding both branches now is dead code. Will revisit when a theme toggle lands. Kept the existing `--background`/`--foreground` aliases (now `var(--bg)` / `var(--text)`) so the boilerplate `page.tsx` keeps rendering until Phase 1.1 replaces it. `body` switched from `--background`/`--foreground` to `--bg`/`--text` directly. Visual smoke check deferred (no browser session); the existing page uses explicit Tailwind classes (`bg-zinc-50`, `dark:bg-black`, etc.) that don't read these tokens, so the body color is mostly hidden behind the page's own styling — render is unchanged. `npm run build` clean.

- [x] **0.3 `src/lib/team-colors.ts`.** Done. 32 teams (verified against `standings/__fixtures__/standings.json` — all `teamAbbrev.default` values present in the map and vice versa). Hex values track each team's official primary/secondary identity at the time of writing. Exports: `TeamCode` (string-literal union of the 32 codes), `TeamColors`, `TEAM_COLORS`, `FALLBACK_TEAM_COLORS` (neutral grey), `getTeamColors(code)` runtime fallback helper. Tests (`team-colors.test.ts`, 4 cases): map covers exactly the fixture's 32 codes; every primary and secondary matches `^#[0-9A-Fa-f]{6}$`; `getTeamColors` returns mapped colors for known codes and the fallback for unknown.

- [x] **0.4 `<DataState>` in `src/components/data-state.tsx` + test.** Done. Props: `isLoading`, `error`, `hasData`, `skeleton`, `emptyState?`, `children`. Branch order (matters): hard error first (4xx → empty state slot or default "Not found." / "Unavailable (5xx)."; schema or http ≥ 500 → top banner + stale children if any), then loading-skeleton (only when `!hasData`), then soft error (`network`/`timeout` → absolute-positioned "Delayed" badge over children), then plain children. Default empty state and banner internal — components consuming `<DataState>` only need to pass a custom `emptyState` when the default text is wrong. Tests (9 cases) cover every branch, including the precedence rule and the default-vs-custom empty state.

- [x] **0.5 `<Skeleton>` in `src/components/skeleton.tsx`.** Done. Four variants — `card` (h-28 rounded), `row` (h-8 rounded), `rink` (aspect-100/85), `pill` (inline-block h-5 w-24 rounded-full). Optional `count` repeats with `flex flex-col gap-2`. Optional `className` for layout overrides. `aria-hidden` on every block so screen readers skip the visual placeholder. No tests yet — pure-presentational, will be exercised by the integration tests in 1.10.

- [x] **0.6 `<TeamLogo>` in `src/components/team-logo.tsx`.** Done. URL convention: `https://assets.nhle.com/logos/nhl/svg/{code}_dark.svg` (the `_dark` SVG variant works on both light and dark UI backgrounds — outlines stay opaque). Wraps `next/image` with `unoptimized` because SVG optimization is a no-op (it's already vector); this also bypasses the `/_next/image` proxy entirely, so SVG logos don't actually rely on the `dangerouslyAllowSVG` flag from 0.1 — that flag only matters as a defense-in-depth for any future code that forgets to set `unoptimized`. Container is an inline-flex span with `background: primary` from `getTeamColors`, sized via the `size` prop (default 32) — this also doubles as the loading-state placeholder. `alt` is the team code.

- [x] **0.7 `<TeamChip>` in `src/components/team-chip.tsx`.** Done. `<TeamLogo>` (default 24px) + abbreviation (font-medium) + optional record in muted xs. Inline-flex with `gap-2`. Plain composition over `<TeamLogo>` — no extra logic.

- [x] **0.8 `<PlayerChip>` in `src/components/player-chip.tsx`.** Done — with a deviation. The plan called for props `{id, name}` and constructing the URL from id, but NHL headshots are season- and team-keyed (`/mugs/nhl/{season}/{team}/{id}.png`) — id alone is insufficient. Switched to props `{name, headshotUrl?}`: consumers thread the URL from the data layer (boxscore.player.headshot, player.headshot, etc.) and we render initials on a neutral circle when no URL is provided. `id` is dropped — callers use the parent component's `<Link href="/player/[id]">` for navigation.

- [x] **0.9 `<GameStatePill>` in `src/components/game-state-pill.tsx` + test.** Done. Props as specced. Pure formatting helper `pillText()` exported alongside the component for direct testability (no need to query rendered DOM for string assertions). LIVE/CRIT → `LIVE NP MM:SS`; FINAL/OFF → `FINAL`; PRE/FUT → locale-formatted time from `startTimeUTC` or "SCHEDULED" if missing; unknown states fall through to the raw value. Period beyond 3 → `OT`, `2OT`, `3OT`, etc. Live color = `var(--live)`, everything else = `var(--text-muted)`. 10 tests cover each state, OT periods, missing fields, and the color-class mapping. Type `KnownGameState` exported for callers that want narrowed input.

- [x] **0.10 Update `src/lib/nhl/index.ts` if needed.** Confirmed no-op. Components import `NhlApiError` via the existing `import type { NhlApiError } from "@/lib/nhl"` re-export; nothing else from this phase belongs in the data-layer surface.

- [x] **0.11 Commit Phase 0.** Done as a stack of per-step commits (commits `d8ff9d1`, `63f0700`, `a563af4`, `607f707`, `31d697c`, `0361fac`, `2ac70b6`, `ddcff38`) rather than one phase-closing commit, because each step landed cleanly and the per-step commit messages already document what changed. Final greens: lint clean, 72 tests green (10 added in 0.4 + 4 in 0.3 + 9 in 0.9), `npm run build` green with no new routes (none added in this phase).

---

## Phase 1 — App shell + three nav surfaces

The skeleton: header, breakpoint nav, and the three top-level pages (Scoreboard / Standings / Stats), all wired through `<DataState>` and using the Phase 0 components. The "Now watching" pill renders nothing yet — `WatchingProvider` is mounted but no setter is wired (Phase 2).

- [x] **1.1 Delete the create-next-app boilerplate.** Done. `src/app/page.tsx` is now a one-liner "Loading scoreboard…" placeholder until 1.6 lands the real Scoreboard. Also took the opportunity (per the 0.2 working note) to drop the now-unused `--background`/`--foreground` aliases and the matching `@theme inline { --color-background, --color-foreground }` keys — the body uses `--bg`/`--text` directly. `@theme inline` keeps only the font keys. Build clean.

- [x] **1.2 `WatchingProvider` in `src/lib/watching/provider.tsx`.** Done. Context value `{ watching, setWatching, clearWatching }`; `WatchingSnapshot` type exported alongside (uses `KnownGameState | string` for the state field — narrow when known, permissive for forward compat). `useWatching()` throws with a clear message when called outside the provider. `useCallback`/`useMemo` keep value identity stable so consumers don't re-render on unrelated state changes. Public surface re-exported from `src/lib/watching/index.ts`. 5 tests cover the full lifecycle: initial null, set, clear, multi-consumer sync, and the "throws outside provider" guard.

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
- **2026-05-09 — Phase 0.2.** Skipped the `.dark` class hook from the spec (no UI toggle exists yet — would be dead code). Tokens flip via `prefers-color-scheme` only; revisit when a theme toggle ships. Single `--rink-line` token may need to expand to `--rink-red`/`--rink-blue`/`--rink-edge` in Phase 4 once we render the actual rink — punted for now.
- **2026-05-09 — Phase 0.6.** SVG team logos use `unoptimized` on `next/image` because vector optimization is a no-op. Side effect: SVG logos don't actually go through the Next image proxy, so `dangerouslyAllowSVG` from 0.1 is now defense-in-depth only (it'd kick in if some future code rendered an SVG via the proxy without `unoptimized`).
- **2026-05-09 — Phase 0.8.** Plan said `<PlayerChip>` props are `{id, name}` and we'd construct the headshot URL from `id`. NHL headshots are actually keyed by `{season, team, id}`, so id alone isn't enough. Changed props to `{name, headshotUrl?}`; consumers thread the URL from whichever response holds it. Initials fallback when missing.
