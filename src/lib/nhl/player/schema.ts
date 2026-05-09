import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

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
  })
  .passthrough();

export type PlayerResponse = z.infer<typeof PlayerResponse>;
