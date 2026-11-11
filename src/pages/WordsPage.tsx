import { useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, FileUp, Plus, SlidersHorizontal, X } from 'lucide-react';
import BulkExportModal from '@/components/BulkExportModal';
import MissingImageNotice from '@/components/MissingImageNotice';
import PageHeader from '@/components/PageHeader';
import WordFilterBar from '@/components/WordFilterBar';
import WordFormModal from '@/components/WordFormModal';
import WordImportModal from '@/components/WordImportModal';
import WordList from '@/components/WordList';
import { useLibrary } from '@/contexts/LibraryContext';
import SortDropdown from '@/components/SortDropdown';
import { useStoredState } from '@/hooks/useStoredState';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { EMPTY_WORD_FILTERS, filterWords, type WordFilters } from '@/lib/wordFilters';
import { sortWordsByListMode, WORD_LIST_SORT_OPTIONS, type WordListSort } from '@/lib/wordSort';

const WORD_SORT_KEY = 'sanasto.wordListSort';

export default function WordsPage() {
  const { words, categories } = useLibrary();
  const [filters, setFilters] = useState<WordFilters>(EMPTY_WORD_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(filterContainerRef, showFilters, () => setShowFilters(false));
  const [sortSettings, setSortSettings] = useStoredState<{ mode: WordListSort }>(WORD_SORT_KEY, { mode: 'added' });
  const sortMode = sortSettings.mode;

  const visibleWords = useMemo(() => {
    return sortWordsByListMode(filterWords(words, filters), sortMode);
  }, [words, filters, sortMode]);
  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_WORD_FILTERS);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tüm Kelimeler"
        description={`${words.length} kelime kayıtlı.`}
        action={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => setIsImporting(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:flex-none"
            >
              <FileUp className="h-4 w-4" /> Toplu kelime ekle
            </button>
            <button
              type="button"
              onClick={() => setIsExporting(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:flex-none"
            >
              <Download className="h-4 w-4" /> Toplu dışa aktar
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:flex-none"
            >
              <Plus className="h-4 w-4" /> Yeni kelime
            </button>
          </div>
        }
      />

      <MissingImageNotice
        count={words.filter((word) => !word.image_url).length}
        onShow={() => setFilters({ ...EMPTY_WORD_FILTERS, noImage: true })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-slate-600">
        <span>Toplam {words.length} kelime</span>
        <span>Seçili filtrelerde {visibleWords.length} kelime</span>
      </div>
        <div className="w-full space-y-2 sm:w-64">
          <div ref={filterContainerRef} className="w-full">
            <button
              type="button"
              aria-label="Filtreler"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((open) => !open)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                hasFilters
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                {hasFilters ? 'Filtreler (aktif)' : 'Filtreler'}
              </span>
              <div className="flex items-center gap-1.5">
                {hasFilters && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFilters(EMPTY_WORD_FILTERS); }}
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <X className="h-3.5 w-3.5" /> Temizle
                  </button>
                )}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
              </div>
            </button>

            {showFilters && (
              <div className="mt-2 w-full">
                <WordFilterBar filters={filters} onChange={setFilters} />
              </div>
            )}
          </div>
          <SortDropdown
            label="Kelime sıralaması"
            options={WORD_LIST_SORT_OPTIONS}
            value={sortMode}
            onChange={(mode) => setSortSettings({ mode })}
          />
        </div>
      </div>

      <WordList
        words={visibleWords}
        emptyTitle={hasFilters ? 'Bu filtrelere uyan kelime yok' : 'Henüz kelime eklemediniz'}
        emptyText={
          hasFilters
            ? 'Filtreleri temizleyerek bütün kelimelerinizi tekrar görebilirsiniz.'
            : 'Sağ üstteki "Yeni kelime" butonuyla ilk kelimenizi ekleyerek başlayın.'
        }
      />

      {isCreating && <WordFormModal word={null} onClose={() => setIsCreating(false)} />}
      {isExporting && (
        <BulkExportModal
          words={words}
          visibleWords={visibleWords}
          categories={categories}
          onClose={() => setIsExporting(false)}
        />
      )}
      {isImporting && <WordImportModal onClose={() => setIsImporting(false)} />}
    </div>
  );
}
