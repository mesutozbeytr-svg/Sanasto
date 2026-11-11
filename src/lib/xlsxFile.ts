import { strToU8, unzipSync, zipSync } from 'fflate';

const SHEET_NAME = 'Kelimeler';
const MAX_PART_BYTES = 20 * 1024 * 1024;
const SPREADSHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const RELATIONSHIP_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_RELATIONSHIP_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function stripInvalidXmlChars(text: string): string {
  return Array.from(text)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 0xfffe && code !== 0xffff);
    })
    .join('');
}

function escapeXml(text: string): string {
  return stripInvalidXmlChars(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function columnName(index: number): string {
  let name = '';
  let remaining = index + 1;
  while (remaining > 0) {
    const offset = (remaining - 1) % 26;
    name = String.fromCharCode(65 + offset) + name;
    remaining = Math.floor((remaining - 1) / 26);
  }
  return name;
}

function cellXml(value: string, reference: string, style: number): string {
  const styleAttribute = style ? ` s="${style}"` : '';
  return `<c r="${reference}" t="inlineStr"${styleAttribute}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml(headers: string[], rows: string[][]): string {
  const allRows = [headers, ...rows];
  const columnCount = headers.length;
  const body = allRows
    .map((cells, rowIndex) => {
      const style = rowIndex === 0 ? 1 : 0;
      const cellsXml = cells
        .map((cell, columnIndex) => cellXml(cell, `${columnName(columnIndex)}${rowIndex + 1}`, style))
        .join('');
      return `<row r="${rowIndex + 1}">${cellsXml}</row>`;
    })
    .join('');
  const lastColumn = columnName(Math.max(columnCount - 1, 0));
  const widths = headers
    .map((_, index) => `<col min="${index + 1}" max="${index + 1}" width="24" customWidth="1"/>`)
    .join('');
  return `${XML_HEADER}<worksheet xmlns="${SPREADSHEET_NS}" xmlns:r="${RELATIONSHIP_NS}"><dimension ref="A1:${lastColumn}${allRows.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${body}</sheetData></worksheet>`;
}

const STYLES_XML = `${XML_HEADER}<styleSheet xmlns="${SPREADSHEET_NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs></styleSheet>`;

const CONTENT_TYPES_XML = `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;

const ROOT_RELS_XML = `${XML_HEADER}<Relationships xmlns="${PACKAGE_RELATIONSHIP_NS}"><Relationship Id="rId1" Type="${RELATIONSHIP_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK_XML = `${XML_HEADER}<workbook xmlns="${SPREADSHEET_NS}" xmlns:r="${RELATIONSHIP_NS}"><sheets><sheet name="${SHEET_NAME}" sheetId="1" r:id="rId1"/></sheets></workbook>`;

const WORKBOOK_RELS_XML = `${XML_HEADER}<Relationships xmlns="${PACKAGE_RELATIONSHIP_NS}"><Relationship Id="rId1" Type="${RELATIONSHIP_NS}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${RELATIONSHIP_NS}/styles" Target="styles.xml"/></Relationships>`;

export function buildXlsxBytes(headers: string[], rows: string[][]): Uint8Array {
  return zipSync({
    '[Content_Types].xml': strToU8(CONTENT_TYPES_XML),
    '_rels/.rels': strToU8(ROOT_RELS_XML),
    'xl/workbook.xml': strToU8(WORKBOOK_XML),
    'xl/_rels/workbook.xml.rels': strToU8(WORKBOOK_RELS_XML),
    'xl/styles.xml': strToU8(STYLES_XML),
    'xl/worksheets/sheet1.xml': strToU8(sheetXml(headers, rows)),
  });
}

function parseXml(bytes: Uint8Array): Document {
  const document = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(bytes), 'application/xml');
  if (document.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Excel dosyasının içeriği okunamadı.');
  }
  return document;
}

function sheetPathFromWorkbook(files: Record<string, Uint8Array>): string {
  const workbook = files['xl/workbook.xml'];
  const rels = files['xl/_rels/workbook.xml.rels'];
  if (!workbook || !rels) return 'xl/worksheets/sheet1.xml';
  const firstSheet = parseXml(workbook).getElementsByTagNameNS(SPREADSHEET_NS, 'sheet')[0];
  const relationId = firstSheet?.getAttributeNS(RELATIONSHIP_NS, 'id');
  const relationship = Array.from(parseXml(rels).getElementsByTagName('Relationship')).find(
    (item) => item.getAttribute('Id') === relationId,
  );
  const target = relationship?.getAttribute('Target');
  if (!target) return 'xl/worksheets/sheet1.xml';
  return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
}

function sharedStringsOf(bytes: Uint8Array | undefined): string[] {
  if (!bytes) return [];
  return Array.from(parseXml(bytes).getElementsByTagNameNS(SPREADSHEET_NS, 'si')).map((item) =>
    Array.from(item.getElementsByTagNameNS(SPREADSHEET_NS, 't'))
      .map((node) => node.textContent ?? '')
      .join(''),
  );
}

function columnIndexOf(reference: string): number {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? 'A';
  let index = 0;
  for (const letter of letters) index = index * 26 + (letter.charCodeAt(0) - 64);
  return index - 1;
}

function cellText(cell: Element, sharedStrings: string[]): string {
  const type = cell.getAttribute('t');
  if (type === 's') {
    const value = cell.getElementsByTagNameNS(SPREADSHEET_NS, 'v')[0]?.textContent ?? '';
    return sharedStrings[Number(value)] ?? '';
  }
  if (type === 'inlineStr') {
    return Array.from(cell.getElementsByTagNameNS(SPREADSHEET_NS, 't'))
      .map((node) => node.textContent ?? '')
      .join('');
  }
  return cell.getElementsByTagNameNS(SPREADSHEET_NS, 'v')[0]?.textContent ?? '';
}

export function readXlsxGrid(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (file) => file.originalSize <= MAX_PART_BYTES,
    });
  } catch {
    throw new Error('Excel dosyası okunamadı. Dosyanın .xlsx biçiminde olduğunu kontrol edin.');
  }

  const sheetBytes = files[sheetPathFromWorkbook(files)];
  if (!sheetBytes) throw new Error('Excel dosyasında okunabilir bir sayfa bulunamadı.');

  const sharedStrings = sharedStringsOf(files['xl/sharedStrings.xml']);
  const sheet = parseXml(sheetBytes);
  const grid: string[][] = [];

  for (const row of Array.from(sheet.getElementsByTagNameNS(SPREADSHEET_NS, 'row'))) {
    const cells: string[] = [];
    for (const cell of Array.from(row.getElementsByTagNameNS(SPREADSHEET_NS, 'c'))) {
      const reference = cell.getAttribute('r') ?? '';
      const index = reference ? columnIndexOf(reference) : cells.length;
      while (cells.length < index) cells.push('');
      cells[index] = cellText(cell, sharedStrings);
    }
    if (cells.some((value) => value.trim() !== '')) grid.push(cells);
  }
  return grid;
}
