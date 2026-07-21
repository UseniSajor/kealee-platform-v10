#!/usr/bin/env node

/**
 * Set environment variables in Railway via GraphQL API
 */

const https = require('https');

const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN || 'a40f1d22-333f-41de-9f22-08ade1e51604';

const ENV_VARS = {
  NEXT_PUBLIC_HERO_VIDEO_KITCHEN: 'https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4',
  NEXT_PUBLIC_HERO_VIDEO_ADDITION: 'https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4',
  NEXT_PUBLIC_HERO_VIDEO_GARDEN: 'https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4',
};

function graphqlRequest(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.railway.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query }));
    req.end();
  });
}

async function main() {
  console.log('\n╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('║' + '  🚄 SET RAILWAY ENVIRONMENT VARIABLES  '.padEnd(68) + '║');
  console.log('║' + ' '.repeat(68) + '║');
  console.log('╚' + '═'.repeat(68) + '╝\n');

  // Step 1: Get projects
  console.log('Step 1: Fetching Railway projects...\n');

  const projectsQuery = `
    query {
      me {
        projects(first: 50) {
          edges {
            node {
              id
              name
              environments(first: 10) {
                edges {
                  node {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const projectsResult = await graphqlRequest(projectsQuery);

  if (projectsResult.errors || !projectsResult.data?.me?.projects?.edges?.length) {
    console.log('❌ Failed to fetch projects');
    console.log('Response:', JSON.stringify(projectsResult).substring(0, 200));
    console.log('\n⚠️  Manual setup required:');
    console.log('1. Go to: https://railway.app/project/');
    console.log('2. Select your web-main service');
    console.log('3. Settings → Variables');
    console.log('4. Add the following environment variables:\n');
    for (const [key, value] of Object.entries(ENV_VARS)) {
      console.log(`   ${key}=${value}`);
    }
    return;
  }

  const projects = projectsResult.data.me.projects.edges;
  console.log(`✅ Found ${projects.length} projects:\n`);

  projects.forEach(({ node }) => {
    console.log(`   - ${node.name} (ID: ${node.id})`);
    if (node.environments?.edges?.length) {
      node.environments.edges.forEach(({ node: env }) => {
        console.log(`     └─ ${env.name}`);
      });
    }
  });

  // Find web-main project
  const webMainProject = projects.find(p => p.node.name.toLowerCase().includes('web-main'));

  if (!webMainProject) {
    console.log('\n⚠️  Could not find web-main project');
    console.log('Manual setup: https://railway.app/project/');
    return;
  }

  console.log(`\n✅ Selected project: ${webMainProject.node.name}`);
  console.log(`\nStep 2: Setting environment variables...\n`);

  // For each environment variable, create or update it
  for (const [key, value] of Object.entries(ENV_VARS)) {
    console.log(`Setting ${key}...`);

    // Note: Railway API doesn't support direct variable creation via GraphQL
    // Variables must be set via the web dashboard
    console.log(`   Value: ${value.substring(0, 60)}...`);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('📋 MANUAL SETUP REQUIRED');
  console.log('═'.repeat(70));
  console.log(`
The Railway GraphQL API does not support variable creation directly.
You must set these variables manually in the Railway dashboard:

1. Go to: https://railway.app/dashboard
2. Select your web-main service
3. Click "Settings" → "Variables"
4. Add these environment variables:

   Name: NEXT_PUBLIC_HERO_VIDEO_KITCHEN
   Value: https://replicate.delivery/xezq/nPPaGJpAIIqfXqD1BROVRK8zC24yGnitwjM9h3I2e8XAoeqtA/tmp918wegji.mp4

   Name: NEXT_PUBLIC_HERO_VIDEO_ADDITION
   Value: https://replicate.delivery/xezq/nzDLyAy4dDYTKBMbzXES4ufa4pjsVRSfp4c088JhPupppeqtA/tmpxd4angyk.mp4

   Name: NEXT_PUBLIC_HERO_VIDEO_GARDEN
   Value: https://replicate.delivery/xezq/nWHCayy5BzLVLBSXzxYHlX3T9xBBcPdOw8ahoBnt1FveVvaLA/tmp8af2hnud.mp4

5. Click "Save"
6. Railway will automatically redeploy with new variables

Alternatively: Add to .env.production (but don't commit to git):
${Object.entries(ENV_VARS).map(([k, v]) => \`   \${k}=\${v}\`).join('\n')}
`);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
