import { itemsToCsv } from '../csvFormat';
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

describe('itemsToCsv', () => {
  it('produces a header row even with no items', () => {
    expect(itemsToCsv([])).toBe('Title,Category,Due date,Repeats,Notes,Last done');
  });

  it('formats a simple non-repeating item', () => {
    const csv = itemsToCsv([makeItem({ title: 'Passport expiry', category: 'documents', dueDate: '2027-03-01' })]);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('Passport expiry,Documents,2027-03-01,,,');
  });

  it('formats a repeating item with correct pluralization', () => {
    const csv = itemsToCsv([makeItem({ repeat: { every: 1, unit: 'month' } })]);
    expect(csv.split('\n')[1]).toContain('Every 1 month,');

    const csvPlural = itemsToCsv([makeItem({ repeat: { every: 6, unit: 'month' } })]);
    expect(csvPlural.split('\n')[1]).toContain('Every 6 months,');
  });

  it('quotes and escapes fields containing commas, quotes, or newlines', () => {
    const csv = itemsToCsv([makeItem({ title: 'Oil change, synthetic', notes: 'Ask for "the good" filter' })]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toContain('"Oil change, synthetic"');
    expect(dataLine).toContain('"Ask for ""the good"" filter"');
  });

  it('includes lastDoneAt when present', () => {
    const csv = itemsToCsv([makeItem({ lastDoneAt: '2026-05-01T12:00:00.000Z' })]);
    expect(csv.split('\n')[1]).toContain('2026-05-01T12:00:00.000Z');
  });
});
