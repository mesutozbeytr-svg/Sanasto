import { supabase } from '@/lib/supabase';

const BUCKET = 'word-images';
const MAX_FILE_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

export function validateImageFile(file: File): string | null {
  if (!(file.type in EXTENSIONS)) {
    return 'Yalnızca PNG, JPG, JPEG veya WEBP dosyası yükleyebilirsiniz.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Dosya 5 MB boyutunu aşamaz.';
  }
  return null;
}

export function validateImageLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return 'Bağlantı http:// veya https:// ile başlamalı.';
    }
    return null;
  } catch {
    return 'Geçerli bir bağlantı girin.';
  }
}

export async function uploadWordImage(userId: string, file: File): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[file.type]}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '3600' });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
