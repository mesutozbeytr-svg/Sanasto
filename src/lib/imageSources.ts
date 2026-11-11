import { findTwemojiCandidates, OPENMOJI_CREDIT, openmojiUrl, TWEMOJI_CREDIT } from '@/lib/twemoji';
import type { ImageSource } from '@/lib/vocabulary';

export type PickerSourceId = 'google_ai_mode' | 'upload' | 'twemoji' | 'openmoji' | 'wikimedia';

export interface ImageCandidate {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl: string;
  credit: string;
  source: ImageSource;
}

export interface PickerSource {
  id: PickerSourceId;
  label: string;
}

export const PICKER_SOURCES: PickerSource[] = [
  { id: 'google_ai_mode', label: 'Google AI Mode' },
  { id: 'upload', label: 'Kendi görselim' },
  { id: 'twemoji', label: 'Twemoji' },
  { id: 'openmoji', label: 'OpenMoji' },
  { id: 'wikimedia', label: 'Wikimedia Commons' },
];

export const IMAGE_SOURCE_LABELS: Record<ImageSource, string> = {
  upload: 'Yüklenen görsel',
  link: 'Bağlantı',
  ai: 'Yapay zeka',
  ai_generated: 'Yapay zeka (SDXL)',
  search: 'Arama',
  twemoji: 'Twemoji',
  openmoji: 'OpenMoji',
  wikimedia: 'Wikimedia Commons',
  google_ai_mode: 'Google AI Mode',
};

export function buildEmojiCandidates(finnish: string, turkish: string, source: PickerSourceId): ImageCandidate[] {
  if (source !== 'twemoji' && source !== 'openmoji') return [];
  return findTwemojiCandidates(finnish, turkish).map((match) => {
    const url = source === 'twemoji' ? match.url : openmojiUrl(match.codepoint);
    return {
      id: match.codepoint,
      title: match.label,
      previewUrl: url,
      imageUrl: url,
      credit: source === 'twemoji' ? TWEMOJI_CREDIT : OPENMOJI_CREDIT,
      source,
    };
  });
}

export function buildImagePrompt(finnish: string, turkish: string): string {
  const meaning = turkish.trim();
  const capitalized = meaning.charAt(0).toLocaleUpperCase('tr-TR') + meaning.slice(1);
  return [
    `${capitalized} (Fince: ${finnish.trim()}) kelimesini temsil eden, gerçekçi, yüksek kaliteli, eğitim amaçlı bir görsel oluştur.`,
    'Görselde bu kavram açıkça görünsün.',
    'Görselin üzerinde hiçbir yazı, harf, kelime veya filigran bulunmasın.',
    'Kare formatında olsun.',
    'Bir Fince kelime öğrenme uygulamasında kullanılmaya uygun, sade ve anlaşılır bir görsel olsun.',
  ].join(' ');
}
