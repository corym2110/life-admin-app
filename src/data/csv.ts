import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

import { itemsToCsv } from './csvFormat';
import { listItems } from './items';

export async function exportItemsCsv(db: SQLiteDatabase): Promise<void> {
  const items = await listItems(db);
  const csv = itemsToCsv(items);

  const filename = `life-admin-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  const file = new File(new Directory(Paths.cache), filename);
  file.create({ intermediates: true, overwrite: true });
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export CSV' });
  }
}
