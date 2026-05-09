import { z } from 'zod';

const GoalieStat = z
  .object({
    playerId: z.number(),
    goalieFullName: z.string(),
    lastName: z.string().optional(),
    teamAbbrevs: z.string(),
    seasonId: z.number(),
    shootsCatches: z.string().optional(),
    gamesPlayed: z.number(),
    gamesStarted: z.number().optional(),
    wins: z.number(),
    losses: z.number(),
    otLosses: z.number().optional(),
    ties: z.number().nullable().optional(),
    shutouts: z.number().optional(),
    saves: z.number().optional(),
    shotsAgainst: z.number().optional(),
    goalsAgainst: z.number().optional(),
    goalsAgainstAverage: z.number().optional(),
    savePct: z.number().optional(),
    timeOnIce: z.number().optional(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    points: z.number().optional(),
    penaltyMinutes: z.number().optional(),
  })
  .passthrough();

export const GoalieStatsResponse = z
  .object({
    total: z.number(),
    data: z.array(GoalieStat),
  })
  .passthrough();

export type GoalieStatsResponse = z.infer<typeof GoalieStatsResponse>;
export type GoalieStat = z.infer<typeof GoalieStat>;
