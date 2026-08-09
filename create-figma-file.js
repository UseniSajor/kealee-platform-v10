#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.argv[2] || process.env.FIGMA_TOKEN || 'FIGMA_TOKEN_REDACTED';

const client = axios.create({
  baseURL: FIGMA_API_BASE,
  headers: {
    'X-Figma-Token': FIGMA_TOKEN,
    'Content-Type': 'application/json',
  },
});

async function createFigmaFile() {
  try {
    console.log('🚀 Creating Kealee Platform Design File...\n');

    // First, try to get user info to validate token
    console.log('📋 Validating token...');
    try {
      const userRes = await client.get('/me');
      console.log('✅ Token validated\n');
    } catch (err) {
      console.log('⚠️  Token check returned:', err.message);
    }

    // For now, we'll create a file directly using a team ID placeholder
    // Most Figma accounts have at least one team
    console.log('📁 Creating design file...');
    
    const teamId = process.argv[3] || '';
    const fileRes = await client.post('/files', {
      name: 'Kealee Platform Design System v2026',
      team_id: teamId,
    }).catch(async (err) => {
      // If that fails, try alternative endpoint
      console.log('Trying alternative API endpoint...');
      const fallbackTeamId = teamId || '0';
      return client.post(`/teams/${fallbackTeamId}/files`, {
        name: 'Kealee Platform Design System v2026',
      });
    });

    const fileId = fileRes.data.file.key;
    console.log(`✅ File created: ${fileRes.data.file.name}`);
    console.log(`📍 File ID: ${fileId}`);
    console.log(`🔗 URL: https://www.figma.com/file/${fileId}/`);

    // Save file ID
    const config = {
      fileId,
      fileName: fileRes.data.file.name,
      token: FIGMA_TOKEN,
      createdAt: new Date().toISOString(),
      setupStatus: 'ready',
    };

    fs.writeFileSync('.figma-config.json', JSON.stringify(config, null, 2));
    console.log(`\n✅ Config saved`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 FIGMA FILE READY');
    console.log('='.repeat(60));
    console.log(`\n✅ Setup with:`);
    console.log(`node figma-setup-script.js ${fileId} ${FIGMA_TOKEN}\n`);

    return fileId;
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nNote: The Figma API token may be limited or expired.');
    console.error('For now, please:');
    console.error('1. Create a file manually in Figma');
    console.error('2. Get the FILE_ID from the URL: https://www.figma.com/file/FILE_ID/...');
    console.error('3. Run: node figma-setup-script.js FILE_ID FIGMA_TOKEN_REDACTED');
    process.exit(1);
  }
}

createFigmaFile();
