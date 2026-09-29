import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { formatDueLabel } from '@/data/homeSections';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Item } from '@/types/item';

export function ItemRow({ item, today, onPress }: { item: Item; today?: string; onPress?: () => void }) {
  const overdue = today !== undefined && item.dueDate < today;

  return (
    <Pressable onPress={onPress}>
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={[styles.dot, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
        <ThemedView style={styles.info}>
          <ThemedText type="default" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {CATEGORY_LABELS[item.category]}
          </ThemedText>
        </ThemedView>
        <ThemedText
          type="smallBold"
          themeColor={overdue ? undefined : 'textSecondary'}
          style={overdue ? styles.overdue : undefined}>
          {formatDueLabel(item.dueDate, today)}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    gap: Spacing.three,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  overdue: {
    color: '#FB7185',
  },
});
