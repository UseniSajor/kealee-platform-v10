const https = require('https');
const { URL } = require('url');

const videos = {
  kitchen: 'https://replicate.delivery/xezq/ViAoWS3GPGoiEJOZpfMX5VSyJIgplFE66FZReGwQe4ZObCrtA/tmpgjvxumny.mp4',
  addition: 'https://replicate.delivery/xezq/WK3vf0fEoQms4UCf6YthBePfemi8cjG3sYGHUkesb3S09nwaLA/tmpmiobyq3m.mp4',
  garden: 'https://replicate.delivery/xezq/qQnfhgqraKTfsE5tGpH0oU2UdjgJJCRaEGvrN5qcF2PaTh1WA/tmpniiena3x.mp4',
};

async function testUrl(name, urlStr) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'HEAD',
      timeout: 5000,
    }, (res) => {
      const size = res.headers['content-length'] ? (res.headers['content-length'] / 1024 / 1024).toFixed(2) : '?';
      resolve({
        name,
        status: res.statusCode,
        size: size,
        accessible: res.statusCode === 200 ? '✅' : '❌',
      });
    });
    req.on('error', (e) => {
      resolve({ name, status: 0, error: e.message, accessible: '❌' });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, status: 'TIMEOUT', accessible: '❌' });
    });
    req.end();
  });
}

async function main() {
  console.log('\n✅ Verifying NEW video URLs...\n');
  for (const [name, url] of Object.entries(videos)) {
    const result = await testUrl(name, url);
    console.log(`${result.accessible} ${result.name.padEnd(12)}: ${result.status} (${result.size}MB)`);
  }
  console.log('\n');
}

main();
