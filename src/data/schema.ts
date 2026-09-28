import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.execAsync(`
      CREATE TABLE items (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        due_date TEXT NOT NULL,
        repeat_every INTEGER,
        repeat_unit TEXT,
        reminder_offsets TEXT NOT NULL,
        notes TEXT NOT NULL DEFAULT '',
        photo_uris TEXT NOT NULL DEFAULT '[]',
        last_done_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE INDEX idx_items_due_date ON items(due_date);
      CREATE INDEX idx_items_category ON items(category);

      CREATE TABLE history (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        done_at TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX idx_history_item_id ON history(item_id);
    `);
    await db.execAsync('PRAGMA user_version = 1;');
  }
}

export const DATABASE_NAME = 'life-admin.db';
