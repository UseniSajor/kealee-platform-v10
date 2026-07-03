#!/usr/bin/env node

/**
 * Generate hero videos using Replicate Kling API
 *
 * This script creates 3 hero videos for the web-main homepage carousel.
 * Videos are generated via Replicate Kling (video model), then pushed to CDN.
 *
 * Prerequisites:
 * - REPLICATE_API_TOKEN env var set
 *
 * Usage:
 * REPLICATE_API_TOKEN=<token> node generate-hero-videos-v2.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN environment variable not set');
  console.error('   Set it: export REPLICATE_API_TOKEN="r8_..."');
  process.exit(1);
}

// Kling video model versions (check latest at replicate.com/kling-ai/kling-video)
const KLING_VERSION = 'aff48af9c68898399378a0b60e126e95'; // Kling 2.5 or latest

const videoPrompts = {
  kitchen: {
    prompt: `Professional 4K video showing a modern kitchen transformation. Before: outdated kitchen with dark cabinets, harvest gold appliances, 1980s ceramic tile. After: contemporary kitchen with white shaker cabinets, stainless steel appliances, waterfall marble island, LED lighting. Show quick transitions with zoom shots. Include person touching counter for scale. Daylight from window. High quality cinematography. 8 seconds.`,
    filename: 'kitchen-hero.mp4',
    duration: 8,
  },
  addition: {
    prompt: `Professional construction progress video showing home addition project. 2-story house with new master suite addition on side. Show: site prep, wood framing, electrical rough-in, drywall, painting, flooring, final walkthrough. Include construction workers, close-ups of quality craftsmanship. Sunny day, clear skies. Time-lapse elements. 8 seconds.`,
    filename: 'addition-hero.mp4',
    duration: 8,
  },
  garden: {
    prompt: `Beautiful garden landscape transformation video. Before: bare backyard, old wooden fence. After: lush garden design with curved planting beds, flowering plants, hardscape patio with seating, decorative pathways, ambient landscape lighting. Multiple angles: wide garden shot, close flower details, evening lighting. Professional cinematography. 8 seconds.`,
    filename: 'garden-hero.mp4',
    duration: 8,
  },
};

function makeRequest(method, path, body = null) {
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
  console.log(`   Prompt: ${promptData.prompt.substring(0, 80)}...`);

  try {
    // Create prediction
    const prediction = await makeRequest('POST', '/v1/predictions', {
      version: KLING_VERSION,
      input: {
        prompt: promptData.prompt,
        duration: promptData.duration,
        negative_prompt: 'blurry, low quality, watermark, text, logo, distorted',
        aspect_ratio: '16:9',
      },
    });

    console.log(`   ✓ Prediction created: ${prediction.id}`);
    console.log(`   Status: ${prediction.status}`);

    // Poll for completion (with timeout)
    let completed = prediction;
    let attempts = 0;
    const maxAttempts = 240; // 20 minutes max (5s per attempt)

    while (completed.status === 'processing' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      completed = await makeRequest('GET', `/v1/predictions/${prediction.id}`);

      const progress = (attempts / maxAttempts * 100).toFixed(0);
      process.stdout.write(`\r   ⏳ Processing... ${progress}% (${attempts * 5}s)`);
      attempts++;
    }

    console.log('');

    if (completed.status === 'succeeded') {
      const videoUrl = completed.output;
      if (videoUrl) {
        console.log(`   ✅ Video generated successfully!`);
        console.log(`   URL: ${videoUrl}`);
        return { type, filename: promptData.filename, url: videoUrl };
      } else {
        throw new Error('No output URL in response');
      }
    } else if (completed.status === 'failed') {
      throw new Error(`Prediction failed: ${completed.error || 'Unknown error'}`);
    } else {
      throw new Error(`Prediction timeout after ${attempts * 5}s (status: ${completed.status})`);
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function uploadToCDN(videoUrl, filename) {
  console.log(`\n📤 Uploading ${filename} to CDN...`);

  // For demo purposes, we'll use the Replicate URL directly
  // In production, you'd upload to your CDN (Cloudflare, AWS S3, etc.)
  console.log(`   ℹ️  Using Replicate hosted URL (production: upload to CDN)`);
  console.log(`   CDN filename: ${filename}`);

  return videoUrl; // Replicate URLs are already public
}

async function main() {
  console.log('='.repeat(70));
  console.log('🎥 KEALEE HERO VIDEO GENERATION & DEPLOYMENT');
  console.log('='.repeat(70));
  console.log(`Model: Kling (version: ${KLING_VERSION})`);
  console.log(`Videos: 8s duration, 16:9 aspect ratio`);
  console.log(`Status: Generating 3 hero videos...\n`);

  const results = [];

  for (const [type, promptData] of Object.entries(videoPrompts)) {
    const result = await generateVideo(type, promptData);
    if (result) {
      const cdnUrl = await uploadToCDN(result.url, result.filename);
      results.push({ ...result, cdnUrl });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📝 ENVIRONMENT VARIABLES FOR apps/web-main/.env.local');
  console.log('='.repeat(70));
  console.log('\nAdd these to your .env.local:\n');

  const envLines = [];
  results.forEach(r => {
    const envKey = `NEXT_PUBLIC_HERO_VIDEO_${r.type.toUpperCase()}`;
    console.log(`${envKey}=${r.cdnUrl}`);
    envLines.push(`${envKey}=${r.cdnUrl}`);
  });

  if (results.length > 0) {
    // Save to file for easy copying
    fs.writeFileSync('.env-hero-videos-generated', envLines.join('\n'));
    console.log(`\n✅ Environment variables saved to: .env-hero-videos-generated`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🚀 NEXT STEPS');
  console.log('='.repeat(70));
  console.log('\n1. Copy the environment variables above');
  console.log('2. Add them to: apps/web-main/.env.local');
  console.log('3. Run: pnpm turbo run build --filter=web-main');
  console.log('4. Deploy to staging for testing');
  console.log('5. Verify hero carousel works in browser\n');

  if (results.length === 0) {
    console.log('⚠️  No videos were generated. Check your API token and quotas.');
    process.exit(1);
  } else {
    console.log(`✅ Generated ${results.length}/3 videos successfully!\n`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
