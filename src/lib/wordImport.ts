import { normalizeFinnish, type Category, type Word, type WordFormValues } from '@/lib/vocabulary';

export type ImportFormat = 'txt' | 'csv' | 'json' | 'xlsx' | 'docx' | 'pdf';

export type ImportTarget = 'finnish' | 'turkish' | 'category';

export interface ImportTargetMeta {
  key: ImportTarget;
  label: string;
  required: boolean;
}

export const IMPORT_TARGETS: ImportTargetMeta[] = [
  { key: 'finnish', label: 'Fince kelime', required: true },
  { key: 'turkish', label: 'Türkçe anlamı', required: true },
  { key: 'category', label: 'Ana kategori', required: false },
];

export interface ParsedTable {
  headers: string[];
  rows: string[][];
}

export interface ColumnMapping {
  finnish?: number;
  turkish?: number;
  category?: number;
}

export interface ImportDefaults {
  categoryId: string | null;
}

export type ImportRowStatus = 'ready' | 'duplicate' | 'invalid';

export interface ImportPreviewRow {
  recordNumber: number;
  status: ImportRowStatus;
  values: WordFormValues | null;
  issues: string[];
}

export interface ImportStatusCounts {
  ready: number;
  duplicate: number;
  invalid: number;
}

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;

const DELIMITERS = /[\t|;,\-–—]/;

const FORMAT_EXTENSIONS: Record<string, ImportFormat> = {
  txt: 'txt',
  csv: 'csv',
  json: 'json',
  xlsx: 'xlsx',
  docx: 'docx',
  pdf: 'pdf',
};

export function detectImportFormat(filename: string): ImportFormat | null {
  const lower = filename.toLowerCase();
  const ext = lower.slice(lower.lastIndexOf('.') + 1);
  return FORMAT_EXTENSIONS[ext] ?? null;
}

const HEADER_KEYWORDS = new Set([
  'finnish', 'fin', 'fi', 'fince', 'suomi',
  'turkish', 'tur', 'tr', 'türkçe', 'anlam', 'anlami', 'anlamı',
  'category', 'kategori', 'ana kategori', 'konu',
]);

function splitDelimitedLine(line: string): string[] {
  return line.split(DELIMITERS).map((cell) => cell.trim());
}

function parseDelimitedText(text: string): ParsedTable {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: ['Fince', 'Türkçe'], rows: [] };
  }

  const firstSplit = splitDelimitedLine(lines[0]);
  const isHeaderLine = firstSplit.some((cell) => HEADER_KEYWORDS.has(cell.toLowerCase()));

  if (isHeaderLine) {
    const headers = firstSplit;
    const rows = lines.slice(1).map(splitDelimitedLine);
    return { headers, rows };
  }

  return { headers: ['Fince', 'Türkçe'], rows: lines.map(splitDelimitedLine) };
}

function parseCsvText(text: string): ParsedTable {
  return parseDelimitedText(text);
}

interface JsonWordEntry {
  finnish?: unknown;
  turkish?: unknown;
  category?: unknown;
}

function parseJsonText(text: string): ParsedTable {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSON dosyası okunamadı. Geçerli bir JSON yapısı girin.');
  }

  let entries: JsonWordEntry[];
  if (Array.isArray(data)) {
    entries = data as JsonWordEntry[];
  } else if (typeof data === 'object' && data !== null && Array.isArray((data as { words?: unknown }).words)) {
    entries = (data as { words: JsonWordEntry[] }).words;
  } else {
    throw new Error('JSON bir kelime listesi içermiyor.');
  }

  const headers = ['finnish', 'turkish', 'category'];
  const rows = entries.map((entry) => [
    typeof entry.finnish === 'string' ? entry.finnish : '',
    typeof entry.turkish === 'string' ? entry.turkish : '',
    typeof entry.category === 'string' ? entry.category : '',
  ]);
  return { headers, rows };
}

export function parseImportFile(text: string, format: ImportFormat): ParsedTable {
  const trimmed = text.trim();
  if (trimmed === '') {
    throw new Error('Dosya boş veya okunamadı.');
  }
  if (format === 'json') return parseJsonText(trimmed);
  if (format === 'csv') return parseCsvText(trimmed);
  return parseDelimitedText(trimmed);
}

export function parseGridTable(grid: string[][]): ParsedTable {
  if (grid.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = grid[0].map((cell) => cell.trim());
  const rows = grid.slice(1).map((row) => {
    const cells = headers.map((_, index) => (row[index] ?? '').trim());
    return cells;
  });
  return { headers, rows };
}

export function guessMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const lowerHeaders = headers.map((header) => header.toLowerCase().trim());

  const finnishIndex = lowerHeaders.findIndex((header) =>
    ['finnish', 'fin', 'fi', 'fince', 'suomi'].includes(header),
  );
  if (finnishIndex !== -1) mapping.finnish = finnishIndex;

  const turkishIndex = lowerHeaders.findIndex((header) =>
    ['turkish', 'tur', 'tr', 'türkçe', 'anlam', 'anlami', 'anlamı'].includes(header),
  );
  if (turkishIndex !== -1) mapping.turkish = turkishIndex;

  const categoryIndex = lowerHeaders.findIndex((header) =>
    ['category', 'kategori', 'ana kategori', 'konu'].includes(header),
  );
  if (categoryIndex !== -1) mapping.category = categoryIndex;

  if (mapping.finnish === undefined && mapping.turkish === undefined) {
    if (headers.length >= 2) {
      mapping.finnish = 0;
      mapping.turkish = 1;
    } else if (headers.length === 1) {
      mapping.finnish = 0;
    }
  }

  return mapping;
}

function findExistingWord(words: Word[], finnish: string): Word | undefined {
  const key = normalizeFinnish(finnish);
  if (!key) return undefined;
  return words.find((word) => normalizeFinnish(word.finnish) === key);
}

function resolveCategoryId(
  cellValue: string,
  defaults: ImportDefaults,
  categories: Category[],
): string | null {
  const trimmed = cellValue.trim();
  if (trimmed) {
    const match = categories.find(
      (category) => category.name.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'),
    );
    if (match) return match.id;
  }
  return defaults.categoryId;
}

export function buildImportPreview(
  table: ParsedTable,
  mapping: ColumnMapping,
  defaults: ImportDefaults,
  categories: Category[],
  words: Word[],
): ImportPreviewRow[] {
  const seenFinnish = new Set<string>();
  const rows: ImportPreviewRow[] = [];

  table.rows.forEach((cells, index) => {
    const recordNumber = index + 1;
    const issues: string[] = [];

    const finnishRaw = mapping.finnish !== undefined ? (cells[mapping.finnish] ?? '').trim() : '';
    const turkishRaw = mapping.turkish !== undefined ? (cells[mapping.turkish] ?? '').trim() : '';
    const categoryCell = mapping.category !== undefined ? (cells[mapping.category] ?? '').trim() : '';

    if (!finnishRaw) issues.push('Fince kelime boş');
    if (!turkishRaw) issues.push('Türkçe anlam boş');

    const categoryId = resolveCategoryId(categoryCell, defaults, categories);
    if (!categoryId && !categoryCell) {
      if (mapping.category === undefined && !defaults.categoryId) {
        issues.push('Kategori seçilmedi');
      }
    }

    if (issues.length > 0) {
      rows.push({ recordNumber, status: 'invalid', values: null, issues });
      return;
    }

    const normalizedFinnish = normalizeFinnish(finnishRaw);
    if (seenFinnish.has(normalizedFinnish)) {
      rows.push({
        recordNumber,
        status: 'invalid',
        values: null,
        issues: ['Bu kelime dosyada tekrar ediyor'],
      });
      return;
    }
    seenFinnish.add(normalizedFinnish);

    const existing = findExistingWord(words, finnishRaw);
    if (existing) {
      rows.push({
        recordNumber,
        status: 'duplicate',
        values: null,
        issues: [`Zaten kayıtlı: ${existing.finnish} - ${existing.turkish}`],
      });
      return;
    }

    const values: WordFormValues = {
      finnish: finnishRaw,
      turkish: turkishRaw,
      category_id: categoryId,
      image_url: null,
      image_source: null,
      image_credit: null,
      example_fi: null,
      example_tr: null,
      grammar_note: null,
    };

    rows.push({ recordNumber, status: 'ready', values, issues: [] });
  });

  return rows;
}

export function countByStatus(rows: ImportPreviewRow[]): ImportStatusCounts {
  return rows.reduce(
    (counts, row) => {
      counts[row.status] += 1;
      return counts;
    },
    { ready: 0, duplicate: 0, invalid: 0 } as ImportStatusCounts,
  );
}
