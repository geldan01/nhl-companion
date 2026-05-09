"use client";

import { DataState } from "@/components/data-state";
import { Skeleton } from "@/components/skeleton";
import { getTeamColors } from "@/lib/team-colors";
import {
  type Play,
  type PlayByPlayRosterSpot,
  usePlayByPlay,
} from "@/lib/nhl/playByPlay";

export function PlaysPane({ id }: { id: number }) {
  const query = usePlayByPlay(id);
  return (
    <DataState
      isLoading={query.isLoading}
      error={query.error ?? null}
      hasData={Boolean(query.data)}
      skeleton={<div className="p-3"><Skeleton variant="row" count={8} /></div>}
    >
      {query.data ? <Plays response={query.data} /> : null}
    </DataState>
  );
}

function Plays({ response }: { response: NonNullable<ReturnType<typeof usePlayByPlay>["data"]> }) {
  const players = new Map<number, PlayByPlayRosterSpot>();
  for (const r of response.rosterSpots) players.set(r.playerId, r);

  const teamCodeById = new Map<number, string>([
    [response.awayTeam.id, response.awayTeam.abbrev],
    [response.homeTeam.id, response.homeTeam.abbrev],
  ]);

  const sorted = [...response.plays].sort((a, b) => b.sortOrder - a.sortOrder);

  return (
    <ul role="list" className="divide-y divide-(--border)">
      {sorted.map((play) => (
        <PlayRow
          key={play.eventId}
          play={play}
          players={players}
          teamCodeById={teamCodeById}
        />
      ))}
    </ul>
  );
}

function PlayRow({
  play,
  players,
  teamCodeById,
}: {
  play: Play;
  players: Map<number, PlayByPlayRosterSpot>;
  teamCodeById: Map<number, string>;
}) {
  const isGoal = play.typeDescKey === "goal";
  const isPenalty = play.typeDescKey === "penalty";
  const teamId = play.details?.eventOwnerTeamId;
  const teamCode = teamId !== undefined ? teamCodeById.get(teamId) : undefined;
  const stripeColor = teamCode ? getTeamColors(teamCode).primary : "transparent";
  const period = play.periodDescriptor.number ?? 0;

  return (
    <li
      id={`play-${play.eventId}`}
      className={`relative flex gap-3 px-3 py-2 text-sm ${
        isGoal
          ? "bg-(--accent)/10 font-medium"
          : isPenalty
            ? "bg-(--live)/5"
            : ""
      }`}
    >
      <span
        aria-hidden
        className="mt-0.5 inline-block h-full min-h-[1.25rem] w-0.5 shrink-0 rounded"
        style={{ background: stripeColor }}
      />
      <span className="w-12 shrink-0 text-xs tabular-nums text-(--text-muted)">
        {period}P {play.timeInPeriod}
      </span>
      <span className="min-w-0 flex-1">
        <PlayDescription play={play} players={players} teamCode={teamCode} />
      </span>
    </li>
  );
}

function PlayDescription({
  play,
  players,
  teamCode,
}: {
  play: Play;
  players: Map<number, PlayByPlayRosterSpot>;
  teamCode: string | undefined;
}) {
  const name = (id: number | undefined): string | null => {
    if (id === undefined) return null;
    const p = players.get(id);
    if (!p) return null;
    return `${p.firstName.default} ${p.lastName.default}`;
  };

  switch (play.typeDescKey) {
    case "goal": {
      const scorer = name(play.details?.scoringPlayerId);
      const a1 = name(play.details?.assist1PlayerId);
      const a2 = name(play.details?.assist2PlayerId);
      const assists = [a1, a2].filter(Boolean).join(", ");
      return (
        <span>
          GOAL{teamCode ? ` (${teamCode})` : ""} — {scorer ?? "Unknown"}
          {assists ? <span className="text-(--text-muted)"> · A: {assists}</span> : null}
        </span>
      );
    }
    case "shot-on-goal": {
      const shooter = name(play.details?.shootingPlayerId);
      return <span>Shot on goal{shooter ? ` — ${shooter}` : ""}</span>;
    }
    case "missed-shot": {
      const shooter = name(play.details?.shootingPlayerId);
      return <span>Missed shot{shooter ? ` — ${shooter}` : ""}</span>;
    }
    case "blocked-shot": {
      const shooter = name(play.details?.shootingPlayerId);
      return <span>Blocked shot{shooter ? ` — ${shooter}` : ""}</span>;
    }
    case "faceoff":
      return <span>Faceoff{teamCode ? ` won by ${teamCode}` : ""}</span>;
    case "hit":
      return <span>Hit{teamCode ? ` by ${teamCode}` : ""}</span>;
    case "penalty":
      return <span>Penalty{teamCode ? ` — ${teamCode}` : ""}</span>;
    case "stoppage":
      return <span className="text-(--text-muted)">Stoppage</span>;
    case "period-start":
      return <span className="text-(--text-muted)">Period {play.periodDescriptor.number} start</span>;
    case "period-end":
      return <span className="text-(--text-muted)">Period {play.periodDescriptor.number} end</span>;
    case "game-end":
      return <span className="text-(--text-muted)">Game end</span>;
    case "takeaway":
      return <span>Takeaway{teamCode ? ` — ${teamCode}` : ""}</span>;
    case "giveaway":
      return <span>Giveaway{teamCode ? ` — ${teamCode}` : ""}</span>;
    default:
      return <span className="text-(--text-muted)">{play.typeDescKey}</span>;
  }
}
