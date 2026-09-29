import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/item-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { todayISODate } from '@/data/dueDate';
import { groupItemsForHome, type HomeSections } from '@/data/homeSections';
import { listItems } from '@/data/items';
import { subscribeItemsChanged } from '@/data/itemsBus';
import { useTheme } from '@/hooks/use-theme';
import type { Item } from '@/types/item';

const SECTION_CONFIG: { key: keyof HomeSections; title: string; emptyText: string }[] = [
  { key: 'overdue', title: 'Overdue', emptyText: 'Nothing overdue.' },
  { key: 'dueThisMonth', title: 'Due this month', emptyText: 'Nothing due this month.' },
  { key: 'comingUp', title: 'Coming up', emptyText: 'Nothing in the next 90 days.' },
];

export default function HomeScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const [items, setItems] = useState<Item[] | null>(null);

  const reload = useCallback(() => {
    listItems(db).then(setItems);
  }, [db]);

  useFocusEffect(reload);

  // Also react to mutations that happen without a focus transition, like
  // tapping Undo on the delete banner while still sitting on this screen.
  useEffect(() => subscribeItemsChanged(reload), [reload]);

  const today = todayISODate();
  const sections = items ? groupItemsForHome(items, today) : null;

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Home</ThemedText>
          <Pressable onPress={() => router.push('/item/new')}>
            <ThemedView type="backgroundElement" style={styles.addButton}>
              <ThemedText type="smallBold">+ Add</ThemedText>
            </ThemedView>
          </Pressable>
        </ThemedView>

        {!sections ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
            Loading…
          </ThemedText>
        ) : (
          <ThemedView style={styles.sectionsWrapper}>
            {SECTION_CONFIG.map(({ key, title, emptyText }) => {
              const sectionItems = sections[key];
              return (
                <ThemedView key={key} style={styles.section}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {sectionItems.length > 0 ? `${title.toUpperCase()} (${sectionItems.length})` : title.toUpperCase()}
                  </ThemedText>
                  {sectionItems.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {emptyText}
                    </ThemedText>
                  ) : (
                    <ThemedView style={styles.rowsWrapper}>
                      {sectionItems.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          today={today}
                          onPress={() => router.push(`/item/${item.id}`)}
                        />
                      ))}
                    </ThemedView>
                  )}
                </ThemedView>
              );
            })}
          </ThemedView>
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
  },
  centerText: {
    textAlign: 'center',
    paddingTop: Spacing.six,
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  rowsWrapper: {
    gap: Spacing.two,
  },
});
