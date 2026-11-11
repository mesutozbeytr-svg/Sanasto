import { parseGridTable, parseImportFile, type ParsedTable } from '@/lib/wordImport';
import { readXlsxGrid } from '@/lib/xlsxFile';

async function docxToTable(buffer: ArrayBuffer): Promise<ParsedTable> {
  const mammoth = await import('mammoth');
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const document = new DOMParser().parseFromString(html, 'text/html');

  const table = document.querySelector('table');
  if (table) {
    const grid = Array.from(table.querySelectorAll('tr')).map((row) =>
      Array.from(row.children).map((cell) => (cell.textContent ?? '').trim()),
    );
    return parseGridTable(grid);
  }

  const lines = Array.from(document.querySelectorAll('p'))
    .map((paragraph) => paragraph.textContent ?? '')
    .join('\n');
  return parseImportFile(lines, 'txt');
}

export async function parseOfficeImport(buffer: ArrayBuffer, format: 'xlsx' | 'docx'): Promise<ParsedTable> {
  if (format === 'xlsx') return parseGridTable(readXlsxGrid(new Uint8Array(buffer)));
  return docxToTable(buffer);
}
