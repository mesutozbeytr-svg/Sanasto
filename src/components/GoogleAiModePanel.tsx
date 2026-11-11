import { useRef, useState } from 'react';
import { Check, Copy, ExternalLink, RotateCcw } from 'lucide-react';
import ImageField, { type ImageDraft } from '@/components/ImageField';
import { buildImagePrompt } from '@/lib/imageSources';
import { GOOGLE_AI_MODE_SEARCH_URL } from '@/lib/googleAiMode';

interface GoogleAiModePanelProps {
  finnish: string;
  turkish: string;
  draft: ImageDraft;
  onChange: (draft: ImageDraft) => void;
}

export default function GoogleAiModePanel({ finnish, turkish, draft, onChange }: GoogleAiModePanelProps) {
  const defaultPrompt = buildImagePrompt(finnish, turkish);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const canUse = prompt.trim().length > 0;

  const openAiMode = () => {
    window.open(`${GOOGLE_AI_MODE_SEARCH_URL}${encodeURIComponent(prompt.trim())}`, '_blank', 'noopener,noreferrer');
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
    } catch {
      promptRef.current?.select();
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm leading-relaxed text-slate-700">
          Aşağıdaki Türkçe komutu Google AI Mode'da kullanarak görseli oluşturun, bilgisayarınıza veya telefonunuza indirin ve
          "Kendi görselim" ile buraya yükleyin.
        </p>
        <p className="text-xs leading-relaxed text-slate-500">
          Google AI Mode için Google hesabınız gerekebilir. Kullanım sınırları Google tarafından belirlenir.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="ai-mode-prompt" className="text-sm font-semibold text-slate-700">
            Görsel komutu
          </label>
          <button
            type="button"
            onClick={() => setPrompt(defaultPrompt)}
            disabled={prompt === defaultPrompt}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Varsayılana dön
          </button>
        </div>
        <textarea
          ref={promptRef}
          id="ai-mode-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
        <p className="text-xs text-slate-500">Komutu dilediğiniz gibi düzenleyebilir veya kendi açıklamanızı ekleyebilirsiniz.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={openAiMode}
            disabled={!canUse}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Google AI Mode'u yeni sekmede aç
          </button>
          <button
            type="button"
            onClick={copyPrompt}
            disabled={!canUse}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            {copyState === 'copied' ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copyState === 'copied' ? 'Kopyalandı' : 'Komutu kopyala'}
          </button>
        </div>
        {copyState === 'failed' && (
          <p className="text-xs font-medium text-amber-700">Otomatik kopyalanamadı. Komut seçildi; Ctrl+C veya kopyala menüsünü kullanın.</p>
        )}
      </div>

      <div className="space-y-2 border-t border-slate-200 pt-5">
        <p className="text-sm font-semibold text-slate-700">İndirdiğiniz görseli yükleyin</p>
        <ImageField value={draft} onChange={(next) => onChange(next.file ? { ...next, source: 'google_ai_mode' } : next)} />
      </div>
    </div>
  );
}
