export type Category = 'home' | 'car' | 'documents' | 'subscriptions' | 'health';

export type RepeatUnit = 'day' | 'week' | 'month' | 'year';

export interface RepeatRule {
  every: number;
  unit: RepeatUnit;
}

export interface Item {
  id: string;
  title: string;
  category: Category;
  dueDate: string; // ISO date, YYYY-MM-DD
  repeat: RepeatRule | null;
  reminderOffsets: number[]; // days before due
  notes: string;
  photoUris: string[];
  lastDoneAt: string | null; // ISO datetime
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface HistoryEntry {
  id: string;
  itemId: string;
  doneAt: string; // ISO datetime
  note: string;
}

export const DEFAULT_REMINDER_OFFSETS = [30, 7, 1];
