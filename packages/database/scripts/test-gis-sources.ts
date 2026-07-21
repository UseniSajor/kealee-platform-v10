#!/usr/bin/env node

/**
 * Quick test to validate free GIS data sources are working
 *
 * Usage: tsx scripts/test-gis-sources.ts [--state <state>] [--county <county>]
 */

import {
  FreeDataSourceAggregator,
  OpenGovSource,
  OpenStreetMapSource,
} from '@kealee/core-llm/data-sources/free-sources';

async function testDataSources() {
  console.log('🧪 Testing GIS Free Data Sources\n');

  // Parse args
  const args = process.argv.slice(2);
  const stateArg = args.includes('--state') ? args[args.indexOf('--state') + 1] : 'MD';
  const countyArg = args.includes('--county') ? args[args.indexOf('--county') + 1] : 'Montgomery';

  try {
    // Test 1: OpenGov jurisdictions
    console.log(`📍 Test 1: Fetching jurisdictions from OpenGov for ${stateArg}...`);
    const jurisdictions = await FreeDataSourceAggregator.fetchJurisdictions(stateArg);
    console.log(`✅ Found ${jurisdictions.length} jurisdictions`);
    console.log(`   Sample: ${jurisdictions.slice(0, 3).map(j => j.name).join(', ')}\n`);

    // Test 2: Parcels from free sources
    console.log(`🏠 Test 2: Fetching parcels for ${stateArg} / ${countyArg}...`);
    const parcels = await FreeDataSourceAggregator.fetchParcels(stateArg, countyArg, {
      limit: 10, // Just 10 for testing
    });
    console.log(`✅ Found ${parcels.length} parcels`);

    if (parcels.length > 0) {
      const sample = parcels[0];
      console.log(`   Sample parcel:
    - Address: ${sample.address}
    - Coordinates: ${sample.coordinates?.lat}, ${sample.coordinates?.lng}
    - SqFt: ${sample.sqft}
    - Zoning: ${sample.zoning}\n`);
    }

    // Test 3: Boundary data
    console.log(`🗺️  Test 3: Fetching boundary data for ${stateArg}...`);
    const boundaries = await FreeDataSourceAggregator.fetchBoundaries(stateArg);
    console.log(`✅ Boundary data retrieved (type: ${boundaries?.type})\n`);

    console.log('✨ All tests passed! Free data sources are operational.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error testing data sources:', error);
    process.exit(1);
  }
}

testDataSources();
