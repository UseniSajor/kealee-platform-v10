#!/usr/bin/env node

/**
 * Generate REAL videos using bytedance/seedance-2.0 model
 */

const https = require('https');
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

function httpRequest(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${REPLICATE_TOKEN}`,
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

async function generateVideo(prompt, type) {
  console.log(`\n📹 ${type.toUpperCase()}`);

  try {
    // Create prediction with bytedance/seedance-2.0
    const response = await httpRequest('POST', 'https://api.replicate.com/v1/predictions', {
      version: 'a6dcbae88b153e75fcccabacfb0eb430ab5be0a7ae27b316fc6f983658b349bc',
      input: {
        prompt: prompt,
        duration: 8,
        aspect_ratio: '16:9',
        resolution: '720p',
      },
    });

    console.log(`   Status: ${response.status}`);

    if (response.status !== 201) {
      if (response.body) console.log(`   Error: ${response.body.substring(0, 200)}`);
      if (response.data && response.data.detail) console.log(`   Detail: ${response.data.detail}`);
      return null;
    }

    const predictionId = response.data.id;
    console.log(`   ✓ Prediction: ${predictionId}`);

    // Poll for completion - wait for starting/processing to complete
    let prediction = response.data;
    let attempts = 0;
    const maxAttempts = 360; // 30 minutes

    while ((prediction.status === 'processing' || prediction.status === 'starting') && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await httpRequest('GET', `https://api.replicate.com/v1/predictions/${predictionId}`);
      prediction = pollRes.data;
      process.stdout.write(`\r   ⏳ Status: ${prediction.status} (${attempts * 5}s elapsed)`);
      attempts++;
    }

    console.log('');

    if (prediction.status === 'succeeded' && prediction.output) {
      const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      console.log(`   ✅ Video generated: ${videoUrl.substring(0, 60)}...`);
      return videoUrl;
    } else {
      console.log(`   ❌ Failed (${prediction.status})`);
      if (prediction.error) console.log(`   Error: ${prediction.error}`);
      if (prediction.logs) console.log(`   Logs: ${prediction.logs.substring(0, 200)}`);
      return null;
    }

  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('\n╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  🎬 GENERATING REAL HERO VIDEOS WITH SEEDANCE 2.0  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  const videos = {
    kitchen: 'Professional 4K video of modern kitchen transformation. Before: dark cabinets, harvest gold appliances, 1980s tiles. After: white shaker cabinets, stainless steel appliances, marble waterfall island with LED lighting. Show quick transitions. 8 seconds.',
    addition: 'Professional 4K video of home addition construction progress. 2-story house with new master suite. Show: site preparation, wood framing, electrical rough-in, drywall installation, painting, flooring, final walkthrough with construction crew. 8 seconds.',
    garden: 'Professional 4K video of garden landscape transformation. Before: bare backyard with old wooden fence. After: lush garden with curved flower beds, mature plants, hardscape patio with seating, decorative pathways, ambient landscape lighting. Multiple angles. 8 seconds.',
  };

  const results = {};

  for (const [type, prompt] of Object.entries(videos)) {
    const url = await generateVideo(prompt, type);
    if (url) results[type] = url;
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 GENERATION SUMMARY');
  console.log('═'.repeat(70));

  if (Object.keys(results).length === 3) {
    console.log(`\n✅ ALL 3 VIDEOS GENERATED SUCCESSFULLY\n`);
    for (const [type, url] of Object.entries(results)) {
      console.log(`${type.padEnd(10)}: ${url}`);
    }
    console.log('\n✅ Ready for Tasks 2-4 (Upload, Railway, Deploy)');
    return results;
  } else {
    console.log(`\n⚠️  Generated ${Object.keys(results).length}/3 videos\n`);
    for (const [type, url] of Object.entries(results)) {
      console.log(`${type.padEnd(10)}: ${url}`);
    }
    return results;
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
