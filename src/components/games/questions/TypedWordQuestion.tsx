import { useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import GameFeedback from '@/components/games/GameFeedback';
import LetterPicker from '@/components/games/questions/LetterPicker';
import LetterSlots from '@/components/games/questions/LetterSlots';
import { type QuestionProps } from '@/components/games/questions/questionShared';
import { useLetterAnswer } from '@/components/games/questions/useLetterAnswer';
import SpeakButton from '@/components/SpeakButton';
import WordImage from '@/components/WordImage';
import { useAutoSpeak } from '@/hooks/useAutoSpeak';
import { useSpeaker } from '@/hooks/useSpeaker';
import { buildLetterTiles } from '@/lib/games/letterTiles';
import type { Word } from '@/lib/vocabulary';

type TypedVariant = 'word' | 'listen' | 'image';

interface TypedWordQuestionProps extends QuestionProps {
  word: Word;
  variant: TypedVariant;
}

const VARIANT_SHOWS: Record<TypedVariant, { image: boolean; meaning: boolean }> = {
  word: { image: true, meaning: true },
  listen: { image: false, meaning: false },
  image: { image: true, meaning: false },
};

const VARIANT_PROMPT: Record<TypedVariant, string> = {
  word: 'Görsel ve Türkçe anlamdan yararlanarak Fince kelimeyi yazın',
  listen: 'Duyduğunuz Fince kelimeyi yazın',
  image: 'Görselin Fince karşılığını yazın',
};

export default function TypedWordQuestion({ word, variant, onDone, isSaving }: TypedWordQuestionProps) {
  const speak = useSpeaker();
  useAutoSpeak(word.finnish, 'fi', variant === 'listen');
  const chars = useMemo(() => [...word.finnish.normalize('NFC')], [word.finnish]);
  const hiddenIndexes = useMemo(
    () => chars.flatMap((char, index) => (char === ' ' ? [] : [index])),
    [chars],
  );
  const hiddenText = hiddenIndexes.map((index) => chars[index]).join('');
  const tiles = useMemo(() => buildLetterTiles(hiddenText), [hiddenText]);
  const answer = useLetterAnswer(word, hiddenIndexes);
  const shows = VARIANT_SHOWS[variant];
  const showAnswerVisuals = answer.isLocked;
  const showImage = shows.image || showAnswerVisuals;
  const showMeaning = shows.meaning || showAnswerVisuals;

  return (
    <section className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {showImage && (
          <WordImage src={word.image_url} alt="" fit="contain" className="h-[clamp(112px,22dvh,200px)] w-full" />
        )}
        <div className="space-y-1 p-3 text-center">
          {showMeaning ? (
            <>
              <p className="text-xs font-medium text-slate-500">Anlamı</p>
              <p className="text-xl font-bold text-slate-900">{word.turkish}</p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-600">{VARIANT_PROMPT[variant]}</p>
          )}
          {variant === 'listen' && !answer.isLocked && (
            <button
              type="button"
              onClick={() => void speak(word.finnish, 'fi')}
              className="mx-auto mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-white shadow-md transition hover:scale-105 hover:bg-blue-800 active:scale-95"
              aria-label="Fince kelimeyi dinle"
            >
              <Volume2 className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {!answer.isLocked && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-center text-sm font-medium text-slate-600">
            Harfleri yazın veya aşağıdan seçin, kelime tamamlanınca otomatik kontrol edilir
          </p>
          <LetterSlots
            chars={answer.chars}
            hiddenIndexes={hiddenIndexes}
            values={answer.inputs}
            disabled={answer.isLocked}
            tone={answer.tone}
            onChange={answer.changeSlot}
          />
          {answer.lastWrongInput !== null && (
            <p className="text-center text-sm text-slate-500">Son yazdığınız: {answer.lastWrongInput}</p>
          )}
          <LetterPicker
            tiles={tiles}
            values={answer.inputs}
            disabled={answer.isLocked}
            onPick={answer.pick}
            onBackspace={answer.backspace}
            onClear={answer.clear}
          />
        </div>
      )}

      {(answer.isSolved || answer.hadWrongAttempt) && (
        <GameFeedback
          correct={answer.isSolved}
          title={answer.isSolved ? 'Doğru!' : 'Yanlış cevap, tekrar deneyin'}
          detail={
            <p className="flex items-center gap-3">
              Fince: <strong>{word.finnish}</strong>
              <SpeakButton text={word.finnish} language="fi" label="Fince telaffuz" />
            </p>
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
