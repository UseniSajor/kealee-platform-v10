import fs from 'node:fs/promises';

const text = await fs.readFile('data/ctc-june-2023-extracted.txt', 'utf8');
const lines = text.split(/\r?\n/);
const tasks = [];
const taskPattern = /^(\d{2}(?: \d{2}){2,3}-\d{4})\s+([A-Za-z0-9]+)\s+(.+?)\s+(-?[\d,]+\.\d{2})(?:\s+(-?[\d,]+\.\d{2}))?\s*\.?$/;

for (let i = 0; i < lines.length; i += 1) {
  const match = lines[i].trim().match(taskPattern);
  if (!match) continue;
  tasks.push({
    code: match[1],
    division: match[1].slice(0, 2),
    uom: match[2].toUpperCase(),
    description: match[3].replace(/\.{3,}/g, ' ').trim(),
    unitCost2023: Number(match[4].replace(/,/g, '')),
    demolitionCost2023: match[5] ? Number(match[5].replace(/,/g, '')) : null,
    sourceLine: i + 1,
  });
}

await fs.writeFile('data/ctc-june-2023-tasks.json', JSON.stringify(tasks, null, 2));
console.log(`Indexed ${tasks.length} priced CTC task rows`);
