import { shuffle } from '@/lib/random';
import type { Word } from '@/lib/vocabulary';

export type WordOrder = 'added' | 'alphabetical' | 'random';
export type AlphabetLanguage = 'finnish' | 'turkish';

const COLLATORS: Record<AlphabetLanguage, Intl.Collator> = {
  finnish: new Intl.Collator('fi'),
  turkish: new Intl.Collator('tr'),
};

export function sortByAlphabet<T>(items: T[], getText: (item: T) => string, language: AlphabetLanguage): T[] {
  const collator = COLLATORS[language];
  return [...items].sort((a, b) => collator.compare(getText(a), getText(b)));
}

export function sortWordsAlphabetically(words: Word[], language: AlphabetLanguage): Word[] {
  return sortByAlphabet(words, (word) => (language === 'finnish' ? word.finnish : word.turkish), language);
}

export type WordListSort = 'added' | 'finnish' | 'turkish';

export const WORD_LIST_SORT_OPTIONS: { value: WordListSort; label: string }[] = [
  { value: 'added', label: 'Eklenme sırası' },
  { value: 'finnish', label: 'Fince A-Z' },
  { value: 'turkish', label: 'Türkçe A-Z' },
];

export function sortWordsByListMode(words: Word[], mode: WordListSort): Word[] {
  if (mode === 'added') return words;
  return sortWordsAlphabetically(words, mode === 'finnish' ? 'finnish' : 'turkish');
}

export function orderWords(words: Word[], order: WordOrder, language: AlphabetLanguage): Word[] {
  if (order === 'random') return shuffle(words);
  if (order === 'alphabetical') return sortWordsAlphabetically(words, language);
  return [...words];
}
