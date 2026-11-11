import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Link as LinkIcon, Trash2, Upload } from 'lucide-react';
import WordImage from '@/components/WordImage';
import { validateImageFile, validateImageLink } from '@/lib/imageUpload';
import type { ImageSource } from '@/lib/vocabulary';

export interface ImageDraft {
  file: File | null;
  url: string | null;
  source: ImageSource | null;
}

interface ImageFieldProps {
  value: ImageDraft;
  onChange: (value: ImageDraft) => void;
}

type Mode = 'upload' | 'link';

export default function ImageField({ value, onChange }: ImageFieldProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!value.file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const hasImage = Boolean(value.file || value.url);
  const shownSrc = value.file ? previewUrl : value.url;

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    onChange({ file, url: null, source: 'upload' });
  };

  const handleLink = () => {
    const url = linkInput.trim();
    const problem = validateImageLink(url);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setLinkInput('');
    onChange({ file: null, url, source: 'link' });
  };

  const removeImage = () => {
    setError(null);
    onChange({ file: null, url: null, source: null });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-36 w-full overflow-hidden rounded-2xl border border-slate-200 sm:h-40 sm:w-40 sm:shrink-0">
          {hasImage ? (
            <WordImage src={shownSrc} alt="Kelime görseli" className="h-full w-full" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Görsel yok</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode('upload')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="h-4 w-4" /> Dosya yükle
            </button>
            <button
              type="button"
              onClick={() => setMode('link')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === 'link' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="h-4 w-4" /> Bağlantı ekle
            </button>
          </div>

          {mode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-700"
              >
                Bilgisayardan veya telefondan görsel seç
              </button>
              <p className="mt-2 text-xs text-slate-500">PNG, JPG, JPEG veya WEBP. En fazla 5 MB.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={linkInput}
                onChange={(event) => setLinkInput(event.target.value)}
                placeholder="https://..."
                className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleLink}
                disabled={!linkInput.trim()}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
              >
                Ekle
              </button>
            </div>
          )}

          {hasImage && (
            <button
              type="button"
              onClick={removeImage}
              className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 transition hover:text-rose-700"
            >
              <Trash2 className="h-4 w-4" /> Görseli kaldır
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
