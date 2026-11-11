import { Delete, RotateCcw } from 'lucide-react';

interface LetterPickerProps {
  tiles: string[];
  values: string[];
  disabled: boolean;
  onPick: (letter: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export default function LetterPicker({ tiles, values, disabled, onPick, onBackspace, onClear }: LetterPickerProps) {
  const remaining = new Map<string, number>();
  for (const value of values) {
    if (value) remaining.set(value, (remaining.get(value) ?? 0) + 1);
  }
  const hasFilled = values.some((value) => value !== '');

  const usedTiles = tiles.map((letter) => {
    const count = remaining.get(letter) ?? 0;
    if (count === 0) return false;
    remaining.set(letter, count - 1);
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        <button
          type="button"
          onClick={onBackspace}
          disabled={disabled || !hasFilled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <Delete className="h-4 w-4" aria-hidden="true" />
          Sil
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled || !hasFilled}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Temizle
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
        {tiles.map((letter, index) => {
          const isUsed = usedTiles[index];
          return (
            <button
              key={`${letter}-${index}`}
              type="button"
              onClick={() => onPick(letter)}
              disabled={disabled || isUsed}
              aria-label={`${letter} harfini seç`}
              className={`h-10 w-9 rounded-lg border-2 text-lg font-bold transition sm:h-11 sm:w-10 ${
                isUsed
                  ? 'border-slate-200 bg-slate-100 text-slate-300'
                  : 'border-slate-300 bg-white text-slate-900 hover:border-blue-400 hover:bg-blue-50 active:scale-95 disabled:opacity-50'
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
