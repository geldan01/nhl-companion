import Image from "next/image";
import { getTeamColors, type TeamCode } from "@/lib/team-colors";

export type TeamLogoProps = {
  code: TeamCode | string;
  // Numeric for a fixed pixel size, or a CSS length string ("100%", "min(40vw, 432px)")
  // for fluid sizing. Defaults to 32 px.
  size?: number | string;
  className?: string;
  // When true, render just the logo SVG with no colored square behind it.
  // Use for hero placements where the page already carries the team's brand
  // color (e.g. the team page header on top of a team-color gradient).
  bare?: boolean;
};

const logoUrl = (code: string) =>
  `https://assets.nhle.com/logos/nhl/svg/${code}_dark.svg`;

// Intrinsic aspect-lock dimensions for next/image. The actual rendered size
// is set on the wrapping element; the Image fills that wrapper.
const INTRINSIC = 256;

export function TeamLogo({ code, size = 32, className, bare = false }: TeamLogoProps) {
  const cssSize = typeof size === "number" ? `${size}px` : size;
  const isFluid = typeof size === "string";

  if (bare) {
    return (
      <span
        className={`inline-block ${className ?? ""}`}
        style={{ width: cssSize, height: isFluid ? "auto" : cssSize }}
      >
        <Image
          src={logoUrl(code)}
          alt={code}
          width={INTRINSIC}
          height={INTRINSIC}
          unoptimized
          // Both `width: 100%` and `height: 100%` are deliberate — passing one
          // as `auto` triggers next/image's dev-time aspect-ratio warning when
          // the parent wrapper enforces a specific size. The intrinsic 1:1
          // attribute pair guarantees the rendered ratio matches.
          className="block w-full h-full object-contain"
        />
      </span>
    );
  }
  // Chip variant: fixed square with team-color background.
  const { primary } = getTeamColors(code);
  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded ${className ?? ""}`}
      style={{ width: cssSize, height: cssSize, background: primary }}
    >
      <Image
        src={logoUrl(code)}
        alt={code}
        width={INTRINSIC}
        height={INTRINSIC}
        unoptimized
        className="block w-full h-full object-contain"
      />
    </span>
  );
}
