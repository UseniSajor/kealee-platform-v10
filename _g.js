
const fs = require('fs');
const path = require('path');
const base = path.join(process.cwd(), 'apps/os-pm/app/(dashboard)');
function w(rel, b64) {
  const content = Buffer.from(b64, 'base64').toString('utf8');
  fs.writeFileSync(path.join(base, rel), content, 'utf8');
  console.log('OK:', rel, content.length, 'chars');
}
const data = require('./_gd.json');
data.forEach(d => w(d.p, d.c));
