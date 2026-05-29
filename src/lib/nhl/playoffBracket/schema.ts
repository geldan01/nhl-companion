import { z } from 'zod';

const LocalizedString = z.object({ default: z.string() }).passthrough();

// A series team is always present. Before a matchup is decided, the NHL fills
// the slot with a TBD placeholder: `id: -1`, `abbrev: "TBD"`, and a generic
// team-tbd logo. Callers detect that via `isTbdTeam` rather than special
// schema handling.
const SeriesTeam = z
  .object({
    id: z.number(),
    abbrev: z.string(),
    name: LocalizedString,
    commonName: LocalizedString.optional(),
    placeNameWithPreposition: LocalizedString.optional(),
    logo: z.string(),
    darkLogo: z.string().optional(),
  })
  .passthrough();

const Series = z
  .object({
    seriesUrl: z.string().optional(),
    seriesTitle: z.string(),
    seriesAbbrev: z.string(),
    seriesLetter: z.string(),
    playoffRound: z.number(),
    // Conference rounds (R3) carry these; earlier rounds don't.
    conferenceAbbrev: z.string().optional(),
    conferenceName: z.string().optional(),
    seriesLogo: z.string().optional(),
    topSeedRank: z.number().optional(),
    topSeedRankAbbrev: z.string().optional(),
    bottomSeedRank: z.number().optional(),
    bottomSeedRankAbbrev: z.string().optional(),
    topSeedWins: z.number(),
    bottomSeedWins: z.number(),
    neededToWin: z.number().optional(),
    // Absent until the series is decided.
    winningTeamId: z.number().optional(),
    losingTeamId: z.number().optional(),
    topSeedTeam: SeriesTeam,
    bottomSeedTeam: SeriesTeam,
  })
  .passthrough();

export const PlayoffBracketResponse = z
  .object({
    bracketLogo: z.string().optional(),
    bracketTitle: LocalizedString.optional(),
    bracketSubTitle: LocalizedString.optional(),
    series: z.array(Series),
  })
  .passthrough();

export type PlayoffBracketResponse = z.infer<typeof PlayoffBracketResponse>;
export type PlayoffSeries = z.infer<typeof Series>;
export type PlayoffSeriesTeam = z.infer<typeof SeriesTeam>;

export function isTbdTeam(team: PlayoffSeriesTeam): boolean {
  return team.id < 0 || team.abbrev === 'TBD';
}
