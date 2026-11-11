import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { choiceClass, type QuestionProps } from '@/components/games/questions/questionShared';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import { useSpeaker } from '@/hooks/useSpeaker';
import { toWordResult, type WordResult } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ListenChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function ListenChoiceQuestion({ word, options, onDone, isSaving }: ListenChoiceQuestionProps) {
  const speak = useSpeaker();
  useAutoSpeak(word.finnish, 'fi');
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

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <button
          type="button"
          onClick={() => void speak(word.finnish, 'fi')}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-md transition hover:scale-105 hover:bg-blue-800 active:scale-95"
          aria-label="Fince kelimeyi dinle"
        >
          <Volume2 className="h-6 w-6" aria-hidden="true" />
        </button>
        <p className="text-sm font-medium text-slate-600">Kelimeyi dinleyin, sonra doğru görseli seçin</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => choose(option)}
            disabled={isLocked || wrongIds.includes(option.id)}
            className={`${choiceClass(isLocked, option.id === word.id, wrongIds.includes(option.id))} overflow-hidden`}
          >
            <WordImage src={option.image_url} alt="" fit="contain" className="h-[clamp(72px,16dvh,160px)] w-full" />
            <span className="block px-2 py-2 text-sm font-semibold sm:text-base">{option.turkish}</span>
          </button>
        ))}
      </div>

      {(isSolved || hadWrongAttempt) && (
        <GameFeedback
          correct={isSolved}
          title={isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru Fince kelime: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={isRevealed}
          isSaving={isSaving}
          onReveal={() => setIsRevealed(true)}
          onContinue={() => onDone(results)}
        />
      )}
    </section>
  );
}
