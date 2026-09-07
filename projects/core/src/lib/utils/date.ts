/**
 * Calendar-date helpers.
 *
 * The library treats a date as a *calendar date* — a year, a month and a day —
 * carried in a native `Date` pinned to local midnight. That is a deliberate
 * narrowing: `Date` is an instant, and an instant is the wrong type for "the
 * 14th", but it is the type every consumer already has, and adding a date
 * library would break the air-gapped, no-runtime-dependency constraint.
 *
 * Everything below therefore works in local time and never touches UTC. The
 * one rule a consumer has to know: what goes in is normalised to midnight, so
 * `value` never carries a time component that would break equality.
 */

/** Local midnight on the same calendar day. Returns a new instance. */
export function txStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function txIsValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

export function txIsSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function txIsSameMonth(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return a === b;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function txAddDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Adds months, clamping the day to the target month's length.
 *
 * The naive `setMonth` overflows — 31 January plus one month lands on 2 or 3
 * March — which makes month paging skip a month roughly seven times a year.
 */
export function txAddMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = Math.min(date.getDate(), txDaysInMonth(year, month));
  return new Date(year, month, day);
}

export function txAddYears(date: Date, years: number): Date {
  return txAddMonths(date, years * 12);
}

export function txStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function txEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** Handles month indexes outside 0–11, which `txAddMonths` relies on. */
export function txDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Keeps a date inside an inclusive range. Either bound may be null. */
export function txClampDate(date: Date, min: Date | null, max: Date | null): Date {
  if (min && date.getTime() < min.getTime()) return txStartOfDay(min);
  if (max && date.getTime() > max.getTime()) return txStartOfDay(max);
  return date;
}

export function txIsWithin(date: Date, min: Date | null, max: Date | null): boolean {
  if (min && txStartOfDay(date).getTime() < txStartOfDay(min).getTime()) return false;
  if (max && txStartOfDay(date).getTime() > txStartOfDay(max).getTime()) return false;
  return true;
}

/** `yyyy-mm-dd`, in local time — never `toISOString`, which shifts to UTC. */
export function txFormatIsoDate(date: Date): string {
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Parses `yyyy-mm-dd`, and the same with `/` or `.` separators.
 *
 * Strict about what a date *is*: `2026-02-30` is rejected rather than rolled
 * forward into March, because a field that silently corrects what someone typed
 * is worse than one that says it did not understand.
 */
export function txParseIsoDate(text: string): Date | null {
  const match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || day > txDaysInMonth(year, month)) return null;

  return new Date(year, month, day);
}

/**
 * The six-week grid for a month.
 *
 * Always six rows, always starting on `firstDayOfWeek`, padded with the
 * adjacent months' days. A fixed height stops the panel resizing as you page
 * through the year, which would move the buttons under the pointer.
 */
export function txMonthGrid(month: Date, firstDayOfWeek: number): Date[][] {
  const first = txStartOfMonth(month);
  const lead = (first.getDay() - firstDayOfWeek + 7) % 7;
  const start = txAddDays(first, -lead);

  const weeks: Date[][] = [];
  for (let week = 0; week < 6; week++) {
    const days: Date[] = [];
    for (let day = 0; day < 7; day++) {
      days.push(txAddDays(start, week * 7 + day));
    }
    weeks.push(days);
  }
  return weeks;
}
