#!/usr/bin/env node

/**
 * Generate 3 construction sequence videos (15 seconds each)
 * Using Seedance 2.0 with construction order, no duplicate frames
 */

const https = require('https');
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const SEEDANCE_VERSION = 'a6dcbae88b153e75fcccabacfb0eb430ab5be0a7ae27b316fc6f983658b349bc';

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

async function generateConstructionVideo(prompt, type) {
  console.log(`\n📹 ${type.toUpperCase()}`);

  try {
    // Create prediction with Seedance 2.0 (15 seconds, construction order)
    const response = await httpRequest('POST', 'https://api.replicate.com/v1/predictions', {
      version: SEEDANCE_VERSION,
      input: {
        prompt: prompt,
        duration: 15,
        aspect_ratio: '16:9',
        resolution: '720p',
        generate_audio: true,
      },
    });

    console.log(`   Status: ${response.status}`);

    if (response.status !== 201) {
      const errMsg = response.data?.detail || response.body || 'Unknown error';
      console.log(`   Error: ${typeof errMsg === 'string' ? errMsg.substring(0, 150) : JSON.stringify(errMsg).substring(0, 150)}`);
      return null;
    }

    const predictionId = response.data.id;
    console.log(`   ✓ Prediction: ${predictionId}`);

    // Poll for completion
    let prediction = response.data;
    let attempts = 0;
    const maxAttempts = 540; // 45 minutes (longer for 15-second videos)

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
  console.log('║' + '  🎬 GENERATING CONSTRUCTION SEQUENCE VIDEOS (15 SEC)  '.padEnd(68) + '║');
  console.log('║' + '  Seedance 2.0 - Construction order, no duplicate frames  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  const videos = {
    kitchen_construction: `Professional time-lapse construction sequence for kitchen renovation.

CONSTRUCTION ORDER (chronological, unique frames at each stage):
1. DEMOLITION (0-2 sec): Old cabinets and appliances removed, counters demolished, tiles removed. Dust and debris. Multiple camera angles of destruction progress.
2. FRAMING & ROUGH (2-5 sec): Empty kitchen shell, electrical wiring installed, plumbing rough-in visible. Workers measuring and installing new framing.
3. INSTALLATION (5-10 sec): New white shaker cabinets being installed one by one, stainless steel appliances delivered and positioned, marble countertop installation in progress.
4. FINISHING (10-13 sec): Backsplash tiles being installed, LED lighting fixtures installed and powered on, final paint touch-ups, hardware being added to cabinets.
5. COMPLETION (13-15 sec): Final walkthrough, marble waterfall island with accent lighting glowing, finished kitchen in full operation, designer and homeowner inspecting results.

Each phase shows clear progression with NO DUPLICATE FRAMES. Duration: 15 seconds, 16:9, construction lighting, professional quality.`,

    addition_construction: `Professional time-lapse home addition construction progress over 15 seconds.

CONSTRUCTION ORDER (unique frames, clear progression):
1. SITE PREP (0-2 sec): Bare lot with surveying marks, equipment arriving, foundation area being cleared and leveled. Multiple angles of site preparation.
2. FOUNDATION & FRAMING (2-5 sec): Concrete foundation being poured and cured, wooden frame going up, 2-story structure taking shape, multiple workers on site.
3. ROOF & ENCLOSURE (5-8 sec): Roof trusses installed, sheathing applied, windows and doors installed, exterior walls being wrapped and sealed. Building envelope complete.
4. SYSTEMS & MEP (8-11 sec): Electrical wiring rough-in visible in wall cavities, HVAC ducts installed, plumbing runs visible, drywall crew beginning wall installation.
5. FINISH WORK (11-14 sec): Drywall taped and mudded, interior paint applied, fixtures installed, hardwood flooring being laid, trim and doors installed.
6. FINAL WALKTHROUGH (14-15 sec): Fully completed master suite addition, professional photography of finished space, homeowner approval inspection.

15 seconds, 16:9 aspect ratio, construction site lighting, no duplicate frames or recycled shots.`,

    garden_construction: `Professional garden landscaping transformation sequence - 15 seconds from bare yard to finished garden.

CONSTRUCTION ORDER (chronological, unique frames):
1. SITE ASSESSMENT (0-2 sec): Bare backyard with old wooden fence, overgrown weeds, dead grass. Landscapers measuring and marking areas. Multiple camera positions.
2. DEMOLITION & PREP (2-4 sec): Old fence being dismantled, old concrete removed, sod stripped away, soil being turned and amended. Dumpster with debris visible.
3. HARDSCAPE INSTALLATION (4-8 sec): Permeable paver patio being laid stone by stone, decorative stepping path installation, retaining walls being built, proper drainage visible being installed.
4. PLANTING PHASE (8-12 sec): Mature shrubs and small trees being planted with proper depth and spacing, flower beds filled with premium soil, perennials and annuals being positioned and planted, workers applying mulch and compost.
5. FINISHING TOUCHES (12-15 sec): Ambient landscape lighting being installed and tested (lights glowing in evening), final hardscape details added, garden furniture positioned on patio, water feature activated showing gentle flow.

Final frame: Lush completed garden with mature plants, evening ambient lighting creating warm atmosphere, professional finished landscape, empty patio chairs inviting relaxation.

15 seconds, 4K-quality lighting, sunset/evening sequence, every frame shows clear progression with no repeated images.`,
  };

  const results = {};

  for (const [type, prompt] of Object.entries(videos)) {
    const url = await generateConstructionVideo(prompt, type);
    if (url) results[type] = url;
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 CONSTRUCTION VIDEO GENERATION SUMMARY');
  console.log('═'.repeat(70));

  if (Object.keys(results).length === 3) {
    console.log(`\n✅ ALL 3 CONSTRUCTION VIDEOS GENERATED SUCCESSFULLY\n`);
    for (const [type, url] of Object.entries(results)) {
      console.log(`${type.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`  ${url}\n`);
    }
    console.log('✅ Ready for storage and deployment');
    return results;
  } else {
    console.log(`\n⚠️  Generated ${Object.keys(results).length}/3 videos\n`);
    for (const [type, url] of Object.entries(results)) {
      console.log(`${type}: ${url}`);
    }
    return results;
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
