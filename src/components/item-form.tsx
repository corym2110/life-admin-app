import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { persistPickedPhoto } from '@/data/photos';
import { useTheme } from '@/hooks/use-theme';
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category, type RepeatUnit } from '@/types/item';

const CATEGORIES: Category[] = ['home', 'car', 'documents', 'subscriptions', 'health'];
const REPEAT_UNITS: RepeatUnit[] = ['day', 'week', 'month', 'year'];
const REMINDER_PRESETS = [1, 3, 7, 14, 30];

export interface ItemFormValues {
  title: string;
  category: Category;
  dueDate: string | null;
  repeatEnabled: boolean;
  repeatEvery: string;
  repeatUnit: RepeatUnit;
  reminderOffsets: number[];
  notes: string;
  photoUris: string[];
}

/** ItemFormValues after passing submit validation, where dueDate is guaranteed set. */
export type ValidatedItemFormValues = ItemFormValues & { dueDate: string };

export function ItemForm({
  initialValues,
  submitLabel,
  onSubmit,
}: {
  initialValues: ItemFormValues;
  submitLabel: string;
  onSubmit: (values: ValidatedItemFormValues) => Promise<void>;
}) {
  const theme = useTheme();
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ItemFormValues>(key: K, value: ItemFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleReminderOffset(offset: number) {
    setValues((prev) => ({
      ...prev,
      reminderOffsets: prev.reminderOffsets.includes(offset)
        ? prev.reminderOffsets.filter((o) => o !== offset)
        : [...prev.reminderOffsets, offset].sort((a, b) => a - b),
    }));
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission was denied.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (result.canceled || result.assets.length === 0) return;

    const persistedUri = await persistPickedPhoto(result.assets[0].uri);
    update('photoUris', [persistedUri]);
  }

  async function handleSubmit() {
    if (values.title.trim().length === 0) {
      setError('Title is required.');
      return;
    }
    if (!values.dueDate) {
      setError('Please select a due date.');
      return;
    }
    if (values.repeatEnabled) {
      const every = Number(values.repeatEvery);
      if (!Number.isInteger(every) || every <= 0) {
        setError('Repeat interval must be a positive whole number.');
        return;
      }
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit(values as ValidatedItemFormValues);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Title
        </ThemedText>
        <TextInput
          value={values.title}
          onChangeText={(text) => update('title', text)}
          placeholder="e.g. Oil change"
          placeholderTextColor={theme.textSecondary}
          style={[styles.textInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Category
        </ThemedText>
        <View style={styles.chipRow}>
          {CATEGORIES.map((category) => {
            const selected = values.category === category;
            const color = CATEGORY_COLORS[category];
            return (
              <Pressable key={category} onPress={() => update('category', category)}>
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selected ? `${color}33` : theme.backgroundElement },
                  ]}>
                  <View style={[styles.categoryDot, { backgroundColor: color }]} />
                  <ThemedText type="small" style={selected ? { color } : undefined}>
                    {CATEGORY_LABELS[category]}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <DateField label="Due date" value={values.dueDate} onChange={(date) => update('dueDate', date)} />

      <View style={styles.field}>
        <Pressable style={styles.repeatToggleRow} onPress={() => update('repeatEnabled', !values.repeatEnabled)}>
          <ThemedText type="small" themeColor="textSecondary">
            Repeats
          </ThemedText>
          <ThemedView type={values.repeatEnabled ? 'backgroundSelected' : 'backgroundElement'} style={styles.chip}>
            <ThemedText type="small">{values.repeatEnabled ? 'On' : 'Off'}</ThemedText>
          </ThemedView>
        </Pressable>

        {values.repeatEnabled && (
          <View style={styles.repeatDetails}>
            <View style={styles.repeatEveryRow}>
              <ThemedText type="small">Every</ThemedText>
              <TextInput
                value={values.repeatEvery}
                onChangeText={(text) => update('repeatEvery', text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                style={[styles.numberInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              />
            </View>
            <View style={styles.chipRow}>
              {REPEAT_UNITS.map((unit) => (
                <Pressable key={unit} onPress={() => update('repeatUnit', unit)}>
                  <ThemedView
                    type={values.repeatUnit === unit ? 'backgroundSelected' : 'backgroundElement'}
                    style={styles.chip}>
                    <ThemedText type="small">
                      {unit}
                      {Number(values.repeatEvery) === 1 ? '' : 's'}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Remind me (days before)
        </ThemedText>
        <View style={styles.chipRow}>
          {REMINDER_PRESETS.map((offset) => (
            <Pressable key={offset} onPress={() => toggleReminderOffset(offset)}>
              <ThemedView
                type={values.reminderOffsets.includes(offset) ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.chip}>
                <ThemedText type="small">{offset}d</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Notes
        </ThemedText>
        <TextInput
          value={values.notes}
          onChangeText={(text) => update('notes', text)}
          placeholder="Optional notes"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.textInput,
            styles.multiline,
            { color: theme.text, backgroundColor: theme.backgroundElement },
          ]}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="small" themeColor="textSecondary">
          Photo
        </ThemedText>
        {values.photoUris.length > 0 ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: values.photoUris[0] }} style={styles.photoPreview} />
            <Pressable onPress={() => update('photoUris', [])}>
              <ThemedText type="linkPrimary">Remove</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={pickPhoto}>
            <ThemedView type="backgroundElement" style={styles.photoPicker}>
              <ThemedText type="small">Add a photo</ThemedText>
            </ThemedView>
          </Pressable>
        )}
      </View>

      {error && (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      )}

      <Pressable onPress={handleSubmit} disabled={saving}>
        <View style={[styles.submitButton, { backgroundColor: theme.accent }]}>
          <ThemedText type="smallBold" style={styles.submitLabel}>
            {saving ? 'Saving…' : submitLabel}
          </ThemedText>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.four,
    gap: Spacing.five,
  },
  field: {
    gap: Spacing.two,
  },
  textInput: {
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  numberInput: {
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    width: 64,
    textAlign: 'center',
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
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  repeatToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  repeatDetails: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  repeatEveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: Radius.medium,
  },
  photoPicker: {
    paddingVertical: Spacing.five,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  error: {
    color: '#FB7185',
  },
  submitButton: {
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
  },
  submitLabel: {
    color: '#FFFFFF',
  },
});
