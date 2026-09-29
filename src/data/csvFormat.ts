import { CATEGORY_LABELS, type Item } from '@/types/item';

const CSV_COLUMNS = ['Title', 'Category', 'Due date', 'Repeats', 'Notes', 'Last done'] as const;

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function repeatColumn(item: Item): string {
  if (!item.repeat) return '';
  const unit = item.repeat.every === 1 ? item.repeat.unit : `${item.repeat.unit}s`;
  return `Every ${item.repeat.every} ${unit}`;
}

export function itemsToCsv(items: Item[]): string {
  const rows = items.map((item) =>
    [
      item.title,
      CATEGORY_LABELS[item.category],
      item.dueDate,
      repeatColumn(item),
      item.notes,
      item.lastDoneAt ?? '',
    ]
      .map(escapeCsvField)
      .join(',')
  );

  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}
