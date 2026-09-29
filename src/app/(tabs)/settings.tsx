import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatFriendlyDate } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { exportBackupJson, restoreFromBackupFile } from '@/data/backup';
import { exportItemsCsv } from '@/data/csv';
import { listItems } from '@/data/items';
import {
  FREE_ITEM_LIMIT,
  getDefaultReminderOffsets,
  getIsPro,
  getLastAutoBackupAt,
  setDefaultReminderOffsets,
  setIsPro,
} from '@/data/settings';
import { useTheme } from '@/hooks/use-theme';

const REMINDER_PRESETS = [1, 3, 7, 14, 30];

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const theme = useTheme();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const [itemCount, setItemCount] = useState<number | null>(null);
  const [isPro, setIsProState] = useState(false);
  const [defaultOffsets, setDefaultOffsets] = useState<number[]>([]);
  const [lastAutoBackupAt, setLastAutoBackupAtState] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(() => {
    listItems(db).then((items) => setItemCount(items.length));
    getIsPro(db).then(setIsProState);
    getDefaultReminderOffsets(db).then(setDefaultOffsets);
    getLastAutoBackupAt(db).then(setLastAutoBackupAtState);
  }, [db]);

  useFocusEffect(reload);

  async function toggleReminderOffset(offset: number) {
    const next = defaultOffsets.includes(offset)
      ? defaultOffsets.filter((o) => o !== offset)
      : [...defaultOffsets, offset].sort((a, b) => a - b);
    setDefaultOffsets(next);
    await setDefaultReminderOffsets(db, next);
  }

  async function togglePro() {
    if (isPro) {
      Alert.alert('Turn off Pro (test)?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn off',
          style: 'destructive',
          onPress: async () => {
            await setIsPro(db, false);
            setIsProState(false);
          },
        },
      ]);
      return;
    }
    Alert.alert(
      'Unlock Pro',
      'This is a stub for testing — no payment is processed. Real payments will be wired up later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlock (test)',
          onPress: async () => {
            await setIsPro(db, true);
            setIsProState(true);
          },
        },
      ]
    );
  }

  async function handleExportJson() {
    setBusy('json');
    try {
      await exportBackupJson(db);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  async function handleExportCsv() {
    setBusy('csv');
    try {
      await exportItemsCsv(db);
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  }

  function handleRestore() {
    Alert.alert(
      'Restore from backup?',
      'This replaces everything currently in the app with the contents of the backup file. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose file…',
          style: 'destructive',
          onPress: async () => {
            setBusy('restore');
            try {
              const result = await restoreFromBackupFile(db);
              if (result === 'restored') {
                Alert.alert('Restored', 'Your data has been replaced with the backup.');
                reload();
              }
            } catch (error) {
              Alert.alert('Restore failed', error instanceof Error ? error.message : String(error));
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  }

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
          <ThemedText type="subtitle">Settings</ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              PLAN
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="default">
                {isPro
                  ? 'Pro (test) — unlimited items'
                  : `${itemCount ?? '…'} of ${FREE_ITEM_LIMIT} items used (Free)`}
              </ThemedText>
              <Pressable onPress={togglePro}>
                <View style={[styles.chip, { backgroundColor: isPro ? theme.backgroundSelected : theme.accent }]}>
                  <ThemedText type="smallBold" style={isPro ? undefined : styles.chipLabelOnAccent}>
                    {isPro ? 'Turn off Pro (test)' : 'Upgrade to Pro (stub)'}
                  </ThemedText>
                </View>
              </Pressable>
            </ThemedView>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              NOTIFICATION DEFAULTS
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Applied to new items — each item can still be changed individually.
            </ThemedText>
            <View style={styles.chipRow}>
              {REMINDER_PRESETS.map((offset) => {
                const selected = defaultOffsets.includes(offset);
                return (
                  <Pressable key={offset} onPress={() => toggleReminderOffset(offset)}>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                      ]}>
                      <ThemedText type="small" style={selected ? styles.chipLabelOnAccent : undefined}>
                        {offset}d
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              BACKUP
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Last automatic backup:{' '}
              {lastAutoBackupAt ? formatFriendlyDate(lastAutoBackupAt.slice(0, 10)) : 'Never'}
            </ThemedText>
            <Pressable onPress={handleExportJson} disabled={busy !== null}>
              <ThemedView type="backgroundElement" style={styles.rowButton}>
                <ThemedText type="default">{busy === 'json' ? 'Exporting…' : 'Export backup (JSON)'}</ThemedText>
              </ThemedView>
            </Pressable>
            <Pressable onPress={handleRestore} disabled={busy !== null}>
              <ThemedView type="backgroundElement" style={styles.rowButton}>
                <ThemedText type="default">{busy === 'restore' ? 'Restoring…' : 'Restore from backup'}</ThemedText>
              </ThemedView>
            </Pressable>
          </View>

          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              EXPORT
            </ThemedText>
            <Pressable onPress={handleExportCsv} disabled={busy !== null}>
              <ThemedView type="backgroundElement" style={styles.rowButton}>
                <ThemedText type="default">{busy === 'csv' ? 'Exporting…' : 'Export CSV'}</ThemedText>
              </ThemedView>
            </Pressable>
          </View>
        </ThemedView>
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
    paddingBottom: Spacing.three,
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  chipLabelOnAccent: {
    color: '#FFFFFF',
  },
  rowButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
  },
});
