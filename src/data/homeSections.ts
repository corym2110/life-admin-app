import type { Item } from '@/types/item';

import { addDays, daysBetween, endOfMonth, todayISODate } from './dueDate';

export interface HomeSections {
  overdue: Item[];
  dueThisMonth: Item[];
  comingUp: Item[];
}

const COMING_UP_HORIZON_DAYS = 90;

function byDueDateAscending(a: Item, b: Item): number {
  return a.dueDate.localeCompare(b.dueDate);
}

/**
 * Splits items into the three Home screen buckets. Anything due further out
 * than the 90-day "coming up" horizon is intentionally left out of all three
 * — it'll surface once it gets closer.
 */
export function groupItemsForHome(items: Item[], today: string = todayISODate()): HomeSections {
  const monthEnd = endOfMonth(today);
  const horizon = addDays(today, COMING_UP_HORIZON_DAYS);

  const sections: HomeSections = { overdue: [], dueThisMonth: [], comingUp: [] };

  for (const item of items) {
    if (item.dueDate < today) {
      sections.overdue.push(item);
    } else if (item.dueDate <= monthEnd) {
      sections.dueThisMonth.push(item);
    } else if (item.dueDate <= horizon) {
      sections.comingUp.push(item);
    }
  }

  sections.overdue.sort(byDueDateAscending);
  sections.dueThisMonth.sort(byDueDateAscending);
  sections.comingUp.sort(byDueDateAscending);

  return sections;
}

export function formatDueLabel(dueDate: string, today: string = todayISODate()): string {
  const diff = daysBetween(today, dueDate);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due in ${diff}d`;
}
