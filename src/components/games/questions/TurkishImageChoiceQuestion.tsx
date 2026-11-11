import GameFeedback from '@/components/games/GameFeedback';
import SpeakButton from '@/components/SpeakButton';
import FlipCardGrid from '@/components/games/questions/FlipCardGrid';
import { useChoiceRound, useSpokenFeedback, type QuestionProps } from '@/components/games/questions/questionShared';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import type { Word } from '@/lib/vocabulary';

interface TurkishImageChoiceQuestionProps extends QuestionProps {
  word: Word;
  options: Word[];
}

export default function TurkishImageChoiceQuestion({
  word,
  options,
  onDone,
  isSaving,
}: TurkishImageChoiceQuestionProps) {
  useAutoSpeak(word.turkish, 'tr');
  const round = useChoiceRound(word);
  const isSpoken = useSpokenFeedback(round.isSolved, word.finnish, 'fi');

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-500">Türkçe kelime</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{word.turkish}</p>
        <div className="mt-1 flex justify-center">
          <SpeakButton text={word.turkish} language="tr" label="Türkçe kelimeyi dinle" />
        </div>
        <p className="mt-1 text-sm text-slate-600">Bu kelimeye uyan resmi bulmak için bir karta dokunun</p>
      </div>

      <FlipCardGrid options={options} target={word} faceText={(option) => option.finnish} round={round} />

      {(round.isSolved || round.hadWrongAttempt) && (
        <GameFeedback
          correct={round.isSolved}
          title={round.isSolved ? 'Doğru!' : 'Yanlış kart, tekrar deneyin'}
          detail={
            round.isSolved || round.isRevealed ? (
              <span className="flex items-center gap-3">
                Doğru Fince kelime: <strong>{word.finnish}</strong>
                <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
              </span>
            ) : undefined
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
