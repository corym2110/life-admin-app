const AUTO_BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

/** True if it's been at least a week since the last auto-backup (or there's never been one). */
export function isBackupDue(lastBackupAt: string | null, now: Date = new Date()): boolean {
  if (!lastBackupAt) return true;
  return now.getTime() - new Date(lastBackupAt).getTime() >= AUTO_BACKUP_INTERVAL_MS;
}
