# nhl-companion

Web-based companion app to use while watching live NHL games. Pulls data from the official NHL APIs (plays, shots, penalties, etc.) and renders rich visuals — team logos, player photos, rink/shot diagrams, charts.

Built on **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript 5** + **Tailwind CSS v4**. See [`CLAUDE.md`](CLAUDE.md) for the full project conventions.

## Getting started

```bash
npm install
npm run dev       # Turbopack dev server at http://localhost:3000
```

Other commands:

```bash
npm run build     # production build
npm run lint      # eslint
npm test          # vitest in watch mode
npm run test:run  # vitest single run (CI)
```

## Working with NHL data

The data layer lives in [`src/lib/nhl/`](src/lib/nhl). Design and rationale: [`docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md`](docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md).

### Quick reference

```ts
'use client';
import { useGame } from '@/lib/nhl/game';
import { useSchedule } from '@/lib/nhl/schedule';

function ScorePill({ id }: { id: number }) {
  const { data, error } = useGame(id);
  if (error) return <span>error: {error.kind}</span>;
  if (!data) return <span>…</span>;
  return <span>{data.awayTeam.score} – {data.homeTeam.score}</span>;
}
```

UI components import only the per-module hook (and types) from `src/lib/nhl/<resource>/index.ts`. URLs, polling intervals, query keys, and Zod schemas stay private to the module.

### Available endpoints

| Module | Hook | Path |
|---|---|---|
| `schedule` | `useSchedule(date)` | `/api/nhl/schedule/[date]` |
| `scheduleNow` | `useScheduleNow()` | `/api/nhl/schedule-now` |
| `game` | `useGame(id)` | `/api/nhl/game/[id]` |
| `playByPlay` | `usePlayByPlay(id)` | `/api/nhl/game/[id]/play-by-play` |
| `boxscore` | `useBoxscore(id)` | `/api/nhl/game/[id]/boxscore` |
| `team` | `useTeam(code)` | `/api/nhl/team/[code]` |
| `roster` | `useRoster(code)` | `/api/nhl/team/[code]/roster` |
| `teamSchedule` | `useTeamSchedule(code)` | `/api/nhl/team/[code]/schedule` |
| `player` | `usePlayer(id)` | `/api/nhl/player/[id]` |
| `standings` | `useStandings()` | `/api/nhl/standings` |
| `stats` | `useSkaterStats()` / `useGoalieStats()` / `useTeamStats()` | `/api/nhl/stats?kind=…` |

`useGame`, `usePlayByPlay`, and `useBoxscore` automatically poll while the game is `LIVE` or `CRIT` and stop once it's `FINAL`/`OFF`/`PRE`/`FUT`. Polling also pauses when the tab is hidden.

### Module pattern

Every endpoint folder under `src/lib/nhl/<resource>/` has the same five files:

- `schema.ts` — Zod schema; `.passthrough()` so unknown fields flow through untouched. Required keys are only those the UI consumes.
- `fetcher.ts` — server-side `fetch<Resource>(...)`. Calls `nhlFetch` and returns the typed value. Throws a typed `NhlApiError` on any failure.
- `route.ts` — Route Handler factory. Maps `NhlApiError` to HTTP: `http` passes through, `schema` → 502, `network`/`timeout` → 504.
- `use<Resource>.ts` — typed React Query hook. Owns query key, polling interval, stale time. Hits *our* Route Handler, not NHL.
- `index.ts` — public surface: hook + types only. Schemas, fetchers, and route internals are private.

The `stats` module bends the pattern (one fetcher + one route, three schemas + three hooks); see the spec.

### Adding a new endpoint

1. Create `src/lib/nhl/<resource>/` with the five files above.
2. Record a fixture: `npx tsx scripts/record-fixture.ts <upstream-url> src/lib/nhl/<resource>/__fixtures__/<resource>.json`.
3. Write a `schema.test.ts` that asserts the schema parses the fixture.
4. Add a `src/app/api/nhl/<resource>/route.ts` one-liner: `export { GET } from '@/lib/nhl/<resource>/route';`.
5. Add the server fetcher (`fetch<Resource>`) to `src/lib/nhl/index.ts` as an escape hatch.
6. Add freshness for the resource in `src/lib/nhl/cache.ts` (`TTL`, `STALE`, `POLL`).

### Recording fixtures

`scripts/record-fixture.ts` is a manual one-shot tool for refreshing schema fixtures. Tests parse those fixtures, so when the NHL API changes shape, re-record and the schema tests will surface the diff.

```bash
npx tsx scripts/record-fixture.ts \
  https://api-web.nhle.com/v1/schedule/2026-05-09 \
  src/lib/nhl/schedule/__fixtures__/schedule.json
```

Not part of CI — fixtures are committed and reproducible without network.

### Errors

All hooks return `error: NhlApiError | null`. The shape is a tagged union:

```ts
type NhlApiError =
  | { kind: 'http';    status: number;       url: string; message: string }
  | { kind: 'network'; cause: unknown;       url: string; message: string }
  | { kind: 'schema';  issues: ZodIssue[];   url: string; message: string }
  | { kind: 'timeout';                       url: string; message: string };
```

UI patterns (suggested, not yet implemented):
- `network` / `timeout` — transient. Show a small "data delayed" indicator; React Query keeps polling.
- `schema` / `http 5xx` — hard. Banner; show stale data if available.
- `http 4xx` — empty state for that view (game/player/team not found).

## Visualizations

The shot map under [`src/components/rink/`](src/components/rink/) is the project's first non-tabular visualization. Design notes live in the app-shell spec ([`docs/superpowers/specs/2026-05-09-app-shell-and-navigation-design.md`](docs/superpowers/specs/2026-05-09-app-shell-and-navigation-design.md#shot-map)); the file layout:

| File | What |
|---|---|
| `scales.ts` | `xScale` / `yScale` (d3-scale linear), `distanceFromGoal`, `isShotKind`, `shotKindOf`, rink dimension constants. |
| `RinkBackdrop.tsx` | Pure-static SVG of the half-rink (boards, blue line, goal, faceoff dots). No props beyond `className`. |
| `ShotDot.tsx` | One dot per play. Switches on `kind` for the visual encoding (filled circle / open ring / X). |
| `RinkControls.tsx` | Controlled filter UI (teams, kinds, period). `RinkFilterState` shape exported. |
| `RinkPane.tsx` | The container. Consumes `useGame` + `usePlayByPlay`, projects shots into SVG-feet, overlays dots on the backdrop, owns the tooltip + filter state. |

### React–D3 split

**D3 owns math, React owns the DOM.** No `d3.select(ref.current)` mutating SVG. Pattern:

```ts
const positions = useMemo(() => buildPoints(plays, players, homeTeamId), [...]);
return positions.map((p) => <circle key={p.id} cx={p.cx} cy={p.cy} ... />);
```

Adding a new overlay (heatmap, voronoi hover targets, contour map, …): build the geometry in a `useMemo` over the play list, then render React JSX. If you need a path, use `d3-shape`'s generators to *produce the `d` string* and feed it to a JSX `<path d={...} />` — don't append elements imperatively.
