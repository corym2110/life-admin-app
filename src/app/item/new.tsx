import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ItemForm, type ItemFormValues } from '@/components/item-form';
import { todayISODate } from '@/data/dueDate';
import { createItem } from '@/data/items';
import { DEFAULT_REMINDER_OFFSETS } from '@/types/item';

const DEFAULT_VALUES: ItemFormValues = {
  title: '',
  category: 'home',
  dueDate: todayISODate(),
  repeatEnabled: false,
  repeatEvery: '1',
  repeatUnit: 'month',
  reminderOffsets: DEFAULT_REMINDER_OFFSETS,
  notes: '',
  photoUris: [],
};

export default function NewItemScreen() {
  const db = useSQLiteContext();

  async function handleSubmit(values: ItemFormValues) {
    await createItem(db, {
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

  return <ItemForm initialValues={DEFAULT_VALUES} submitLabel="Add item" onSubmit={handleSubmit} />;
}
