import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  let document: Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;
  try {
    document = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  } catch {
    throw new Error('PDF dosyası açılamadı. Dosya bozuk ya da parola korumalı olabilir.');
  }

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      text += item.str;
      text += item.hasEOL ? '\n' : ' ';
    }
    pages.push(text);
  }

  const joined = pages.join('\n').replace(/[ \t]+\n/g, '\n').trim();
  if (joined === '') {
    throw new Error('PDF içinde okunabilir metin bulunamadı. Taranmış (resim) PDF dosyaları desteklenmiyor.');
  }
  return joined;
}
