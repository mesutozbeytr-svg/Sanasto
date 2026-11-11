import { useState } from 'react';
import { useSpokenFeedback } from '@/components/games/questions/questionShared';
import { isAnswerCorrect } from '@/lib/games/answerCheck';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

export type LetterSlotTone = 'idle' | 'solved' | 'revealed';

export function useLetterAnswer(word: Word, hiddenIndexes: number[]) {
  const chars = [...word.finnish.normalize('NFC')];
  const [inputs, setInputs] = useState<string[]>(() => hiddenIndexes.map(() => ''));
  const [hadWrongAttempt, setHadWrongAttempt] = useState(false);
  const [lastWrongInput, setLastWrongInput] = useState<string | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isSpoken = useSpokenFeedback(isSolved, word.finnish, 'fi');

  const isLocked = isSolved || isRevealed;
  const tone: LetterSlotTone = isSolved ? 'solved' : isRevealed ? 'revealed' : 'idle';
  const results: WordResult[] = [toWordResult(word, !hadWrongAttempt)];

  const composeAnswer = (values: string[]) =>
    chars
      .map((char, index) => {
        const slot = hiddenIndexes.indexOf(index);
        return slot === -1 ? char : values[slot] ?? '';
      })
      .join('');

  const changeSlot = (slot: number, letter: string) => {
    if (isLocked) return;
    const next = inputs.map((item, index) => (index === slot ? letter : item));
    if (next.some((value) => value === '')) {
      setInputs(next);
      return;
    }
    const answer = composeAnswer(next);
    if (isAnswerCorrect(answer, word.finnish)) {
      setInputs(next);
      setIsSolved(true);
      return;
    }
    setHadWrongAttempt(true);
    setLastWrongInput(answer);
    setInputs(hiddenIndexes.map(() => ''));
  };

  const pick = (letter: string) => {
    const firstEmpty = inputs.indexOf('');
    if (firstEmpty === -1) return;
    changeSlot(firstEmpty, letter);
  };

  const backspace = () => {
    if (isLocked) return;
    let lastFilled = -1;
    inputs.forEach((value, index) => {
      if (value !== '') lastFilled = index;
    });
    if (lastFilled === -1) return;
    setInputs(inputs.map((value, index) => (index === lastFilled ? '' : value)));
  };

  const clear = () => {
    if (isLocked) return;
    setInputs(hiddenIndexes.map(() => ''));
  };

  return {
    chars,
    inputs,
    changeSlot,
    pick,
    backspace,
    clear,
    tone,
    isLocked,
    isSolved,
    isRevealed,
    isSpoken,
    hadWrongAttempt,
    lastWrongInput,
    results,
    reveal: () => setIsRevealed(true),
  };
}
