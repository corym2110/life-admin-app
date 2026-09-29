import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ItemForm, type ValidatedItemFormValues } from '@/components/item-form';
import { todayISODate } from '@/data/dueDate';
import { createItem } from '@/data/items';
import { DEFAULT_REMINDER_OFFSETS, type Category, type RepeatUnit } from '@/types/item';

export default function NewItemScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{
    title?: string;
    category?: Category;
    repeatEvery?: string;
    repeatUnit?: RepeatUnit;
    fromStarter?: string;
  }>();

  const fromStarter = params.fromStarter === '1';

  async function handleSubmit(values: ValidatedItemFormValues) {
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

  return (
    <ItemForm
      initialValues={{
        title: params.title ?? '',
        category: params.category ?? 'home',
        // Starter items never assume a due date — the user must pick one.
        dueDate: fromStarter ? null : todayISODate(),
        repeatEnabled: params.repeatEvery !== undefined,
        repeatEvery: params.repeatEvery ?? '1',
        repeatUnit: params.repeatUnit ?? 'month',
        reminderOffsets: DEFAULT_REMINDER_OFFSETS,
        notes: '',
        photoUris: [],
      }}
      submitLabel="Add item"
      onSubmit={handleSubmit}
    />
  );
}
