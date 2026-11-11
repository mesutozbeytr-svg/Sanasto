import type { Word } from '@/lib/vocabulary';

export type GameId =
  | 'flashcards'
  | 'choose-word'
  | 'listen-choose'
  | 'find-image'
  | 'matching'
  | 'missing-letters'
  | 'type-word'
  | 'listen-type'
  | 'image-type'
  | 'turkish-choose-word'
  | 'turkish-listen-choose'
  | 'turkish-find-image';

export type QuizGameId = Exclude<GameId, 'flashcards'>;

export interface WordResult {
  wordId: string;
  finnish: string;
  turkish: string;
  correct: boolean;
}

export type QuizQuestion =
  | { kind: 'image-choice'; word: Word; options: Word[] }
  | { kind: 'listen-choice'; word: Word; options: Word[] }
  | { kind: 'flip-image'; word: Word; options: Word[] }
  | { kind: 'matching'; words: Word[] }
  | { kind: 'missing-letters'; word: Word; hiddenIndexes: number[] }
  | { kind: 'type-word'; word: Word }
  | { kind: 'listen-type'; word: Word }
  | { kind: 'image-type'; word: Word }
  | { kind: 'text-choice'; word: Word; options: Word[] }
  | { kind: 'turkish-listen-choice'; word: Word; options: Word[] }
  | { kind: 'turkish-image-choice'; word: Word; options: Word[] };

export type QuizKind = QuizQuestion['kind'];

export function toWordResult(word: Word, correct: boolean): WordResult {
  return { wordId: word.id, finnish: word.finnish, turkish: word.turkish, correct };
}
