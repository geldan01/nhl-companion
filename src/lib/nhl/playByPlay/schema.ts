import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

const TeamPlayByPlay = z
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

const PlayDetails = z
  .object({
    xCoord: z.number().optional(),
    yCoord: z.number().optional(),
    zoneCode: z.string().optional(),
    shotType: z.string().optional(),
    eventOwnerTeamId: z.number().optional(),
    scoringPlayerId: z.number().optional(),
    assist1PlayerId: z.number().optional(),
    assist2PlayerId: z.number().optional(),
    shootingPlayerId: z.number().optional(),
    goalieInNetId: z.number().optional(),
    committedByPlayerId: z.number().optional(),
    drawnByPlayerId: z.number().optional(),
    hittingPlayerId: z.number().optional(),
    hitteePlayerId: z.number().optional(),
    winningPlayerId: z.number().optional(),
    losingPlayerId: z.number().optional(),
    playerId: z.number().optional(),
    descKey: z.string().optional(),
    duration: z.number().optional(),
    // String here ('MIN'/'MAJ' on penalties) — distinct from Play.typeCode (number).
    typeCode: z.string().optional(),
    awayScore: z.number().optional(),
    homeScore: z.number().optional(),
    awaySOG: z.number().optional(),
    homeSOG: z.number().optional(),
  })
  .passthrough();

export const Play = z
  .object({
    eventId: z.number(),
    periodDescriptor: PeriodDescriptor,
    timeInPeriod: z.string(),
    timeRemaining: z.string(),
    situationCode: z.string().optional(),
    homeTeamDefendingSide: z.enum(['left', 'right']).optional(),
    typeCode: z.number(),
    typeDescKey: z.string(),
    sortOrder: z.number(),
    details: PlayDetails.optional(),
  })
  .passthrough();

const RosterSpot = z
  .object({
    teamId: z.number(),
    playerId: z.number(),
    firstName: LocalizedString,
    lastName: LocalizedString,
    sweaterNumber: z.number().optional(),
    positionCode: z.string(),
    headshot: z.string(),
  })
  .passthrough();

export const PlayByPlayResponse = z
  .object({
    id: z.number(),
    season: z.number(),
    gameType: z.number(),
    gameState: z.string(),
    gameScheduleState: z.string(),
    awayTeam: TeamPlayByPlay,
    homeTeam: TeamPlayByPlay,
    periodDescriptor: PeriodDescriptor,
    clock: Clock,
    plays: z.array(Play),
    rosterSpots: z.array(RosterSpot),
  })
  .passthrough();

export type PlayByPlayResponse = z.infer<typeof PlayByPlayResponse>;
export type Play = z.infer<typeof Play>;
export type PlayByPlayRosterSpot = z.infer<typeof RosterSpot>;
