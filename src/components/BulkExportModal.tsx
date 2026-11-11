import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import Modal from '@/components/Modal';
import {
  createWordFileBlob,
  downloadWordFile,
  DEFAULT_EXPORT_FIELDS,
  EXPORT_FIELDS,
  EXPORT_FORMATS,
  getExportTable,
  selectExportWords,
  type ExportField,
  type ExportFormat,
} from '@/lib/wordExport';
import { openPrintableWordList } from '@/lib/wordPrint';
import { ALL_LEARNING_STATUSES } from '@/lib/wordFilters';
import { LEARNING_STATUS_OPTIONS, type Category, type LearningStatus, type Word } from '@/lib/vocabulary';

type ExportSource = 'visible' | 'all';

interface BulkExportModalProps {
  words: Word[];
  visibleWords: Word[];
  categories: Category[];
  onClose: () => void;
}

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        active ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{children}</h3>;
}

export default function BulkExportModal({ words, visibleWords, categories, onClose }: BulkExportModalProps) {
  const [source, setSource] = useState<ExportSource>('visible');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [fields, setFields] = useState<ExportField[]>(DEFAULT_EXPORT_FIELDS);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<LearningStatus[]>(ALL_LEARNING_STATUSES);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [limitText, setLimitText] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const limit = limitText.trim() === '' ? null : Number.parseInt(limitText, 10);
  const limitIsValid = limit === null || (Number.isFinite(limit) && limit > 0);

  const selected = useMemo(
    () =>
      limitIsValid
        ? selectExportWords(source === 'visible' ? visibleWords : words, {
            categoryIds,
            learningStatuses: statuses,
            favoritesOnly,
            limit,
          })
        : [],
    [words, visibleWords, source, categoryIds, statuses, favoritesOnly, limit, limitIsValid],
  );

  const orderedFields = EXPORT_FIELDS.map((field) => field.value).filter((field) => fields.includes(field));
  const canExport = selected.length > 0 && orderedFields.length > 0 && limitIsValid && !isExporting;

  const handleExport = async () => {
    if (!canExport) return;
    setMessage(null);
    setExportError(null);

    if (format === 'pdf') {
      const opened = openPrintableWordList(getExportTable(selected, orderedFields, categories));
      if (!opened) {
        setExportError('Yazdırma penceresi açılamadı. Tarayıcının açılır pencere engelini kaldırıp tekrar deneyin.');
      }
      return;
    }

    setIsExporting(true);
    try {
      const blob = await createWordFileBlob(selected, orderedFields, format, categories);
      downloadWordFile(blob, format);
      setMessage(`${selected.length} kelime dosyaya aktarıldı.`);
    } catch {
      setExportError('Dosya oluşturulurken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  };

  const isPdf = format === 'pdf';

  return (
    <Modal title="Toplu dışa aktar" onClose={onClose} maxWidthClass="max-w-3xl">
      <div className="space-y-6">
        <section className="space-y-3">
          <SectionTitle>1. Hangi kelimeler?</SectionTitle>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Kaynak</p>
            <div className="flex flex-wrap gap-2">
              <FilterChip
                label={`Ekranda görünen sonuçlar (${visibleWords.length})`}
                active={source === 'visible'}
                onClick={() => setSource('visible')}
              />
              <FilterChip label={`Tüm kelimelerim (${words.length})`} active={source === 'all'} onClick={() => setSource('all')} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Ana kategori</p>
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 && <p className="text-sm text-slate-500">Henüz kategori yok; tüm kelimeler seçilir.</p>}
              {categories.map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  active={categoryIds.includes(category.id)}
                  onClick={() => setCategoryIds((current) => toggleItem(current, category.id))}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Öğrenme durumu</p>
            <div className="flex flex-wrap gap-2">
              {LEARNING_STATUS_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  active={statuses.includes(option.value)}
                  onClick={() => {
                    const next = toggleItem(statuses, option.value);
                    if (next.length > 0) setStatuses(next);
                  }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(event) => setFavoritesOnly(event.target.checked)}
                className="h-4 w-4 accent-blue-700"
              />
              Yalnızca favoriler
            </label>
            <div>
              <label htmlFor="export-limit" className="mb-1.5 block text-sm font-semibold text-slate-700">
                En fazla kaç kelime?
              </label>
              <input
                id="export-limit"
                type="number"
                min={1}
                inputMode="numeric"
                value={limitText}
                onChange={(event) => setLimitText(event.target.value)}
                placeholder="Hepsi"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {!limitIsValid && <p className="mt-1.5 text-xs text-rose-600">Lütfen 1 veya daha büyük bir sayı girin.</p>}
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <SectionTitle>2. Dosya biçimi</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-3">
            {EXPORT_FORMATS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                aria-pressed={format === option.value}
                className={`rounded-xl border-2 px-4 py-3 text-left transition ${
                  format === option.value ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="block font-bold text-slate-900">{option.label}</span>
                <span className="block text-xs leading-snug text-slate-600">{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3 border-t border-slate-200 pt-5">
          <SectionTitle>3. Hangi bilgiler eklensin?</SectionTitle>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPORT_FIELDS.map((field) => (
              <label key={field.value} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={fields.includes(field.value)}
                  onChange={() => setFields((current) => toggleItem(current, field.value))}
                  className="h-4 w-4 accent-blue-700"
                />
                {field.label}
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Ä, Ö ve Å gibi Fince harfler tüm biçimlerde korunur. CSV dosyasında sütunlar noktalı virgülle ayrılır.
          </p>
        </section>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-800">{selected.length} kelime dışa aktarılacak</p>
            {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
            {exportError && <p className="text-sm font-medium text-rose-700">{exportError}</p>}
            {selected.length === 0 && limitIsValid && (
              <p className="text-sm text-amber-700">Seçtiğiniz filtrelere uyan kelime yok.</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Kapat
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
            >
              {isPdf ? <Printer className="h-4 w-4" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {isExporting ? 'Hazırlanıyor...' : isPdf ? 'PDF olarak yazdır' : 'Dosyayı indir'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
