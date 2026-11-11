import { List, RotateCcw, Repeat, SkipForward } from 'lucide-react';

interface GameEndActionsProps {
  wrongCount?: number;
  onRetryWrong?: () => void;
  onRestart: () => void;
  onNext?: () => void;
  onExit: () => void;
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50';
const PRIMARY = `${BUTTON_BASE} bg-blue-700 text-white hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-600`;
const SECONDARY = `${BUTTON_BASE} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`;

export default function GameEndActions({ wrongCount, onRetryWrong, onRestart, onNext, onExit }: GameEndActionsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {onRetryWrong && (
        <button type="button" onClick={onRetryWrong} disabled={!wrongCount} className={PRIMARY}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Yanlışları tekrar et
        </button>
      )}
      <button type="button" onClick={onRestart} className={onRetryWrong ? SECONDARY : PRIMARY}>
        <Repeat className="h-4 w-4" aria-hidden="true" />
        Baştan tekrar et
      </button>
      {onNext && (
        <button type="button" onClick={onNext} className={SECONDARY}>
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          Sonraki oyuna geç
        </button>
      )}
      <button type="button" onClick={onExit} className={SECONDARY}>
        <List className="h-4 w-4" aria-hidden="true" />
        Oyun listesine dön
      </button>
    </div>
  );
}
