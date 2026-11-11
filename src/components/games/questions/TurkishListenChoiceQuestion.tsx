import { Volume2 } from 'lucide-react';
import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { choiceClass, useChoiceRound, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import { useSpeaker } from '@/hooks/useSpeaker';
import type { Word } from '@/lib/vocabulary';

interface TurkishListenChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function TurkishListenChoiceQuestion({
  word,
  options,
  onDone,
  isSaving,
}: TurkishListenChoiceQuestionProps) {
  const speak = useSpeaker();
  useAutoSpeak(word.turkish, 'tr');
  const round = useChoiceRound(word);
  const isSpoken = useSpokenFeedback(round.isSolved, word.finnish, 'fi');

  return (
    <section className="space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
        <button
          type="button"
          onClick={() => void speak(word.turkish, 'tr')}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-md transition hover:scale-105 hover:bg-blue-800 active:scale-95"
          aria-label="Türkçe kelimeyi dinle"
        >
          <Volume2 className="h-6 w-6" aria-hidden="true" />
        </button>
        <p className="text-sm font-medium text-slate-600">Türkçe kelimeyi dinleyin, sonra doğru görseli seçin</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => round.choose(option)}
            disabled={round.isLocked || round.wrongIds.includes(option.id)}
            className={`${choiceClass(round.isLocked, option.id === word.id, round.wrongIds.includes(option.id))} overflow-hidden`}
          >
            <WordImage src={option.image_url} alt="" fit="contain" className="h-[clamp(72px,16dvh,160px)] w-full" />
            <span className="block px-2 py-2 text-sm font-semibold sm:text-base">{option.finnish}</span>
          </button>
        ))}
      </div>

      {(round.isSolved || round.hadWrongAttempt) && (
        <GameFeedback
          correct={round.isSolved}
          title={round.isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru Fince kelime: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={round.isRevealed}
          isReady={isSpoken}
          isSaving={isSaving}
          onReveal={round.reveal}
          onContinue={() => onDone(round.results)}
        />
      )}
    </section>
  );
}
