import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';

interface SortOption<T extends string> {
  value: T;
  label: string;
}

interface SortDropdownProps<T extends string> {
  label: string;
  options: SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SortDropdown<T extends string>({ label, options, value, onChange }: SortDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(containerRef, isOpen, () => setIsOpen(false));

  const selected = options.find((option) => option.value === value);

  const choose = (next: T) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-left text-sm font-semibold text-slate-900 transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => choose(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    active ? 'font-semibold text-blue-800' : 'text-slate-800'
                  }`}
                >
                  {option.label}
                  {active && <Check className="h-4 w-4 shrink-0 text-blue-700" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
