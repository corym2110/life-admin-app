import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { formatDueLabel } from '@/data/homeSections';
import { CATEGORY_LABELS, type Item } from '@/types/item';

export function ItemRow({ item, today }: { item: Item; today?: string }) {
  const overdue = today !== undefined && item.dueDate < today;

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
    backgroundColor: 'transparent',
  },
  overdue: {
    color: '#D14343',
  },
});
