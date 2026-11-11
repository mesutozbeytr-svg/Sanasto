import { useState } from 'react';
import { ArrowDownAZ, ArrowUpDown } from 'lucide-react';
import MultiSelectField from '@/components/MultiSelectField';
import LearningBattery from '@/components/LearningBattery';
import type { Category, Word } from '@/lib/vocabulary';
import { getCategoryOptions, getSelectionProgress } from '@/lib/learningProgress';

interface CategoryFilterFieldProps {
  label: string;
  categories: Category[];
  words: Word[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function CategoryFilterField({ label, categories, words, selected, onChange }: CategoryFilterFieldProps) {
  const [alphaSort, setAlphaSort] = useState(false);
  const options = getCategoryOptions(categories, words);
  const sortedOptions = alphaSort
    ? [...options].sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))
    : options;
  const progress = getSelectionProgress(words, selected);
  const caption =
    selected.length === 0
      ? 'Tüm kelimeler'
      : selected.length === 1
        ? options.find((option) => option.value === selected[0])?.label ?? ''
        : `${selected.length} kategori seçili`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <button
          type="button"
          onClick={() => setAlphaSort((v) => !v)}
          aria-label={alphaSort ? 'Alfabetik sıralama açık' : 'Alfabetik sıralama kapalı'}
          aria-pressed={alphaSort}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition ${
            alphaSort ? 'bg-blue-100 text-blue-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {alphaSort ? <ArrowDownAZ className="h-3.5 w-3.5" /> : <ArrowUpDown className="h-3.5 w-3.5" />}
          {alphaSort ? 'A-Z' : 'Sıralı'}
        </button>
      </div>
      <MultiSelectField
        label={label}
        options={sortedOptions}
        selected={selected}
        allLabel="Tüm kategoriler"
        onChange={onChange}
      />
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{caption}</p>
        <LearningBattery progress={progress} />
      </div>
    </div>
  );
}
