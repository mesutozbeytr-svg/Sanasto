import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import GameResults from '@/components/games/GameResults';
import ImageChoiceQuestion from '@/components/games/questions/ImageChoiceQuestion';
import ListenChoiceQuestion from '@/components/games/questions/ListenChoiceQuestion';
import FlipImageQuestion from '@/components/games/questions/FlipImageQuestion';
import MatchingQuestion from '@/components/games/questions/MatchingQuestion';
import MissingLettersQuestion from '@/components/games/questions/MissingLettersQuestion';
import TypedWordQuestion from '@/components/games/questions/TypedWordQuestion';
import TextChoiceQuestion from '@/components/games/questions/TextChoiceQuestion';
import TurkishListenChoiceQuestion from '@/components/games/questions/TurkishListenChoiceQuestion';
import TurkishImageChoiceQuestion from '@/components/games/questions/TurkishImageChoiceQuestion';
import { useLibrary } from '@/contexts/LibraryContext';
import { buildQuestions } from '@/lib/games/questionBuilder';
import { getGameDefinition } from '@/lib/games/gameDefinitions';
import type { QuizGameId, QuizQuestion, WordResult } from '@/lib/games/types';
import { describeError } from '@/lib/errors';
import type { Word } from '@/lib/vocabulary';

interface GameSessionProps {
  gameId: QuizGameId;
  words: Word[];
  onExit: () => void;
  onRetryWrong: (wordIds: string[]) => void;
  onRestart: () => void;
  onNext?: () => void;
}

export default function GameSession({ gameId, words, onExit, onRetryWrong, onRestart, onNext }: GameSessionProps) {
  const { words: library, recordAnswers } = useLibrary();
  const [questions] = useState<QuizQuestion[]>(() => buildQuestions(gameId, words, library));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<WordResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const definition = getGameDefinition(gameId);

  const handleDone = async (answers: WordResult[]) => {
    if (questionIndex < questions.length - 1) {
      setResults((previous) => [...previous, ...answers]);
      setQuestionIndex((index) => index + 1);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const allResults = [...results, ...answers];
      await recordAnswers(gameId, allResults.map(({ wordId, correct }) => ({ wordId, correct })));
      setResults(allResults);
      setQuestionIndex((index) => index + 1);
    } catch (error) {
      setSaveError(describeError(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (questionIndex >= questions.length) {
    return (
      <GameResults
        title={definition.title}
        results={results}
        onRetryWrong={onRetryWrong}
        onRestart={onRestart}
        onNext={onNext}
        onExit={onExit}
      />
    );
  }

  const question = questions[questionIndex];
  const progress = Math.round((questionIndex / questions.length) * 100);
  const questionProps = { onDone: handleDone, isSaving };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 md:gap-6">
      {saveError && (
        <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
          Sonuç kaydedilemedi: {saveError}. Devam düğmesine tekrar basarak deneyebilirsiniz.
        </p>
      )}

      {renderQuestion(question, questionIndex, questionProps)}

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={questionIndex}
        >
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Oyundan çık
          </button>
          <p className="min-w-0 truncate text-sm font-bold text-slate-900">{definition.title}</p>
          <p className="shrink-0 text-sm font-semibold text-slate-600">
            {questionIndex + 1} / {questions.length}
          </p>
        </div>
      </div>
    </div>
  );
}

function renderQuestion(
  question: QuizQuestion,
  key: number,
  props: { onDone: (results: WordResult[]) => void; isSaving: boolean },
) {
  switch (question.kind) {
    case 'image-choice':
      return <ImageChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'listen-choice':
      return <ListenChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'flip-image':
      return <FlipImageQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'matching':
      return <MatchingQuestion key={key} words={question.words} {...props} />;
    case 'missing-letters':
      return (
        <MissingLettersQuestion key={key} word={question.word} hiddenIndexes={question.hiddenIndexes} {...props} />
      );
    case 'type-word':
      return <TypedWordQuestion key={key} word={question.word} variant="word" {...props} />;
    case 'listen-type':
      return <TypedWordQuestion key={key} word={question.word} variant="listen" {...props} />;
    case 'image-type':
      return <TypedWordQuestion key={key} word={question.word} variant="image" {...props} />;
    case 'text-choice':
      return <TextChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'turkish-listen-choice':
      return <TurkishListenChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
    case 'turkish-image-choice':
      return <TurkishImageChoiceQuestion key={key} word={question.word} options={question.options} {...props} />;
  }
}
