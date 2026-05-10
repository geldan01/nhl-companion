"use client";

import { useMemo, useState } from "react";
import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { useGame } from "@/lib/nhl/game";
import {
  type Play,
  type PlayByPlayRosterSpot,
  normalizeShot,
  usePlayByPlay,
} from "@/lib/nhl/playByPlay";
import { RinkBackdrop } from "./RinkBackdrop";
import {
  DEFAULT_RINK_FILTER,
  RinkControls,
  type RinkFilterState,
  type Side,
} from "./RinkControls";
import {
  type ShotKind,
  distanceFromGoal,
  shotKindOf,
  xScale,
  yScale,
} from "./scales";
import { ShotDot } from "./ShotDot";

type ShotPoint = {
  id: number;
  cx: number;
  cy: number;
  side: Side;
  kind: ShotKind;
  period: number;
  clock: string;
  shooter: string | null;
  distance: number;
};

export type RinkPaneProps = {
  id: number;
  selectedEventId?: number | null;
  onSelectEvent?: (eventId: number | null) => void;
};

export function RinkPane({ id, selectedEventId, onSelectEvent }: RinkPaneProps) {
  const game = useGame(id);
  const pbp = usePlayByPlay(id);

  // Treat the rink as a unit: only render once both queries land. Wait on the
  // play-by-play query for the data state since it's the bigger of the two.
  return (
    <DataState
      isLoading={pbp.isLoading || game.isLoading}
      error={pbp.error ?? game.error ?? null}
      hasData={Boolean(pbp.data && game.data)}
      skeleton={
        <div className="p-3">
          <Skeleton variant="rink" />
        </div>
      }
    >
      {pbp.data && game.data ? (
        <RinkBody
          plays={pbp.data.plays}
          rosterSpots={pbp.data.rosterSpots}
          homeTeamId={game.data.homeTeam.id}
          awayCode={game.data.awayTeam.abbrev}
          homeCode={game.data.homeTeam.abbrev}
          selectedEventId={selectedEventId ?? null}
          onSelectEvent={onSelectEvent}
        />
      ) : null}
    </DataState>
  );
}

function RinkBody({
  plays,
  rosterSpots,
  homeTeamId,
  awayCode,
  homeCode,
  selectedEventId,
  onSelectEvent,
}: {
  plays: Play[];
  rosterSpots: PlayByPlayRosterSpot[];
  homeTeamId: number;
  awayCode: string;
  homeCode: string;
  selectedEventId: number | null;
  onSelectEvent?: (eventId: number | null) => void;
}) {
  const [filter, setFilter] = useState<RinkFilterState>(DEFAULT_RINK_FILTER);
  const [hoverId, setHoverId] = useState<number | null>(null);

  const players = useMemo(() => {
    const m = new Map<number, PlayByPlayRosterSpot>();
    for (const r of rosterSpots) m.set(r.playerId, r);
    return m;
  }, [rosterSpots]);

  const points = useMemo(
    () => buildPoints(plays, players, homeTeamId),
    [plays, players, homeTeamId],
  );

  const visible = useMemo(() => filterPoints(points, filter), [points, filter]);

  const tooltipFor = hoverId ?? selectedEventId;
  const tooltipPoint = tooltipFor !== null ? points.find((p) => p.id === tooltipFor) : null;

  return (
    <div className="flex h-full flex-col">
      <RinkControls
        state={filter}
        onChange={setFilter}
        awayCode={awayCode}
        homeCode={homeCode}
      />
      <div className="relative min-h-0 flex-1 p-3">
        <div className="relative">
          <RinkBackdrop />
          <svg
            viewBox="0 0 100 85"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 block w-full"
            style={{ aspectRatio: "100 / 85" }}
            aria-label="Shots"
          >
            {visible.map((p) => (
              <ShotDot
                key={p.id}
                cx={p.cx}
                cy={p.cy}
                kind={p.kind}
                side={p.side}
                focused={p.id === selectedEventId}
                title={titleFor(p)}
                onClick={onSelectEvent ? () => onSelectEvent(p.id === selectedEventId ? null : p.id) : undefined}
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => setHoverId((cur) => (cur === p.id ? null : cur))}
              />
            ))}
          </svg>
          {tooltipPoint ? <Tooltip point={tooltipPoint} /> : null}
        </div>
        <Legend total={points.length} visible={visible.length} />
      </div>
    </div>
  );
}

function Tooltip({ point }: { point: ShotPoint }) {
  // Pin to the dot via percentage positioning over the rink container.
  // 100ft × 85ft viewBox → cx/100 + cy/85 percentages.
  const left = `${(point.cx / 100) * 100}%`;
  const top = `${(point.cy / 85) * 100}%`;
  return (
    <div
      role="tooltip"
      style={{ left, top, transform: "translate(-50%, -120%)" }}
      className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-(--border) bg-(--surface) px-2 py-1 text-[11px] shadow"
    >
      <div className="font-semibold">{labelFor(point.kind)}</div>
      <div className="text-(--text-muted)">{point.shooter ?? "Unknown"}</div>
      <div className="text-(--text-muted)">
        {point.period}P {point.clock} · {Math.round(point.distance)} ft
      </div>
    </div>
  );
}

function Legend({ total, visible }: { total: number; visible: number }) {
  return (
    <p className="mt-2 text-[11px] text-(--text-muted)">
      Showing {visible} of {total} shots
    </p>
  );
}

function buildPoints(
  plays: Play[],
  players: Map<number, PlayByPlayRosterSpot>,
  homeTeamId: number,
): ShotPoint[] {
  const out: ShotPoint[] = [];
  for (const play of plays) {
    const kind = shotKindOf(play.typeDescKey);
    if (!kind) continue;
    const norm = normalizeShot(play, homeTeamId);
    if (!norm) continue;
    const cx = xScale(norm.x);
    const cy = yScale(norm.y);
    const shooterId =
      kind === "goal" ? play.details?.scoringPlayerId : play.details?.shootingPlayerId;
    const shooter = shooterId ? nameOf(players, shooterId) : null;
    out.push({
      id: play.eventId,
      cx,
      cy,
      side: norm.side,
      kind,
      period: play.periodDescriptor.number ?? 0,
      clock: play.timeInPeriod,
      shooter,
      distance: distanceFromGoal(cx, cy),
    });
  }
  return out;
}

function filterPoints(points: ShotPoint[], filter: RinkFilterState): ShotPoint[] {
  return points.filter((p) => {
    if (!filter.sides.has(p.side)) return false;
    if (!filter.kinds.has(p.kind)) return false;
    if (filter.period === "all") return true;
    if (filter.period === "ot") return p.period >= 4;
    return p.period === filter.period;
  });
}

function nameOf(
  players: Map<number, PlayByPlayRosterSpot>,
  id: number,
): string | null {
  const p = players.get(id);
  return p ? `${p.firstName.default} ${p.lastName.default}` : null;
}

function labelFor(kind: ShotKind): string {
  return kind === "goal"
    ? "Goal"
    : kind === "shot-on-goal"
      ? "Shot on goal"
      : kind === "missed-shot"
        ? "Missed shot"
        : "Blocked shot";
}

function titleFor(p: ShotPoint): string {
  return `${labelFor(p.kind)} — ${p.shooter ?? "Unknown"} (${p.period}P ${p.clock}, ${Math.round(p.distance)} ft)`;
}
