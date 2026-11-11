import { useState, type FormEvent } from 'react';
import GoogleAiModePanel from '@/components/GoogleAiModePanel';
import ImageCandidateGrid from '@/components/ImageCandidateGrid';
import ImageField, { type ImageDraft } from '@/components/ImageField';
import Modal from '@/components/Modal';
import { describeError } from '@/lib/errors';
import { importRemoteImage, searchWikimediaImages } from '@/lib/imageSearch';
import {
  buildEmojiCandidates,
  PICKER_SOURCES,
  type ImageCandidate,
  type PickerSourceId,
} from '@/lib/imageSources';
import type { ImageSource } from '@/lib/vocabulary';

export interface PickedImage {
  file: File | null;
  url: string | null;
  source: ImageSource | null;
  credit: string | null;
}

interface ImagePickerProps {
  finnish: string;
  turkish: string;
  onPick: (picked: PickedImage) => void;
  onClose: () => void;
}

const inputClass =
  'min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function ImagePicker({ finnish, turkish, onPick, onClose }: ImagePickerProps) {
  const [sourceId, setSourceId] = useState<PickerSourceId>('google_ai_mode');
  const [query, setQuery] = useState(finnish);
  const [remoteCandidates, setRemoteCandidates] = useState<ImageCandidate[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ImageDraft>({ file: null, url: null, source: null });

  const isFileSource = sourceId === 'google_ai_mode' || sourceId === 'upload';
  const isEmojiSource = sourceId === 'twemoji' || sourceId === 'openmoji';
  const emojiCandidates = isEmojiSource ? buildEmojiCandidates(finnish, turkish, sourceId) : [];
  const candidates = sourceId === 'wikimedia' ? remoteCandidates ?? [] : emojiCandidates;
  const canConfirm = isFileSource
    ? Boolean(draft.file || draft.url) && !isSaving
    : selectedId !== null && !isSaving;

  const selectSource = (id: PickerSourceId) => {
    setSourceId(id);
    setSelectedId(null);
    setError(null);
    setDraft({ file: null, url: null, source: null });
    if (id === 'wikimedia') setQuery(finnish);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setIsSearching(true);
    setError(null);
    setSelectedId(null);
    try {
      setRemoteCandidates(await searchWikimediaImages(term));
    } catch (err) {
      setRemoteCandidates(null);
      setError(describeError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (isFileSource) {
      const credit = sourceId === 'google_ai_mode' ? 'Google AI Mode ile oluşturuldu' : null;
      onPick({ file: draft.file, url: draft.url, source: draft.source, credit });
      return;
    }
    const candidate = candidates.find((item) => item.id === selectedId);
    if (!candidate) return;
    if (sourceId !== 'wikimedia') {
      onPick({ file: null, url: candidate.imageUrl, source: candidate.source, credit: candidate.credit });
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const storedUrl = await importRemoteImage(candidate.imageUrl);
      onPick({ file: null, url: storedUrl, source: candidate.source, credit: candidate.credit });
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const renderBody = () => {
    if (sourceId === 'google_ai_mode') {
      return <GoogleAiModePanel finnish={finnish} turkish={turkish} draft={draft} onChange={setDraft} />;
    }
    if (sourceId === 'upload') return <ImageField value={draft} onChange={setDraft} />;
    if (sourceId === 'wikimedia') {
      return (
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={120}
              placeholder="Aranacak kelime (örn. apple)"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </button>
          </form>
          <p className="text-xs leading-relaxed text-slate-500">
            İngilizce aramalar genellikle daha iyi sonuç verir. Görseller Wikimedia Commons'taki açık lisanslı
            dosyalardır ve kaynak bilgisiyle birlikte kaydedilir.
          </p>
          {candidates.length > 0 ? (
            <ImageCandidateGrid candidates={candidates} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
              {remoteCandidates === null
                ? 'Aramak istediğiniz kelimeyi yazıp Ara düğmesine basın.'
                : 'Bu aramada uygun görsel bulunamadı. Farklı bir kelime deneyin.'}
            </p>
          )}
        </div>
      );
    }
    return candidates.length > 0 ? (
      <ImageCandidateGrid candidates={candidates} selectedId={selectedId} onSelect={setSelectedId} />
    ) : (
      <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Bu kelimeye uygun emoji bulunamadı. Başka bir kaynak seçebilirsiniz.
      </p>
    );
  };

  return (
    <Modal title="Görsel seç" onClose={onClose}>
      <div className="space-y-5">
        <div role="tablist" aria-label="Görsel kaynağı" className="flex flex-wrap gap-2">
          {PICKER_SOURCES.map((source) => {
            const active = source.id === sourceId;
            return (
              <button
                key={source.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectSource(source.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  active ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {source.label}
              </button>
            );
          })}
        </div>

        {renderBody()}

        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-50"
          >
            {isSaving ? 'Kaydediliyor...' : 'Bu görseli kullan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
