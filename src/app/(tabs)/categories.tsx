import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { listItems } from '@/data/items';
import { subscribeItemsChanged } from '@/data/itemsBus';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type Item } from '@/types/item';

const CATEGORIES: Category[] = ['home', 'car', 'documents', 'subscriptions', 'health'];

export default function CategoriesScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const [items, setItems] = useState<Item[]>([]);

  const reload = useCallback(() => {
    listItems(db).then(setItems);
  }, [db]);

  useFocusEffect(reload);
  useEffect(() => subscribeItemsChanged(reload), [reload]);

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
          <ThemedText type="subtitle">Categories</ThemedText>
        </ThemedView>

        <View style={styles.grid}>
          {CATEGORIES.map((category) => {
            const count = items.filter((item) => item.category === category).length;
            const color = CATEGORY_COLORS[category];
            return (
              <Pressable
                key={category}
                style={styles.cardWrapper}
                onPress={() => router.push(`/category/${category}`)}>
                <View style={[styles.card, { backgroundColor: `${color}26` }]}>
                  <ThemedText type="title" style={[styles.cardCount, { color }]}>
                    {count}
                  </ThemedText>
                  <ThemedText type="smallBold" style={[styles.cardLabel, { color }]}>
                    {CATEGORY_LABELS[category]}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
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
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  cardWrapper: {
    width: '47%',
  },
  card: {
    borderRadius: Radius.large,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardCount: {
    fontSize: 32,
    lineHeight: 36,
  },
  cardLabel: {
    textAlign: 'center',
  },
});
