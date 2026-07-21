/**
 * test-env-vars.js
 * Test environment variable loading across all apps
 */

const apps = [
  { name: 'Marketplace', url: 'https://marketplace.kealee.com' },
  { name: 'Admin', url: 'https://admin.kealee.com' },
  { name: 'PM', url: 'https://pm.kealee.com' },
  { name: 'Ops Services', url: 'https://ops.kealee.com' },
  { name: 'Project Owner', url: 'https://projects.kealee.com' },
  { name: 'Architect', url: 'https://architect.kealee.com' },
  { name: 'Permits', url: 'https://permits.kealee.com' }
];

async function testEnvVars() {
  console.log('🧪 Testing environment variable loading...\n');
  
  const results = [];
  
  for (const app of apps) {
    try {
      const response = await fetch(`${app.url}/api/env-test`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${app.name} (${app.url}): Environment variables loaded`);
        
        // Check for critical variables
        const criticalVars = ['NODE_ENV', 'APP_NAME'];
        const missing = criticalVars.filter(varName => !data[varName]);
        
        if (missing.length > 0) {
          console.warn(`   ⚠️  Missing critical variables: ${missing.join(', ')}`);
        }
        
        // Check for app-specific requirements
        if (app.name === 'Ops Services') {
          if (!data.hasStripeSecret || !data.hasStripeWebhookSecret) {
            console.warn(`   ⚠️  Missing Stripe configuration`);
          }
        }
        
        if (!data.hasDatabaseUrl) {
          console.warn(`   ⚠️  Missing DATABASE_URL`);
        }
        
        results.push({ app: app.name, status: 'success', data });
      } else {
        const errorText = await response.text();
        console.error(`❌ ${app.name} (${app.url}): HTTP ${response.status}`);
        console.error(`   Error: ${errorText.substring(0, 100)}`);
        results.push({ app: app.name, status: 'error', error: `HTTP ${response.status}` });
      }
    } catch (error) {
      console.error(`❌ ${app.name} (${app.url}): Failed to test - ${error.message}`);
      results.push({ app: app.name, status: 'error', error: error.message });
    }
  }
  
  console.log('\n📊 Summary:');
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  console.log(`   ✅ Successful: ${successCount}/${apps.length}`);
  console.log(`   ❌ Failed: ${errorCount}/${apps.length}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some apps failed. Check:');
    console.log('   1. Apps are deployed and accessible');
    console.log('   2. /api/env-test endpoint exists');
    console.log('   3. Environment variables are configured in Vercel');
    process.exit(1);
  } else {
    console.log('\n✅ All apps passed environment variable tests!');
    process.exit(0);
  }
}

// Handle fetch for Node.js < 18
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js 18+ required for fetch API');
  console.log('   Install: node --version (should be 18+)');
  console.log('   Or use: node --experimental-fetch test-env-vars.js');
  process.exit(1);
}

testEnvVars().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
