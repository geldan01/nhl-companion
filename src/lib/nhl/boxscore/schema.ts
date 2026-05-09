import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const BoxscoreTeam = z
  .object({
    id: z.number(),
    abbrev: z.string(),
    commonName: LocalizedString,
    placeName: LocalizedString,
    score: z.number().optional(),
    sog: z.number().optional(),
    logo: z.string(),
    darkLogo: z.string().optional(),
  })
  .passthrough();

const SkaterStats = z
  .object({
    playerId: z.number(),
    sweaterNumber: z.number().optional(),
    name: LocalizedString,
    position: z.string(),
    goals: z.number().optional(),
    assists: z.number().optional(),
    points: z.number().optional(),
    plusMinus: z.number().optional(),
    pim: z.number().optional(),
    hits: z.number().optional(),
    sog: z.number().optional(),
    blockedShots: z.number().optional(),
    giveaways: z.number().optional(),
    takeaways: z.number().optional(),
    powerPlayGoals: z.number().optional(),
    faceoffWinningPctg: z.number().optional(),
    shifts: z.number().optional(),
    toi: z.string().optional(),
  })
  .passthrough();

const GoalieStats = z
  .object({
    playerId: z.number(),
    sweaterNumber: z.number().optional(),
    name: LocalizedString,
    position: z.string(),
    starter: z.boolean().optional(),
    saves: z.number().optional(),
    saveShotsAgainst: z.string().optional(),
    shotsAgainst: z.number().optional(),
    goalsAgainst: z.number().optional(),
    pim: z.number().optional(),
    toi: z.string().optional(),
  })
  .passthrough();

const TeamPlayerStats = z
  .object({
    forwards: z.array(SkaterStats),
    defense: z.array(SkaterStats),
    goalies: z.array(GoalieStats),
  })
  .passthrough();

const PlayerByGameStats = z
  .object({
    awayTeam: TeamPlayerStats,
    homeTeam: TeamPlayerStats,
  })
  .passthrough();

const PeriodDescriptor = z
  .object({
    number: z.number().optional(),
    periodType: z.string().optional(),
    maxRegulationPeriods: z.number().optional(),
  })
  .passthrough();

const Clock = z
  .object({
    timeRemaining: z.string(),
    secondsRemaining: z.number(),
    running: z.boolean(),
    inIntermission: z.boolean(),
  })
  .passthrough();

export const BoxscoreResponse = z
  .object({
    id: z.number(),
    season: z.number(),
    gameType: z.number(),
    gameState: z.string(),
    gameScheduleState: z.string(),
    awayTeam: BoxscoreTeam,
    homeTeam: BoxscoreTeam,
    periodDescriptor: PeriodDescriptor,
    clock: Clock,
    playerByGameStats: PlayerByGameStats,
  })
  .passthrough();

export type BoxscoreResponse = z.infer<typeof BoxscoreResponse>;
export type BoxscoreSkater = z.infer<typeof SkaterStats>;
export type BoxscoreGoalie = z.infer<typeof GoalieStats>;
