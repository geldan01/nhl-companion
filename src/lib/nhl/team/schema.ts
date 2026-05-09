import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const TeamSkaterStats = z
  .object({
    playerId: z.number(),
    headshot: z.string(),
    firstName: LocalizedString,
    lastName: LocalizedString,
    positionCode: z.string(),
    gamesPlayed: z.number().optional(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    points: z.number().optional(),
    plusMinus: z.number().optional(),
    penaltyMinutes: z.number().optional(),
    powerPlayGoals: z.number().optional(),
    shorthandedGoals: z.number().optional(),
    overtimeGoals: z.number().optional(),
    gameWinningGoals: z.number().optional(),
    shots: z.number().optional(),
    shootingPctg: z.number().optional(),
    avgTimeOnIcePerGame: z.number().optional(),
    avgShiftsPerGame: z.number().optional(),
    faceoffWinPctg: z.number().optional(),
  })
  .passthrough();

const TeamGoalieStats = z
  .object({
    playerId: z.number(),
    headshot: z.string().optional(),
    firstName: LocalizedString,
    lastName: LocalizedString,
    gamesPlayed: z.number().optional(),
    gamesStarted: z.number().optional(),
    wins: z.number().optional(),
    losses: z.number().optional(),
    overtimeLosses: z.number().optional(),
    shutouts: z.number().optional(),
    goalsAgainst: z.number().optional(),
    goalsAgainstAverage: z.number().optional(),
    saves: z.number().optional(),
    shotsAgainst: z.number().optional(),
    savePercentage: z.number().optional(),
    timeOnIce: z.number().optional(),
  })
  .passthrough();

export const TeamResponse = z
  .object({
    // `season` arrives as a string (e.g. "20252026") on this endpoint, despite
    // being a number elsewhere in the API.
    season: z.string(),
    gameType: z.number(),
    skaters: z.array(TeamSkaterStats),
    goalies: z.array(TeamGoalieStats),
  })
  .passthrough();

export type TeamResponse = z.infer<typeof TeamResponse>;
export type TeamSkater = z.infer<typeof TeamSkaterStats>;
export type TeamGoalie = z.infer<typeof TeamGoalieStats>;
