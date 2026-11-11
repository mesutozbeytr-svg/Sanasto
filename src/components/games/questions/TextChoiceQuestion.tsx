import GameFeedback from '@/components/games/GameFeedback';
import { choiceClass, useChoiceRound, type QuestionProps } from '@/components/games/questions/questionShared';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import WordImage from '@/components/WordImage';
import type { Word } from '@/lib/vocabulary';

interface TextChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function TextChoiceQuestion({ word, options, onDone, isSaving }: TextChoiceQuestionProps) {
  useAutoSpeak(word.finnish, 'fi');
  const round = useChoiceRound(word);

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <WordImage src={word.image_url} alt="" fit="contain" className="h-[clamp(96px,20dvh,200px)] w-full" />
        <div className="p-4 text-center">
          <p className="text-sm font-medium text-slate-500">Fince kelime</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{word.finnish}</p>
          <p className="mt-1 text-sm text-slate-600">Bu kelimenin Türkçe anlamını seçin</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => round.choose(option)}
            disabled={round.isLocked || round.wrongIds.includes(option.id)}
            className={`${choiceClass(round.isLocked, option.id === word.id, round.wrongIds.includes(option.id))} px-3 py-3 text-base font-semibold`}
          >
            {option.turkish}
          </button>
        ))}
      </div>

      {(round.isSolved || round.hadWrongAttempt) && (
        <GameFeedback
          correct={round.isSolved}
          title={round.isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru Türkçe anlam: <strong>{word.turkish}</strong>
            </span>
          }
          isRevealed={round.isRevealed}
          isSaving={isSaving}
          onReveal={round.reveal}
          onContinue={() => onDone(round.results)}
        />
      )}
    </section>
  );
}
