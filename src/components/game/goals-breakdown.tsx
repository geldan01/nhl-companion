import { PlayerChip } from "@/components/player-chip";
import { TeamLogo } from "@/components/team-logo";
import {
  fullName,
  type Play,
  type PlayByPlayResponse,
  type PlayByPlayRosterSpot,
} from "@/lib/nhl/playByPlay";

export function GoalsBreakdown({ response }: { response: PlayByPlayResponse }) {
  const goals = response.plays.filter((p) => p.typeDescKey === "goal");

  if (goals.length === 0) {
    return (
      <div className="px-3 py-6 text-center text-sm text-(--text-muted)">
        No goals yet.
      </div>
    );
  }

  const players = new Map<number, PlayByPlayRosterSpot>();
  for (const r of response.rosterSpots) players.set(r.playerId, r);

  const teamCodeById = new Map<number, string>([
    [response.awayTeam.id, response.awayTeam.abbrev],
    [response.homeTeam.id, response.homeTeam.abbrev],
  ]);

  const byPeriod = new Map<number, Play[]>();
  for (const g of goals) {
    const period = g.periodDescriptor.number ?? 0;
    const bucket = byPeriod.get(period) ?? [];
    bucket.push(g);
    byPeriod.set(period, bucket);
  }
  const periods = [...byPeriod.keys()].sort((a, b) => a - b);

  return (
    <div className="divide-y divide-(--border)">
      {periods.map((period) => {
        const plays = (byPeriod.get(period) ?? []).slice().sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );
        return (
          <section key={period} className="px-3 py-2">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
              {periodLabel(period, plays[0]?.periodDescriptor.periodType)}
            </h3>
            <ul role="list" className="space-y-1.5">
              {plays.map((play) => (
                <GoalRow
                  key={play.eventId}
                  play={play}
                  players={players}
                  teamCodeById={teamCodeById}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function GoalRow({
  play,
  players,
  teamCodeById,
}: {
  play: Play;
  players: Map<number, PlayByPlayRosterSpot>;
  teamCodeById: Map<number, string>;
}) {
  const teamId = play.details?.eventOwnerTeamId;
  const teamCode = teamId !== undefined ? teamCodeById.get(teamId) : undefined;
  const scorer = lookup(players, play.details?.scoringPlayerId);
  const a1 = lookup(players, play.details?.assist1PlayerId);
  const a2 = lookup(players, play.details?.assist2PlayerId);
  const assists = [a1, a2].filter(Boolean) as PlayByPlayRosterSpot[];
  const away = play.details?.awayScore;
  const home = play.details?.homeScore;
  const score =
    away !== undefined && home !== undefined ? `${away}–${home}` : null;

  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="w-10 shrink-0 pt-0.5 text-xs tabular-nums text-(--text-muted)">
        {play.timeInPeriod}
      </span>
      {teamCode ? <TeamLogo code={teamCode} size={20} /> : <span className="w-5" />}
      <span className="min-w-0 flex-1">
        {scorer ? (
          <PlayerChip name={fullName(scorer)} headshotUrl={scorer.headshot} />
        ) : (
          <span className="text-(--text-muted)">Unknown</span>
        )}
        {assists.length > 0 ? (
          <span className="ml-1 text-xs text-(--text-muted)">
            · A: {assists.map((p) => fullName(p)).join(", ")}
          </span>
        ) : null}
      </span>
      {score ? (
        <span className="shrink-0 pt-0.5 text-xs tabular-nums text-(--text-muted)">
          {score}
        </span>
      ) : null}
    </li>
  );
}

function lookup(
  players: Map<number, PlayByPlayRosterSpot>,
  id: number | undefined,
): PlayByPlayRosterSpot | null {
  if (id === undefined) return null;
  return players.get(id) ?? null;
}

function periodLabel(num: number, type: string | undefined): string {
  if (type === "OT") return "Overtime";
  if (type === "SO") return "Shootout";
  if (num === 1) return "1st period";
  if (num === 2) return "2nd period";
  if (num === 3) return "3rd period";
  if (num >= 4) return `Overtime ${num - 3}`;
  return `Period ${num}`;
}
