// `?date=YYYY-MM-DD` on the Scoreboard. null/empty/invalid means "today".

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function parseScoreboardDate(value: string | null): string | null {
  if (!value || !ISO_DATE.test(value)) return null;
  return value;
}

export function formatScoreboardDate(date: string | null): string | null {
  if (!date || !ISO_DATE.test(date)) return null;
  return date;
}

export function todayUtcDate(): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
