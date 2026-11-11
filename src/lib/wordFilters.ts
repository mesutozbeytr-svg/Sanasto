import { foldForSearch, type LearningStatus, type Word } from '@/lib/vocabulary';

export interface WordFilters {
  search: string;
  categoryIds: string[];
  status: LearningStatus | null;
  favoritesOnly: boolean;
  noImage: boolean;
}

export const EMPTY_WORD_FILTERS: WordFilters = {
  search: '',
  categoryIds: [],
  status: null,
  favoritesOnly: false,
  noImage: false,
};


export function matchesCategories(word: Pick<Word, 'category_id'>, categoryIds: string[]): boolean {
  return categoryIds.length === 0 || (word.category_id !== null && categoryIds.includes(word.category_id));
}

export const ALL_LEARNING_STATUSES: LearningStatus[] = ['learned', 'learning', 'not_studied', 'review'];

export interface WordSelectionFilters {
  categoryIds: string[];
  learningStatuses: LearningStatus[];
  favoritesOnly: boolean;
}

export function matchesSelectionFilters(word: Word, filters: WordSelectionFilters): boolean {
  if (!matchesCategories(word, filters.categoryIds)) return false;
  if (filters.favoritesOnly && !word.is_favorite) return false;
  return filters.learningStatuses.includes(word.learning_status);
}

export function filterWords(words: Word[], filters: WordFilters): Word[] {
  const query = foldForSearch(filters.search);
  return words.filter((word) => {
    if (query && !foldForSearch(word.finnish).includes(query) && !foldForSearch(word.turkish).includes(query)) {
      return false;
    }
    if (!matchesCategories(word, filters.categoryIds)) return false;
    if (filters.status && word.learning_status !== filters.status) return false;
    if (filters.noImage && word.image_url) return false;
    if (filters.favoritesOnly && !word.is_favorite) return false;
    return true;
  });
}
