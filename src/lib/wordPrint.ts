function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PRINT_STYLES = `
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 0; }
  h1 { font-size: 18pt; margin: 0 0 4mm; }
  p.meta { font-size: 9pt; color: #475569; margin: 0 0 4mm; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #e2e8f0; font-weight: bold; }
  tr { break-inside: avoid; }
`;

export function openPrintableWordList(table: { labels: string[]; rows: string[][] }): boolean {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;

  const head = table.labels.map((label) => `<th>${escapeHtml(label)}</th>`).join('');
  const body = table.rows
    .map((cells) => `<tr>${cells.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
    .join('');
  const date = new Date().toLocaleDateString('tr-TR');

  printWindow.document.write(`<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Sanasto kelime listesi</title>
<style>${PRINT_STYLES}</style>
</head>
<body>
<h1>Sanasto kelime listesi</h1>
<p class="meta">${table.rows.length} kelime · ${escapeHtml(date)}</p>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  return true;
}
