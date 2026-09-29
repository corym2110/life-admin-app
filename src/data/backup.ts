import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import type { HistoryEntry, Item } from '@/types/item';

import { isBackupDue } from './backupSchedule';
import { listAllHistory, listItems, replaceAllData } from './items';
import { getLastAutoBackupAt, setLastAutoBackupAt } from './settings';

const BACKUP_VERSION = 1;

export interface BackupPayload {
  version: number;
  exportedAt: string;
  items: Item[];
  history: HistoryEntry[];
}

async function buildBackupPayload(db: SQLiteDatabase): Promise<BackupPayload> {
  const [items, history] = await Promise.all([listItems(db), listAllHistory(db)]);
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), items, history };
}

function backupFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
}

function writeJsonFile(directory: Directory, filename: string, payload: unknown): File {
  const file = new File(directory, filename);
  file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(payload, null, 2));
  return file;
}

/** Writes a full JSON backup to a shareable location and opens the share sheet. */
export async function exportBackupJson(db: SQLiteDatabase): Promise<void> {
  const payload = await buildBackupPayload(db);
  const file = writeJsonFile(new Directory(Paths.cache), backupFilename('life-admin-backup'), payload);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export backup' });
  }
}

export type RestoreResult = 'restored' | 'canceled';

/** Lets the user pick a backup JSON file and replaces all current data with its contents. */
export async function restoreFromBackupFile(db: SQLiteDatabase): Promise<RestoreResult> {
  const picked = await File.pickFileAsync({ mimeTypes: 'application/json' });
  if (picked.canceled) return 'canceled';

  const text = await picked.result.text();
  const payload = JSON.parse(text) as Partial<BackupPayload>;
  if (!Array.isArray(payload.items) || !Array.isArray(payload.history)) {
    throw new Error("That file doesn't look like a valid backup.");
  }

  await replaceAllData(db, payload.items, payload.history);
  return 'restored';
}

const AUTO_BACKUP_DIR_NAME = 'auto-backups';

/**
 * Silently writes a JSON snapshot to the app's own storage about once a week
 * (the "never lose data" requirement) — not user-facing. See
 * exportBackupJson for the manual, shareable export.
 */
export async function runAutoBackupIfDue(db: SQLiteDatabase): Promise<void> {
  const lastBackupAt = await getLastAutoBackupAt(db);
  if (!isBackupDue(lastBackupAt)) return;

  const payload = await buildBackupPayload(db);
  writeJsonFile(new Directory(Paths.document, AUTO_BACKUP_DIR_NAME), backupFilename('auto'), payload);

  await setLastAutoBackupAt(db, new Date().toISOString());
}
