import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ItemForm, type ItemFormValues, type ValidatedItemFormValues } from '@/components/item-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getItem, updateItem } from '@/data/items';
import { deletePersistedPhoto } from '@/data/photos';
import type { Item } from '@/types/item';

function itemToFormValues(item: Item): ItemFormValues {
  return {
    title: item.title,
    category: item.category,
    dueDate: item.dueDate,
    repeatEnabled: item.repeat !== null,
    repeatEvery: String(item.repeat?.every ?? 1),
    repeatUnit: item.repeat?.unit ?? 'month',
    reminderOffsets: item.reminderOffsets,
    notes: item.notes,
    photoUris: item.photoUris,
  };
}

export default function EditItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    getItem(db, id).then(setItem);
  }, [db, id]);

  async function handleSubmit(values: ValidatedItemFormValues) {
    const previousPhoto = item?.photoUris[0];
    const nextPhoto = values.photoUris[0];
    if (previousPhoto && previousPhoto !== nextPhoto) {
      deletePersistedPhoto(previousPhoto);
    }

    await updateItem(db, id, {
      title: values.title.trim(),
      category: values.category,
      dueDate: values.dueDate,
      repeat: values.repeatEnabled ? { every: Number(values.repeatEvery), unit: values.repeatUnit } : null,
      reminderOffsets: values.reminderOffsets,
      notes: values.notes.trim(),
      photoUris: values.photoUris,
    });
    router.back();
  }

  if (!item) {
    return (
      <ThemedView style={styles.centerFill}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  return <ItemForm initialValues={itemToFormValues(item)} submitLabel="Save changes" onSubmit={handleSubmit} />;
}

const styles = StyleSheet.create({
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
