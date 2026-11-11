import { useEffect, useRef, type ReactNode } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const AUTO_CONTINUE_MS = 1200;

interface GameFeedbackProps {
  correct: boolean;
  title: string;
  detail?: ReactNode;
  isRevealed?: boolean;
  isReady?: boolean;
  isSaving: boolean;
  onReveal?: () => void;
  onContinue: () => void;
}

export default function GameFeedback({
  correct,
  title,
  detail,
  isRevealed = false,
  isReady = true,
  isSaving,
  onReveal,
  onContinue,
}: GameFeedbackProps) {
  const Icon = correct ? CheckCircle2 : XCircle;
  const continueRef = useRef(onContinue);
  const hasContinuedRef = useRef(false);

  useEffect(() => {
    continueRef.current = onContinue;
  });

  useEffect(() => {
    if (!isSaving) hasContinuedRef.current = false;
  }, [isSaving]);

  const waitingForSpeech = correct && !isReady;

  useEffect(() => {
    if (!correct || !isReady) return;
    const timer = window.setTimeout(() => {
      if (hasContinuedRef.current) return;
      hasContinuedRef.current = true;
      continueRef.current();
    }, AUTO_CONTINUE_MS);
    return () => window.clearTimeout(timer);
  }, [correct, isReady]);

  const canReveal = Boolean(onReveal) && !correct && !isRevealed;
  const showAnswer = correct || isRevealed || !onReveal;

  const handleContinue = () => {
    if (hasContinuedRef.current) return;
    hasContinuedRef.current = true;
    continueRef.current();
  };

  return (
    <div
      role="status"
      className={`animate-modal-in flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
        correct ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'
      }`}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <p className="text-lg font-bold">{title}</p>
          {showAnswer && detail && <div className="text-sm">{detail}</div>}
        </div>
      </div>
      {canReveal ? (
        <button
          type="button"
          onClick={onReveal}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
        >
          Cevabı göster
        </button>
      ) : (
        <button
          type="button"
          onClick={handleContinue}
          disabled={isSaving || waitingForSpeech}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Kaydediliyor...' : 'Devam'}
        </button>
      )}
    </div>
  );
}
