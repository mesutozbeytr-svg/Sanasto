import { normalizeAnswer } from '@/lib/games/answerCheck';
import { hasImage } from '@/lib/games/gameConfig';
import type { QuizGameId, QuizQuestion } from '@/lib/games/types';
import { shuffle } from '@/lib/random';
import type { Word } from '@/lib/vocabulary';

const MATCHING_BATCH_SIZE = 5;
const CHOICE_DISTRACTOR_COUNT = 3;

type SingleQuestionKind = Exclude<QuizQuestion['kind'], 'matching'>;

const SINGLE_KIND_BY_GAME: Record<Exclude<QuizGameId, 'matching'>, SingleQuestionKind> = {
  'choose-word': 'image-choice',
  'listen-choose': 'listen-choice',
  'find-image': 'flip-image',
  'missing-letters': 'missing-letters',
  'type-word': 'type-word',
  'listen-type': 'listen-type',
  'image-type': 'image-type',
  'turkish-choose-word': 'text-choice',
  'turkish-listen-choose': 'turkish-listen-choice',
  'turkish-find-image': 'turkish-image-choice',
};

export function buildQuestions(gameId: QuizGameId, words: Word[], library: Word[]): QuizQuestion[] {
  if (gameId === 'matching') {
    const questions: QuizQuestion[] = [];
    for (let start = 0; start < words.length; start += MATCHING_BATCH_SIZE) {
      questions.push({ kind: 'matching', words: words.slice(start, start + MATCHING_BATCH_SIZE) });
    }
    return questions;
  }

  const kind = SINGLE_KIND_BY_GAME[gameId];
  return words.map((word) => createSingleQuestion(kind, word, library));
}

function createSingleQuestion(kind: SingleQuestionKind, word: Word, library: Word[]): QuizQuestion {
  switch (kind) {
    case 'image-choice':
    case 'text-choice':
    case 'turkish-listen-choice':
      return { kind, word, options: buildOptions(word, library, CHOICE_DISTRACTOR_COUNT) };
    case 'listen-choice':
    case 'flip-image':
    case 'turkish-image-choice':
      return { kind, word, options: buildOptions(word, library.filter(hasImage), CHOICE_DISTRACTOR_COUNT) };
    case 'missing-letters':
      return { kind, word, hiddenIndexes: pickHiddenIndexes(word.finnish) };
    case 'type-word':
    case 'listen-type':
    case 'image-type':
      return { kind, word };
  }
}

function buildOptions(word: Word, candidates: Word[], distractorCount: number): Word[] {
  const finnish = normalizeAnswer(word.finnish);
  const turkish = normalizeAnswer(word.turkish);
  const distractors = shuffle(
    candidates.filter(
      (candidate) =>
        candidate.id !== word.id &&
        normalizeAnswer(candidate.finnish) !== finnish &&
        normalizeAnswer(candidate.turkish) !== turkish,
    ),
  ).slice(0, distractorCount);
  return shuffle([word, ...distractors]);
}

function pickHiddenIndexes(finnish: string): number[] {
  const letterIndexes = [...finnish.normalize('NFC')].flatMap((char, index) =>
    /\p{L}/u.test(char) ? [index] : [],
  );
  if (letterIndexes.length === 0) return [];
  const hideCount =
    letterIndexes.length === 1
      ? 1
      : Math.min(letterIndexes.length - 1, Math.max(1, Math.round(letterIndexes.length * 0.4)));
  return shuffle(letterIndexes)
    .slice(0, hideCount)
    .sort((a, b) => a - b);
}
