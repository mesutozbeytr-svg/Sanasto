import { useRef, type KeyboardEvent } from 'react';
import type { LetterSlotTone } from '@/components/games/questions/useLetterAnswer';

interface LetterSlotsProps {
  chars: string[];
  hiddenIndexes: number[];
  values: string[];
  disabled: boolean;
  tone: LetterSlotTone;
  onChange: (slot: number, letter: string) => void;
}

const SLOT_TONE_CLASS: Record<LetterSlotTone, string> = {
  idle: 'border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100',
  solved: 'border-emerald-500 bg-emerald-50 text-emerald-900',
  revealed: 'border-slate-300 bg-slate-50 text-slate-900',
};

export default function LetterSlots({ chars, hiddenIndexes, values, disabled, tone, onChange }: LetterSlotsProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (slot: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[slot] && slot > 0) {
      inputRefs.current[slot - 1]?.focus();
    }
  };

  const handleChange = (slot: number, raw: string) => {
    const letter = raw.slice(-1);
    onChange(slot, letter);
    if (letter && slot < hiddenIndexes.length - 1) inputRefs.current[slot + 1]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2" aria-label="Kelime">
      {chars.map((char, index) => {
        if (char === ' ') return <span key={index} className="w-3 sm:w-4" />;
        const slot = hiddenIndexes.indexOf(index);
        if (slot === -1) {
          return (
            <span
              key={index}
              className="flex h-10 w-7 items-center justify-center text-xl font-bold text-slate-900 sm:h-12 sm:w-9"
            >
              {char}
            </span>
          );
        }
        return (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[slot] = element;
            }}
            value={values[slot]}
            onChange={(event) => handleChange(slot, event.target.value)}
            onKeyDown={(event) => handleKeyDown(slot, event)}
            disabled={disabled}
            maxLength={2}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-label={`${index + 1}. harf`}
            className={`h-10 w-8 rounded-lg border-2 bg-white text-center text-xl font-bold text-slate-900 transition focus:outline-none sm:h-12 sm:w-10 ${SLOT_TONE_CLASS[tone]}`}
          />
        );
      })}
    </div>
  );
}
