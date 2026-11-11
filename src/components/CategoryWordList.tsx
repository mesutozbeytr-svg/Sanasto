import { useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import WordFormModal from '@/components/WordFormModal';
import WordImage from '@/components/WordImage';
import type { Word } from '@/lib/vocabulary';

interface CategoryWordListProps {
  categoryId: string;
  words: Word[];
}

export default function CategoryWordList({ categoryId, words }: CategoryWordListProps) {
  const [editing, setEditing] = useState<Word | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Kelimeler ({words.length})</p>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" /> Kelime ekle
        </button>
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-slate-500">Bu kategoride henüz kelime yok.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
          {words.map((word) => (
            <li key={word.id} className="flex items-center gap-3 px-3 py-2.5">
              <WordImage
                src={word.image_url}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{word.finnish}</p>
                <p className="truncate text-sm text-slate-500">{word.turkish}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(word)}
                aria-label={`${word.finnish} kelimesini düzenle`}
                className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {isAdding && (
        <WordFormModal
          word={null}
          onClose={() => setIsAdding(false)}
          defaultCategoryId={categoryId}
        />
      )}
      {editing && <WordFormModal key={editing.id} word={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
