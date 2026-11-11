export const GOOGLE_AI_MODE_SEARCH_URL = 'https://www.google.com/search?udm=50&q=';

export function buildTranslationPrompt(wordsText: string): string {
  const trimmed = wordsText.trim();
  if (!trimmed) return '';
  const words = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (words.length === 0) return '';
  const list = words.map((word) => `- ${word}`).join('\n');
  return [
    'Aşağıdaki kelimelerin veya ifadelerin Fince karşılıklarını bul.',
    'Her satırı "Fince - Türkçe" biçiminde yaz (örnek: omena - elma).',
    'Yalnızca çeviriyi ver, açıklama ekleme.',
    '',
    'Kelimeler:',
    list,
  ].join('\n');
}
