import { shuffle } from '@/lib/random';

const DISTRACTOR_LETTERS = ['a', 'e', 'i', 'o', 'u', 'y', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v', 'p', 'h', 'ä', 'ö'];

export function buildLetterTiles(hiddenLetters: string): string[] {
  const targets = [...hiddenLetters];
  const extraCount = Math.min(5, Math.max(3, 10 - targets.length));
  const extras = shuffle(DISTRACTOR_LETTERS.filter((letter) => !targets.includes(letter))).slice(0, extraCount);
  return shuffle([...targets, ...extras]);
}
