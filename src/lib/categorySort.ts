import { sortByAlphabet } from '@/lib/wordSort';
import type { Category } from '@/lib/vocabulary';

export type CategorySortMode = 'manual' | 'alphabetical';

export const CATEGORY_SORT_KEY = 'sanasto.categorySort';

export const CATEGORY_SORT_OPTIONS: { value: CategorySortMode; label: string }[] = [
  { value: 'manual', label: 'Manuel sıralama' },
  { value: 'alphabetical', label: 'Alfabetik (A-Z)' },
];

export function orderCategories(categories: Category[], mode: CategorySortMode): Category[] {
  if (mode === 'alphabetical') return sortByAlphabet(categories, (category) => category.name, 'turkish');
  return [...categories].sort((a, b) => a.position - b.position);
}
