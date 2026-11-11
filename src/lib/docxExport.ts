import { Document, PageOrientation, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel } from 'docx';

export async function buildWordDocx(table: { labels: string[]; rows: string[][] }): Promise<Blob> {
  const headerRow = new TableRow({
    tableHeader: true,
    children: table.labels.map(
      (label) =>
        new TableCell({
          shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'E2E8F0' },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
        }),
    ),
  });

  const bodyRows = table.rows.map(
    (cells) =>
      new TableRow({
        cantSplit: true,
        children: cells.map(
          (cell) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell })] })] }),
        ),
      }),
  );

  const document = new Document({
    sections: [
      {
        properties: { page: { size: { orientation: PageOrientation.LANDSCAPE } } },
        children: [
          new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Sanasto kelime listesi')] }),
          new Paragraph({ children: [new TextRun(`${table.rows.length} kelime`)] }),
          new Paragraph({ children: [] }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...bodyRows],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(document);
}
