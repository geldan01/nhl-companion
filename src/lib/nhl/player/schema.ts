import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

// featuredStats.{regularSeason,playoffs}.subSeason carries either skater or
// goalie fields; mark them all optional so one schema accepts both shapes.
const FeaturedSubSeason = z
  .object({
    gamesPlayed: z.number().optional(),
    // Skater
    goals: z.number().optional(),
    assists: z.number().optional(),
    points: z.number().optional(),
    plusMinus: z.number().optional(),
    pim: z.number().optional(),
    shots: z.number().optional(),
    powerPlayGoals: z.number().optional(),
    powerPlayPoints: z.number().optional(),
    shorthandedGoals: z.number().optional(),
    shorthandedPoints: z.number().optional(),
    gameWinningGoals: z.number().optional(),
    otGoals: z.number().optional(),
    shootingPctg: z.number().optional(),
    // Goalie
    wins: z.number().optional(),
    losses: z.number().optional(),
    otLosses: z.number().optional(),
    shutouts: z.number().optional(),
    goalsAgainstAvg: z.number().optional(),
    savePctg: z.number().optional(),
  })
  .passthrough();

const FeaturedSplit = z
  .object({
    subSeason: FeaturedSubSeason.optional(),
    career: FeaturedSubSeason.optional(),
  })
  .passthrough();

const FeaturedStats = z
  .object({
    season: z.number().optional(),
    regularSeason: FeaturedSplit.optional(),
    playoffs: FeaturedSplit.optional(),
  })
  .passthrough();

export const PlayerResponse = z
  .object({
    playerId: z.number(),
    isActive: z.boolean(),
    firstName: LocalizedString,
    lastName: LocalizedString,
    fullTeamName: LocalizedString.optional(),
    teamCommonName: LocalizedString.optional(),
    teamLogo: z.string().optional(),
    currentTeamId: z.number().optional(),
    currentTeamAbbrev: z.string().optional(),
    sweaterNumber: z.number().optional(),
    position: z.string(),
    headshot: z.string(),
    heroImage: z.string().optional(),
    shootsCatches: z.string().optional(),
    heightInInches: z.number().optional(),
    heightInCentimeters: z.number().optional(),
    weightInPounds: z.number().optional(),
    weightInKilograms: z.number().optional(),
    birthDate: z.string().optional(),
    birthCity: LocalizedString.optional(),
    birthCountry: z.string().optional(),
    birthStateProvince: LocalizedString.optional(),
    inHHOF: z.union([z.boolean(), z.number()]).optional(),
    featuredStats: FeaturedStats.optional(),
  })
  .passthrough();

export type PlayerResponse = z.infer<typeof PlayerResponse>;
export type PlayerFeaturedSubSeason = z.infer<typeof FeaturedSubSeason>;
