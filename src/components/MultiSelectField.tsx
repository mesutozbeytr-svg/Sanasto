import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import LearningBattery from '@/components/LearningBattery';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import type { LearningProgress } from '@/lib/learningProgress';

export interface MultiSelectOption {
  value: string;
  label: string;
  progress?: LearningProgress;
}

interface MultiSelectFieldProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  allLabel: string;
  disabled?: boolean;
}

export default function MultiSelectField({
  label,
  options,
  selected,
  onChange,
  allLabel,
  disabled = false,
}: MultiSelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(containerRef, isOpen, () => setIsOpen(false));

  const selectedLabels = options.filter((option) => selected.includes(option.value)).map((option) => option.label);
  const summary =
    selectedLabels.length === 0
      ? allLabel
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} seçili`;

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  return (
    <div ref={containerRef} className="relative">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm text-slate-900 transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 text-sm">
            <span className="text-slate-500">{selected.length} seçili</span>
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="font-semibold text-blue-700 transition hover:text-blue-900 disabled:text-slate-400"
            >
              Temizle
            </button>
          </div>
          <ul role="listbox" aria-multiselectable="true" className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(option.value)}
                    className="flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm text-slate-800 transition hover:bg-slate-50"
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="block truncate">{option.label}</span>
                      {option.progress && <LearningBattery progress={option.progress} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
