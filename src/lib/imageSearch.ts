import { supabase } from '@/lib/supabase';
import type { ImageCandidate } from '@/lib/imageSources';

const SEARCH_UNAVAILABLE = 'Görsel araması şu an yapılamıyor. Lütfen tekrar deneyin.';
const IMPORT_FAILED = 'Görsel kaydedilemedi. Mevcut görsel korunuyor; lütfen başka bir görsel deneyin.';

interface ServerCandidate {
  id: string;
  title: string;
  previewUrl: string;
  imageUrl: string;
  credit: string;
}

function isServerCandidate(value: unknown): value is ServerCandidate {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return ['id', 'title', 'previewUrl', 'imageUrl', 'credit'].every((key) => typeof candidate[key] === 'string');
}

export async function searchWikimediaImages(query: string): Promise<ImageCandidate[]> {
  const { data, error } = await supabase.functions.invoke('image-search', {
    body: { action: 'search', source: 'wikimedia', query },
  });
  if (error) throw new Error(SEARCH_UNAVAILABLE);
  const body = data as { candidates?: unknown } | null;
  if (!body || !Array.isArray(body.candidates) || !body.candidates.every(isServerCandidate)) {
    throw new Error(SEARCH_UNAVAILABLE);
  }
  return (body.candidates as ServerCandidate[]).map((candidate) => ({ ...candidate, source: 'wikimedia' }));
}

export async function importRemoteImage(imageUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('image-search', {
    body: { action: 'import', url: imageUrl },
  });
  const body = data as { url?: unknown } | null;
  if (error || typeof body?.url !== 'string' || !body.url.startsWith('https://')) {
    throw new Error(IMPORT_FAILED);
  }
  return body.url;
}
