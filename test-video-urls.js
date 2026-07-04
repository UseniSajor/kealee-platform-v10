const https = require('https');
const { URL } = require('url');

const videos = {
  kitchen: 'https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4',
  addition: 'https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4',
  garden: 'https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4',
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
      resolve({
        name,
        status: res.statusCode,
        size: res.headers['content-length'],
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
  console.log('\n🔍 Testing video URL accessibility...\n');
  for (const [name, url] of Object.entries(videos)) {
    const result = await testUrl(name, url);
    console.log(`${result.accessible} ${result.name.padEnd(12)}: ${result.status}`);
    if (result.size) console.log(`   Size: ${(result.size / 1024 / 1024).toFixed(2)}MB`);
    if (result.error) console.log(`   Error: ${result.error}`);
  }
}

main();
