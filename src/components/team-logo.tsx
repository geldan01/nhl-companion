import Image from "next/image";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";

export type TeamLogoProps = {
  code: TeamCode | string;
  size?: number;
  className?: string;
};

// NHL serves team logos as SVG at a stable URL keyed by abbreviation.
// We use the `_dark` variant — designed for dark backgrounds but readable
// on light too because its outlines stay opaque. If individual teams look
// wrong on the light theme later, switch to two <Image>s toggled via
// Tailwind's dark: classes.
const logoUrl = (code: string) =>
  `https://assets.nhle.com/logos/nhl/svg/${code}_dark.svg`;

export function TeamLogo({ code, size = 32, className }: TeamLogoProps) {
  const { primary } = getTeamColors(code);
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded ${className ?? ""}`}
      style={{ width: size, height: size, background: primary }}
    >
      <Image
        src={logoUrl(code)}
        alt={code}
        width={size}
        height={size}
        unoptimized
      />
    </span>
  );
}
