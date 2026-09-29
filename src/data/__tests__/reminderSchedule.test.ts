import { isFinished, upcomingReminderDates } from '../reminderSchedule';
import type { Item } from '@/types/item';

function makeItem(overrides: Partial<Item>): Item {
  return {
    id: overrides.id ?? 'item-1',
    title: overrides.title ?? 'Test item',
    category: overrides.category ?? 'home',
    dueDate: overrides.dueDate ?? '2026-06-15',
    repeat: overrides.repeat ?? null,
    reminderOffsets: overrides.reminderOffsets ?? [30, 7, 1],
    notes: overrides.notes ?? '',
    photoUris: overrides.photoUris ?? [],
    lastDoneAt: overrides.lastDoneAt ?? null,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

describe('isFinished', () => {
  it('is false for an item with no repeat that has never been done', () => {
    expect(isFinished(makeItem({ repeat: null, lastDoneAt: null }))).toBe(false);
  });

  it('is true for a one-off item that has been marked done', () => {
    expect(isFinished(makeItem({ repeat: null, lastDoneAt: '2026-06-01T00:00:00.000Z' }))).toBe(true);
  });

  it('is false for a repeating item even after being marked done', () => {
    const item = makeItem({ repeat: { every: 1, unit: 'month' }, lastDoneAt: '2026-06-01T00:00:00.000Z' });
    expect(isFinished(item)).toBe(false);
  });
});

describe('upcomingReminderDates', () => {
  it('computes one reminder per offset, at 9am on the offset day', () => {
    const item = makeItem({ dueDate: '2026-06-15', reminderOffsets: [7, 1] });
    const now = new Date('2026-06-01T00:00:00');
    const dates = upcomingReminderDates(item, now);

    expect(dates).toHaveLength(2);
    expect(dates[0]).toEqual(new Date(2026, 5, 8, 9, 0, 0, 0));
    expect(dates[1]).toEqual(new Date(2026, 5, 14, 9, 0, 0, 0));
  });

  it('drops reminders that have already passed', () => {
    const item = makeItem({ dueDate: '2026-06-15', reminderOffsets: [30, 7, 1] });
    // Only 3 days before due — the 30-day and 7-day reminders are already in the past.
    const now = new Date('2026-06-12T00:00:00');
    const dates = upcomingReminderDates(item, now);

    expect(dates).toHaveLength(1);
    expect(dates[0]).toEqual(new Date(2026, 5, 14, 9, 0, 0, 0));
  });

  it('returns nothing when every offset has already passed', () => {
    const item = makeItem({ dueDate: '2026-06-15', reminderOffsets: [7, 1] });
    const now = new Date('2026-06-20T00:00:00');
    expect(upcomingReminderDates(item, now)).toEqual([]);
  });

  it('returns nothing for an item with no reminder offsets', () => {
    const item = makeItem({ reminderOffsets: [] });
    expect(upcomingReminderDates(item, new Date('2026-01-01T00:00:00'))).toEqual([]);
  });
});
