import fs from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

const source = '_docs/Construction Task Catalog® - Distribution.pdf';
const target = 'data/ctc-june-2023-extracted.txt';
const parser = new PDFParse({ data: await fs.readFile(source) });

try {
  const result = await parser.getText();
  await fs.writeFile(target, result.text, 'utf8');
  console.log(`${target}: ${result.total} pages, ${result.text.length} characters`);
} finally {
  await parser.destroy();
}
