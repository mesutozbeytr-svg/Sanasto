import { useCallback } from 'react';
import { speak, stopSpeech, type SpeechLanguage } from '@/lib/speech';
import { useSpeechSettings } from '@/hooks/useSpeechSettings';

export function useSpeaker() {
  const { settings } = useSpeechSettings();
  return useCallback(
    (text: string, language: SpeechLanguage) => {
      stopSpeech();
      return speak(text, {
        language,
        rate: settings.rate,
        voiceURI: language === 'fi' ? settings.fiVoiceURI : settings.trVoiceURI,
      });
    },
    [settings],
  );
}
