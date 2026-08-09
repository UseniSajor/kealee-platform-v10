/**
 * Verification script for intake tier configuration
 * Run: node __tests__/verify-tiers.js
 */

const coreRules = require('@kealee/core-rules');

function formatPrice(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

function testServiceTiers(serviceName, intakePath) {
  const tiers = coreRules.INTAKE_TIER_PRICE_CENTS[intakePath];

  if (!tiers) {
    console.error(`❌ No tier pricing found for ${intakePath}`);
    return false;
  }

  console.log(`\n📦 ${serviceName}`);
  console.log(`   Intake path: ${intakePath}`);

  let allValid = true;

  for (let tierNum = 1; tierNum <= 3; tierNum++) {
    const tier = tiers[tierNum];
    if (!tier) {
      console.error(`   ❌ Tier ${tierNum} missing`);
      allValid = false;
      continue;
    }

    const tierLabel = tier.label;
    const tierPrice = formatPrice(tier.cents);
    const delivery = tier.deliveryDays;

    // Validate label
    const expectedTierName = tierNum === 1 ? 'Basic' : tierNum === 2 ? 'Premium' : 'Premium+';
    if (!tierLabel.includes(expectedTierName)) {
      console.error(`   ❌ Tier ${tierNum} label incorrect: ${tierLabel}`);
      allValid = false;
    }

    console.log(`   ✅ Tier ${tierNum} (${expectedTierName}): ${tierPrice} — ${delivery}`);
  }

  // Verify pricing progression
  const t1 = tiers[1]?.cents || 0;
  const t2 = tiers[2]?.cents || 0;
  const t3 = tiers[3]?.cents || 0;

  if (t1 >= t2 || t2 >= t3) {
    console.error(`   ❌ Price progression invalid: ${formatPrice(t1)} → ${formatPrice(t2)} → ${formatPrice(t3)}`);
    allValid = false;
  }

  return allValid;
}

console.log('='.repeat(60));
console.log('🧪 INTAKE TIER VERIFICATION TEST');
console.log('='.repeat(60));

const services = [
  ['Kitchen Remodel', 'kitchen_remodel'],
  ['Bathroom Remodel', 'bathroom_remodel'],
  ['Garden & Landscape', 'garden_concept'],
  ['Home Addition', 'addition_expansion'],
  ['Whole Home Concept', 'whole_home_concept'],
  ['Interior Renovation', 'interior_renovation'],
  ['Exterior Concept', 'exterior_concept'],
];

let allPassed = true;
services.forEach(([name, path]) => {
  const passed = testServiceTiers(name, path);
  if (!passed) allPassed = false;
});

console.log('\n' + '='.repeat(60));

if (allPassed) {
  console.log('✅ ALL TIER TESTS PASSED');
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}

console.log('='.repeat(60));

// Summary statistics
console.log('\n📊 TIER STATISTICS:');
const allTiers = Object.entries(coreRules.INTAKE_TIER_PRICE_CENTS);
const servicesWithTiers = allTiers.filter(([_, t]) => t && t[1] && t[2] && t[3]).length;

console.log(`   Services with all 3 tiers: ${servicesWithTiers}`);
console.log(`   Total tier configurations: ${allTiers.reduce((sum, [_, t]) => {
  return sum + Object.keys(t || {}).length;
}, 0)}`);
