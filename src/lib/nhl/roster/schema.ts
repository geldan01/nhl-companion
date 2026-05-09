import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const RosterPlayer = z
  .object({
    id: z.number(),
    headshot: z.string(),
    firstName: LocalizedString,
    lastName: LocalizedString,
    sweaterNumber: z.number().optional(),
    positionCode: z.string(),
    shootsCatches: z.string().optional(),
    heightInInches: z.number().optional(),
    weightInPounds: z.number().optional(),
    heightInCentimeters: z.number().optional(),
    weightInKilograms: z.number().optional(),
    birthDate: z.string().optional(),
    birthCity: LocalizedString.optional(),
    birthCountry: z.string().optional(),
  })
  .passthrough();

export const RosterResponse = z
  .object({
    forwards: z.array(RosterPlayer),
    defensemen: z.array(RosterPlayer),
    goalies: z.array(RosterPlayer),
  })
  .passthrough();

export type RosterResponse = z.infer<typeof RosterResponse>;
export type RosterPlayer = z.infer<typeof RosterPlayer>;
