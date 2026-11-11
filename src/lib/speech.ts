export type SpeechLanguage = 'fi' | 'tr';

const LANGUAGE_TAGS: Record<SpeechLanguage, string> = {
  fi: 'fi-FI',
  tr: 'tr-TR',
};

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getVoices(language: SpeechLanguage): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().startsWith(language));
}

export function subscribeToVoiceChanges(callback: () => void): () => void {
  if (!isSpeechSupported()) return () => {};
  const synth = window.speechSynthesis;
  synth.addEventListener('voiceschanged', callback);
  return () => synth.removeEventListener('voiceschanged', callback);
}

function isLocalVoice(voice: SpeechSynthesisVoice): boolean {
  return voice.localService === true;
}

function voiceQualityScore(voice: SpeechSynthesisVoice, language: SpeechLanguage): number {
  let score = 0;
  const langPrefix = LANGUAGE_TAGS[language].toLowerCase();

  if (voice.lang.toLowerCase() === langPrefix) score += 100;
  else if (voice.lang.toLowerCase().startsWith(langPrefix.slice(0, 2))) score += 50;

  if (isLocalVoice(voice)) score += 30;
  if (voice.default) score += 10;

  const nameLower = voice.name.toLowerCase();
  if (/natural|neural|premium|enhanced|wavenet|studio/.test(nameLower)) score += 20;
  if (/google/.test(nameLower)) score += 15;
  if (/microsoft/.test(nameLower)) score += 10;

  return score;
}

export function pickBestVoice(language: SpeechLanguage): SpeechSynthesisVoice | null {
  const voices = getVoices(language);
  if (voices.length === 0) return null;
  let best = voices[0];
  let bestScore = voiceQualityScore(best, language);
  for (let i = 1; i < voices.length; i += 1) {
    const score = voiceQualityScore(voices[i], language);
    if (score > bestScore) {
      best = voices[i];
      bestScore = score;
    }
  }
  return best;
}

interface SpeakOptions {
  language: SpeechLanguage;
  rate: number;
  voiceURI: string | null;
}

export function speak(text: string, { language, rate, voiceURI }: SpeakOptions): Promise<void> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_TAGS[language];
    utterance.rate = rate;

    const voices = getVoices(language);
    let voice: SpeechSynthesisVoice | undefined;
    if (voiceURI) {
      voice = voices.find((item) => item.voiceURI === voiceURI);
    }
    if (!voice) {
      const best = pickBestVoice(language);
      if (best) voice = best;
    }
    if (voice) utterance.voice = voice;

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
