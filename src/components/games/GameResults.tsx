import { Trophy, List } from 'lucide-react';
import GameEndActions from '@/components/games/GameEndActions';
import SpeakButton from '@/components/SpeakButton';
import type { WordResult } from '@/lib/games/types';

interface GameResultsProps {
  title: string;
  results: WordResult[];
  onRetryWrong: (wordIds: string[]) => void;
  onRestart: () => void;
  onNext?: () => void;
  onExit: () => void;
}

export default function GameResults({ title, results, onRetryWrong, onRestart, onNext, onExit }: GameResultsProps) {
  const total = results.length;
  const correct = results.filter((result) => result.correct).length;
  const wrong = total - correct;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const wrongResults = [...new Map(results.filter((result) => !result.correct).map((result) => [result.wordId, result])).values()];
  const wrongWordIds = wrongResults.map((result) => result.wordId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Trophy className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-sm font-medium text-slate-500">{title} tamamlandı</p>
        <p className="mt-1 text-5xl font-extrabold text-slate-900">%{percent}</p>
        <p className="mt-1 text-sm text-slate-600">başarı oranı</p>

        <dl className="mt-6 grid grid-cols-3 gap-3">
          <Stat label="Toplam" value={total} tone="slate" />
          <Stat label="Doğru" value={correct} tone="emerald" />
          <Stat label="Yanlış" value={wrong} tone="rose" />
        </dl>
      </div>

      {wrongResults.length > 0 && (
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <List className="h-5 w-5 text-rose-600" aria-hidden="true" />
            Yanlış cevaplanan kelimeler
          </h3>
          <ul className="divide-y divide-slate-100">
            {wrongResults.map((result) => (
              <li key={result.wordId} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-slate-900">{result.finnish}</p>
                  <p className="text-sm text-slate-500">{result.turkish}</p>
                </div>
                <SpeakButton text={result.finnish} language="fi" label="Fince telaffuz" />
              </li>
            ))}
          </ul>
        </div>
      )}

      <GameEndActions
        wrongCount={wrongWordIds.length}
        onRetryWrong={() => onRetryWrong(wrongWordIds)}
        onRestart={onRestart}
        onNext={onNext}
        onExit={onExit}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'rose' }) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-900',
    emerald: 'bg-emerald-50 text-emerald-800',
    rose: 'bg-rose-50 text-rose-800',
  }[tone];
  return (
    <div className={`rounded-2xl p-4 ${toneClass}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</dt>
      <dd className="mt-1 text-2xl font-bold">{value}</dd>
    </div>
  );
}
