import { z } from 'zod';

const TeamStat = z
  .object({
    teamId: z.number(),
    teamFullName: z.string(),
    seasonId: z.number(),
    gamesPlayed: z.number(),
    wins: z.number(),
    losses: z.number(),
    otLosses: z.number().optional(),
    ties: z.number().nullable().optional(),
    points: z.number(),
    pointPct: z.number().optional(),
    regulationAndOtWins: z.number().optional(),
    winsInRegulation: z.number().optional(),
    winsInShootout: z.number().optional(),
    goalsFor: z.number(),
    goalsAgainst: z.number(),
    goalsForPerGame: z.number().optional(),
    goalsAgainstPerGame: z.number().optional(),
    shotsForPerGame: z.number().optional(),
    shotsAgainstPerGame: z.number().optional(),
    powerPlayPct: z.number().optional(),
    powerPlayNetPct: z.number().optional(),
    penaltyKillPct: z.number().optional(),
    penaltyKillNetPct: z.number().optional(),
    faceoffWinPct: z.number().optional(),
    teamShutouts: z.number().optional(),
  })
  .passthrough();

export const TeamStatsResponse = z
  .object({
    total: z.number(),
    data: z.array(TeamStat),
  })
  .passthrough();

export type TeamStatsResponse = z.infer<typeof TeamStatsResponse>;
export type TeamStat = z.infer<typeof TeamStat>;
