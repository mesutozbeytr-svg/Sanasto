import { matchesSelectionFilters, ALL_LEARNING_STATUSES } from '@/lib/wordFilters';
import {
  LEARNING_STATUS_OPTIONS,
  type Category,
  type LearningStatus,
  type Word,
} from '@/lib/vocabulary';
import { buildXlsxBytes } from '@/lib/xlsxFile';

export type ExportFormat = 'xlsx' | 'csv' | 'pdf' | 'docx' | 'json' | 'txt';

export type ExportField =
  | 'finnish'
  | 'turkish'
  | 'category'
  | 'example_fi'
  | 'example_tr'
  | 'grammar_note'
  | 'learning_status'
  | 'favorite'
  | 'image_url';

export const EXPORT_FIELDS: { value: ExportField; label: string }[] = [
  { value: 'finnish', label: 'Fince kelime' },
  { value: 'turkish', label: 'Türkçe anlamı' },
  { value: 'category', label: 'Ana kategori' },
  { value: 'example_fi', label: 'Örnek Fince cümle' },
  { value: 'example_tr', label: 'Örnek cümlenin Türkçe anlamı' },
  { value: 'grammar_note', label: 'Dilbilgisi notu' },
  { value: 'learning_status', label: 'Öğrenme durumu' },
  { value: 'favorite', label: 'Favori' },
  { value: 'image_url', label: 'Görsel bağlantısı' },
];

export const DEFAULT_EXPORT_FIELDS: ExportField[] = [
  'finnish',
  'turkish',
  'category',
  'example_fi',
  'example_tr',
  'grammar_note',
  'learning_status',
  'favorite',
];

export const EXPORT_FORMATS: { value: ExportFormat; label: string; description: string }[] = [
  { value: 'xlsx', label: 'Excel (XLSX)', description: 'Excel ve Google E-Tablolar ile açılır' },
  { value: 'csv', label: 'CSV', description: 'Noktalı virgülle ayrılmış tablo' },
  { value: 'pdf', label: 'PDF', description: 'Yazdırma penceresinden PDF olarak kaydedin' },
  { value: 'docx', label: 'Word (DOCX)', description: 'Word ve Google Dokümanlar ile açılır' },
  { value: 'json', label: 'JSON', description: 'Başka uygulamalar için veri dosyası' },
  { value: 'txt', label: 'TXT', description: 'Düz metin, her satırda bir kelime' },
];

export interface ExportOptions {
  categoryIds: string[];
  learningStatuses: LearningStatus[];
  favoritesOnly: boolean;
  limit: number | null;
}

export function selectExportWords(words: Word[], options: ExportOptions): Word[] {
  const statuses = options.learningStatuses.length > 0 ? options.learningStatuses : ALL_LEARNING_STATUSES;
  const matching = words.filter(
    (word) =>
      matchesSelectionFilters(word, {
        categoryIds: options.categoryIds,
        learningStatuses: statuses,
        favoritesOnly: options.favoritesOnly,
      }),
  );
  return options.limit === null ? matching : matching.slice(0, options.limit);
}

function fieldValue(word: Word, field: ExportField, categoryNames: Map<string, string>): string {
  switch (field) {
    case 'finnish':
      return word.finnish;
    case 'turkish':
      return word.turkish;
    case 'category':
      return (word.category_id && categoryNames.get(word.category_id)) || '';
    case 'example_fi':
      return word.example_fi ?? '';
    case 'example_tr':
      return word.example_tr ?? '';
    case 'grammar_note':
      return word.grammar_note ?? '';
    case 'learning_status':
      return LEARNING_STATUS_OPTIONS.find((option) => option.value === word.learning_status)?.label ?? '';
    case 'favorite':
      return word.is_favorite ? 'Evet' : 'Hayır';
    case 'image_url':
      return word.image_url ?? '';
  }
}

export function getExportTable(
  words: Word[],
  fields: ExportField[],
  categories: Category[],
): { labels: string[]; rows: string[][] } {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return {
    labels: fields.map((field) => EXPORT_FIELDS.find((item) => item.value === field)?.label ?? field),
    rows: words.map((word) => fields.map((field) => fieldValue(word, field, categoryNames))),
  };
}

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[";\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function serializeTextFormat(table: { labels: string[]; rows: string[][] }, format: 'csv' | 'json' | 'txt', fields: ExportField[]): string {
  if (format === 'csv') {
    const lines = [table.labels, ...table.rows].map((cells) => cells.map(csvCell).join(';'));
    return `\uFEFF${lines.join('\r\n')}`;
  }
  if (format === 'json') {
    const objects = table.rows.map((cells) => Object.fromEntries(fields.map((field, index) => [field, cells[index]])));
    return JSON.stringify(objects, null, 2);
  }
  return table.rows.map((cells) => cells.filter((cell) => cell !== '').join(' | ')).join('\n');
}

const MIME_TYPES: Record<Exclude<ExportFormat, 'pdf'>, string> = {
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv;charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: 'application/json;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
};

export async function createWordFileBlob(
  words: Word[],
  fields: ExportField[],
  format: Exclude<ExportFormat, 'pdf'>,
  categories: Category[],
): Promise<Blob> {
  const table = getExportTable(words, fields, categories);
  if (format === 'xlsx') {
    return new Blob([buildXlsxBytes(table.labels, table.rows)], { type: MIME_TYPES.xlsx });
  }
  if (format === 'docx') {
    const { buildWordDocx } = await import('@/lib/docxExport');
    return buildWordDocx(table);
  }
  return new Blob([serializeTextFormat(table, format, fields)], { type: MIME_TYPES[format] });
}

export function downloadWordFile(blob: Blob, format: Exclude<ExportFormat, 'pdf'>): void {
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sanasto-kelimeler-${date}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
