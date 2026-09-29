import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_REMINDER_OFFSETS } from '@/types/item';

const KEYS = {
  defaultReminderOffsets: 'defaultReminderOffsets',
  isPro: 'isPro',
  lastAutoBackupAt: 'lastAutoBackupAt',
} as const;

async function getValue(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key);
  return row?.value ?? null;
}

async function setValue(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value
  );
}

export const FREE_ITEM_LIMIT = 15;

export async function getDefaultReminderOffsets(db: SQLiteDatabase): Promise<number[]> {
  const raw = await getValue(db, KEYS.defaultReminderOffsets);
  return raw ? JSON.parse(raw) : DEFAULT_REMINDER_OFFSETS;
}

export async function setDefaultReminderOffsets(db: SQLiteDatabase, offsets: number[]): Promise<void> {
  await setValue(db, KEYS.defaultReminderOffsets, JSON.stringify(offsets));
}

export async function getIsPro(db: SQLiteDatabase): Promise<boolean> {
  const raw = await getValue(db, KEYS.isPro);
  return raw === 'true';
}

export async function setIsPro(db: SQLiteDatabase, isPro: boolean): Promise<void> {
  await setValue(db, KEYS.isPro, isPro ? 'true' : 'false');
}

export async function getLastAutoBackupAt(db: SQLiteDatabase): Promise<string | null> {
  return getValue(db, KEYS.lastAutoBackupAt);
}

export async function setLastAutoBackupAt(db: SQLiteDatabase, isoDateTime: string): Promise<void> {
  await setValue(db, KEYS.lastAutoBackupAt, isoDateTime);
}
