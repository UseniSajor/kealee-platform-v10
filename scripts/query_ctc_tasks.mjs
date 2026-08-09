import fs from 'node:fs/promises';

const tasks = JSON.parse(await fs.readFile('data/ctc-june-2023-tasks.json', 'utf8'));
const queries = process.argv.slice(2);

for (const query of queries) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = tasks.filter((task) => {
    const haystack = `${task.code} ${task.description}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  }).slice(0, 80);
  console.log(`\n## ${query} (${matches.length})`);
  for (const task of matches) {
    console.log(`${task.code}\t${task.uom}\t${task.unitCost2023.toFixed(2)}\t${task.description}`);
  }
}
