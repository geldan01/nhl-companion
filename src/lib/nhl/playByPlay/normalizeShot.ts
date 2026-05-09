import type { Play } from './schema';

// NHL rink: 200ft x 85ft, origin at center ice.
// Raw coords: xCoord ∈ [-100, 100], yCoord ∈ [-42.5, 42.5].
// `homeTeamDefendingSide` per play already encodes the period flip — we don't
// need to know the period number, just trust the field.

const RINK_LENGTH = 200;
const RINK_WIDTH = 85;
const HALF_LENGTH = RINK_LENGTH / 2;
const HALF_WIDTH = RINK_WIDTH / 2;

export type NormalizedShot = {
  x: number; // 0..1 in attacking direction (1 = at the goal being attacked)
  y: number; // 0..1 across the width (rotated with x when attacking left)
  side: 'home' | 'away';
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function normalizeShot(play: Play, homeTeamId: number): NormalizedShot | null {
  const x = play.details?.xCoord;
  const y = play.details?.yCoord;
  const owner = play.details?.eventOwnerTeamId;
  const homeSide = play.homeTeamDefendingSide;

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof owner !== 'number' ||
    (homeSide !== 'left' && homeSide !== 'right')
  ) {
    return null;
  }

  const isHome = owner === homeTeamId;
  // home defends left → home attacks right; home defends right → home attacks left
  const homeAttacksRight = homeSide === 'left';
  const shooterAttacksRight = isHome ? homeAttacksRight : !homeAttacksRight;

  // If shooter attacks left, rotate the play 180° (flip both x and y).
  const rotatedX = shooterAttacksRight ? x : -x;
  const rotatedY = shooterAttacksRight ? y : -y;

  return {
    x: clamp01((rotatedX + HALF_LENGTH) / RINK_LENGTH),
    y: clamp01((rotatedY + HALF_WIDTH) / RINK_WIDTH),
    side: isHome ? 'home' : 'away',
  };
}
