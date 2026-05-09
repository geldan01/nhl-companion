import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const StandingEntry = z
  .object({
    seasonId: z.number(),
    teamAbbrev: LocalizedString,
    teamName: LocalizedString,
    teamCommonName: LocalizedString,
    placeName: LocalizedString,
    teamLogo: z.string(),
    conferenceAbbrev: z.string(),
    conferenceName: z.string(),
    conferenceSequence: z.number(),
    divisionAbbrev: z.string(),
    divisionName: z.string(),
    divisionSequence: z.number(),
    leagueSequence: z.number(),
    wildcardSequence: z.number().optional(),
    clinchIndicator: z.string().optional(),
    gamesPlayed: z.number(),
    wins: z.number(),
    losses: z.number(),
    otLosses: z.number().optional(),
    points: z.number(),
    pointPctg: z.number().optional(),
    goalFor: z.number(),
    goalAgainst: z.number(),
    goalDifferential: z.number(),
    streakCode: z.string().optional(),
    streakCount: z.number().optional(),
    l10Wins: z.number().optional(),
    l10Losses: z.number().optional(),
    l10OtLosses: z.number().optional(),
    l10Points: z.number().optional(),
    l10GamesPlayed: z.number().optional(),
  })
  .passthrough();

export const StandingsResponse = z
  .object({
    standings: z.array(StandingEntry),
    standingsDateTimeUtc: z.string(),
    wildCardIndicator: z.boolean().optional(),
  })
  .passthrough();

export type StandingsResponse = z.infer<typeof StandingsResponse>;
export type StandingEntry = z.infer<typeof StandingEntry>;
