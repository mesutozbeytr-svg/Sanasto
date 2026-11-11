import type { QuizGameId } from '@/lib/games/types';
import type { LearningStatus, Word } from '@/lib/vocabulary';

export const LEARNING_GAME_IDS: QuizGameId[] = [
  'choose-word',
  'turkish-choose-word',
  'listen-choose',
  'turkish-listen-choose',
  'find-image',
  'turkish-find-image',
  'matching',
  'missing-letters',
  'type-word',
  'listen-type',
  'image-type',
];

export interface WordProgressPatch {
  correct_count: number;
  wrong_count: number;
  last_studied_at: string;
  learning_status: LearningStatus;
  completed_game_types: string[];
}

export function getProgressPatch(
  word: Word,
  gameId: QuizGameId,
  correct: boolean,
  nowIso: string,
): WordProgressPatch {
  const completedGameTypes = correct && !word.completed_game_types.includes(gameId)
    ? [...word.completed_game_types, gameId]
    : word.completed_game_types;
  return {
    correct_count: correct ? word.correct_count + 1 : word.correct_count,
    wrong_count: correct ? word.wrong_count : word.wrong_count + 1,
    last_studied_at: nowIso,
    learning_status: word.learning_status_manual
      ? word.learning_status
      : nextLearningStatus(word.learning_status, correct, completedGameTypes),
    completed_game_types: completedGameTypes,
  };
}

function nextLearningStatus(
  status: LearningStatus,
  correct: boolean,
  completedGameTypes: string[],
): LearningStatus {
  if (status === 'learned') return 'learned';
  if (!correct) return 'review';
  if (LEARNING_GAME_IDS.every((gameId) => completedGameTypes.includes(gameId))) return 'learned';
  return 'learning';
}
