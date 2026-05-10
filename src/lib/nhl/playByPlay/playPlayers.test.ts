import { describe, expect, it } from 'vitest';
import { PlayByPlayResponse, type PlayByPlayRosterSpot } from './schema';
import { getPlayPlayers } from './playPlayers';
import fixture from './__fixtures__/playByPlay.json';

const data = PlayByPlayResponse.parse(fixture);

const roster = new Map<number, PlayByPlayRosterSpot>(
  data.rosterSpots.map((r) => [r.playerId, r]),
);

const firstByType = (type: string) =>
  data.plays.find((p) => p.typeDescKey === type);

describe('getPlayPlayers', () => {
  it('returns scorer + at least one assist + goalie for a goal', () => {
    const goal = firstByType('goal');
    expect(goal).toBeDefined();
    const players = getPlayPlayers(goal!, roster);
    const roles = players.map((p) => p.role);
    expect(roles).toContain('scorer');
    expect(roles).toContain('goalieOnIce');
    // Most goals in the fixture have at least one assist; allow either.
    if (goal!.details?.assist1PlayerId !== undefined) {
      expect(roles).toContain('assist1');
    }
  });

  it('returns committedBy + drawnBy for a penalty', () => {
    const penalty = firstByType('penalty');
    expect(penalty).toBeDefined();
    const players = getPlayPlayers(penalty!, roster);
    const roles = players.map((p) => p.role);
    expect(roles).toContain('committedBy');
    if (penalty!.details?.drawnByPlayerId !== undefined) {
      expect(roles).toContain('drawnBy');
    }
  });

  it('returns hitter + hittee for a hit', () => {
    const hit = firstByType('hit');
    expect(hit).toBeDefined();
    const players = getPlayPlayers(hit!, roster);
    expect(players.map((p) => p.role)).toEqual(
      expect.arrayContaining(['hitter', 'hittee']),
    );
  });

  it('returns winner + loser for a faceoff', () => {
    const fo = firstByType('faceoff');
    expect(fo).toBeDefined();
    const players = getPlayPlayers(fo!, roster);
    expect(players.map((p) => p.role)).toEqual(
      expect.arrayContaining(['faceoffWinner', 'faceoffLoser']),
    );
  });

  it('returns shooter (and goalie if present) for shot-on-goal', () => {
    const shot = firstByType('shot-on-goal');
    expect(shot).toBeDefined();
    const players = getPlayPlayers(shot!, roster);
    expect(players.map((p) => p.role)).toContain('shooter');
  });

  it('returns the actor for takeaway / giveaway', () => {
    const takeaway = firstByType('takeaway');
    if (takeaway) {
      const players = getPlayPlayers(takeaway, roster);
      expect(players.map((p) => p.role)).toContain('actor');
    }
    const giveaway = firstByType('giveaway');
    if (giveaway) {
      const players = getPlayPlayers(giveaway, roster);
      expect(players.map((p) => p.role)).toContain('actor');
    }
  });

  it('returns [] for an unknown event type', () => {
    const stoppage = firstByType('stoppage');
    expect(stoppage).toBeDefined();
    expect(getPlayPlayers(stoppage!, roster)).toEqual([]);
  });

  it('skips IDs that the roster cannot resolve', () => {
    const goal = firstByType('goal')!;
    const empty = new Map<number, PlayByPlayRosterSpot>();
    expect(getPlayPlayers(goal, empty)).toEqual([]);
  });
});
