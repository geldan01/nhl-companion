import { z } from 'zod';

// The right-rail endpoint is large (linescore, team stats, game info, …). We
// only type the playoff series fields the UI consumes; everything else rides
// along on .passthrough(). `seasonSeriesWins` is keyed to the *current game's*
// away/home teams, so the banner maps it onto game.awayTeam / game.homeTeam.
const SeasonSeriesWins = z
  .object({
    awayTeamWins: z.number(),
    homeTeamWins: z.number(),
    // Present for playoff games (4 to win a best-of-7); absent in the regular
    // season, where the block is just a head-to-head record.
    neededToWin: z.number().optional(),
  })
  .passthrough();

export const RightRailResponse = z
  .object({
    seasonSeriesWins: SeasonSeriesWins.optional(),
  })
  .passthrough();

export type RightRailResponse = z.infer<typeof RightRailResponse>;
export type SeasonSeriesWins = z.infer<typeof SeasonSeriesWins>;
