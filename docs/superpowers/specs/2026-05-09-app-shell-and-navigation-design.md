# NHL Companion — App Shell & Navigation Design

Status: design approved 2026-05-09. Awaiting implementation plan (writing-plans).

## Goals

Build the responsive app shell and the screens it frames, on top of the existing NHL data layer ([2026-05-09-nhl-data-layer-design.md](./2026-05-09-nhl-data-layer-design.md)). Specifically:

- Three top-level surfaces accessible from a persistent navigation: **Scoreboard**, **Standings**, **Stats**.
- A **Game detail** route that is the headline second-screen experience.
- A **"Now watching" pill** in the header that keeps a focused game one tap away from anywhere.
- **Team** and **Player** routes reached contextually (tap a team logo, tap a player name).
- A **shot map** in Game detail rendered as an SVG rink with D3-driven scales.
- A consistent loading/error model that maps the data layer's `NhlApiError` categories to UI states.
- Test coverage at three levels (unit, integration, smoke E2E with Playwright — first time Playwright is added to the project).

## Non-goals

- No auth, no per-user favorites, no notifications, no offline mode.
- No SSR-rendered NHL data — every NHL hook is client-side polling. Routes render their static chrome on the server, then hydrate the hooks. The existing `QueryClientProvider` already handles this.
- No persistence of the "Now watching" selection across browser sessions (in-memory only).
- No `useTeamSchedule` hook — the Team page renders a "Recent results" placeholder; that hook is a future addition.

## Information architecture

### Routes

All under `src/app/` using the App Router.

| Route | Purpose | Hook(s) consumed |
|---|---|---|
| `/` | Scoreboard. Today by default; `?date=YYYY-MM-DD` for other days | `useScheduleNow` / `useSchedule(date)` |
| `/game/[id]` | Game detail (multi-pane on desktop, tabs on mobile) | `useGame`, `usePlayByPlay`, `useBoxscore` |
| `/standings` | League standings, division or wild-card view | `useStandings` |
| `/stats` | Leaderboards (`?kind=skater\|goalie\|team`) | `useSkaterStats` / `useGoalieStats` / `useTeamStats` |
| `/team/[code]` | Team page (header, roster, recent-results placeholder) | `useTeam`, `useRoster` |
| `/player/[id]` | Player page (headshot, bio, career stats) | `usePlayer` |

The first three are top-level nav. `/game/[id]`, `/team/[code]`, and `/player/[id]` are reached contextually.

### Navigation primitive

Tailwind v4 breakpoint pivot: **`lg` (1024px)**.

- **`<lg`**: header (logo + "Now watching" pill, sticky top, `h-12`) + main content + a fixed bottom tab bar (`h-14`, safe-area inset on iOS) holding **Scoreboard / Standings / Stats**.
- **`>=lg`**: header (same) + a left rail (`w-56`, `border-r`) holding the three nav items vertically + flex-1 main content. No bottom bar.

The shell is a single `app/layout.tsx`. Header and nav are shared across every route; only `{children}` changes.

### "Now watching" pill

The pill is a persistent header element that surfaces a user-picked game from anywhere in the app. State model:

- Lives in a tiny `WatchingProvider` (React Context) at the root layout. **Pure in-memory state** — no localStorage, no URL.
- Shape:
  ```ts
  type Watching = {
    gameId: number;
    away: string; // team abbreviation
    home: string;
    awayScore: number;
    homeScore: number;
    state: 'PRE' | 'LIVE' | 'CRIT' | 'FINAL' | 'OFF' | 'FUT';
  } | null;
  ```
- The minimum needed to render the pill without re-fetching.
- **Set**: tapping a game card on Scoreboard calls `setWatching(snapshot)` and routes to `/game/[id]`. The Game-detail page also calls `setWatching` from a `useEffect` keyed on `params.id` so deep links and refreshes seed the pill (the effect re-runs only when the URL game id changes).
- **Live update**: the pill component conditionally calls `useGame(watching.gameId, { enabled: watching !== null })` so the score in the pill stays current via React Query's shared cache (no duplicate polling). The hook is a no-op when nothing is being watched.
- **Open**: tapping the pill routes to `/game/[gameId]`.
- **Clear**: an `X` button in the Game-detail header calls `clearWatching()` **and** routes back to `/`. The "clear and navigate" pair is one action — clearing while staying on the game page would let the page's mount effect re-seed the pill on the next render, which is not what the user signalled.

### Theming

- Honor the existing dark/light scaffolding (the default `app/page.tsx` already uses `dark:` classes).
- Define color tokens as CSS variables in `src/app/globals.css`: `--bg`, `--surface`, `--surface-hover`, `--border`, `--text`, `--text-muted`, `--accent`, `--live`, `--rink-line`, `--home`, `--away`. The `.dark` class flips the values; default uses `prefers-color-scheme`.
- Reference tokens via `bg-[var(--bg)]` only where the token is meaningful. Everything else stays Tailwind utility classes.

## Loading & error model

A single `<DataState>` helper in `src/components/data-state.tsx` accepts:

```ts
type DataStateProps = {
  isLoading: boolean;
  error: NhlApiError | null;
  hasData: boolean;
  skeleton: ReactNode;
  children: ReactNode;
};
```

It maps the data layer's error categories to UI uniformly:

| Condition | UI |
|---|---|
| `isLoading && !hasData` | Render `skeleton` (variant matching the eventual content) |
| `error.kind === 'network' \| 'timeout'` | Small "delayed" badge in the pill or in-place; React Query keeps polling; render last-known data if any |
| `error.kind === 'schema'` or `error.kind === 'http'` with `status >= 500` | Banner at top of route ("data unavailable, last seen at ..."); show stale data if available |
| `error.kind === 'http'` with `400 <= status < 500` | Empty state for that view (e.g., "Game not found") |
| `hasData` | Render `children` |

Skeletons are typed: `<Skeleton variant="card" />`, `<Skeleton variant="row" />`, `<Skeleton variant="rink" />`. No spinners anywhere.

## Per-screen content

### Scoreboard — `/`

- Hook: `useScheduleNow()` when `?date` is absent or matches today; `useSchedule(date)` otherwise. Same render code path either way (the schemas overlap in the fields the UI consumes).
- **Layout**: 1-column list of game cards on phone; `md:` = 2-column grid; `xl:` = 3-column.
- **Game card content**: away team (logo + abbreviation + record) `vs` home team (logo + abbreviation + record), score (or start time), `<GameStatePill>` (`LIVE 2P 8:14` / `FINAL` / `7:00 PM ET` / `PRE`). Whole card is the tap target.
- **Date control** (top of route): `«` `YYYY-MM-DD` `»` chevrons + a small calendar popover using a native `<input type="date">` (no extra dep). URL is the source of truth: `?date=` is mutated via `router.replace` so back/forward and shareable links work.
- **Empty state**: "No games scheduled for this date."
- **Section dividers** when the date has games across status groups: `Live` / `Upcoming` / `Final`. Sort within groups by start time.

### Game detail — `/game/[id]`

- Hooks: `useGame(id)`, `usePlayByPlay(id)`, `useBoxscore(id)`. All three poll at the cadence wired in their hooks; pause when the tab is hidden.
- **Always pinned**: `<ScoreHeader>` at the top — away logo, score, period/clock/situation, home logo, score. Includes the `X` to clear "Now watching".
- **Layout below header**:
  - **`<lg`**: 3 tabs (`Plays` / `Box` / `Shots`). Tab state lives in URL hash (`#plays | #box | #shots`) so back/forward works and the page is linkable. Default tab: `#plays`.
  - **`>=lg`**: 3-column grid (`grid-cols-[1.2fr_1fr_1fr] gap-4`): `<RinkPane>` left, `<PlaysPane>` middle, `<BoxPane>` right. Each pane scrolls independently inside fixed-height columns (`h-[calc(100vh-header-h)]`).
- **`<PlaysPane>`**: chronological list of plays, newest first. Goal rows highlighted, penalty rows tinted, ordinary plays muted. Each play: time, team color stripe, one-line description, optional `<PlayerChip>`s.
- **`<BoxPane>`**: team-stat table at top (Shots / PP / FO% / Hits / PIM / Blocks / Giveaways / Takeaways), then collapsed-by-default per-team skater + goalie tables. Tap a player row → `/player/[id]`.
- **`<RinkPane>`**: see [Shot map](#shot-map).

### Standings — `/standings`

- Hook: `useStandings()`.
- **Default view**: division standings (4 cards: Atlantic / Metro / Central / Pacific).
- **Toggle to wild-card view** (2 cards: East / West) via a small segmented control at the top.
- Each card is a table: rank, team logo+name, GP, W, L, OTL, PTS, P% (when there's room). Highlight playoff line and wild-card cutoffs with a subtle horizontal rule + label.
- Tap team row → `/team/[code]`.

### Stats — `/stats`

- Hooks: `useSkaterStats()` / `useGoalieStats()` / `useTeamStats()`.
- **Top**: 3-tab segmented control (`Skaters` / `Goalies` / `Teams`). Tab state in URL: `?kind=skater|goalie|team`. Defaults to `skater`.
- **Body**: a paginated table per kind, top 50 by points (skater) / SV% (goalie) / points (team). Columns scaled by breakpoint; the most important columns stay visible on phone, less-important columns appear at `md:` and `lg:`.
- Tap player row → `/player/[id]`. Tap team row → `/team/[code]`.

### Team — `/team/[code]`

- Hooks: `useTeam(code)`, `useRoster(code)`.
- **Header**: team color band (driven by the static `TEAM_COLORS` map — see [Shared components](#shared-components)), big logo, full name, division/conference, current record + standings position (read from `useStandings` if cached).
- **Two collapsible sections** (open by default on `lg:`):
  - **Roster**: forwards / defense / goalies as 3 sub-tables.
  - **Recent results**: placeholder ("`useTeamSchedule` not yet implemented") — a future spec adds the hook.
- Tap player row → `/player/[id]`.

### Player — `/player/[id]`

- Hook: `usePlayer(id)`.
- **Layout** (`lg:` side-by-side, mobile stacked):
  - Left/top: headshot (`next/image`), full name, position, shoots/catches, height, weight, age, current team logo + name.
  - Right/bottom: career stat table (regular season by default; toggle to playoffs if data exists). Most recent season highlighted.
- Tap team logo → `/team/[code]`.

## Shared components

Introduced under `src/components/` for reuse across routes.

- `<TeamLogo code size />` — wraps `next/image` with a known fallback. Hosts under NHL CDN added to `next.config.ts` `images.remotePatterns`.
- `<TeamChip code />` — logo + abbreviation, used in plays, boxscore rows, scoreboard cards.
- `<PlayerChip id name />` — headshot circle + name, used in plays.
- `<GameStatePill state period clock />` — the LIVE/FINAL/time pill, used on cards and in the score header.
- `<DataState>` — the loading/error/data switch (see [Loading & error model](#loading--error-model)).
- `<Skeleton variant="card|row|rink" />` — typed skeletons matching each component's footprint.
- `TEAM_COLORS` — a static `Record<TeamCode, { primary: string; secondary: string }>` map. Used by `<TeamLogo>` fallback background, Team page color band, and play-row team stripes. Hand-maintained, ~32 entries.

## Shot map

The data layer already does the heavy lifting: `normalizeShot(play, homeTeamId)` in [src/lib/nhl/playByPlay/normalizeShot.ts](../../src/lib/nhl/playByPlay/normalizeShot.ts) returns `{ x, y, side }` with `x ∈ [0, 1]` always pointing toward the attacking goal and `y` flipped to match. Both home and away shots project onto the same coordinate space — the conventional "offensive-zone-overlay" shot map.

### Coordinate model

- We render a **half rink** (offensive-zone view). SVG `viewBox` is `0 0 100 85` (NHL feet); the rink occupies the full width and the attacking goal is at `x = 100`.
- A `<RinkBackdrop />` component is pure-static SVG: red goal line at `x = 89`, blue line at `x = 25`, two offensive-zone faceoff dots at `(69, 22)` and `(69, 63)`, faceoff circles, the crease arc in front of the goal, the goal rectangle, the trapezoid behind the net, and net hash marks. All as `<line>`, `<circle>`, `<path>` JSX with token-driven stroke colors (`var(--rink-line)`).
- Scaled via SVG `viewBox` + `preserveAspectRatio="xMidYMid meet"`. Container is `aspect-[100/85]`; the rink fills whatever pane it sits in (mobile tab content or desktop left pane).

### D3's job

- `xScale = d3.scaleLinear().domain([0, 1]).range([0, 100])` and `yScale = d3.scaleLinear().domain([0, 1]).range([0, 85])`. These convert the normalized `(x, y)` from `normalizeShot` into SVG-feet.
- Memoized with `useMemo`. The domain is constant; the range only changes if rink dimensions change.
- D3 also handles future overlays where it's the right tool: contour heatmaps via `d3.contourDensity()`, voronoi for hover targets via `d3.Delaunay`, color interpolation for shot quality. None of these are MVP; noted to keep the seam clean.

### React–D3 split

**D3 owns math, React owns the DOM.** No `d3.select(ref.current)` mutating SVG. Pattern: hooks like `useShotPositions(plays, homeTeamId)` that return `{ id, cx, cy, side, kind }[]`, then JSX:

```tsx
{positions.map(s => (
  <circle key={s.id} cx={s.cx} cy={s.cy} r={1.5}
    className={shotClass(s)} onClick={() => onSelectShot(s.id)} />
))}
```

Animations (new shots fading in) will use Framer Motion's `<motion.circle>` with `key`-based `AnimatePresence`. Out of MVP scope; spec'd as the chosen path for when we add it. **No transitions stored on D3 selections** — that's the React–D3 anti-pattern.

### Visual encoding

Two channels.

**Side** (home vs away) → color:
- home: `var(--home)`
- away: `var(--away)`

**Kind** (`goal | shot-on-goal | missed-shot | blocked-shot`) → shape/stroke:
- `goal`: filled circle, larger radius (2.2 SVG-feet), gold ring
- `shot-on-goal`: filled circle (1.5)
- `missed-shot`: open ring (1.5, stroke only)
- `blocked-shot`: small "x" path (1.2)

Both channels are token-backed for dark/light readability.

**Filter controls** (`<RinkControls>`, above the rink): toggles for `Home / Away`, toggles for `Goals / Shots on goal / Missed / Blocked`, and a period filter (`All / 1P / 2P / 3P / OT`). Filter state is component-local (no URL — these are exploratory toggles, not shareable).

### Interactivity (MVP)

- **Hover**: SVG `<title>` element for accessible default tooltip + a positioned `<div>` overlay tooltip with shooter name, distance to goal (`Math.hypot(100 - x_ft, 42.5 - y_ft)`), event kind, period/clock. Touch devices: tap-to-pin tooltip.
- **Click a shot**: scrolls `<PlaysPane>` to the corresponding play. The play's `eventId` becomes a `#play-{eventId}` anchor; the pane uses `scrollIntoView({ block: 'center' })`.
- **Click a play in the plays pane**: highlights the corresponding shot dot (`.is-focused` class with bigger radius + outline) for 2 seconds. Bidirectional link.

### Data flow

- `<RinkPane>` consumes `useGame(id)` (for `homeTeam.id`) and `usePlayByPlay(id)` (for the play list). Both already deduplicate via React Query — no extra fetching.
- Memoized derive step: `plays.filter(isShotKind).map(p => ({ id: p.eventId, ...normalizeShot(p, homeTeamId), kind: p.typeDescKey, ... }))`. Recomputed when `playByPlay.data` changes (only on a successful poll).
- Skeleton state: render `<RinkBackdrop />` at low opacity with no dots, plus a shimmer over the controls. The rink itself is the skeleton — no separate "loading" affordance.

### File layout

```
src/components/rink/
  RinkBackdrop.tsx       static SVG rink elements
  RinkPane.tsx           container; consumes hooks, owns filters, renders dots
  RinkControls.tsx       filter toggles
  ShotDot.tsx            single dot variants (Goal / SOG / Miss / Block)
  scales.ts              d3 scales + helpers (distance, isShotKind)
  scales.test.ts         unit tests for normalization → pixel mapping
```

## Testing

Three layers, scaled to risk.

### Unit (Vitest, jsdom)

- `scales.test.ts`: `normalizeShot → pixel` round-trip, distance math, `isShotKind` classifier.
- `<DataState />`: renders skeleton when loading, banner when `error.kind === 'schema'` or http >= 500, empty state on http 4xx, children on data.
- `<GameStatePill />`: renders correctly for each `gameState` value.
- `WatchingProvider`: `setWatching` updates context, `clearWatching` resets, multiple consumers stay in sync.
- URL-derived state helpers: `parseStatsKind`, `parseGameTab`, `parseScoreboardDate` (plus their `format*` inverses).

### Integration (Vitest + React Testing Library)

Each screen test loads a route component, asserts the loading skeleton, resolves the mocked fetch, asserts the populated UI, then asserts behavior of one interaction (tap a card, switch a tab, click a shot dot).

**Mocking approach**: a small `setupFetch(fixtures)` helper that pattern-matches `/api/nhl/<resource>` URLs and returns a fixture from `src/lib/nhl/<resource>/__fixtures__/`. **No MSW** — the existing fixtures + a 30-line route-matching helper is enough; MSW would be a third testing-only dependency.

Screens covered: Scoreboard (today + with `?date`), Game detail (each tab on mobile, all panes on desktop via a `matchMedia` mock), Standings, Stats (all three kinds), Team, Player.

### End-to-end (Playwright)

This spec adds Playwright to the project for the first time, fulfilling the "add when the first UI feature lands" note in [CLAUDE.md](../../CLAUDE.md).

- Setup: `@playwright/test`, `playwright.config.ts` boots `npm run dev` against a fake NHL upstream (a Next.js Route Handler that serves the fixtures from `__fixtures__/` directly — no real network in CI). Tests in `e2e/`.
- Smoke specs (intentionally few; this is not where we live):
  - `e2e/scoreboard.spec.ts`: load `/`, see at least one game card, tap a card, land on `/game/[id]`.
  - `e2e/game.spec.ts`: load `/game/[id]`, score header is visible, all three tabs reachable on mobile viewport, all three panes reachable on desktop viewport.
  - `e2e/now-watching.spec.ts`: pick a game from Scoreboard → pill appears → navigate to `/standings` → pill still there → click pill → back at game detail → click X → pill gone.
- Not covered by E2E: Standings/Stats correctness, individual shot positions, hover tooltips. Those are integration-test territory.

### CI

- New script: `npm run test:e2e` → `playwright test`.
- CI command: `npm run lint && npm run test:run && npm run build && npm run test:e2e`.
- The current `npm test` (watch) and `npm run test:run` (CI single-run) stay as they are.

## Phasing

Each phase is independently shippable and testable. The implementation plan (writing-plans) will refine these.

### Phase 0 — Foundation

- `next.config.ts`: NHL CDN hosts in `images.remotePatterns`.
- `src/app/globals.css`: color tokens (`--bg`, `--surface`, `--border`, `--text`, `--text-muted`, `--accent`, `--live`, `--rink-line`, `--home`, `--away`) for both light and dark themes.
- `src/components/`: `<DataState>`, `<Skeleton>`, `<TeamLogo>`, `<TeamChip>`, `<PlayerChip>`, `<GameStatePill>`. Unit tests for each.
- `TEAM_COLORS` static map.

### Phase 1 — Shell + 3 nav surfaces

- Root `app/layout.tsx` (header, bottom nav `<lg`, sidebar `>=lg`).
- `WatchingProvider` mounted at root (no game wiring yet — pill renders only on Game detail in Phase 2).
- Replace `app/page.tsx` boilerplate with the Scoreboard (today only, no date control yet).
- `/standings` route.
- `/stats` route with the 3-kind tab.
- End of phase: app navigates between three screens; loading and error states render correctly.

### Phase 2 — Game detail + "Now watching" wired end-to-end

- `/game/[id]` route with `<ScoreHeader>`, multi-pane desktop / tabbed mobile layout.
- `<PlaysPane>`, `<BoxPane>` fully implemented.
- Placeholder `<RinkPane>` ("Shot map coming").
- Tap-card-on-Scoreboard → routes + sets watching. Pill becomes interactive (live score updates via shared `useGame` cache).
- URL-hash tab state on Game detail (`#plays | #box | #shots`).
- `e2e/now-watching.spec.ts` and `e2e/game.spec.ts` pass.

### Phase 3 — Team + Player + Date picker

- `/team/[code]` route (header, roster sections, recent-results placeholder).
- `/player/[id]` route (headshot, bio, career stat table).
- Date control on Scoreboard with `?date` param + `useSchedule(date)`.
- All inbound contextual links from Scoreboard / Standings / Stats / Boxscore start working.

### Phase 4 — Shot map

- `<RinkBackdrop>`, `scales.ts` (D3 scales + helpers), `<ShotDot>` variants.
- `<RinkControls>` filters (side / kind / period).
- Hover tooltips with shooter/distance/kind.
- Click-to-scroll-plays + plays-to-shot bidirectional highlight.
- Replace the Phase 2 `<RinkPane>` placeholder.
- End of phase: full live companion experience.

Each phase commits as a stack of small commits (matching the data-layer commit style — one feature per commit), and each phase ends with all tests passing including the relevant new E2E spec.

## Dependencies added by this spec

- `d3` (full or `d3-scale` + `d3-array` if we want a smaller surface) — Phase 4.
- `@playwright/test` — Phase 1 (E2E setup) or Phase 2 (when the first specs are written). Decided in the implementation plan.
- `framer-motion` — **not in MVP**. Mentioned for future shot-dot animations only.

## Open questions

None blocking. The implementation plan will choose precise NHL CDN hosts to allow-list (depends on which logo/headshot URLs the fixtures actually return) and whether to import `d3` whole or piecewise.
