import { ImageOff } from 'lucide-react';

interface MissingImageNoticeProps {
  count: number;
  onShow: () => void;
}

export default function MissingImageNotice({ count, onShow }: MissingImageNoticeProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <ImageOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        {count} kelimede görsel yok.
      </p>
      <button
        type="button"
        onClick={onShow}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
      >
        Görselsiz kelimeleri göster
      </button>
    </div>
  );
}
