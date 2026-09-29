import type { Category, RepeatRule } from '@/types/item';

export interface StarterItem {
  title: string;
  category: Category;
  repeat: RepeatRule | null;
}

export const STARTER_ITEMS: StarterItem[] = [
  { title: 'Furnace filter', category: 'home', repeat: { every: 3, unit: 'month' } },
  { title: 'Smoke/CO detector batteries', category: 'home', repeat: { every: 1, unit: 'year' } },
  { title: 'Dryer vent clean', category: 'home', repeat: { every: 1, unit: 'year' } },
  { title: 'Gutter clean', category: 'home', repeat: { every: 6, unit: 'month' } },
  { title: 'Water heater flush', category: 'home', repeat: { every: 1, unit: 'year' } },
  { title: 'Home insurance renewal', category: 'home', repeat: { every: 1, unit: 'year' } },

  { title: 'Oil change', category: 'car', repeat: { every: 6, unit: 'month' } },
  { title: 'Registration renewal', category: 'car', repeat: { every: 1, unit: 'year' } },
  { title: 'Insurance renewal', category: 'car', repeat: { every: 1, unit: 'year' } },
  { title: 'Tire swap', category: 'car', repeat: { every: 6, unit: 'month' } },
  { title: "Driver's licence renewal", category: 'car', repeat: null },

  { title: 'Passport expiry', category: 'documents', repeat: null },
  { title: 'Health card expiry', category: 'documents', repeat: null },

  { title: 'Dental cleaning', category: 'health', repeat: { every: 6, unit: 'month' } },
  { title: 'Eye exam', category: 'health', repeat: { every: 1, unit: 'year' } },
];

export function starterItemsForCategory(category: Category): StarterItem[] {
  return STARTER_ITEMS.filter((item) => item.category === category);
}
