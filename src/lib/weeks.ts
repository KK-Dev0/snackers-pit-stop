/** Return the UTC date string for the Monday of the week containing `date`. */
export function weekStartForDate(date: Date | string = new Date()): string {
  const parsed = typeof date === "string" ? new Date(`${date}T00:00:00Z`) : date;
  const day = parsed.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
  return monday.toISOString().slice(0, 10);
}

/** Shift a Monday week-start date by a whole number of days. */
export function addDays(weekStart: string, days: number): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Short, locale-friendly label for a week-start date. */
export function formatWeekLabel(weekStart: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${weekStart}T00:00:00Z`));
}
