// Hand-maintained team color map. The NHL data layer doesn't surface team
// brand colors, so the UI imports these here. Hex values track each team's
// official primary/secondary identity at the time of writing; expect rare
// updates when a team rebrands. Coverage is the 32 active franchises as of
// the 2025-26 season — verified against the standings fixture.

export type TeamCode =
  | "ANA" | "BOS" | "BUF" | "CAR" | "CBJ" | "CGY" | "CHI" | "COL"
  | "DAL" | "DET" | "EDM" | "FLA" | "LAK" | "MIN" | "MTL" | "NJD"
  | "NSH" | "NYI" | "NYR" | "OTT" | "PHI" | "PIT" | "SEA" | "SJS"
  | "STL" | "TBL" | "TOR" | "UTA" | "VAN" | "VGK" | "WPG" | "WSH";

export type TeamColors = { primary: string; secondary: string };

export const TEAM_COLORS: Record<TeamCode, TeamColors> = {
  ANA: { primary: "#F47A38", secondary: "#B9975B" },
  BOS: { primary: "#FFB81C", secondary: "#000000" },
  BUF: { primary: "#002654", secondary: "#FCB514" },
  CAR: { primary: "#CC0000", secondary: "#000000" },
  CBJ: { primary: "#002654", secondary: "#CE1126" },
  CGY: { primary: "#C8102E", secondary: "#F1BE48" },
  CHI: { primary: "#CF0A2C", secondary: "#000000" },
  COL: { primary: "#6F263D", secondary: "#236192" },
  DAL: { primary: "#006847", secondary: "#8F8F8C" },
  DET: { primary: "#CE1126", secondary: "#FFFFFF" },
  EDM: { primary: "#041E42", secondary: "#FF4C00" },
  FLA: { primary: "#041E42", secondary: "#C8102E" },
  LAK: { primary: "#111111", secondary: "#A2AAAD" },
  MIN: { primary: "#154734", secondary: "#A6192E" },
  MTL: { primary: "#AF1E2D", secondary: "#192168" },
  NJD: { primary: "#CE1126", secondary: "#000000" },
  NSH: { primary: "#FFB81C", secondary: "#041E42" },
  NYI: { primary: "#00539B", secondary: "#F47D30" },
  NYR: { primary: "#0038A8", secondary: "#CE1126" },
  OTT: { primary: "#C52032", secondary: "#C2912C" },
  PHI: { primary: "#F74902", secondary: "#000000" },
  PIT: { primary: "#FCB514", secondary: "#000000" },
  SEA: { primary: "#001628", secondary: "#99D9D9" },
  SJS: { primary: "#006D75", secondary: "#000000" },
  STL: { primary: "#002F87", secondary: "#FCB514" },
  TBL: { primary: "#002868", secondary: "#FFFFFF" },
  TOR: { primary: "#00205B", secondary: "#FFFFFF" },
  UTA: { primary: "#71AFE5", secondary: "#000000" },
  VAN: { primary: "#00205B", secondary: "#00843D" },
  VGK: { primary: "#B4975A", secondary: "#333F42" },
  WPG: { primary: "#041E42", secondary: "#AC162C" },
  WSH: { primary: "#041E42", secondary: "#C8102E" },
};

export const FALLBACK_TEAM_COLORS: TeamColors = {
  primary: "#9ca3af",
  secondary: "#6b7280",
};

export function getTeamColors(code: string): TeamColors {
  return (TEAM_COLORS as Record<string, TeamColors>)[code] ?? FALLBACK_TEAM_COLORS;
}

// Full-name → abbreviation map. Used to derive a `/team/[code]` link from
// data that only carries the full name (e.g. the team-stats response).
// Coverage matches TEAM_COLORS — same 32 franchises.
export const TEAM_NAME_TO_CODE: Record<string, TeamCode> = {
  "Anaheim Ducks": "ANA",
  "Boston Bruins": "BOS",
  "Buffalo Sabres": "BUF",
  "Carolina Hurricanes": "CAR",
  "Columbus Blue Jackets": "CBJ",
  "Calgary Flames": "CGY",
  "Chicago Blackhawks": "CHI",
  "Colorado Avalanche": "COL",
  "Dallas Stars": "DAL",
  "Detroit Red Wings": "DET",
  "Edmonton Oilers": "EDM",
  "Florida Panthers": "FLA",
  "Los Angeles Kings": "LAK",
  "Minnesota Wild": "MIN",
  "Montréal Canadiens": "MTL",
  "Montreal Canadiens": "MTL",
  "New Jersey Devils": "NJD",
  "Nashville Predators": "NSH",
  "New York Islanders": "NYI",
  "New York Rangers": "NYR",
  "Ottawa Senators": "OTT",
  "Philadelphia Flyers": "PHI",
  "Pittsburgh Penguins": "PIT",
  "Seattle Kraken": "SEA",
  "San Jose Sharks": "SJS",
  "St. Louis Blues": "STL",
  "Tampa Bay Lightning": "TBL",
  "Toronto Maple Leafs": "TOR",
  "Utah Mammoth": "UTA",
  "Utah Hockey Club": "UTA",
  "Vancouver Canucks": "VAN",
  "Vegas Golden Knights": "VGK",
  "Winnipeg Jets": "WPG",
  "Washington Capitals": "WSH",
};

export function teamCodeForName(name: string): TeamCode | null {
  return TEAM_NAME_TO_CODE[name] ?? null;
}
