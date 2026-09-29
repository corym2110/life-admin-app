import { Directory, File, Paths } from 'expo-file-system';

const PHOTOS_DIR_NAME = 'item-photos';

function photosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/** Copies a picked photo (which may live in a temporary cache location) into the app's document directory so it survives cache clears. */
export async function persistPickedPhoto(sourceUri: string): Promise<string> {
  const source = new File(sourceUri);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${source.extension || '.jpg'}`;
  const dest = new File(photosDirectory(), filename);
  await source.copy(dest);
  return dest.uri;
}

export function deletePersistedPhoto(uri: string): void {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
