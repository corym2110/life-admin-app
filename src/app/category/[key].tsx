import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ItemRow } from '@/components/item-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { todayISODate } from '@/data/dueDate';
import { listItems } from '@/data/items';
import { starterItemsForCategory, type StarterItem } from '@/data/starterItems';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type Item } from '@/types/item';

function repeatHint(repeat: StarterItem['repeat']): string {
  if (!repeat) return 'One-time';
  const unit = repeat.every === 1 ? repeat.unit : `${repeat.unit}s`;
  return `Every ${repeat.every} ${unit}`;
}

export default function CategoryDetailScreen() {
  const { key } = useLocalSearchParams<{ key: Category }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const color = CATEGORY_COLORS[key];

  const [items, setItems] = useState<Item[]>([]);

  useFocusEffect(
    useCallback(() => {
      listItems(db).then((all) => setItems(all.filter((item) => item.category === key)));
    }, [db, key])
  );

  const today = todayISODate();
  const addedTitles = new Set(items.map((item) => item.title.trim().toLowerCase()));
  const suggestions = starterItemsForCategory(key).filter(
    (starter) => !addedTitles.has(starter.title.trim().toLowerCase())
  );

  function addCustom() {
    router.push({ pathname: '/item/new', params: { category: key } });
  }

  function addStarter(starter: StarterItem) {
    router.push({
      pathname: '/item/new',
      params: {
        title: starter.title,
        category: key,
        ...(starter.repeat ? { repeatEvery: String(starter.repeat.every), repeatUnit: starter.repeat.unit } : {}),
        fromStarter: '1',
      },
    });
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <ThemedText type="subtitle">{CATEGORY_LABELS[key]}</ThemedText>
        </View>
        <Pressable onPress={addCustom}>
          <View style={[styles.addButton, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={styles.addButtonLabel}>
              + Add
            </ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          YOUR ITEMS
        </ThemedText>
        {items.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nothing added in this category yet.
          </ThemedText>
        ) : (
          <View style={styles.rows}>
            {items.map((item) => (
              <ItemRow key={item.id} item={item} today={today} onPress={() => router.push(`/item/${item.id}`)} />
            ))}
          </View>
        )}
      </View>

      {suggestions.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            SUGGESTED
          </ThemedText>
          <View style={styles.rows}>
            {suggestions.map((starter) => (
              <Pressable key={starter.title} onPress={() => addStarter(starter)}>
                <ThemedView type="backgroundElement" style={styles.suggestionRow}>
                  <View style={styles.suggestionInfo}>
                    <ThemedText type="default">{starter.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {repeatHint(starter.repeat)}
                    </ThemedText>
                  </View>
                  <ThemedText type="title" style={[styles.plus, { color: theme.accent }]}>
                    +
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: Radius.pill,
  },
  addButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  addButtonLabel: {
    color: '#FFFFFF',
  },
  section: {
    gap: Spacing.two,
  },
  rows: {
    gap: Spacing.two,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
  },
  suggestionInfo: {
    gap: Spacing.half,
  },
  plus: {
    fontSize: 24,
    lineHeight: 24,
  },
});
