export type LearningStatus = 'not_studied' | 'learning' | 'learned' | 'review';

export type ImageSource =
  | 'upload'
  | 'link'
  | 'ai'
  | 'ai_generated'
  | 'search'
  | 'twemoji'
  | 'openmoji'
  | 'wikimedia'
  | 'google_ai_mode';

export const LEARNING_STATUS_OPTIONS: { value: LearningStatus; label: string }[] = [
  { value: 'not_studied', label: 'Henüz çalışılmadı' },
  { value: 'learning', label: 'Öğreniliyor' },
  { value: 'learned', label: 'Öğrenildi' },
  { value: 'review', label: 'Tekrar edilmeli' },
];

export const DEFAULT_CATEGORY_NAMES = [
  'Aile ve akrabalar',
  'İnsanlar ve ilişkiler',
  'Vücut',
  'Sağlık',
  'Hastane ve sağlık hizmetleri',
  'Ev',
  'Mutfak',
  'Yiyecekler',
  'İçecekler',
  'Hayvanlar',
  'Bitkiler',
  'Doğa',
  'Hava durumu',
  'Şehir',
  'Ulaşım',
  'Alışveriş',
  'Giyim',
  'İş hayatı',
  'Eğitim',
  'Teknoloji',
  'İletişim',
  'Günlük yaşam',
  'Zaman',
  'Sayılar ve ölçüler',
  'Renkler ve şekiller',
  'Duygular',
  'Hobiler ve boş zaman',
  'Spor',
  'Kültür',
  'Seyahat',
  'Güvenlik',
  'Çevre',
  'Toplum ve hizmetler',
];

export interface Category {
  id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Word {
  id: string;
  finnish: string;
  turkish: string;
  category_id: string | null;
  subcategory_id: string | null;
  image_url: string | null;
  image_source: ImageSource | null;
  image_credit: string | null;
  example_fi: string | null;
  example_tr: string | null;
  grammar_note: string | null;
  is_favorite: boolean;
  learning_status: LearningStatus;
  learning_status_manual: boolean;
  completed_game_types: string[];
  correct_count: number;
  wrong_count: number;
  last_studied_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WordFormValues {
  finnish: string;
  turkish: string;
  category_id: string | null;
  image_url: string | null;
  image_source: ImageSource | null;
  image_credit: string | null;
  example_fi: string | null;
  example_tr: string | null;
  grammar_note: string | null;
}

export function foldForSearch(text: string): string {
  return text.trim().toLocaleLowerCase('tr-TR');
}

export function normalizeFinnish(text: string): string {
  return text.trim().toLocaleLowerCase('fi-FI');
}

