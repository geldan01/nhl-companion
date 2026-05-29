import { Suspense } from "react";
import { Skeleton } from "@/components/skeleton";
import { TeamPage } from "./team-page";

type Params = { code: string };

export default async function TeamRoute({ params }: { params: Promise<Params> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  return (
    <Suspense fallback={<TeamFallback />}>
      <TeamPage code={upper} />
    </Suspense>
  );
}

function TeamFallback() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 h-12 w-64 animate-pulse rounded bg-(--surface)" />
      <Skeleton variant="row" count={6} />
    </div>
  );
}
