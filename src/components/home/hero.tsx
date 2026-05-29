import Image from "next/image";

// Landing banner: the official NHL crest alongside the app name. The crest is
// served from /public so it needs no remote-image allow-listing.
export function Hero() {
  return (
    <section className="border-b border-(--border) bg-gradient-to-b from-(--surface) to-(--bg)">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-10 text-center sm:flex-row sm:gap-6 sm:py-12 sm:text-left">
        <Image
          src="/nhl-logo.svg"
          alt="NHL"
          width={96}
          height={64}
          priority
          unoptimized
          className="h-16 w-auto shrink-0 sm:h-20"
        />
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            NHL Companion
          </h1>
          <p className="mt-1.5 text-sm text-(--text-muted) sm:text-base">
            Your live sidekick for every NHL game — scores, plays, shots and stats.
          </p>
        </div>
      </div>
    </section>
  );
}
