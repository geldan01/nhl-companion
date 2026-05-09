import { describe, expect, it } from "vitest";
import standingsFixture from "./nhl/standings/__fixtures__/standings.json";
import teamStatsFixture from "./nhl/stats/__fixtures__/team.json";
import {
  FALLBACK_TEAM_COLORS,
  getTeamColors,
  TEAM_COLORS,
  teamCodeForName,
} from "./team-colors";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

describe("TEAM_COLORS", () => {
  it("covers exactly the 32 team codes present in the standings fixture", () => {
    const fixtureCodes = new Set(
      (standingsFixture.standings as { teamAbbrev: { default: string } }[]).map(
        (s) => s.teamAbbrev.default,
      ),
    );
    const mapCodes = new Set(Object.keys(TEAM_COLORS));
    expect(mapCodes).toEqual(fixtureCodes);
    expect(mapCodes.size).toBe(32);
  });

  it("every primary and secondary parses as a 6-digit hex color", () => {
    for (const [code, { primary, secondary }] of Object.entries(TEAM_COLORS)) {
      expect(primary, `${code}.primary`).toMatch(HEX_COLOR);
      expect(secondary, `${code}.secondary`).toMatch(HEX_COLOR);
    }
  });
});

describe("getTeamColors", () => {
  it("returns the mapped colors for a known code", () => {
    expect(getTeamColors("TOR")).toEqual(TEAM_COLORS.TOR);
  });

  it("returns the fallback for an unknown code", () => {
    expect(getTeamColors("ZZZ")).toBe(FALLBACK_TEAM_COLORS);
  });
});

describe("teamCodeForName", () => {
  it("maps every teamFullName from the team-stats fixture to a code", () => {
    const names = (teamStatsFixture.data as { teamFullName: string }[]).map(
      (t) => t.teamFullName,
    );
    for (const name of names) {
      expect(teamCodeForName(name), `missing in TEAM_NAME_TO_CODE: ${name}`).not.toBeNull();
    }
  });

  it("returns null for an unknown name", () => {
    expect(teamCodeForName("Mystery FC")).toBeNull();
  });

  it("returns the right code for a sample lookup", () => {
    expect(teamCodeForName("Toronto Maple Leafs")).toBe("TOR");
  });
});
