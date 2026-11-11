import { useEffect, useRef, useState } from 'react';
import { useSpeaker } from '@/hooks/useSpeaker';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { SpeechLanguage } from '@/lib/speech';
import type { Word } from '@/lib/vocabulary';

export interface QuestionProps {
  onDone: (results: WordResult[]) => void;
  isSaving: boolean;
}

export function choiceClass(isLocked: boolean, isCorrectOption: boolean, isWrongChoice: boolean): string {
  const base = 'rounded-2xl border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200';
  if (isLocked && isCorrectOption) return `${base} border-emerald-500 bg-emerald-50 text-emerald-900`;
  if (isWrongChoice) return `${base} border-rose-500 bg-rose-50 text-rose-900`;
  if (isLocked) return `${base} border-slate-200 bg-white opacity-60`;
  return `${base} border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md`;
}

export function useSpokenFeedback(isSolved: boolean, text: string, language: SpeechLanguage): boolean {
  const speak = useSpeaker();
  const speakRef = useRef(speak);
  const [isSpoken, setIsSpoken] = useState(false);

  useEffect(() => {
    speakRef.current = speak;
  });

  useEffect(() => {
    if (!isSolved) return;
    let isCurrent = true;
    void speakRef.current(text, language).then(() => {
      if (isCurrent) setIsSpoken(true);
    });
    return () => {
      isCurrent = false;
    };
  }, [isSolved, text, language]);

  return isSpoken;
}

export function useChoiceRound(word: Word) {
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const isLocked = isSolved || isRevealed;
  const hadWrongAttempt = wrongIds.length > 0;
  const results: WordResult[] = [toWordResult(word, !hadWrongAttempt)];

  const choose = (option: Word) => {
    if (isLocked || wrongIds.includes(option.id)) return;
    if (option.id === word.id) {
      setIsSolved(true);
    } else {
      setWrongIds((previous) => [...previous, option.id]);
    }
  };

  return {
    wrongIds,
    isSolved,
    isRevealed,
    isLocked,
    hadWrongAttempt,
    results,
    choose,
    reveal: () => setIsRevealed(true),
  };
}

export type ChoiceRound = ReturnType<typeof useChoiceRound>;
