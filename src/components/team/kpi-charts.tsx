"use client";

import { scaleLinear } from "d3-scale";
import type { ReactNode } from "react";
import type { GoalsTrendGame, ScorerRow } from "@/lib/team-kpis";

// Presentational KPI chart primitives. These are data-agnostic: the dashboard
// (`kpi-dashboard.tsx`) derives numbers from the data layer and feeds plain
// props in here. Colors lean on the team's primary brand color (passed via
// `accent`) plus the global CSS variables so light/dark themes both work.

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "positive" | "negative";
}) {
  const valueColor =
    tone === "positive"
      ? "text-(--accent)"
      : tone === "negative"
        ? "text-(--live)"
        : "text-(--text)";
  return (
    <div className="rounded-xl border border-(--border) bg-(--surface) px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${valueColor}`}>
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-xs text-(--text-muted)">{sub}</div>
      ) : null}
    </div>
  );
}

export function ChartCard({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-(--border) bg-(--surface) p-4">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          {title}
        </h3>
        {aside ? <span className="text-xs text-(--text-muted)">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

// Diverging column chart: goals-for rise above a center baseline, goals-against
// drop below it. One column per game, oldest → newest left to right. The net
// result of any game reads at a glance from which side dominates.
export function GoalsTrendChart({ games, accent }: { games: GoalsTrendGame[]; accent: string }) {
  if (games.length === 0) {
    return <p className="text-sm text-(--text-muted)">No completed games yet.</p>;
  }

  const W = Math.max(games.length, 1) * 26;
  const H = 150;
  const mid = H / 2;
  const pad = 14; // vertical breathing room above/below the tallest bar
  const maxGoals = Math.max(2, ...games.flatMap((g) => [g.gf, g.ga]));
  const h = scaleLinear().domain([0, maxGoals]).range([0, mid - pad]);
  const band = W / games.length;
  const barW = Math.min(14, band * 0.6);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Goals for and against, recent games"
        style={{ minWidth: games.length > 12 ? W : undefined }}
      >
        {/* baseline */}
        <line x1={0} y1={mid} x2={W} y2={mid} stroke="var(--border)" strokeWidth={1} />
        {games.map((g, i) => {
          const cx = i * band + band / 2;
          const gfH = h(g.gf);
          const gaH = h(g.ga);
          return (
            <g key={g.id}>
              <title>{`${g.isHome ? "vs" : "@"} ${g.opp} — ${g.gf}-${g.ga} ${g.outcome}`}</title>
              <rect
                x={cx - barW / 2}
                y={mid - gfH}
                width={barW}
                height={gfH}
                rx={2}
                fill={accent}
              />
              <rect
                x={cx - barW / 2}
                y={mid}
                width={barW}
                height={gaH}
                rx={2}
                fill="var(--text-muted)"
                opacity={0.5}
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-(--text-muted)">
        <Swatch color={accent} label="Goals for" />
        <Swatch color="var(--text-muted)" label="Goals against" muted />
      </div>
    </div>
  );
}

// Single proportional bar split into Wins / OT losses / Regulation losses.
export function ResultsBar({
  wins,
  otLosses,
  losses,
  accent,
}: {
  wins: number;
  otLosses: number;
  losses: number;
  accent: string;
}) {
  const total = Math.max(wins + otLosses + losses, 1);
  const segments = [
    { key: "W", value: wins, color: accent, label: "Wins" },
    { key: "OTL", value: otLosses, color: "var(--text-muted)", label: "OT losses", muted: true },
    { key: "L", value: losses, color: "var(--live)", label: "Losses" },
  ];
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-(--bg)">
        {segments.map((s) =>
          s.value > 0 ? (
            <div
              key={s.key}
              style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color, opacity: s.muted ? 0.5 : 1 }}
              title={`${s.label}: ${s.value}`}
            />
          ) : null,
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--text-muted)">
        {segments.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <Swatch color={s.color} label={`${s.label} ${s.value}`} muted={s.muted} />
          </span>
        ))}
      </div>
    </div>
  );
}

// Horizontal stacked bars (goals + assists = points) for the top scorers.
export function ScorerBars({ rows, accent }: { rows: ScorerRow[]; accent: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-(--text-muted)">No scoring data yet.</p>;
  }
  const max = Math.max(...rows.map((r) => r.points), 1);
  return (
    <div>
      <ul role="list" className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-2 text-sm sm:grid-cols-[10rem_1fr_2.5rem]">
            <a href={`/player/${r.id}`} className="truncate hover:underline" title={r.name}>
              {r.name}
            </a>
            <div className="flex h-4 w-full overflow-hidden rounded bg-(--bg)">
              <div
                style={{ width: `${(r.goals / max) * 100}%`, backgroundColor: accent }}
                title={`${r.goals} goals`}
              />
              <div
                style={{ width: `${(r.assists / max) * 100}%`, backgroundColor: accent, opacity: 0.45 }}
                title={`${r.assists} assists`}
              />
            </div>
            <span className="text-right font-semibold tabular-nums">{r.points}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-4 text-xs text-(--text-muted)">
        <Swatch color={accent} label="Goals" />
        <Swatch color={accent} label="Assists" faded />
      </div>
    </div>
  );
}

function Swatch({
  color,
  label,
  muted,
  faded,
}: {
  color: string;
  label: string;
  muted?: boolean;
  faded?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color, opacity: muted ? 0.5 : faded ? 0.45 : 1 }}
      />
      {label}
    </span>
  );
}
