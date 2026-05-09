import { describe, it, expect } from 'vitest';
import { normalizeShot } from './normalizeShot';
import type { Play } from './schema';

const HOME_ID = 4;
const AWAY_ID = 12;

function shot(opts: {
  x: number;
  y: number;
  ownerId: number;
  homeSide: 'left' | 'right';
}): Play {
  return {
    eventId: 1,
    periodDescriptor: { number: 1, periodType: 'REG' },
    timeInPeriod: '00:00',
    timeRemaining: '20:00',
    typeCode: 506,
    typeDescKey: 'shot-on-goal',
    sortOrder: 1,
    homeTeamDefendingSide: opts.homeSide,
    details: { xCoord: opts.x, yCoord: opts.y, eventOwnerTeamId: opts.ownerId },
  } as Play;
}

describe('normalizeShot', () => {
  it('home shot at center ice (home defends left, attacks right) → (0.5, 0.5, home)', () => {
    expect(normalizeShot(shot({ x: 0, y: 0, ownerId: HOME_ID, homeSide: 'left' }), HOME_ID)).toEqual({
      x: 0.5,
      y: 0.5,
      side: 'home',
    });
  });

  it('home shot at attacking goal line (attacks right) → (1, 0.5, home)', () => {
    expect(
      normalizeShot(shot({ x: 100, y: 0, ownerId: HOME_ID, homeSide: 'left' }), HOME_ID),
    ).toEqual({ x: 1, y: 0.5, side: 'home' });
  });

  it('home shot at attacking goal line when home attacks left → (1, 0.5, home) after rotation', () => {
    expect(
      normalizeShot(shot({ x: -100, y: 0, ownerId: HOME_ID, homeSide: 'right' }), HOME_ID),
    ).toEqual({ x: 1, y: 0.5, side: 'home' });
  });

  it('rotates y as well as x when attacking left (period flip)', () => {
    const result = normalizeShot(
      shot({ x: -50, y: 21.25, ownerId: HOME_ID, homeSide: 'right' }),
      HOME_ID,
    );
    expect(result?.x).toBeCloseTo(0.75, 5); // -50 → 50 → (50+100)/200
    expect(result?.y).toBeCloseTo(0.25, 5); // 21.25 → -21.25 → (-21.25+42.5)/85
  });

  it('away shot tagged side: away', () => {
    expect(
      normalizeShot(shot({ x: 100, y: 0, ownerId: AWAY_ID, homeSide: 'right' }), HOME_ID),
    ).toMatchObject({ side: 'away' });
  });

  it('away shooter attacks the side home is defending', () => {
    // Home defends right → away attacks right. Raw +100 → (1, ...).
    expect(
      normalizeShot(shot({ x: 100, y: 0, ownerId: AWAY_ID, homeSide: 'right' }), HOME_ID),
    ).toEqual({ x: 1, y: 0.5, side: 'away' });
    // Home defends left → away attacks left. Raw -100 → rotated +100 → (1, ...).
    expect(
      normalizeShot(shot({ x: -100, y: 0, ownerId: AWAY_ID, homeSide: 'left' }), HOME_ID),
    ).toEqual({ x: 1, y: 0.5, side: 'away' });
  });

  it('clamps coords slightly outside the rink to [0, 1]', () => {
    const result = normalizeShot(
      shot({ x: 110, y: 50, ownerId: HOME_ID, homeSide: 'left' }),
      HOME_ID,
    );
    expect(result?.x).toBe(1);
    expect(result?.y).toBe(1);
  });

  it('returns null when xCoord is missing', () => {
    const play = {
      eventId: 1,
      periodDescriptor: { number: 1, periodType: 'REG' },
      timeInPeriod: '00:00',
      timeRemaining: '20:00',
      typeCode: 502,
      typeDescKey: 'faceoff',
      sortOrder: 1,
      homeTeamDefendingSide: 'left' as const,
      details: { eventOwnerTeamId: HOME_ID },
    } as Play;
    expect(normalizeShot(play, HOME_ID)).toBeNull();
  });

  it('returns null when homeTeamDefendingSide is missing', () => {
    const play = {
      eventId: 1,
      periodDescriptor: { number: 1, periodType: 'REG' },
      timeInPeriod: '00:00',
      timeRemaining: '20:00',
      typeCode: 506,
      typeDescKey: 'shot-on-goal',
      sortOrder: 1,
      details: { xCoord: 0, yCoord: 0, eventOwnerTeamId: HOME_ID },
    } as Play;
    expect(normalizeShot(play, HOME_ID)).toBeNull();
  });
});
