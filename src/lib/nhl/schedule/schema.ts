import { z } from 'zod';

const LocalizedString = z
  .object({
    default: z.string(),
  })
  .passthrough();

const TeamSummary = z
  .object({
    id: z.number(),
    commonName: LocalizedString,
    placeName: LocalizedString,
    abbrev: z.string(),
    logo: z.string(),
    darkLogo: z.string().optional(),
    score: z.number().optional(),
  })
  .passthrough();

const TvBroadcast = z
  .object({
    id: z.number(),
    market: z.string(),
    countryCode: z.string(),
    network: z.string(),
  })
  .passthrough();

const PeriodDescriptor = z
  .object({
    number: z.number().optional(),
    periodType: z.string().optional(),
  })
  .passthrough();

const GameSummary = z
  .object({
    id: z.number(),
    season: z.number(),
    gameType: z.number(),
    venue: LocalizedString,
    startTimeUTC: z.string(),
    gameState: z.string(),
    gameScheduleState: z.string(),
    awayTeam: TeamSummary,
    homeTeam: TeamSummary,
    tvBroadcasts: z.array(TvBroadcast),
    periodDescriptor: PeriodDescriptor.optional(),
  })
  .passthrough();

const GameWeekDay = z
  .object({
    date: z.string(),
    dayAbbrev: z.string(),
    numberOfGames: z.number(),
    games: z.array(GameSummary),
  })
  .passthrough();

export const ScheduleResponse = z
  .object({
    // /v1/schedule/{date} omits these near the end of the visible week
    // (e.g. current week during playoffs). UI only consumes gameWeek.
    nextStartDate: z.string().optional(),
    previousStartDate: z.string().optional(),
    gameWeek: z.array(GameWeekDay),
  })
  .passthrough();

export type ScheduleResponse = z.infer<typeof ScheduleResponse>;
export type ScheduleGame = z.infer<typeof GameSummary>;
export type ScheduleGameWeekDay = z.infer<typeof GameWeekDay>;
