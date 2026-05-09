# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Web-based companion app to use while watching live NHL games. Pulls data from the official NHL APIs (plays, shots, penalties, etc.) and renders rich visuals — team logos, player photos, rink/shot diagrams, charts.

## Stack

- **Next.js 16** (App Router) with **Turbopack** dev/build — note breaking changes from older Next versions; see `AGENTS.md` and consult `node_modules/next/dist/docs/` before writing route/config code.
- **React 19**, **TypeScript 5**.
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"` in `src/app/globals.css` and `@tailwindcss/postcss` in `postcss.config.mjs`. No `tailwind.config.js`.
- **ESLint 9** flat config in `eslint.config.mjs` (extends `eslint-config-next`).
- Source layout uses `src/` with `@/*` import alias (see `tsconfig.json`).

## Commands

```bash
npm run dev       # Turbopack dev server at http://localhost:3000
npm run build     # production build (Turbopack)
npm run start     # serve the built app
npm run lint      # eslint
npm test          # vitest (watch)
npm run test:run  # vitest (single run, for CI)
```

Vitest is wired up with jsdom + React Testing Library; config in `vitest.config.mts`. No Playwright yet — add when the first UI feature lands.

## Architecture notes

The data layer is designed in [docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md](docs/superpowers/specs/2026-05-09-nhl-data-layer-design.md) and implemented under `src/lib/nhl/`. Key conventions:

- **NHL API access:** Route Handlers in `src/app/api/nhl/**/route.ts` proxy NHL endpoints; the actual logic lives in `src/lib/nhl/<resource>/` (one folder per endpoint, five files: `schema.ts`, `fetcher.ts`, `route.ts`, `use<Thing>.ts`, `index.ts`). UI components import only from `src/lib/nhl/<resource>/index.ts`.
- **Live game data:** client polling via React Query. Hooks read `gameState` and switch off polling when a game is `FINAL`/`OFF`/`PRE`. Per-endpoint TTLs live in `src/lib/nhl/cache.ts`.
- **Validation:** every NHL response is parsed by a Zod schema at the Route Handler boundary. Schema mismatch surfaces as a typed `NhlApiError` (kind `'schema'`), not a UI bug.
- **Images:** use `next/image` for player headshots and team logos. Any external image host (NHL CDN domains) must be allow-listed under `images.remotePatterns` in `next.config.ts`.
- **Visualizations:** SVG + a charting lib (e.g. Recharts, visx, or D3) for rink diagrams and shot maps. No choice committed yet.
