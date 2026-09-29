import { isBackupDue } from '../backupSchedule';

describe('isBackupDue', () => {
  it('is due when there has never been a backup', () => {
    expect(isBackupDue(null, new Date('2026-06-01T00:00:00Z'))).toBe(true);
  });

  it('is not due right after a backup', () => {
    expect(isBackupDue('2026-06-01T00:00:00Z', new Date('2026-06-01T00:00:01Z'))).toBe(false);
  });

  it('is not due just under a week later', () => {
    const lastBackup = '2026-06-01T00:00:00Z';
    const now = new Date('2026-06-07T23:59:59Z');
    expect(isBackupDue(lastBackup, now)).toBe(false);
  });

  it('is due at exactly a week', () => {
    const lastBackup = '2026-06-01T00:00:00Z';
    const now = new Date('2026-06-08T00:00:00Z');
    expect(isBackupDue(lastBackup, now)).toBe(true);
  });

  it('is due well over a week later', () => {
    expect(isBackupDue('2026-05-01T00:00:00Z', new Date('2026-06-01T00:00:00Z'))).toBe(true);
  });
});
