// Two-letter initials fallback for missing/broken headshots. Used by both
// the player page hero and the in-game player pane so a 404 from the NHL
// CDN doesn't leave a blank circle behind.

export type InitialsAvatarProps = {
  name: string;
  size?: number;
  className?: string;
  rounded?: "md" | "full";
};

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function InitialsAvatar({
  name,
  size = 56,
  className,
  rounded = "md",
}: InitialsAvatarProps) {
  const r = rounded === "full" ? "rounded-full" : "rounded-md";
  return (
    <span
      aria-hidden
      className={`flex items-center justify-center bg-(--surface) font-semibold text-(--text-muted) ${r} ${className ?? ""}`}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.32) }}
    >
      {initialsFor(name)}
    </span>
  );
}
