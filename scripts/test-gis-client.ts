/**
 * scripts/test-gis-client.ts
 *
 * Smoke test script to verify the geocoder and municipal ArcGIS REST queries.
 *
 * Usage:
 *   npx tsx scripts/test-gis-client.ts
 */

import { getJurisdictionGisData, geocodeAddress, determineJurisdictionFromAddress } from '../packages/spatial-engine/src/gis-client';

async function runTests() {
  console.log('🧪 Running Live GIS Client Queries & Geocoder Tests...\n');

  // 1. Test Geocoding & Jurisdiction Resolution
  console.log('--- 1. Testing Address Geocoding & Jurisdiction Matching ---');
  const addressCases = [
    {
      address: '1350 Pennsylvania Avenue NW, Washington, D.C.',
      expectedJurisdiction: 'dc',
    },
    {
      address: '101 Monroe St, Rockville, MD 20850',
      expectedJurisdiction: 'montgomery_md',
    },
    {
      address: '2100 Clarendon Blvd, Arlington, VA 22201',
      expectedJurisdiction: 'arlington_va',
    },
    {
      address: '12000 Government Center Pkwy, Fairfax, VA 22035',
      expectedJurisdiction: 'fairfax_va',
    },
  ];

  for (const tc of addressCases) {
    const coords = await geocodeAddress(tc.address);
    if (coords) {
      const jur = determineJurisdictionFromAddress(tc.address, tc.address);
      console.log(`  ✓ Address: "${tc.address}"`);
      console.log(`    Coords: Lat ${coords.lat}, Lng ${coords.lng}`);
      console.log(`    Jurisdiction: ${jur} (Expected: ${tc.expectedJurisdiction})`);
      if (jur === tc.expectedJurisdiction) {
        console.log('    Status: ✅ Match');
      } else {
        console.error('    Status: ❌ Mismatch');
      }
    } else {
      console.error(`  ✗ Address failed to geocode: "${tc.address}"`);
    }
    console.log();
  }

  // 2. Test Live ArcGIS REST Queries
  console.log('--- 2. Testing Live Municipal ArcGIS Queries ---');
  const liveQueries = [
    '1350 Pennsylvania Avenue NW, Washington, D.C. 20004', // Wilson Building
    '101 Monroe St, Rockville, MD 20850', // Rockville Govt
    '2100 Clarendon Blvd, Arlington, VA 22201', // Arlington Govt
    '12000 Government Center Pkwy, Fairfax, VA 22035', // Fairfax Govt
  ];

  for (const address of liveQueries) {
    console.log(`🔍 Querying: "${address}"...`);
    try {
      const start = Date.now();
      const gisData = await getJurisdictionGisData(address);
      const duration = Date.now() - start;

      if (gisData) {
        console.log(`  Result: ✅ Found in ${duration}ms`);
        console.log(`  Jurisdiction:   ${gisData.jurisdictionName}`);
        console.log(`  Zoning Class:   ${gisData.zoningClass}`);
        console.log(`  Zoning Authority: ${gisData.zoningAuthority}`);
        console.log(`  Parcel ID:      ${gisData.parcelId ?? 'N/A'}`);
        console.log(`  Map URL:        ${gisData.zoningMapUrl}`);
      } else {
        console.warn(`  Result: ⚠️ Geocoded but zoning query failed (outside of covered GIS boundaries)`);
      }
    } catch (error) {
      console.error(`  Result: ❌ Query failed with error:`, error);
    }
    console.log();
  }

  console.log('Tests run completed.');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
