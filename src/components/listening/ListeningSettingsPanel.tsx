import { useState } from 'react';
import { ChevronDown, Settings2 } from 'lucide-react';
import { useSpeechSettings, useVoices } from '@/hooks/useSpeechSettings';
import {
  LANGUAGE_GAP_OPTIONS,
  LISTENING_ORDER_OPTIONS,
  type ListeningOrder,
  type ListeningSettings,
} from '@/lib/listening';

interface ListeningSettingsPanelProps {
  settings: ListeningSettings;
  onChange: (settings: ListeningSettings) => void;
}

const PAUSE_OPTIONS = [0, 1, 2, 3, 5];

const selectClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function ListeningSettingsPanel({ settings, onChange }: ListeningSettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { settings: speech, updateSettings: updateSpeech } = useSpeechSettings();
  const finnishVoices = useVoices('fi');
  const turkishVoices = useVoices('tr');
  const update = (patch: Partial<ListeningSettings>) => onChange({ ...settings, ...patch });
  const isMixedOrder = settings.order === 'fi_tr' || settings.order === 'tr_fi';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="inline-flex items-center gap-2 font-bold text-slate-900">
          <Settings2 className="h-5 w-5 text-blue-700" /> Dinleme ayarları
        </span>
        <ChevronDown className={`h-5 w-5 text-slate-500 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="space-y-6 border-t border-slate-100 px-5 py-5">
          <div>
            <p className="mb-3 text-sm font-semibold text-slate-700">Okuma sırası</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LISTENING_ORDER_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    settings.order === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="listening-order"
                    value={option.value}
                    checked={settings.order === option.value}
                    onChange={() => update({ order: option.value as ListeningOrder })}
                    className="sr-only"
                  />
                  <span className="block font-semibold text-slate-900">{option.label}</span>
                  <span className="block text-xs text-slate-600">{option.description}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Fince kelime tekrarı</p>
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                {([1, 2, 3] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => update({ repeatCount: count })}
                    className={`min-w-14 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      settings.repeatCount === count ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    {count} kez
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="pause-select" className="mb-2 block text-sm font-semibold text-slate-700">
                İki kelime arası bekleme
              </label>
              <select
                id="pause-select"
                value={settings.pauseSeconds}
                onChange={(event) => update({ pauseSeconds: Number(event.target.value) })}
                className={selectClass}
              >
                {PAUSE_OPTIONS.map((seconds) => (
                  <option key={seconds} value={seconds}>
                    {seconds === 0 ? 'Bekleme yok' : `${seconds} saniye`}
                  </option>
                ))}
              </select>
            </div>
            {isMixedOrder && (
              <div>
                <label htmlFor="gap-select" className="mb-2 block text-sm font-semibold text-slate-700">
                  Fince ve Türkçe arasında bekleme
                </label>
                <select
                  id="gap-select"
                  value={settings.languageGapSeconds}
                  onChange={(event) => update({ languageGapSeconds: Number(event.target.value) })}
                  className={selectClass}
                >
                  {LANGUAGE_GAP_OPTIONS.map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds === 0 ? 'Bekleme yok' : `${seconds} saniye`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div>
              <p className="font-semibold text-slate-900">Otomatik oynatma</p>
              <p className="text-sm text-slate-600">Kapalıysa her kelimeden sonra durur, siz devam ettirirsiniz.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoplay}
              onClick={() => update({ autoplay: !settings.autoplay })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${settings.autoplay ? 'bg-blue-700' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  settings.autoplay ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="speed-range" className="mb-2 block text-sm font-semibold text-slate-700">
                Konuşma hızı: {speech.rate.toFixed(2)}
              </label>
              <input
                id="speed-range"
                type="range"
                min={0.5}
                max={1.5}
                step={0.05}
                value={speech.rate}
                onChange={(event) => updateSpeech({ rate: Number(event.target.value) })}
                className="w-full accent-blue-700"
              />
            </div>
            <div className="hidden sm:block" />
            <div>
              <label htmlFor="fi-voice" className="mb-2 block text-sm font-semibold text-slate-700">Fince ses</label>
              <select
                id="fi-voice"
                value={speech.fiVoiceURI ?? ''}
                onChange={(event) => updateSpeech({ fiVoiceURI: event.target.value || null })}
                className={selectClass}
              >
                <option value="">Cihazın varsayılan Fince sesi</option>
                {finnishVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>
                ))}
              </select>
              {finnishVoices.length === 0 && (
                <p className="mt-2 text-xs text-amber-800">Bu cihazda Fince ses bulunamadı.</p>
              )}
            </div>
            <div>
              <label htmlFor="tr-voice" className="mb-2 block text-sm font-semibold text-slate-700">Türkçe ses</label>
              <select
                id="tr-voice"
                value={speech.trVoiceURI ?? ''}
                onChange={(event) => updateSpeech({ trVoiceURI: event.target.value || null })}
                className={selectClass}
              >
                <option value="">Cihazın varsayılan Türkçe sesi</option>
                {turkishVoices.map((voice) => (
                  <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
