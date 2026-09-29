import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ItemForm, type ValidatedItemFormValues } from '@/components/item-form';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { todayISODate } from '@/data/dueDate';
import { createItem, listItems } from '@/data/items';
import { FREE_ITEM_LIMIT, getDefaultReminderOffsets, getIsPro } from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_REMINDER_OFFSETS, type Category, type RepeatUnit } from '@/types/item';

export default function NewItemScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    title?: string;
    category?: Category;
    repeatEvery?: string;
    repeatUnit?: RepeatUnit;
    fromStarter?: string;
  }>();

  const fromStarter = params.fromStarter === '1';

  const [status, setStatus] = useState<'loading' | 'blocked' | 'ready'>('loading');
  const [defaultOffsets, setDefaultOffsets] = useState<number[]>(DEFAULT_REMINDER_OFFSETS);

  useEffect(() => {
    Promise.all([listItems(db), getIsPro(db), getDefaultReminderOffsets(db)]).then(
      ([items, isPro, offsets]) => {
        setDefaultOffsets(offsets);
        setStatus(!isPro && items.length >= FREE_ITEM_LIMIT ? 'blocked' : 'ready');
      }
    );
  }, [db]);

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

  if (status === 'loading') {
    return (
      <ThemedView style={styles.centerFill}>
        <ThemedText type="small" themeColor="textSecondary">
          Loading…
        </ThemedText>
      </ThemedView>
    );
  }

  if (status === 'blocked') {
    return (
      <ThemedView style={styles.blocked}>
        <ThemedText type="subtitle" style={styles.centerText}>
          You&apos;ve reached the free limit
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          The free plan includes up to {FREE_ITEM_LIMIT} items. Upgrade to Pro in Settings for unlimited
          items, or delete something you no longer need.
        </ThemedText>
        <View style={styles.blockedActions}>
          <Pressable onPress={() => router.replace('/settings')}>
            <View style={[styles.actionButton, { backgroundColor: theme.accent }]}>
              <ThemedText type="smallBold" style={styles.actionButtonLabelOnAccent}>
                Go to Settings
              </ThemedText>
            </View>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <View style={[styles.actionButton, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="smallBold">Not now</ThemedText>
            </View>
          </Pressable>
        </View>
      </ThemedView>
    );
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
        reminderOffsets: defaultOffsets,
        notes: '',
        photoUris: [],
      }}
      submitLabel="Add item"
      onSubmit={handleSubmit}
    />
  );
}

const styles = StyleSheet.create({
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocked: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.five,
    gap: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  blockedActions: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  actionButtonLabelOnAccent: {
    color: '#FFFFFF',
  },
});
