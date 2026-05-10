import { z } from 'zod';

const LocalizedString = z
  .object({ default: z.string() })
  .passthrough();

const TeamGameSummary = z
  .object({
    id: z.number(),
    commonName: LocalizedString,
    abbrev: z.string(),
    placeName: LocalizedString,
    score: z.number().optional(),
    sog: z.number().optional(),
    logo: z.string(),
    darkLogo: z.string().optional(),
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

export const GameResponse = z
  .object({
    id: z.number(),
    season: z.number(),
    gameType: z.number(),
    gameState: z.string(),
    gameScheduleState: z.string(),
    startTimeUTC: z.string(),
    awayTeam: TeamGameSummary,
    homeTeam: TeamGameSummary,
    // FUT (and sometimes PRE) games omit periodDescriptor and clock entirely;
    // they only show up once the game is live or final.
    periodDescriptor: PeriodDescriptor.optional(),
    clock: Clock.optional(),
  })
  .passthrough();

export type GameResponse = z.infer<typeof GameResponse>;
