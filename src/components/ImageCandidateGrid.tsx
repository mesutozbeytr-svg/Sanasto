import WordImage from '@/components/WordImage';
import type { ImageCandidate } from '@/lib/imageSources';

interface ImageCandidateGridProps {
  candidates: ImageCandidate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ImageCandidateGrid({ candidates, selectedId, onSelect }: ImageCandidateGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {candidates.map((candidate) => {
        const selected = candidate.id === selectedId;
        return (
          <li key={candidate.id}>
            <button
              type="button"
              onClick={() => onSelect(candidate.id)}
              aria-pressed={selected}
              className={`flex h-full w-full flex-col overflow-hidden rounded-2xl border-2 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                selected ? 'border-blue-600 shadow-md' : 'border-slate-200'
              }`}
            >
              <WordImage src={candidate.previewUrl} alt={candidate.title} fit="contain" className="h-28 w-full p-2" />
              <span className="space-y-1 p-3">
                <span className="block truncate text-sm font-semibold text-slate-800">{candidate.title || 'Görsel'}</span>
                <span className="block text-xs leading-snug text-slate-500">{candidate.credit}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
