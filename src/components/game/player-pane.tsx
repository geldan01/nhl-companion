"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { DataState } from "@/components/data-state";
import { InitialsAvatar } from "@/components/initials-avatar";
import { Skeleton } from "@/components/skeleton";
import {
  type BoxscoreGoalie,
  type BoxscoreResponse,
  type BoxscoreSkater,
  useBoxscore,
} from "@/lib/nhl/boxscore";
import {
  type PlayerFeaturedSubSeason,
  usePlayer,
} from "@/lib/nhl/player";
import {
  PLAY_PLAYER_ROLE_LABEL,
  type Play,
  type PlayByPlayResponse,
  type PlayByPlayRosterSpot,
  type PlayPlayer,
  fullName,
  getPlayPlayers,
  usePlayByPlay,
} from "@/lib/nhl/playByPlay";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";

export type PlayerPaneProps = {
  id: number;
  eventId: number;
  onClose: () => void;
};

export function PlayerPane({ id, eventId, onClose }: PlayerPaneProps) {
  const pbpQuery = usePlayByPlay(id);
  const boxQuery = useBoxscore(id);

  const isLoading = pbpQuery.isLoading || boxQuery.isLoading;
  const error = pbpQuery.error ?? boxQuery.error ?? null;
  const hasData = Boolean(pbpQuery.data && boxQuery.data);

  return (
    <DataState
      isLoading={isLoading}
      error={error}
      hasData={hasData}
      skeleton={<div className="p-3"><Skeleton variant="row" count={6} /></div>}
    >
      {pbpQuery.data && boxQuery.data ? (
        <PlayerPaneBody
          pbp={pbpQuery.data}
          box={boxQuery.data}
          eventId={eventId}
          onClose={onClose}
        />
      ) : null}
    </DataState>
  );
}

function PlayerPaneBody({
  pbp,
  box,
  eventId,
  onClose,
}: {
  pbp: PlayByPlayResponse;
  box: BoxscoreResponse;
  eventId: number;
  onClose: () => void;
}) {
  const play = pbp.plays.find((p) => p.eventId === eventId);
  const roster = new Map<number, PlayByPlayRosterSpot>(
    pbp.rosterSpots.map((r) => [r.playerId, r]),
  );
  const teamCodeById = new Map<number, string>([
    [pbp.awayTeam.id, pbp.awayTeam.abbrev],
    [pbp.homeTeam.id, pbp.homeTeam.abbrev],
  ]);

  const playerStats = buildPlayerStatsIndex(box);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-start justify-between gap-2 border-b border-(--border) px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
            Selected play
          </h3>
          <p className="mt-0.5 truncate text-sm">
            {play ? <PlayHeadline play={play} teamCodeById={teamCodeById} /> : "Play not found"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close player details"
          className="shrink-0 rounded border border-(--border) px-2 py-1 text-xs text-(--text-muted) hover:text-(--text)"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {play ? (
          <PlayerList
            play={play}
            roster={roster}
            playerStats={playerStats}
          />
        ) : (
          <p className="text-sm text-(--text-muted)">
            This play is no longer in the feed.
          </p>
        )}
      </div>
    </div>
  );
}

function PlayHeadline({
  play,
  teamCodeById,
}: {
  play: Play;
  teamCodeById: Map<number, string>;
}) {
  const teamId = play.details?.eventOwnerTeamId;
  const team = teamId !== undefined ? teamCodeById.get(teamId) : undefined;
  const period = play.periodDescriptor.number ?? 0;
  const label = describePlayLabel(play);
  return (
    <span>
      <span className="text-(--text-muted)">
        {period}P {play.timeInPeriod}
        {team ? ` · ${team}` : ""}
      </span>{" "}
      <span className="font-medium">{label}</span>
    </span>
  );
}

function describePlayLabel(play: Play): string {
  switch (play.typeDescKey) {
    case "goal":
      return "Goal";
    case "shot-on-goal":
      return "Shot on goal";
    case "missed-shot":
      return "Missed shot";
    case "blocked-shot":
      return "Blocked shot";
    case "penalty": {
      const dur = play.details?.duration;
      const desc = play.details?.descKey?.replace(/-/g, " ");
      const parts = [desc, dur ? `${dur} min` : null].filter(Boolean);
      return parts.length > 0 ? `Penalty — ${parts.join(", ")}` : "Penalty";
    }
    case "hit":
      return "Hit";
    case "faceoff":
      return "Faceoff";
    case "takeaway":
      return "Takeaway";
    case "giveaway":
      return "Giveaway";
    default:
      return play.typeDescKey;
  }
}

function PlayerList({
  play,
  roster,
  playerStats,
}: {
  play: Play;
  roster: Map<number, PlayByPlayRosterSpot>;
  playerStats: Map<number, PlayerStatsEntry>;
}) {
  const players = getPlayPlayers(play, roster);
  if (players.length === 0) {
    return (
      <p className="text-sm text-(--text-muted)">
        No player attribution for this event.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {players.map((p, idx) => (
        <li key={`${p.role}-${p.player.playerId}-${idx}`}>
          <PlayerCard entry={p} stats={playerStats.get(p.player.playerId)} />
        </li>
      ))}
    </ul>
  );
}

function PlayerCard({
  entry,
  stats,
}: {
  entry: PlayPlayer;
  stats: PlayerStatsEntry | undefined;
}) {
  const { role, player } = entry;
  const teamCode = stats?.teamCode;
  const accent = teamCode ? getTeamColors(teamCode as TeamCode).primary : "transparent";
  const name = fullName(player);

  return (
    <article className="rounded-md border border-(--border) bg-(--bg)">
      <div
        aria-hidden
        className="h-1 rounded-t-md"
        style={{ background: accent }}
      />
      <div className="flex items-center gap-3 px-3 pt-3">
        <Headshot url={player.headshot} alt={name} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
            {PLAY_PLAYER_ROLE_LABEL[role]}
          </p>
          <Link
            href={`/player/${player.playerId}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {name}
          </Link>
          <p className="text-xs text-(--text-muted)">
            {player.sweaterNumber !== undefined ? `#${player.sweaterNumber}` : null}
            {player.sweaterNumber !== undefined && player.positionCode ? " · " : null}
            {player.positionCode}
            {teamCode ? ` · ${teamCode}` : ""}
          </p>
        </div>
      </div>
      <PlayerStatLine stats={stats} />
      <CareerStats playerId={player.playerId} isGoalie={player.positionCode === "G"} />
    </article>
  );
}

function CareerStats({
  playerId,
  isGoalie,
}: {
  playerId: number;
  isGoalie: boolean;
}) {
  const query = usePlayer(playerId);
  if (!query.data) return null;
  const featured = query.data.featuredStats;
  if (!featured) return null;
  const reg = featured.regularSeason?.subSeason;
  const post = featured.playoffs?.subSeason;
  const seasonLabel = featured.season ? formatSeason(featured.season) : "Season";
  const hasReg = reg && (reg.gamesPlayed ?? 0) > 0;
  const hasPost = post && (post.gamesPlayed ?? 0) > 0;
  if (!hasReg && !hasPost) return null;
  return (
    <div className="border-t border-(--border) px-3 pb-3 pt-2">
      {hasReg && (
        <CareerRow label={seasonLabel} stats={reg!} isGoalie={isGoalie} />
      )}
      {hasPost && (
        <CareerRow label="Playoffs" stats={post!} isGoalie={isGoalie} />
      )}
    </div>
  );
}

function CareerRow({
  label,
  stats,
  isGoalie,
}: {
  label: string;
  stats: PlayerFeaturedSubSeason;
  isGoalie: boolean;
}) {
  return (
    <div className="mt-1.5 first:mt-0">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-(--text-muted)">
        {label}
      </p>
      {isGoalie ? (
        <dl className="grid grid-cols-6 gap-1 text-xs">
          <Stat label="GP" value={stats.gamesPlayed ?? 0} />
          <Stat label="W" value={stats.wins ?? 0} />
          <Stat label="L" value={stats.losses ?? 0} />
          <Stat label="GAA" value={formatGaa(stats.goalsAgainstAvg)} />
          <Stat label="SV%" value={formatSvPct(stats.savePctg)} />
          <Stat label="SO" value={stats.shutouts ?? 0} />
        </dl>
      ) : (
        <dl className="grid grid-cols-6 gap-1 text-xs">
          <Stat label="GP" value={stats.gamesPlayed ?? 0} />
          <Stat label="G" value={stats.goals ?? 0} />
          <Stat label="A" value={stats.assists ?? 0} />
          <Stat label="PTS" value={stats.points ?? 0} />
          <Stat label="+/-" value={stats.plusMinus ?? 0} />
          <Stat label="PIM" value={stats.pim ?? 0} />
        </dl>
      )}
    </div>
  );
}

// 20252026 → "Season '25-26".
function formatSeason(n: number): string {
  const s = String(n);
  if (s.length !== 8) return "Season";
  return `Season '${s.slice(2, 4)}-${s.slice(6, 8)}`;
}

function formatGaa(v: number | undefined): string {
  return typeof v === "number" ? v.toFixed(2) : "—";
}

function formatSvPct(v: number | undefined): string {
  return typeof v === "number" ? v.toFixed(3).slice(1) : "—";
}

function Headshot({ url, alt }: { url: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!url || errored) return <InitialsAvatar name={alt} size={56} rounded="md" />;
  return (
    <Image
      src={url}
      alt={alt}
      width={56}
      height={56}
      className="rounded-md bg-(--surface)"
      onError={() => setErrored(true)}
    />
  );
}

function PlayerStatLine({ stats }: { stats: PlayerStatsEntry | undefined }) {
  if (!stats) {
    return (
      <p className="px-3 pb-3 pt-2 text-xs text-(--text-muted)">
        No game stats yet.
      </p>
    );
  }
  if (stats.kind === "skater") {
    const s = stats.row;
    return (
      <dl className="grid grid-cols-6 gap-1 px-3 pb-3 pt-2 text-xs">
        <Stat label="G" value={s.goals ?? 0} />
        <Stat label="A" value={s.assists ?? 0} />
        <Stat label="+/-" value={s.plusMinus ?? 0} />
        <Stat label="SOG" value={s.sog ?? 0} />
        <Stat label="PIM" value={s.pim ?? 0} />
        <Stat label="TOI" value={s.toi ?? "—"} />
      </dl>
    );
  }
  const g = stats.row;
  const sv = g.saves ?? 0;
  const sa = g.shotsAgainst ?? 0;
  const svPct = sa > 0 ? sv / sa : null;
  return (
    <dl className="grid grid-cols-5 gap-1 px-3 pb-3 pt-2 text-xs">
      <Stat label="SV" value={sv} />
      <Stat label="SA" value={sa} />
      <Stat label="GA" value={g.goalsAgainst ?? 0} />
      <Stat label="SV%" value={svPct === null ? "—" : svPct.toFixed(3).slice(1)} />
      <Stat label="TOI" value={g.toi ?? "—"} />
    </dl>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded bg-(--surface) px-1 py-0.5 text-center">
      <dt className="text-[10px] uppercase tracking-wide text-(--text-muted)">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

type PlayerStatsEntry =
  | { kind: "skater"; row: BoxscoreSkater; teamCode: string }
  | { kind: "goalie"; row: BoxscoreGoalie; teamCode: string };

function buildPlayerStatsIndex(
  box: BoxscoreResponse,
): Map<number, PlayerStatsEntry> {
  const out = new Map<number, PlayerStatsEntry>();
  const ingest = (
    teamCode: string,
    skaters: BoxscoreSkater[],
    goalies: BoxscoreGoalie[],
  ) => {
    for (const s of skaters) out.set(s.playerId, { kind: "skater", row: s, teamCode });
    for (const g of goalies) out.set(g.playerId, { kind: "goalie", row: g, teamCode });
  };
  ingest(
    box.awayTeam.abbrev,
    [
      ...box.playerByGameStats.awayTeam.forwards,
      ...box.playerByGameStats.awayTeam.defense,
    ],
    box.playerByGameStats.awayTeam.goalies,
  );
  ingest(
    box.homeTeam.abbrev,
    [
      ...box.playerByGameStats.homeTeam.forwards,
      ...box.playerByGameStats.homeTeam.defense,
    ],
    box.playerByGameStats.homeTeam.goalies,
  );
  return out;
}
