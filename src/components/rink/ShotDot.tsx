import type { ShotKind } from "./scales";

export type ShotDotProps = {
  cx: number;
  cy: number;
  kind: ShotKind;
  side: "home" | "away";
  focused?: boolean;
  title?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function ShotDot({
  cx,
  cy,
  kind,
  side,
  focused = false,
  title,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ShotDotProps) {
  const color = side === "home" ? "var(--home)" : "var(--away)";
  const interactive = Boolean(onClick);

  const common = {
    onClick,
    onMouseEnter,
    onMouseLeave,
    tabIndex: interactive ? 0 : undefined,
    role: interactive ? ("button" as const) : undefined,
    style: { cursor: interactive ? "pointer" : "default" },
  };

  const focusRing = focused ? (
    <circle
      cx={cx}
      cy={cy}
      r={radiusFor(kind) + 1.2}
      fill="none"
      stroke={color}
      strokeWidth="0.5"
      strokeOpacity={0.6}
    />
  ) : null;

  switch (kind) {
    case "goal":
      return (
        <g {...common}>
          {focusRing}
          {/* gold ring for goals — extra visual weight */}
          <circle cx={cx} cy={cy} r={2.6} fill="none" stroke="#f5c542" strokeWidth="0.7" />
          <circle cx={cx} cy={cy} r={2.2} fill={color}>
            {title ? <title>{title}</title> : null}
          </circle>
        </g>
      );
    case "shot-on-goal":
      return (
        <g {...common}>
          {focusRing}
          <circle cx={cx} cy={cy} r={1.5} fill={color}>
            {title ? <title>{title}</title> : null}
          </circle>
        </g>
      );
    case "missed-shot":
      return (
        <g {...common}>
          {focusRing}
          <circle cx={cx} cy={cy} r={1.5} fill="none" stroke={color} strokeWidth="0.5">
            {title ? <title>{title}</title> : null}
          </circle>
        </g>
      );
    case "blocked-shot": {
      const r = 1.2;
      return (
        <g {...common}>
          {focusRing}
          <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} stroke={color} strokeWidth="0.5" />
          <line x1={cx - r} y1={cy + r} x2={cx + r} y2={cy - r} stroke={color} strokeWidth="0.5">
            {title ? <title>{title}</title> : null}
          </line>
        </g>
      );
    }
  }
}

function radiusFor(kind: ShotKind): number {
  switch (kind) {
    case "goal":
      return 2.2;
    case "shot-on-goal":
    case "missed-shot":
      return 1.5;
    case "blocked-shot":
      return 1.2;
  }
}
