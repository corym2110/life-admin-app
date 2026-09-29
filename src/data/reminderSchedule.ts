import type { Item } from '@/types/item';

// A one-off item that's already been marked done has nothing left to remind about.
export function isFinished(item: Item): boolean {
  return item.repeat === null && item.lastDoneAt !== null;
}

/** The still-future reminder moments for an item (due date at 9am, minus each offset in days). */
export function upcomingReminderDates(item: Item, now: Date = new Date()): Date[] {
  const [year, month, day] = item.dueDate.split('-').map(Number);
  const dueAt9am = new Date(year, month - 1, day, 9, 0, 0, 0);

  return item.reminderOffsets
    .map((offsetDays) => new Date(dueAt9am.getTime() - offsetDays * 24 * 60 * 60 * 1000))
    .filter((date) => date.getTime() > now.getTime());
}
