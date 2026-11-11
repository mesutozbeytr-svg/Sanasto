import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speak, stopSpeech, type SpeechLanguage } from '@/lib/speech';
import { useSpeechSettings } from '@/hooks/useSpeechSettings';

interface SpeakButtonProps {
  text: string;
  language: SpeechLanguage;
  label: string;
}

export default function SpeakButton({ text, language, label }: SpeakButtonProps) {
  const { settings } = useSpeechSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const runRef = useRef(0);

  useEffect(() => {
    return () => {
      runRef.current += 1;
    };
  }, []);

  const handleClick = async () => {
    stopSpeech();
    const runId = runRef.current + 1;
    runRef.current = runId;
    setIsSpeaking(true);
    try {
      await speak(text, {
        language,
        rate: settings.rate,
        voiceURI: language === 'fi' ? settings.fiVoiceURI : settings.trVoiceURI,
      });
    } catch {
      // speechSynthesis errors are resolved, not rejected — this is a safety net
    }
    if (runRef.current === runId) setIsSpeaking(false);
  };


  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      title={label}
      className={`h-9 w-9 inline-flex shrink-0 items-center justify-center rounded-full transition ${
        isSpeaking
          ? 'bg-amber-400 text-slate-900 animate-pulse'
          : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
      }`}
    >
      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
