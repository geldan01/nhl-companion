import Image from "next/image";

export type PlayerChipProps = {
  name: string;
  headshotUrl?: string;
  size?: number;
  className?: string;
};

// Headshot URLs from the NHL CDN are season- and team-keyed
// (assets.nhle.com/mugs/nhl/{season}/{team}/{id}.png), so we can't construct
// them from a player id alone. Consumers pass the URL through from the
// data-layer response (boxscore.player.headshot, player.headshot, etc.).
// Without a URL we render initials on a neutral background.
export function PlayerChip({ name, headshotUrl, size = 24, className }: PlayerChipProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--surface) text-[10px] font-semibold uppercase text-(--text-muted)"
        style={{ width: size, height: size }}
      >
        {headshotUrl ? (
          <Image src={headshotUrl} alt={name} width={size} height={size} />
        ) : (
          initials(name)
        )}
      </span>
      <span>{name}</span>
    </span>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + parts[parts.length - 1][0]).slice(0, 2);
}
