import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFriendlyDate(iso: string): string {
  return parseISODate(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
}) {
  const theme = useTheme();
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseISODate(value),
        mode: 'date',
        onChange: (_event, date) => {
          if (date) onChange(toISODate(date));
        },
      });
    } else {
      setShowIOSPicker(true);
    }
  }

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <Pressable onPress={open}>
        <ThemedView type="backgroundElement" style={styles.field}>
          <ThemedText type="default">{formatFriendlyDate(value)}</ThemedText>
        </ThemedView>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={showIOSPicker} transparent animationType="slide">
          <Pressable style={styles.backdrop} onPress={() => setShowIOSPicker(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: theme.background }]}>
              <DateTimePicker
                value={parseISODate(value)}
                mode="date"
                display="inline"
                onChange={(_event, date) => {
                  if (date) onChange(toISODate(date));
                }}
              />
              <Pressable style={styles.doneButton} onPress={() => setShowIOSPicker(false)}>
                <ThemedText type="linkPrimary">Done</ThemedText>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  field: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.three,
  },
});
