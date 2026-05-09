import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { StatsView } from "./stats-view";

export default function StatsPage() {
  return (
    <Suspense fallback={<StatsFallback />}>
      <StatsView />
    </Suspense>
  );
}

function StatsFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-6 h-7 w-32 animate-pulse rounded bg-(--surface)" />
      <Skeleton variant="row" count={10} />
    </div>
  );
}
