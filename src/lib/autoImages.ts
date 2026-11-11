import { findTwemojiCandidates, TWEMOJI_CREDIT } from '@/lib/twemoji';
import type { ImageSource, Word } from '@/lib/vocabulary';

export type AutoImageScope = 'missing' | 'all';

export interface AutoImagePlanItem {
  word: Word;
  imageUrl: string;
  label: string;
}

export interface WordImageAssignment {
  wordId: string;
  imageUrl: string;
  imageSource: ImageSource;
  imageCredit: string;
  replaceExisting: boolean;
}

export function isEligibleForAutoImage(word: Word, scope: AutoImageScope): boolean {
  if (scope === 'missing') return !word.image_url;
  return word.image_source !== 'upload';
}

export function planAutoImages(words: Word[], scope: AutoImageScope): AutoImagePlanItem[] {
  return words.flatMap((word) => {
    if (!isEligibleForAutoImage(word, scope)) return [];
    const [match] = findTwemojiCandidates(word.finnish, word.turkish);
    return match ? [{ word, imageUrl: match.url, label: match.label }] : [];
  });
}

export function toTwemojiAssignments(plan: AutoImagePlanItem[], scope: AutoImageScope): WordImageAssignment[] {
  return plan.map((item) => ({
    wordId: item.word.id,
    imageUrl: item.imageUrl,
    imageSource: 'twemoji',
    imageCredit: TWEMOJI_CREDIT,
    replaceExisting: scope === 'all',
  }));
}
