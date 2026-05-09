"use client";

import Link from "next/link";
import { useWatching } from "@/lib/watching";
import { GameStatePill } from "./game-state-pill";

// Phase 1 stub. The pill renders only when a game has been picked, and in
// Phase 1 nothing wires setWatching, so this component never renders. Phase
// 2.10 wires the live useGame subscription and the seeded snapshot.
export function NowWatchingPill() {
  const { watching } = useWatching();
  if (!watching) return null;

  return (
    <Link
      href={`/game/${watching.gameId}`}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs hover:bg-[var(--surface-hover)]"
    >
      <span className="font-semibold">{watching.away}</span>
      <span className="tabular-nums">{watching.awayScore}</span>
      <span className="text-[var(--text-muted)]">–</span>
      <span className="tabular-nums">{watching.homeScore}</span>
      <span className="font-semibold">{watching.home}</span>
      <GameStatePill state={watching.state} />
    </Link>
  );
}
