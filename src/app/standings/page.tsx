import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { StandingsView } from "./standings-view";

export default function StandingsPage() {
  return (
    <Suspense fallback={<StandingsFallback />}>
      <StandingsView />
    </Suspense>
  );
}

function StandingsFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-6 h-7 w-32 animate-pulse rounded bg-(--surface)" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Skeleton variant="card" count={4} />
      </div>
    </div>
  );
}
