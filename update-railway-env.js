const https = require('https');

const RAILWAY_TOKEN = 'a40f1d22-333f-41de-9f22-08ade1e51604';

function httpRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('Testing Railway REST API...\n');

  // Try to get account info
  const res = await httpRequest('GET', 'https://api.railway.app/auth/user');
  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(res.data, null, 2).substring(0, 300));
}

main();
