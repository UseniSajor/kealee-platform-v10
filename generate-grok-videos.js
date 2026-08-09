#!/usr/bin/env node

/**
 * Generate 3 construction videos with xai/grok-imagine-video
 * 15 seconds each, construction order, no duplicate frames
 */

const https = require('https');
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;
const GROK_VERSION = 'ec05ebf490fb5db7e17e73c456e80cb1242d4df8ade9bd7300c66ea2108288bc';

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

async function generateGrokVideo(prompt, type) {
  console.log(`\n📹 ${type.toUpperCase()}`);

  try {
    // Create prediction with Grok Imagine Video
    const response = await httpRequest('POST', 'https://api.replicate.com/v1/predictions', {
      version: GROK_VERSION,
      input: {
        prompt: prompt,
        duration: 15,
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
    const maxAttempts = 720; // 60 minutes for Grok Imagine (slower model)

    while ((prediction.status === 'processing' || prediction.status === 'starting') && attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await httpRequest('GET', `https://api.replicate.com/v1/predictions/${predictionId}`);
      prediction = pollRes.data;
      process.stdout.write(`\r   ⏳ Status: ${prediction.status} (${Math.floor(attempts * 5 / 60)}m ${(attempts * 5) % 60}s)`);
      attempts++;
    }

    console.log('');

    if (prediction.status === 'succeeded' && prediction.output) {
      const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      console.log(`   ✅ Video: ${videoUrl.substring(0, 60)}...`);
      return videoUrl;
    } else {
      console.log(`   ❌ Failed (${prediction.status})`);
      if (prediction.error) console.log(`   Error: ${prediction.error}`);
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
  console.log('║' + '  🎬 GROK IMAGINE VIDEO - CONSTRUCTION SEQUENCES (15 SEC)  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  const videos = {
    kitchen_remodel: `High-quality professional kitchen renovation time-lapse construction video, 15 seconds. STRICT CONSTRUCTION ORDER - NO DUPLICATE FRAMES:

Phase 1 (0-3sec): DEMOLITION - Old 1980s kitchen teardown. Dark oak cabinets being removed, harvest gold appliances pulled out, old tile counters demolished. Dumpster full of debris. Dust clouds. Multiple angles showing complete gutting.

Phase 2 (3-6sec): FRAMING & UTILITIES - Empty kitchen shell revealed. Electrical wires being installed in walls, plumbing pipes rough-in visible, new gas line connections. Workers with tools and blueprints. Fresh drywall going up.

Phase 3 (6-10sec): CABINET & APPLIANCE INSTALLATION - White shaker cabinets installed sequentially, stainless steel refrigerator positioned, slide-in range installed, dishwasher placement. Island frame being built. Each major piece installed once, progression clear.

Phase 4 (10-13sec): COUNTERTOP & BACKSPLASH - Marble countertop slabs positioned and secured, waterfall edge on island prominent. Glass subway tile backsplash being installed behind stove. LED strip lighting installed under cabinets.

Phase 5 (13-15sec): FINAL FINISHES & LIGHTING - Hardware added to cabinets, final paint touches, LED ambient lighting activated showing warm glow, finished kitchen in perfect condition, homeowner approval moment.

Each second shows clear progression. No repeated shots. Professional cinematography. 16:9 aspect ratio.`,

    home_addition: `Professional home addition construction time-lapse video, 15 seconds. CHRONOLOGICAL CONSTRUCTION ORDER - UNIQUE FRAMES ONLY:

Phase 1 (0-3sec): SITE PREP - Empty lot with surveying marks, equipment delivery (excavator, lumber materials), area being cleared and leveled. Foundation outline marked. Aerial and ground angles of blank slate.

Phase 2 (3-6sec): FOUNDATION & FRAMING - Concrete foundation being poured, forms and concrete curing visible. Wooden 2-story frame going up, trusses being installed. Structure takes shape rapidly. Every frame shows new progress.

Phase 3 (6-9sec): ROOF & ENCLOSURE - Roof sheathing applied, rafters complete, windows and doors installed in sequence, exterior wall wrapping being applied. Building envelope sealed and complete.

Phase 4 (9-12sec): MEP SYSTEMS & DRYWALL - Electrical rough-in in wall cavities (visible wiring), HVAC ductwork installation, plumbing visible in walls, drywall installation beginning, mudding and taping progression.

Phase 5 (12-15sec): FINISH & COMPLETION - Interior paint applied, hardwood flooring installed, trim and baseboard installation, door hardware added, final walkthrough of completed master suite addition with professional lighting.

15 seconds total. No frame recycled. Clear construction progression. Professional time-lapse cinema.`,

    garden_landscaping: `Professional garden landscaping transformation, 15 seconds. SEQUENTIAL INSTALLATION - NO DUPLICATE IMAGES:

Phase 1 (0-2.5sec): SITE ASSESSMENT & DEMOLITION - Old bare backyard, wooden fence partially visible, overgrown areas marked, old fence boards being removed, concrete patio being demolished with pneumatic tools. Debris heap growing.

Phase 2 (2.5-5sec): SOIL PREP - Ground being leveled and graded, old soil removed, premium soil and compost being delivered and spread, amended soil being turned and prepared. Drainage layout visible.

Phase 3 (5-9sec): HARDSCAPE - Permeable paver stones being individually laid in curved patio pattern, decorative stepping stones placed in garden beds, retaining wall built with natural stone, each piece positioned methodically, no frame repeated.

Phase 4 (9-12sec): PLANTING - Mature ornamental trees planted with proper depth, flowering shrubs positioned and planted, perennials and annuals going into prepared beds one by one, mulch and soil around each plant, watering visible.

Phase 5 (12-15sec): LIGHTING & FINISHING - Landscape LED lights installed along pathways, accent lighting on trees powered on creating warm glow, garden seating arranged on finished patio, evening ambiance created, lush mature plants in evening soft light.

Every second advances the project. No recycled footage. 15-second complete transformation from bare to finished garden. Professional lighting cinematography.`,
  };

  const results = {};

  for (const [type, prompt] of Object.entries(videos)) {
    const url = await generateGrokVideo(prompt, type);
    if (url) results[type] = url;
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📊 GROK IMAGINE VIDEO SUMMARY');
  console.log('═'.repeat(70));

  if (Object.keys(results).length === 3) {
    console.log(`\n✅ ALL 3 GROK VIDEOS GENERATED (15 SECONDS EACH)\n`);
    for (const [type, url] of Object.entries(results)) {
      console.log(`${type.replace(/_/g, ' ').toUpperCase()}`);
      console.log(`  ${url}\n`);
    }
    console.log('✅ Ready for deployment');
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
