#!/usr/bin/env node

/**
 * Generate hero videos using latest Replicate Kling API
 * Updated: 2026-07-03
 *
 * Steps:
 * 1. Find latest Kling model version
 * 2. Generate 3 hero videos in parallel
 * 3. Upload URLs to environment
 *
 * Usage:
 * REPLICATE_API_TOKEN=<token> node generate-videos-updated.js
 */

const https = require('https');
const fs = require('fs');

const API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN not set');
  console.error('   Set: export REPLICATE_API_TOKEN="r8_..."');
  process.exit(1);
}

function httpRequest(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Token ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, { method, ...options }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function getLatestKlingVersion() {
  console.log('🔍 Fetching latest Kling model version...');

  try {
    const modelData = await httpRequest('GET', 'https://api.replicate.com/v1/models/kling-ai/kling-video');
    const version = modelData.latest_version?.id;

    if (!version) {
      throw new Error('No version ID found in model data');
    }

    console.log(`   ✓ Found version: ${version}`);
    return version;
  } catch (error) {
    console.error(`   ❌ Failed to fetch model: ${error.message}`);
    console.error('\n   Alternative: Get version manually from:');
    console.error('   https://replicate.com/kling-ai/kling-video');
    console.error('   Then update KLING_VERSION in this script');
    process.exit(1);
  }
}

async function generateVideo(type, prompt, versionId) {
  console.log(`\n🎬 Generating ${type} video...`);

  try {
    const prediction = await httpRequest('POST', 'https://api.replicate.com/v1/predictions', {
      version: versionId,
      input: {
        prompt,
        duration: 8,
        aspect_ratio: '16:9',
        negative_prompt: 'blurry, low quality, watermark',
      },
    });

    console.log(`   ✓ Prediction: ${prediction.id}`);

    // Poll for completion
    let completed = prediction;
    let attempts = 0;
    while (completed.status === 'processing' && attempts < 120) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      completed = await httpRequest('GET', `https://api.replicate.com/v1/predictions/${prediction.id}`);
      process.stdout.write(`\r   ⏳ ${completed.status}... (${attempts * 5}s)`);
      attempts++;
    }

    console.log('');

    if (completed.status === 'succeeded' && completed.output) {
      console.log(`   ✅ Video: ${completed.output}`);
      return { type, url: completed.output };
    } else {
      throw new Error(`Failed: ${completed.status}`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

const videos = {
  kitchen: `Professional 4K video showing a modern kitchen transformation. Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s ceramic tile. After: contemporary kitchen with white shaker cabinets, stainless steel appliances, waterfall marble island, LED lighting. Show quick transitions with zoom shots. Include person touching counter for scale. Daylight from window. High quality cinematography. 8 seconds.`,

  addition: `Professional construction progress video showing home addition project. 2-story house with new master suite addition on side. Show: site prep, wood framing, electrical rough-in, drywall, painting, flooring, final walkthrough. Include construction workers, close-ups of quality craftsmanship. Sunny day, clear skies. Time-lapse elements. 8 seconds.`,

  garden: `Beautiful garden landscape transformation video. Before: bare backyard, old wooden fence. After: lush garden design with curved planting beds, flowering plants, hardscape patio with seating, decorative pathways, ambient landscape lighting. Multiple angles: wide garden shot, close flower details, evening lighting. Professional cinematography. 8 seconds.`,
};

async function main() {
  console.log('='.repeat(70));
  console.log('🎥 HERO VIDEO GENERATION — KEALEE PLATFORM');
  console.log('='.repeat(70));

  // Get latest Kling version
  const klingVersion = await getLatestKlingVersion();

  console.log('\n📹 Generating 3 hero videos...');
  const results = [];

  for (const [type, prompt] of Object.entries(videos)) {
    const result = await generateVideo(type, prompt, klingVersion);
    if (result) results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('📝 ENVIRONMENT VARIABLES');
  console.log('='.repeat(70));
  console.log('\nAdd to Railway (Preview & Production):\n');

  results.forEach(r => {
    const key = `NEXT_PUBLIC_HERO_VIDEO_${r.type.toUpperCase()}`;
    console.log(`${key}=${r.url}`);
  });

  if (results.length === 3) {
    fs.writeFileSync('.env-videos-generated',
      results.map(r => `NEXT_PUBLIC_HERO_VIDEO_${r.type.toUpperCase()}=${r.url}`).join('\n')
    );
    console.log('\n✅ Saved to: .env-videos-generated');
    console.log('\n🚀 Next steps:');
    console.log('   1. Copy above environment variables');
    console.log('   2. Add to Railway dashboard (Preview + Production)');
    console.log('   3. Deploy and test on staging');
  } else {
    console.log('\n⚠️  Only generated ' + results.length + '/3 videos');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
