import {
  AudioLines,
  Eye,
  Headphones,
  Image,
  Languages,
  Layers,
  Link,
  ListChecks,
  MessageSquareText,
  SpellCheck,
  Type,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import type { GameId } from '@/lib/games/types';

export interface GameDefinition {
  id: GameId;
  title: string;
  description: string;
  icon: LucideIcon;
  requiresImage: boolean;
  optionCount: number | null;
  optionsNeedImage: boolean;
}

export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'flashcards',
    title: 'Kelime kartları',
    description: 'Kelimeleri kart kart gözden geçirin, bildiklerinizi işaretleyin.',
    icon: Layers,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'choose-word',
    title: 'Fince kelimeyi seç',
    description: 'Görseli ve Türkçe anlamı görün, doğru Fince kelimeyi seçin.',
    icon: ListChecks,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: false,
  },
  {
    id: 'turkish-choose-word',
    title: 'Türkçe kelimeyi seç',
    description: 'Fince kelimeyi görün, doğru Türkçe anlamı seçin.',
    icon: Languages,
    requiresImage: false,
    optionCount: 4,
    optionsNeedImage: false,
  },
  {
    id: 'listen-choose',
    title: 'Fince dinle ve cevabı bul',
    description: 'Fince kelimeyi dinleyin, dört görselden doğrusunu bulun.',
    icon: Headphones,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'turkish-listen-choose',
    title: 'Türkçe dinle ve cevabı bul',
    description: 'Türkçe kelimeyi dinleyin, doğru Fince kelimeyi bulun.',
    icon: AudioLines,
    requiresImage: false,
    optionCount: 4,
    optionsNeedImage: false,
  },
  {
    id: 'find-image',
    title: 'Fince kelimenin doğru resmini bul',
    description: 'Fince kelimeye uyan resmi, kartları çevirerek bulun.',
    icon: Image,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'turkish-find-image',
    title: 'Türkçe kelimenin doğru resmini bul',
    description: 'Türkçe kelimeyi dinleyin ve ona uyan Fince kelimeli resmi seçin.',
    icon: MessageSquareText,
    requiresImage: true,
    optionCount: 4,
    optionsNeedImage: true,
  },
  {
    id: 'matching',
    title: 'Eşleştirme',
    description: 'Fince ve Türkçe kelime çiftlerini doğru şekilde eşleştirin.',
    icon: Link,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'missing-letters',
    title: 'Eksik harfleri tamamla',
    description: 'Görsele ve anlama bakarak kelimedeki eksik harfleri yazın.',
    icon: SpellCheck,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'type-word',
    title: 'Kelimenin tamamını yaz',
    description: 'Görsel ve Türkçe anlamdan yararlanarak Fince kelimeyi yazın.',
    icon: Type,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'listen-type',
    title: 'Dinle ve yaz',
    description: 'Duyduğunuz Fince kelimeyi yazın. Yazılışı ve görseli cevaptan sonra görürsünüz.',
    icon: Volume2,
    requiresImage: false,
    optionCount: null,
    optionsNeedImage: false,
  },
  {
    id: 'image-type',
    title: 'Resme bak ve yaz',
    description: 'Yalnızca görseli görün, Fince karşılığını yazın.',
    icon: Eye,
    requiresImage: true,
    optionCount: null,
    optionsNeedImage: false,
  },
];

export function getGameDefinition(id: GameId): GameDefinition {
  const definition = GAME_DEFINITIONS.find((item) => item.id === id);
  if (!definition) throw new Error(`Bilinmeyen oyun: ${id}`);
  return definition;
}
