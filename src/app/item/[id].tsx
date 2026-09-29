import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { formatFriendlyDate } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useUndoBanner } from '@/components/undo-banner';
import { Radius, Spacing } from '@/constants/theme';
import { deleteItem, getItem, listHistoryForItem, markItemDone, restoreItem } from '@/data/items';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, type HistoryEntry, type Item } from '@/types/item';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const theme = useTheme();
  const { showUndo } = useUndoBanner();

  const [item, setItem] = useState<Item | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [loadedItem, loadedHistory] = await Promise.all([getItem(db, id), listHistoryForItem(db, id)]);
    setItem(loadedItem);
    setHistory(loadedHistory);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleMarkDone() {
    await markItemDone(db, id);
    load();
  }

  function handleDelete() {
    if (!item) return;
    Alert.alert('Delete this item?', item.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const itemSnapshot = item;
          const historySnapshot = history;
          await deleteItem(db, item.id);
          router.back();
          showUndo({
            message: `Deleted "${itemSnapshot.title}"`,
            onUndo: async () => {
              await restoreItem(db, itemSnapshot, historySnapshot);
            },
          });
        },
      },
    ]);
  }

  if (loading || !item) {
    return (
      <ThemedView style={styles.centerFill}>
        <ThemedText type="small" themeColor="textSecondary">
          {loading ? 'Loading…' : 'Item not found.'}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      {item.photoUris[0] && <Image source={{ uri: item.photoUris[0] }} style={styles.photo} />}

      <ThemedText type="subtitle">{item.title}</ThemedText>
      <View style={styles.categoryRow}>
        <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[item.category] }]} />
        <ThemedText type="small" themeColor="textSecondary">
          {CATEGORY_LABELS[item.category]} · Due {formatFriendlyDate(item.dueDate)}
        </ThemedText>
      </View>
      {item.repeat && (
        <ThemedText type="small" themeColor="textSecondary">
          Repeats every {item.repeat.every} {item.repeat.unit}
          {item.repeat.every === 1 ? '' : 's'}
        </ThemedText>
      )}
      {item.notes.length > 0 && <ThemedText type="default">{item.notes}</ThemedText>}

      <View style={styles.actionRow}>
        <Pressable onPress={handleMarkDone} style={styles.actionButton}>
          <View style={[styles.actionButtonInner, { backgroundColor: theme.accent }]}>
            <ThemedText type="smallBold" style={styles.markDoneText}>
              Mark done
            </ThemedText>
          </View>
        </Pressable>
        <Pressable onPress={() => router.push(`/item/${item.id}/edit`)} style={styles.actionButton}>
          <ThemedView type="backgroundElement" style={styles.actionButtonInner}>
            <ThemedText type="smallBold">Edit</ThemedText>
          </ThemedView>
        </Pressable>
        <Pressable onPress={handleDelete} style={styles.actionButton}>
          <ThemedView type="backgroundElement" style={styles.actionButtonInner}>
            <ThemedText type="smallBold" style={styles.deleteText}>
              Delete
            </ThemedText>
          </ThemedView>
        </Pressable>
      </View>

      <View style={styles.historySection}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          HISTORY
        </ThemedText>
        {history.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Not marked done yet.
          </ThemedText>
        ) : (
          history.map((entry) => (
            <ThemedView key={entry.id} type="backgroundElement" style={styles.historyRow}>
              <ThemedText type="small">{formatFriendlyDate(entry.doneAt.slice(0, 10))}</ThemedText>
              {entry.note.length > 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {entry.note}
                </ThemedText>
              )}
            </ThemedView>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: Radius.large,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonInner: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  markDoneText: {
    color: '#FFFFFF',
  },
  deleteText: {
    color: '#FB7185',
  },
  historySection: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  historyRow: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    gap: Spacing.half,
  },
});
