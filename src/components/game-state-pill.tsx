// Renders a small pill summarizing a game's status. The data layer surfaces
// gameState as a free-form string; the values we expect from NHL are PRE,
// FUT, LIVE, CRIT, FINAL, OFF — anything else falls through to a neutral
// rendering of the raw string.

export type KnownGameState = "PRE" | "FUT" | "LIVE" | "CRIT" | "FINAL" | "OFF";

export type GameStatePillProps = {
  state: KnownGameState | string;
  period?: number;
  clock?: string;
  startTimeUTC?: string;
  className?: string;
};

export function GameStatePill({
  state,
  period,
  clock,
  startTimeUTC,
  className,
}: GameStatePillProps) {
  const text = pillText({ state, period, clock, startTimeUTC });
  const isLive = state === "LIVE" || state === "CRIT";
  const color = isLive ? "text-[var(--live)]" : "text-[var(--text-muted)]";
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${color} ${className ?? ""}`}
    >
      {text}
    </span>
  );
}

export function pillText({
  state,
  period,
  clock,
  startTimeUTC,
}: Pick<GameStatePillProps, "state" | "period" | "clock" | "startTimeUTC">): string {
  if (state === "LIVE" || state === "CRIT") {
    const parts = ["LIVE"];
    if (typeof period === "number") parts.push(formatPeriod(period));
    if (clock) parts.push(clock);
    return parts.join(" ");
  }
  if (state === "FINAL" || state === "OFF") return "FINAL";
  if (state === "PRE" || state === "FUT") {
    return startTimeUTC ? formatStartTime(startTimeUTC) : "SCHEDULED";
  }
  return state;
}

function formatPeriod(period: number): string {
  if (period <= 3) return `${period}P`;
  if (period === 4) return "OT";
  return `${period - 3}OT`;
}

function formatStartTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "SCHEDULED";
  return d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s/g, " ");
}
