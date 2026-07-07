#!/usr/bin/env node

/**
 * Generate hero videos using Replicate Kling 2.5 API
 *
 * Prerequisites:
 * - REPLICATE_API_TOKEN env var set
 *
 * Usage:
 * node generate-hero-videos.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable not set');
  process.exit(1);
}

const videoPrompts = {
  kitchen: {
    prompt: `Professional 4K video showing a modern kitchen transformation. Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s ceramic tile backsplash. After: contemporary kitchen renovation with white shaker cabinets, stainless steel appliances, waterfall island with marble countertop, LED under-cabinet lighting, large window. Show quick before/after transition with zoom shots. Include person opening cabinet or touching counter for scale. Daylight from kitchen window. Professional cinematography. Duration: 8 seconds.`,
    filename: 'kitchen-hero.mp4',
  },
  addition: {
    prompt: `Professional construction progress video showing a home addition project. House: 2-story suburban home with new master suite addition on side. Show progression: site preparation, wood framing, electrical rough-in, drywall installation, painting, flooring, final walkthrough. Include construction crew in hard hats doing quality work, close-ups of craftsmanship, time-lapse elements. Sunny day with clear blue sky. Professional construction documentation style. Duration: 8 seconds.`,
    filename: 'addition-hero.mp4',
  },
  garden: {
    prompt: `Beautiful garden transformation video showing landscape design. Before: basic suburban backyard with bare lawn, old wooden fence, no plants. After: lush garden with curved planting beds, mature flowering plants (roses, perennials), hardscape patio with seating area, decorative gravel pathways, ambient landscape lighting. Show multiple angles: wide shot of entire garden, close-ups of flowers and plants, evening ambiance with soft lighting. Professional landscape photography. Duration: 8 seconds.`,
    filename: 'garden-hero.mp4',
  },
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.replicate.com',
      path,
      method,
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
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

async function generateVideo(type, promptData) {
  console.log(`\n🎬 Generating ${type} hero video...`);

  try {
    // Create prediction
    const prediction = await makeRequest('POST', '/v1/predictions', {
      version: '7cffb21fbb2bf6154c8a43deff630f5e12dfa2af7c387d8f965b64e93ace20f1', // Kling 2.5
      input: {
        prompt: promptData.prompt,
        duration: 8,
        aspect_ratio: '16:9',
        quality: '4k',
      },
    });

    console.log(`   ✓ Prediction created: ${prediction.id}`);

    // Poll for completion
    let completed = prediction;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max

    while (completed.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      completed = await makeRequest('GET', `/v1/predictions/${prediction.id}`);
      console.log(`   • Status: ${completed.status} (${attempts + 1}/${maxAttempts})`);
      attempts++;
    }

    if (completed.status === 'succeeded') {
      const videoUrl = completed.output?.[0];
      if (videoUrl) {
        console.log(`   ✅ Video generated: ${videoUrl}`);
        return { type, filename: promptData.filename, url: videoUrl };
      } else {
        throw new Error('No output URL in response');
      }
    } else if (completed.status === 'failed') {
      throw new Error(`Prediction failed: ${completed.error}`);
    } else {
      throw new Error(`Prediction timeout after ${attempts * 5}s`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🎥 KEALEE HERO VIDEO GENERATION');
  console.log('='.repeat(60));
  console.log(`Using Replicate Kling 2.5 API`);
  console.log(`Videos: 8s duration, 16:9 aspect, 4K quality\n`);

  const results = [];

  for (const [type, promptData] of Object.entries(videoPrompts)) {
    const result = await generateVideo(type, promptData);
    if (result) results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📝 ENVIRONMENT VARIABLES');
  console.log('='.repeat(60));
  console.log('\nAdd these to apps/web-main/.env.local:\n');

  results.forEach(r => {
    const envKey = `NEXT_PUBLIC_HERO_VIDEO_${r.type.toUpperCase()}`;
    console.log(`${envKey}=${r.url}`);
  });

  if (results.length > 0) {
    // Also write to a temp file for easy copy/paste
    const envContent = results
      .map(r => `NEXT_PUBLIC_HERO_VIDEO_${r.type.toUpperCase()}=${r.url}`)
      .join('\n');

    fs.writeFileSync('.env-hero-videos', envContent);
    console.log('\n✅ Environment variables saved to: .env-hero-videos');
    console.log('   Copy these into apps/web-main/.env.local');
  }

  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
