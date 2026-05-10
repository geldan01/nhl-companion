// Static SVG of a simplified half-rink. Pure presentational component — no
// hooks, no D3. Drawn in NHL-feet via a 100x85 viewBox so the same coordinate
// space as `xScale`/`yScale` lines up with shot dots placed on top.
//
// Geometry is approximate: the attacking goal sits at the right edge (x=100)
// rather than 11ft inside, to keep math + visuals consistent with the data
// layer's `normalizeShot` (where x=1 = at the attacking goal). Faceoff dots,
// circles, blue line, and crease arc are placed proportionally — readable as
// "a hockey rink" without claiming survey-grade precision.

const STROKE = "var(--rink-line)";
const RED = "var(--live)"; // re-uses the LIVE token for goal/center red
const BLUE = "var(--accent)"; // re-uses the accent for the blue line

export function RinkBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 85"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Rink backdrop"
      className={`block w-full ${className ?? ""}`}
      style={{ aspectRatio: "100 / 85" }}
    >
      {/* Boards (rounded corners) */}
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="84"
        rx="14"
        ry="14"
        fill="none"
        stroke={STROKE}
        strokeWidth="0.5"
      />

      {/* Center red line at left edge of the half-rink view */}
      <line x1="0" y1="0" x2="0" y2="85" stroke={RED} strokeWidth="1" />

      {/* Attacking blue line at x=25 */}
      <line x1="25" y1="0" x2="25" y2="85" stroke={BLUE} strokeWidth="1.2" />

      {/* Goal line at x=100 (implicit at right edge — drawn as a thin red marker) */}
      <line x1="99.7" y1="6" x2="99.7" y2="79" stroke={RED} strokeWidth="0.4" />

      {/* Goal rectangle — thin box just inside the right edge */}
      <rect
        x="98"
        y="38.5"
        width="2"
        height="8"
        fill="none"
        stroke={STROKE}
        strokeWidth="0.4"
      />

      {/* Crease — semicircle in front of the goal */}
      <path
        d="M 96,37 A 6 6 0 0 1 96,48"
        fill="rgba(50, 130, 220, 0.08)"
        stroke={BLUE}
        strokeWidth="0.4"
      />

      {/* Faceoff dots (offensive zone): NHL-proportional ~22ft from goal line,
          ~22ft from each side of center width. */}
      <circle cx="78" cy="22" r="0.8" fill={RED} />
      <circle cx="78" cy="63" r="0.8" fill={RED} />

      {/* Faceoff circles around the dots */}
      <circle cx="78" cy="22" r="15" fill="none" stroke={RED} strokeWidth="0.4" />
      <circle cx="78" cy="63" r="15" fill="none" stroke={RED} strokeWidth="0.4" />

      {/* Neutral-zone faceoff dots near the blue line */}
      <circle cx="20" cy="22" r="0.6" fill={RED} />
      <circle cx="20" cy="63" r="0.6" fill={RED} />

      {/* Center-ice faceoff guides on the red line for orientation */}
      <line x1="0" y1="42.5" x2="2" y2="42.5" stroke={RED} strokeWidth="0.3" />
    </svg>
  );
}
