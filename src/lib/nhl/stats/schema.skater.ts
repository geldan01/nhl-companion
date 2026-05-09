import { z } from 'zod';

const SkaterStat = z
  .object({
    playerId: z.number(),
    skaterFullName: z.string(),
    lastName: z.string().optional(),
    positionCode: z.string(),
    teamAbbrevs: z.string(),
    seasonId: z.number(),
    shootsCatches: z.string().optional(),
    gamesPlayed: z.number(),
    goals: z.number(),
    assists: z.number(),
    points: z.number(),
    plusMinus: z.number().optional(),
    penaltyMinutes: z.number().optional(),
    ppGoals: z.number().optional(),
    ppPoints: z.number().optional(),
    shGoals: z.number().optional(),
    shPoints: z.number().optional(),
    evGoals: z.number().optional(),
    evPoints: z.number().optional(),
    gameWinningGoals: z.number().optional(),
    otGoals: z.number().optional(),
    shots: z.number().optional(),
    shootingPct: z.number().nullable().optional(),
    pointsPerGame: z.number().optional(),
    timeOnIcePerGame: z.number().optional(),
    faceoffWinPct: z.number().nullable().optional(),
  })
  .passthrough();

export const SkaterStatsResponse = z
  .object({
    total: z.number(),
    data: z.array(SkaterStat),
  })
  .passthrough();

export type SkaterStatsResponse = z.infer<typeof SkaterStatsResponse>;
export type SkaterStat = z.infer<typeof SkaterStat>;
