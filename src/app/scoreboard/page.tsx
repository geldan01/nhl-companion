import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { ScoreboardView } from "./scoreboard-view";

export const metadata = {
  title: "Scoreboard — NHL Companion",
};

export default function ScoreboardPage() {
  return (
    <Suspense fallback={<ScoreboardFallback />}>
      <ScoreboardView />
    </Suspense>
  );
}

function ScoreboardFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 h-7 w-48 animate-pulse rounded bg-(--surface)" />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton variant="card" count={6} />
      </div>
    </div>
  );
}
