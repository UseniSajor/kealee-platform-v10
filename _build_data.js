
const fs = require('fs');
const files = [];
function add(p, c) { files.push({p, c: Buffer.from(c).toString('base64')}); }
// Files will be appended via require
module.exports = { add, save: () => { fs.writeFileSync('_gd.json', JSON.stringify(files)); console.log('Saved', files.length, 'files'); } };
