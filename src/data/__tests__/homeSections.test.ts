import { formatDueLabel, groupItemsForHome } from '../homeSections';
import type { Item } from '@/types/item';

const TODAY = '2026-06-15';

function makeItem(overrides: Partial<Item>): Item {
  return {
    id: overrides.id ?? Math.random().toString(36),
    title: overrides.title ?? 'Test item',
    category: overrides.category ?? 'home',
    dueDate: overrides.dueDate ?? TODAY,
    repeat: overrides.repeat ?? null,
    reminderOffsets: overrides.reminderOffsets ?? [30, 7, 1],
    notes: overrides.notes ?? '',
    photoUris: overrides.photoUris ?? [],
    lastDoneAt: overrides.lastDoneAt ?? null,
    createdAt: overrides.createdAt ?? TODAY,
    updatedAt: overrides.updatedAt ?? TODAY,
  };
}

describe('groupItemsForHome', () => {
  it('buckets an already-past date as overdue', () => {
    const item = makeItem({ dueDate: '2026-06-01' });
    const sections = groupItemsForHome([item], TODAY);
    expect(sections.overdue).toEqual([item]);
    expect(sections.dueThisMonth).toEqual([]);
    expect(sections.comingUp).toEqual([]);
  });

  it('treats today itself as due this month, not overdue', () => {
    const item = makeItem({ dueDate: TODAY });
    const sections = groupItemsForHome([item], TODAY);
    expect(sections.overdue).toEqual([]);
    expect(sections.dueThisMonth).toEqual([item]);
  });

  it('buckets the rest of the current calendar month as due this month', () => {
    const item = makeItem({ dueDate: '2026-06-30' });
    const sections = groupItemsForHome([item], TODAY);
    expect(sections.dueThisMonth).toEqual([item]);
  });

  it('buckets next month through the 90-day horizon as coming up', () => {
    const item = makeItem({ dueDate: '2026-07-01' });
    const sections = groupItemsForHome([item], TODAY);
    expect(sections.comingUp).toEqual([item]);
  });

  it('excludes items beyond the 90-day horizon entirely', () => {
    const item = makeItem({ dueDate: '2026-12-01' });
    const sections = groupItemsForHome([item], TODAY);
    expect(sections.overdue).toEqual([]);
    expect(sections.dueThisMonth).toEqual([]);
    expect(sections.comingUp).toEqual([]);
  });

  it('sorts each section by due date ascending', () => {
    const later = makeItem({ id: 'later', dueDate: '2026-06-28' });
    const sooner = makeItem({ id: 'sooner', dueDate: '2026-06-20' });
    const sections = groupItemsForHome([later, sooner], TODAY);
    expect(sections.dueThisMonth.map((i) => i.id)).toEqual(['sooner', 'later']);
  });
});

describe('formatDueLabel', () => {
  it('labels a past due date as overdue with day count', () => {
    expect(formatDueLabel('2026-06-10', TODAY)).toBe('5d overdue');
  });

  it('labels today', () => {
    expect(formatDueLabel(TODAY, TODAY)).toBe('Due today');
  });

  it('labels tomorrow', () => {
    expect(formatDueLabel('2026-06-16', TODAY)).toBe('Due tomorrow');
  });

  it('labels a future date with day count', () => {
    expect(formatDueLabel('2026-06-25', TODAY)).toBe('Due in 10d');
  });
});
