import type { RepeatRule } from '@/types/item';

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, month0: number): number {
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate();
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return toISODate(new Date(Date.UTC(year, month - 1, day + days)));
}

// Adding months can overflow past the end of a shorter target month
// (e.g. Jan 31 + 1 month); clamp to that month's last day instead of
// letting JS Date roll over into the following month.
function addMonths(dateStr: string, months: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const totalMonths = month - 1 + months;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth0 = ((totalMonths % 12) + 12) % 12;
  const clampedDay = Math.min(day, lastDayOfMonth(targetYear, targetMonth0));
  return toISODate(new Date(Date.UTC(targetYear, targetMonth0, clampedDay)));
}

export function addInterval(dateStr: string, repeat: RepeatRule): string {
  switch (repeat.unit) {
    case 'day':
      return addDays(dateStr, repeat.every);
    case 'week':
      return addDays(dateStr, repeat.every * 7);
    case 'month':
      return addMonths(dateStr, repeat.every);
    case 'year':
      return addMonths(dateStr, repeat.every * 12);
  }
}

/**
 * Advances `dueDate` by `repeat` until the result is strictly after
 * `referenceDate` (the day the item was actually marked done). Without this,
 * an item completed long after it was due would come back due again
 * immediately instead of resuming its normal cadence.
 */
export function computeNextDueDate(
  dueDate: string,
  repeat: RepeatRule,
  referenceDate: string = dueDate
): string {
  if (!Number.isInteger(repeat.every) || repeat.every <= 0) {
    throw new Error(`repeat.every must be a positive integer, got ${repeat.every}`);
  }

  let next = addInterval(dueDate, repeat);
  while (next <= referenceDate) {
    next = addInterval(next, repeat);
  }
  return next;
}
