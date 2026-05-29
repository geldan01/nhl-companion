import Link from "next/link";

// Shown in the summer, between the Stanley Cup Final and the next puck drop.
export function OffseasonMessage() {
  return (
    <div className="rounded-lg border border-(--border) bg-(--surface) px-6 py-12 text-center">
      <p className="text-5xl" aria-hidden>
        ☀️🏒
      </p>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">
        Enjoy the off-season!
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-(--text-muted)">
        The rinks are quiet for now. Soak up the summer — we&apos;ll be right here
        when training camps open and the puck drops on a new season.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/standings"
          className="rounded-md border border-(--border) px-4 py-2 text-sm font-medium transition-colors hover:bg-(--surface-hover)"
        >
          Final standings
        </Link>
        <Link
          href="/stats"
          className="rounded-md border border-(--border) px-4 py-2 text-sm font-medium transition-colors hover:bg-(--surface-hover)"
        >
          Season stat leaders
        </Link>
      </div>
    </div>
  );
}
