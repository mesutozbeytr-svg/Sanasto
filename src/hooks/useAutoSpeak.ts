import { useEffect } from 'react';
import { useSpeaker } from '@/hooks/useSpeaker';
import { stopSpeech, type SpeechLanguage } from '@/lib/speech';

export function useAutoSpeak(text: string, language: SpeechLanguage, enabled = true) {
  const speak = useSpeaker();
  useEffect(() => {
    if (!enabled) return;
    void speak(text, language);
    return () => stopSpeech();
  }, [enabled, text, language, speak]);
}
