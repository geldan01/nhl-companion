import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const TeamSummary = z
  .object({
    id: z.number(),
    abbrev: z.string(),
    commonName: LocalizedString,
    placeName: LocalizedString,
    logo: z.string(),
    darkLogo: z.string().optional(),
    score: z.number().optional(),
  })
  .passthrough();

const PeriodDescriptor = z
  .object({
    number: z.number().optional(),
    periodType: z.string().optional(),
    maxRegulationPeriods: z.number().optional(),
  })
  .passthrough();

const GameOutcome = z
  .object({
    lastPeriodType: z.string().optional(),
  })
  .passthrough();

const TeamScheduleGame = z
  .object({
    id: z.number(),
    season: z.number(),
    gameType: z.number(),
    gameDate: z.string(),
    startTimeUTC: z.string(),
    gameState: z.string(),
    gameScheduleState: z.string(),
    venue: LocalizedString,
    awayTeam: TeamSummary,
    homeTeam: TeamSummary,
    periodDescriptor: PeriodDescriptor.optional(),
    gameOutcome: GameOutcome.optional(),
  })
  .passthrough();

export const TeamScheduleResponse = z
  .object({
    previousSeason: z.number(),
    currentSeason: z.number(),
    clubTimezone: z.string(),
    clubUTCOffset: z.string(),
    games: z.array(TeamScheduleGame),
  })
  .passthrough();

export type TeamScheduleResponse = z.infer<typeof TeamScheduleResponse>;
export type TeamScheduleGame = z.infer<typeof TeamScheduleGame>;
