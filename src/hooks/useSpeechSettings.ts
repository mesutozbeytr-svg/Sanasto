import { useCallback, useEffect, useRef, useState } from 'react';
import { getVoices, pickBestVoice, subscribeToVoiceChanges, type SpeechLanguage } from '@/lib/speech';

const STORAGE_KEY = 'sanasto.speechSettings';

export interface SpeechSettings {
  rate: number;
  fiVoiceURI: string | null;
  trVoiceURI: string | null;
}

export const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  rate: 0.9,
  fiVoiceURI: null,
  trVoiceURI: null,
};

function readSettings(): SpeechSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SPEECH_SETTINGS;
    return { ...DEFAULT_SPEECH_SETTINGS, ...(JSON.parse(raw) as Partial<SpeechSettings>) };
  } catch {
    return DEFAULT_SPEECH_SETTINGS;
  }
}

type Listener = () => void;
const listeners = new Set<Listener>();
let cachedSettings: SpeechSettings | null = null;

function getSettings(): SpeechSettings {
  if (!cachedSettings) cachedSettings = readSettings();
  return cachedSettings;
}

function setSettings(next: SpeechSettings) {
  cachedSettings = next;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function useSpeechSettings() {
  const [settings, setLocalSettings] = useState<SpeechSettings>(() => getSettings());

  useEffect(() => {
    const listener = () => setLocalSettings(getSettings());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<SpeechSettings>) => {
    setSettings({ ...getSettings(), ...patch });
  }, []);

  return { settings, updateSettings };
}

export function useVoices(language: SpeechLanguage): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getVoices(language));

  useEffect(() => {
    setVoices(getVoices(language));
    return subscribeToVoiceChanges(() => setVoices(getVoices(language)));
  }, [language]);

  return voices;
}

const autoPickedFi = new Set<unknown>();
const autoPickedTr = new Set<unknown>();

export function useAutoPickVoices() {
  const { settings, updateSettings } = useSpeechSettings();
  const fiVoices = useVoices('fi');
  const trVoices = useVoices('tr');
  const userPickedFi = useRef(settings.fiVoiceURI !== null);
  const userPickedTr = useRef(settings.trVoiceURI !== null);

  useEffect(() => {
    if (userPickedFi.current || fiVoices.length === 0) return;
    const best = pickBestVoice('fi');
    if (best && !autoPickedFi.has(best.voiceURI)) {
      autoPickedFi.add(best.voiceURI);
      updateSettings({ fiVoiceURI: best.voiceURI });
    }
  }, [fiVoices, updateSettings]);

  useEffect(() => {
    if (userPickedTr.current || trVoices.length === 0) return;
    const best = pickBestVoice('tr');
    if (best && !autoPickedTr.has(best.voiceURI)) {
      autoPickedTr.add(best.voiceURI);
      updateSettings({ trVoiceURI: best.voiceURI });
    }
  }, [trVoices, updateSettings]);

  return { settings, updateSettings };
}
