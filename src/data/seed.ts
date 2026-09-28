import type { SQLiteDatabase } from 'expo-sqlite';

import type { NewItemInput } from './items';
import { createItem, listItems } from './items';
import { addDays, todayISODate } from './dueDate';

const SEED_ITEMS: (Omit<NewItemInput, 'dueDate'> & { dueOffsetDays: number })[] = [
  { title: 'Furnace filter', category: 'home', dueOffsetDays: -10, repeat: { every: 3, unit: 'month' } },
  { title: 'Registration renewal', category: 'car', dueOffsetDays: -3, repeat: { every: 1, unit: 'year' } },
  { title: 'Dentist cleaning', category: 'health', dueOffsetDays: 12, repeat: { every: 6, unit: 'month' } },
  { title: 'Oil change', category: 'car', dueOffsetDays: 20, repeat: { every: 6, unit: 'month' } },
  { title: 'Passport renewal', category: 'documents', dueOffsetDays: 25, repeat: null },
  {
    title: 'Streaming subscription renewal',
    category: 'subscriptions',
    dueOffsetDays: 45,
    repeat: { every: 1, unit: 'month' },
  },
  {
    title: 'Smoke & CO detector batteries',
    category: 'home',
    dueOffsetDays: 70,
    repeat: { every: 1, unit: 'year' },
  },
  { title: 'Eye exam', category: 'health', dueOffsetDays: 85, repeat: { every: 2, unit: 'year' } },
  { title: 'Home insurance renewal', category: 'home', dueOffsetDays: 150, repeat: { every: 1, unit: 'year' } },
];

/** Populates a handful of sample items on first launch so the Home screen has real data to show. */
export async function seedIfEmpty(db: SQLiteDatabase): Promise<void> {
  const existing = await listItems(db);
  if (existing.length > 0) return;

  const today = todayISODate();
  for (const { dueOffsetDays, ...input } of SEED_ITEMS) {
    await createItem(db, { ...input, dueDate: addDays(today, dueOffsetDays) });
  }
}
