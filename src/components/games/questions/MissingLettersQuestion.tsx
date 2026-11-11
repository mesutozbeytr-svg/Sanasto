import { useMemo } from 'react';
import GameFeedback from '@/components/games/GameFeedback';
import LetterPicker from '@/components/games/questions/LetterPicker';
import LetterSlots from '@/components/games/questions/LetterSlots';
import { type QuestionProps } from '@/components/games/questions/questionShared';
import { useLetterAnswer } from '@/components/games/questions/useLetterAnswer';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { buildLetterTiles } from '@/lib/games/letterTiles';
import type { Word } from '@/lib/vocabulary';

interface MissingLettersQuestionProps extends QuestionProps {
  word: Word;
  hiddenIndexes: number[];
}

export default function MissingLettersQuestion({ word, hiddenIndexes, onDone, isSaving }: MissingLettersQuestionProps) {
  const answer = useLetterAnswer(word, hiddenIndexes);
  const hiddenText = hiddenIndexes.map((index) => answer.chars[index]).join('');
  const tiles = useMemo(() => buildLetterTiles(hiddenText), [hiddenText]);

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <WordImage src={word.image_url} alt="" fit="contain" className="h-[clamp(112px,22dvh,200px)] w-full" />
        <div className="space-y-1 p-3 text-center">
          <p className="text-xs font-medium text-slate-500">Anlamı</p>
          <p className="text-xl font-bold text-slate-900">{word.turkish}</p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-center text-sm font-medium text-slate-600">Eksik harfleri yazın</p>
        <LetterSlots
          chars={answer.chars}
          hiddenIndexes={hiddenIndexes}
          values={answer.inputs}
          disabled={answer.isLocked}
          tone={answer.tone}
          onChange={answer.changeSlot}
        />
        <LetterPicker
          tiles={tiles}
          values={answer.inputs}
          disabled={answer.isLocked}
          onPick={answer.pick}
          onBackspace={answer.backspace}
          onClear={answer.clear}
        />
      </div>

      {(answer.isSolved || answer.hadWrongAttempt) && (
        <GameFeedback
          correct={answer.isSolved}
          title={answer.isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <span className="flex items-center gap-3">
              Doğru yazılış: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </span>
          }
          isRevealed={answer.isRevealed}
          isReady={answer.isSpoken}
          isSaving={isSaving}
          onReveal={answer.reveal}
          onContinue={() => onDone(answer.results)}
        />
      )}
    </section>
  );
}
