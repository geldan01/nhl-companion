"use client";

import type { ShotKind } from "./scales";

export type Side = "home" | "away";
export type PeriodFilter = "all" | 1 | 2 | 3 | "ot";

export type RinkFilterState = {
  sides: Set<Side>;
  kinds: Set<ShotKind>;
  period: PeriodFilter;
};

export const DEFAULT_RINK_FILTER: RinkFilterState = {
  sides: new Set<Side>(["home", "away"]),
  kinds: new Set<ShotKind>(["goal", "shot-on-goal", "missed-shot", "blocked-shot"]),
  period: "all",
};

export type RinkControlsProps = {
  state: RinkFilterState;
  onChange: (next: RinkFilterState) => void;
  awayCode: string;
  homeCode: string;
};

const KIND_LABELS: Record<ShotKind, string> = {
  goal: "Goals",
  "shot-on-goal": "SOG",
  "missed-shot": "Missed",
  "blocked-shot": "Blocked",
};

const PERIODS: PeriodFilter[] = ["all", 1, 2, 3, "ot"];
const PERIOD_LABEL: Record<string, string> = {
  all: "All",
  "1": "1P",
  "2": "2P",
  "3": "3P",
  ot: "OT",
};

export function RinkControls({ state, onChange, awayCode, homeCode }: RinkControlsProps) {
  const toggleSide = (s: Side) => {
    const next = new Set(state.sides);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChange({ ...state, sides: next });
  };
  const toggleKind = (k: ShotKind) => {
    const next = new Set(state.kinds);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    onChange({ ...state, kinds: next });
  };
  const setPeriod = (p: PeriodFilter) => onChange({ ...state, period: p });

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-(--border) p-2 text-xs">
      <ToggleGroup
        label="Teams"
        items={[
          { id: "away" as const, label: awayCode, on: state.sides.has("away") },
          { id: "home" as const, label: homeCode, on: state.sides.has("home") },
        ]}
        onToggle={toggleSide}
      />
      <ToggleGroup
        label="Kinds"
        items={(Object.keys(KIND_LABELS) as ShotKind[]).map((k) => ({
          id: k,
          label: KIND_LABELS[k],
          on: state.kinds.has(k),
        }))}
        onToggle={toggleKind}
      />
      <Segmented
        label="Period"
        value={String(state.period)}
        options={PERIODS.map((p) => ({ value: String(p), label: PERIOD_LABEL[String(p)] ?? String(p) }))}
        onChange={(v) => setPeriod(v === "all" || v === "ot" ? (v as PeriodFilter) : (Number(v) as PeriodFilter))}
      />
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  items,
  onToggle,
}: {
  label: string;
  items: { id: T; label: string; on: boolean }[];
  onToggle: (id: T) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="sr-only">{label}</span>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          aria-pressed={it.on}
          onClick={() => onToggle(it.id)}
          className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-1 transition-colors ${
            it.on
              ? "border-(--accent) bg-(--accent)/15 text-(--text)"
              : "border-(--border) bg-(--surface) text-(--text-muted)"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="ml-auto inline-flex rounded-full border border-(--border) bg-(--surface) p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`inline-flex min-h-6 items-center rounded-full px-2.5 py-1 transition-colors ${
            value === opt.value
              ? "bg-(--bg) text-(--text) shadow-sm"
              : "text-(--text-muted)"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
