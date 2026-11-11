import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import WordImage from '@/components/WordImage';
import { useLibrary } from '@/contexts/LibraryContext';
import { describeError } from '@/lib/errors';
import { importRemoteImage, searchWikimediaImages } from '@/lib/imageSearch';
import type { ImageCandidate } from '@/lib/imageSources';
import type { Word } from '@/lib/vocabulary';

interface WikimediaReviewPanelProps {
  words: Word[];
}

export default function WikimediaReviewPanel({ words }: WikimediaReviewPanelProps) {
  const { applyWordImages } = useLibrary();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [candidates, setCandidates] = useState<ImageCandidate[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const remaining = words.filter((word) => !savedIds.includes(word.id));
  const selectedWord = remaining.find((word) => word.id === selectedId) ?? null;

  const selectWord = (word: Word) => {
    setSelectedId(word.id);
    setQuery(word.finnish);
    setCandidates(null);
    setError(null);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    setIsSearching(true);
    setError(null);
    try {
      setCandidates(await searchWikimediaImages(term));
    } catch (err) {
      setCandidates(null);
      setError(describeError(err));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (candidate: ImageCandidate) => {
    if (!selectedWord) return;
    setIsSaving(true);
    setError(null);
    try {
      const storedUrl = await importRemoteImage(candidate.imageUrl);
      const outcome = await applyWordImages(
        [{ wordId: selectedWord.id, imageUrl: storedUrl, imageSource: 'wikimedia', imageCredit: candidate.credit, replaceExisting: false }],
        () => undefined,
      );
      if (outcome.errorMessage) {
        setError(outcome.errorMessage);
        return;
      }
      setSavedIds((previous) => [...previous, selectedWord.id]);
      setSelectedId(null);
      setCandidates(null);
      setQuery('');
    } catch (err) {
      setError(describeError(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (remaining.length === 0) {
    return <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Bu listedeki kelimelerin tümüne görsel atandı.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="flex flex-wrap gap-2">
        {remaining.map((word) => (
          <li key={word.id}>
            <button
              type="button"
              onClick={() => selectWord(word)}
              aria-pressed={selectedId === word.id}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                selectedId === word.id ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {word.finnish}
            </button>
          </li>
        ))}
      </ul>

      {selectedWord && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              maxLength={120}
              aria-label="Wikimedia Commons arama terimi"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              {isSearching ? 'Aranıyor...' : 'Ara'}
            </button>
          </form>

          {isSearching && (
            <p className="flex items-center gap-2 text-sm text-slate-600" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Wikimedia Commons taranıyor
            </p>
          )}

          {candidates && candidates.length === 0 && (
            <p className="text-sm text-slate-600">Bu terimle serbest lisanslı görsel bulunamadı. Başka bir terim deneyin.</p>
          )}

          {candidates && candidates.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {candidates.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void handleSave(candidate)}
                    className="flex w-full flex-col gap-2 rounded-xl border border-slate-200 p-2 text-left transition hover:border-blue-500 disabled:opacity-60"
                  >
                    <WordImage src={candidate.previewUrl} alt={candidate.title} fit="contain" className="h-24 w-full rounded-lg" />
                    <span className="line-clamp-2 text-xs font-semibold text-slate-800">{candidate.title}</span>
                    <span className="line-clamp-2 text-[11px] leading-snug text-slate-500">{candidate.credit}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {isSaving && <p className="text-sm font-semibold text-slate-700" role="status">Görsel kaydediliyor...</p>}
          {error && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {error}
            </p>
          )}
          <p className="text-xs text-slate-500">
            Görsel, seçtiğiniz kelimeye bir kez kaydedilir. Lisans bilgisi kelimenin altında saklanır.
          </p>
        </div>
      )}
    </div>
  );
}
