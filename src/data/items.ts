import type { SQLiteDatabase } from 'expo-sqlite';

import type { Category, HistoryEntry, Item, RepeatRule } from '@/types/item';
import { DEFAULT_REMINDER_OFFSETS } from '@/types/item';

import { computeNextDueDate } from './dueDate';

function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

interface ItemRow {
  id: string;
  title: string;
  category: Category;
  due_date: string;
  repeat_every: number | null;
  repeat_unit: RepeatRule['unit'] | null;
  reminder_offsets: string;
  notes: string;
  photo_uris: string;
  last_done_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    dueDate: row.due_date,
    repeat:
      row.repeat_every != null && row.repeat_unit != null
        ? { every: row.repeat_every, unit: row.repeat_unit }
        : null,
    reminderOffsets: JSON.parse(row.reminder_offsets),
    notes: row.notes,
    photoUris: JSON.parse(row.photo_uris),
    lastDoneAt: row.last_done_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type NewItemInput = {
  title: string;
  category: Category;
  dueDate: string;
  repeat?: RepeatRule | null;
  reminderOffsets?: number[];
  notes?: string;
  photoUris?: string[];
};

export async function createItem(db: SQLiteDatabase, input: NewItemInput): Promise<Item> {
  const timestamp = nowISO();
  const item: Item = {
    id: generateId(),
    title: input.title,
    category: input.category,
    dueDate: input.dueDate,
    repeat: input.repeat ?? null,
    reminderOffsets: input.reminderOffsets ?? DEFAULT_REMINDER_OFFSETS,
    notes: input.notes ?? '',
    photoUris: input.photoUris ?? [],
    lastDoneAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.runAsync(
    `INSERT INTO items
      (id, title, category, due_date, repeat_every, repeat_unit, reminder_offsets, notes, photo_uris, last_done_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    item.id,
    item.title,
    item.category,
    item.dueDate,
    item.repeat?.every ?? null,
    item.repeat?.unit ?? null,
    JSON.stringify(item.reminderOffsets),
    item.notes,
    JSON.stringify(item.photoUris),
    item.lastDoneAt,
    item.createdAt,
    item.updatedAt
  );

  return item;
}

export async function getItem(db: SQLiteDatabase, id: string): Promise<Item | null> {
  const row = await db.getFirstAsync<ItemRow>('SELECT * FROM items WHERE id = ?', id);
  return row ? rowToItem(row) : null;
}

export async function listItems(db: SQLiteDatabase): Promise<Item[]> {
  const rows = await db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY due_date ASC');
  return rows.map(rowToItem);
}

export type ItemPatch = Partial<
  Pick<Item, 'title' | 'category' | 'dueDate' | 'repeat' | 'reminderOffsets' | 'notes' | 'photoUris'>
>;

export async function updateItem(db: SQLiteDatabase, id: string, patch: ItemPatch): Promise<Item> {
  const existing = await getItem(db, id);
  if (!existing) {
    throw new Error(`Item ${id} not found`);
  }
  const updated: Item = { ...existing, ...patch, updatedAt: nowISO() };

  await db.runAsync(
    `UPDATE items SET
      title = ?, category = ?, due_date = ?, repeat_every = ?, repeat_unit = ?,
      reminder_offsets = ?, notes = ?, photo_uris = ?, updated_at = ?
     WHERE id = ?`,
    updated.title,
    updated.category,
    updated.dueDate,
    updated.repeat?.every ?? null,
    updated.repeat?.unit ?? null,
    JSON.stringify(updated.reminderOffsets),
    updated.notes,
    JSON.stringify(updated.photoUris),
    updated.updatedAt,
    id
  );

  return updated;
}

export async function deleteItem(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
}

export async function listHistoryForItem(db: SQLiteDatabase, itemId: string): Promise<HistoryEntry[]> {
  const rows = await db.getAllAsync<{ id: string; item_id: string; done_at: string; note: string }>(
    'SELECT * FROM history WHERE item_id = ? ORDER BY done_at DESC',
    itemId
  );
  return rows.map((row) => ({ id: row.id, itemId: row.item_id, doneAt: row.done_at, note: row.note }));
}

export async function markItemDone(
  db: SQLiteDatabase,
  id: string,
  options: { doneAt?: string; note?: string } = {}
): Promise<Item> {
  const existing = await getItem(db, id);
  if (!existing) {
    throw new Error(`Item ${id} not found`);
  }

  const doneAt = options.doneAt ?? nowISO();
  const nextDueDate = existing.repeat
    ? computeNextDueDate(existing.dueDate, existing.repeat, doneAt.slice(0, 10))
    : existing.dueDate;
  const updatedAt = nowISO();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO history (id, item_id, done_at, note) VALUES (?, ?, ?, ?)',
      generateId(),
      id,
      doneAt,
      options.note ?? ''
    );
    await db.runAsync(
      'UPDATE items SET due_date = ?, last_done_at = ?, updated_at = ? WHERE id = ?',
      nextDueDate,
      doneAt,
      updatedAt,
      id
    );
  });

  return { ...existing, dueDate: nextDueDate, lastDoneAt: doneAt, updatedAt };
}
