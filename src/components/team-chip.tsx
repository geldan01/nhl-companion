import type { TeamCode } from "@/lib/team-colors";
import { TeamLogo } from "./team-logo";

export type TeamChipProps = {
  code: TeamCode | string;
  record?: string;
  size?: number;
  className?: string;
};

export function TeamChip({ code, record, size = 24, className }: TeamChipProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <TeamLogo code={code} size={size} />
      <span className="font-medium">{code}</span>
      {record ? (
        <span className="text-xs text-(--text-muted)">{record}</span>
      ) : null}
    </span>
  );
}
