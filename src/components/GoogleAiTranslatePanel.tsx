import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { buildTranslationPrompt, GOOGLE_AI_MODE_SEARCH_URL } from '@/lib/googleAiMode';

export default function GoogleAiTranslatePanel() {
  const [wordsText, setWordsText] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const prompt = buildTranslationPrompt(wordsText);

  const openAiMode = () => {
    if (!prompt) return;
    window.open(`${GOOGLE_AI_MODE_SEARCH_URL}${encodeURIComponent(prompt)}`, '_blank', 'noopener,noreferrer');
  };

  const copyPrompt = async () => {
    if (!prompt) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    window.setTimeout(() => setCopyState('idle'), 2500);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-800">Google AI Mode ile toplu çeviri</p>
        <p className="text-xs leading-relaxed text-slate-600">
          Çevirmek istediğiniz kelimeleri alt alta yazın. Google AI Mode karşılıklarını "Fince - Türkçe" biçiminde hazırlar;
          çıkan listeyi kopyalayıp aşağıdaki kutuya yapıştırın.
        </p>
      </div>
      <textarea
        value={wordsText}
        onChange={(event) => setWordsText(event.target.value)}
        maxLength={3000}
        rows={4}
        aria-label="Çevrilecek kelimeler"
        placeholder={'kissa\nkoti\nomena'}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openAiMode}
          disabled={!prompt}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Google AI Mode'da çevir
        </button>
        <button
          type="button"
          onClick={copyPrompt}
          disabled={!prompt}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
        >
          {copyState === 'copied' ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copyState === 'copied' ? 'Kopyalandı' : 'Komutu kopyala'}
        </button>
        {copyState === 'failed' && <p className="text-xs font-medium text-amber-700">Komut kopyalanamadı.</p>}
      </div>
    </div>
  );
}
