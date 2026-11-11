import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from 'lucide-react';
import CategoryWordList from '@/components/CategoryWordList';
import InlineNameEditor from '@/components/InlineNameEditor';
import LearningBattery from '@/components/LearningBattery';
import { getLearningProgress } from '@/lib/learningProgress';
import type { Category, Word } from '@/lib/vocabulary';

interface CategoryPanelProps {
  category: Category;
  words: Word[];
  onRename: (name: string) => Promise<void>;
  onRequestDelete: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMove?: (direction: 'up' | 'down') => void;
}

export default function CategoryPanel({
  category,
  words,
  onRename,
  onRequestDelete,
  canMoveUp = false,
  canMoveDown = false,
  onMove,
}: CategoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const categoryProgress = getLearningProgress(words);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="truncate text-base font-bold text-slate-900">{category.name}</h3>
              <p className="shrink-0 text-sm text-slate-500">{words.length} kelime</p>
            </div>
            <LearningBattery progress={categoryProgress} />
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {onMove && (
          <div className="flex shrink-0 flex-col justify-center gap-1 border-l border-slate-100 px-2">
            <button
              type="button"
              onClick={() => onMove('up')}
              disabled={!canMoveUp}
              aria-label={`${category.name} kategorisini yukarı taşı`}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onMove('down')}
              disabled={!canMoveDown}
              aria-label={`${category.name} kategorisini aşağı taşı`}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="space-y-5 border-t border-slate-100 px-5 py-5">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Ana kategori adı</p>
            <InlineNameEditor value={category.name} label="Ana kategori" onSave={onRename} />
          </div>

          <CategoryWordList categoryId={category.id} words={words} />

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onRequestDelete}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <Trash2 className="h-4 w-4" /> Ana kategoriyi sil
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
