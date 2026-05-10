import type { Play, PlayByPlayRosterSpot } from './schema';

export type PlayPlayerRole =
  | 'scorer'
  | 'assist1'
  | 'assist2'
  | 'goalieOnIce'
  | 'shooter'
  | 'goalie'
  | 'committedBy'
  | 'drawnBy'
  | 'hitter'
  | 'hittee'
  | 'faceoffWinner'
  | 'faceoffLoser'
  | 'actor';

export type PlayPlayer = {
  role: PlayPlayerRole;
  player: PlayByPlayRosterSpot;
};

export const PLAY_PLAYER_ROLE_LABEL: Record<PlayPlayerRole, string> = {
  scorer: 'Scorer',
  assist1: 'Assist',
  assist2: 'Assist',
  goalieOnIce: 'Goalie',
  shooter: 'Shooter',
  goalie: 'Goalie',
  committedBy: 'Penalty on',
  drawnBy: 'Drawn by',
  hitter: 'Hit by',
  hittee: 'Hit on',
  faceoffWinner: 'Won by',
  faceoffLoser: 'Lost by',
  actor: 'Player',
};

// Returns the players involved in a play, in display priority order, with
// each role tagged. Roles are tied to play.typeDescKey; unknown play types
// or unresolvable IDs return an empty array.
export function getPlayPlayers(
  play: Play,
  roster: Map<number, PlayByPlayRosterSpot>,
): PlayPlayer[] {
  const d = play.details;
  if (!d) return [];

  const out: PlayPlayer[] = [];
  const push = (role: PlayPlayerRole, id: number | undefined) => {
    if (id === undefined) return;
    const player = roster.get(id);
    if (!player) return;
    out.push({ role, player });
  };

  switch (play.typeDescKey) {
    case 'goal':
      push('scorer', d.scoringPlayerId);
      push('assist1', d.assist1PlayerId);
      push('assist2', d.assist2PlayerId);
      push('goalieOnIce', d.goalieInNetId);
      return out;
    case 'shot-on-goal':
    case 'missed-shot':
    case 'blocked-shot':
      push('shooter', d.shootingPlayerId);
      push('goalie', d.goalieInNetId);
      return out;
    case 'penalty':
      push('committedBy', d.committedByPlayerId);
      push('drawnBy', d.drawnByPlayerId);
      return out;
    case 'hit':
      push('hitter', d.hittingPlayerId);
      push('hittee', d.hitteePlayerId);
      return out;
    case 'faceoff':
      push('faceoffWinner', d.winningPlayerId);
      push('faceoffLoser', d.losingPlayerId);
      return out;
    case 'takeaway':
    case 'giveaway':
      push('actor', d.playerId);
      return out;
    default:
      return out;
  }
}

export function fullName(p: PlayByPlayRosterSpot): string {
  return `${p.firstName.default} ${p.lastName.default}`;
}
