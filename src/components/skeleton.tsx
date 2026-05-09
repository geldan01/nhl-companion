type Variant = "card" | "row" | "rink" | "pill";

export type SkeletonProps = {
  variant: Variant;
  count?: number;
  className?: string;
};

const SHIMMER = "animate-pulse bg-(--surface)";

export function Skeleton({ variant, count = 1, className }: SkeletonProps) {
  const block = <SkeletonBlock variant={variant} className={className} />;
  if (count <= 1) return block;
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonBlock key={i} variant={variant} className={className} />
      ))}
    </div>
  );
}

function SkeletonBlock({ variant, className }: { variant: Variant; className?: string }) {
  const cls = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" ");
  switch (variant) {
    case "card":
      return <div aria-hidden className={cls(SHIMMER, "h-28 w-full rounded-lg", className)} />;
    case "row":
      return <div aria-hidden className={cls(SHIMMER, "h-8 w-full rounded", className)} />;
    case "rink":
      return (
        <div
          aria-hidden
          className={cls(SHIMMER, "aspect-[100/85] w-full rounded", className)}
        />
      );
    case "pill":
      return (
        <div
          aria-hidden
          className={cls(SHIMMER, "inline-block h-5 w-24 rounded-full", className)}
        />
      );
  }
}
