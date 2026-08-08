import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { PDFParse } from 'pdf-parse';

// NOTE: this expects the ~4,666-page PRICED distribution, NOT the 6-page
// "Using The Construction Task Catalog® - Distribution.pdf" methodology guide
// (that guide has zero priced tasks; its text is at data/ctc/ctc-ground-rules.txt).
// The priced distribution is proprietary Gordian data and is not committed —
// see data/ctc/README.md for how to load it.
const source = '_docs/Construction Task Catalog® - Distribution.pdf';
const target = 'data/ctc-june-2023-extracted.txt';

if (!existsSync(source)) {
  console.error(`Priced CTC distribution not found at: ${source}
The repo only ships the CTC usage guide + a 41-task sample.
Query the sample instead: node scripts/ctc.mjs divisions
See data/ctc/README.md to load the full licensed catalog.`);
  process.exit(1);
}

const parser = new PDFParse({ data: await fs.readFile(source) });

try {
  const result = await parser.getText();
  await fs.writeFile(target, result.text, 'utf8');
  console.log(`${target}: ${result.total} pages, ${result.text.length} characters`);
} finally {
  await parser.destroy();
}
