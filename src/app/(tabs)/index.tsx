import { SymbolView } from 'expo-symbols';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/item-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { todayISODate } from '@/data/dueDate';
import { groupItemsForHome, SECTION_COLORS, type HomeSections } from '@/data/homeSections';
import { listItems } from '@/data/items';
import { subscribeItemsChanged } from '@/data/itemsBus';
import { useTheme } from '@/hooks/use-theme';
import type { Item } from '@/types/item';

const SECTION_CONFIG: { key: keyof HomeSections; title: string; emptyText: string }[] = [
  { key: 'overdue', title: 'Overdue', emptyText: 'Nothing overdue.' },
  { key: 'dueThisMonth', title: 'Due this month', emptyText: 'Nothing due this month.' },
  { key: 'comingUp', title: 'Coming up', emptyText: 'Nothing in the next 90 days.' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: `${color}26` }]}>
      <ThemedText type="title" style={[styles.statCount, { color }]}>
        {count}
      </ThemedText>
      <ThemedText type="small" style={[styles.statLabel, { color }]}>
        {label}
      </ThemedText>
    </View>
  );
}

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
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentInset={insets}
        contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <ThemedView style={styles.container}>
          <ThemedView style={styles.header}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
              LIFE ADMIN
            </ThemedText>
            <ThemedText type="title" style={styles.greeting}>
              {greeting()}
            </ThemedText>
          </ThemedView>

          {sections && (
            <View style={styles.statRow}>
              <StatCard color={SECTION_COLORS.overdue} count={sections.overdue.length} label="Overdue" />
              <StatCard color={SECTION_COLORS.dueThisMonth} count={sections.dueThisMonth.length} label="This month" />
              <StatCard color={SECTION_COLORS.comingUp} count={sections.comingUp.length} label="Coming up" />
            </View>
          )}

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
                      {sectionItems.length > 0
                        ? `${title.toUpperCase()} (${sectionItems.length})`
                        : title.toUpperCase()}
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

      <Pressable
        onPress={() => router.push('/item/new')}
        style={[styles.fab, { backgroundColor: theme.accent, bottom: insets.bottom }]}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={26} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.three,
    gap: Spacing.half,
  },
  eyebrow: {
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 32,
    lineHeight: 38,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.five,
  },
  statCard: {
    flex: 1,
    borderRadius: Radius.large,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    gap: Spacing.half,
  },
  statCount: {
    fontSize: 28,
    lineHeight: 32,
  },
  statLabel: {
    textAlign: 'center',
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
  fab: {
    position: 'absolute',
    right: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
