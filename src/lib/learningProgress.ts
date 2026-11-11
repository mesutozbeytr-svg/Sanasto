import type { Category, Word } from '@/lib/vocabulary';

export interface LearningProgress {
  learned: number;
  total: number;
}

export interface CategoryOption {
  value: string;
  label: string;
  progress: LearningProgress;
}

export function getLearningProgress(words: Word[]): LearningProgress {
  return {
    learned: words.filter((word) => word.learning_status === 'learned').length,
    total: words.length,
  };
}

export function getSelectionProgress(words: Word[], categoryIds: string[]): LearningProgress {
  if (categoryIds.length === 0) return getLearningProgress(words);
  return getLearningProgress(words.filter((word) => word.category_id !== null && categoryIds.includes(word.category_id)));
}

export function getCategoryOptions(categories: Category[], words: Word[]): CategoryOption[] {
  const wordsByCategory = new Map<string, Word[]>();
  for (const word of words) {
    if (!word.category_id) continue;
    const list = wordsByCategory.get(word.category_id) ?? [];
    list.push(word);
    wordsByCategory.set(word.category_id, list);
  }
  return categories.map((category) => ({
    value: category.id,
    label: category.name,
    progress: getLearningProgress(wordsByCategory.get(category.id) ?? []),
  }));
}
