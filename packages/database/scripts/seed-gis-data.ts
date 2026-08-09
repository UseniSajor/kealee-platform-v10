#!/usr/bin/env node

/**
 * GIS DATA SEEDING SCRIPT
 * Populates jurisdiction, parcel, and zoning data from free sources
 *
 * Usage:
 *   npm run seed:gis               # Seed all states
 *   npm run seed:gis -- --state CA # Seed California only
 *   npm run seed:gis -- --state CA --county "San Francisco"
 */

import { prisma } from '@kealee/database';
import {
  FreeDataSourceAggregator,
  CountyAssessorSource,
  OpenGovSource,
  OpenStreetMapSource,
} from '@kealee/core-llm/data-sources/free-sources';

// Parse CLI arguments
const args = process.argv.slice(2);
const stateArg = args.includes('--state') ? args[args.indexOf('--state') + 1] : null;
const countyArg = args.includes('--county') ? args[args.indexOf('--county') + 1] : null;

const STATES = stateArg ? [stateArg] : [
  'DC', 'MD', 'VA', 'CA', 'TX', 'NY', 'FL', 'PA', 'IL', 'OH',
];

const COUNTIES_BY_STATE: Record<string, string[]> = {
  // DMV TIER - ALL FREE (Priority 1)
  DC: ['District of Columbia'],

  MD: [
    // Baltimore & DMV Core
    'Baltimore City', 'Baltimore', 'Montgomery', 'Prince George\'s', 'Anne Arundel',
    // DC Suburbs
    'Howard', 'Carroll', 'Harford',
    // Rest of Maryland (ALL have free data)
    'Frederick', 'Washington', 'Allegany', 'Wicomico', 'Somerset', 'Dorchester', 'Talbot',
  ],

  VA: [
    // Northern Virginia/DMV Core
    'Fairfax', 'Arlington', 'Alexandria', 'Loudoun', 'Prince William', 'Stafford',
    // Piedmont/Shenandoah Valley (ALL have free data)
    'Fauquier', 'Clarke', 'Frederick', 'Shenandoah', 'Warren', 'Page', 'Rappahannock',
  ],

  // CALIFORNIA
  CA: [
    'San Francisco', 'Los Angeles', 'San Diego', 'Alameda', 'Santa Clara', 'Marin',
    'Sacramento', 'Sonoma', 'Contra Costa', 'Kern', 'Fresno', 'San Bernardino',
  ],

  // TEXAS
  TX: [
    'Travis', 'Dallas', 'Harris', 'Bexar', 'Tarrant', 'Williamson', 'Denton',
    'Jefferson', 'Nueces', 'Collin', 'Galveston', 'Montgomery',
  ],

  // NEW YORK
  NY: [
    'New York', 'Kings', 'Queens', 'Bronx', 'Richmond', 'Westchester', 'Nassau',
  ],
};

interface SeedingStats {
  state: string;
  jurisdictionsCreated: number;
  jurisdictionsUpdated: number;
  parcelsCreated: number;
  parcelsUpdated: number;
  errors: Array<{ county: string; error: string }>;
  duration: number;
}

async function seedState(state: string): Promise<SeedingStats> {
  const startTime = Date.now();
  const stats: SeedingStats = {
    state,
    jurisdictionsCreated: 0,
    jurisdictionsUpdated: 0,
    parcelsCreated: 0,
    parcelsUpdated: 0,
    errors: [],
    duration: 0,
  };

  console.log(`\n🌱 Seeding ${state}...`);

  try {
    // Step 1: Fetch and seed jurisdictions
    console.log(`  📍 Fetching jurisdictions from OpenGov...`);
    const jurisdictions = await FreeDataSourceAggregator.fetchJurisdictions(state);

    for (const jurisdiction of jurisdictions) {
      try {
        const result = await prisma.jurisdiction.upsert({
          where: { code: jurisdiction.code },
          create: {
            name: jurisdiction.name,
            code: jurisdiction.code,
            state: jurisdiction.state,
            county: jurisdiction.county,
            type: jurisdiction.type,
            isActive: true,
          },
          update: {
            isActive: true,
          },
        });

        if (result.createdAt === result.updatedAt) {
          stats.jurisdictionsCreated++;
        } else {
          stats.jurisdictionsUpdated++;
        }
      } catch (error) {
        console.error(`    ❌ Failed to upsert jurisdiction ${jurisdiction.code}:`, error);
        stats.errors.push({
          county: jurisdiction.county || state,
          error: `Jurisdiction: ${(error as Error).message}`,
        });
      }
    }

    // Step 2: Fetch and seed parcels for major counties
    const counties = countyArg
      ? [countyArg]
      : (COUNTIES_BY_STATE[state] || []);

    for (const county of counties) {
      try {
        console.log(`  🏠 Fetching parcels for ${county}...`);
        const parcels = await FreeDataSourceAggregator.fetchParcels(state, county, {
          limit: 5000, // Limit to 5K per county in seeding
        });

        // Find jurisdiction ID
        const jurisdiction = await prisma.jurisdiction.findFirst({
          where: {
            state,
            county,
          },
        });

        if (!jurisdiction) {
          console.warn(`    ⚠️  No jurisdiction found for ${county}`);
          continue;
        }

        for (const parcel of parcels) {
          try {
            const addressHash = Buffer.from(parcel.address).toString('hex').slice(0, 16);
            const result = await prisma.parcel.upsert({
              where: {
                address_county_state: {
                  address: parcel.address,
                  county,
                  state,
                },
              },
              create: {
                address: parcel.address,
                county,
                state,
                jurisdictionId: jurisdiction.id,
                metadata: {
                  source: 'free_data_source',
                  coordinates: parcel.coordinates,
                  sqft: parcel.sqft,
                  zoning: parcel.zoning,
                },
              },
              update: {
                metadata: {
                  source: 'free_data_source',
                  coordinates: parcel.coordinates,
                  sqft: parcel.sqft,
                  zoning: parcel.zoning,
                },
              },
            });

            if (result.createdAt === result.updatedAt) {
              stats.parcelsCreated++;
            } else {
              stats.parcelsUpdated++;
            }
          } catch (error) {
            // Skip individual parcel errors and continue
            if ((error as any).code !== 'P2002') {
              console.error(`    ❌ Parcel upsert failed:`, error);
            }
          }
        }

        console.log(`    ✅ Processed ${parcels.length} parcels for ${county}`);
      } catch (error) {
        console.error(`  ❌ Error processing county ${county}:`, error);
        stats.errors.push({
          county,
          error: `County parcels: ${(error as Error).message}`,
        });
      }
    }
  } catch (error) {
    console.error(`❌ Error seeding state ${state}:`, error);
    stats.errors.push({
      county: 'state_level',
      error: (error as Error).message,
    });
  }

  stats.duration = Date.now() - startTime;
  return stats;
}

async function main() {
  console.log('🌍 GIS DATA SEEDING SCRIPT');
  console.log('========================\n');
  console.log(`Targets: ${STATES.join(', ')}`);
  console.log(`Using FREE sources only (County Assessor, OpenGov, OpenStreetMap)`);
  console.log(`\nNote: Paid providers (ESRI, Mapbox, Zillow, Pitney Bowes, Moody's)`);
  console.log(`can be enabled by setting environment variables.`);
  console.log('\n');

  const allStats: SeedingStats[] = [];

  for (const state of STATES) {
    try {
      const stats = await seedState(state);
      allStats.push(stats);

      console.log(`\n✅ ${state} Complete:`);
      console.log(`   - Jurisdictions: ${stats.jurisdictionsCreated} created, ${stats.jurisdictionsUpdated} updated`);
      console.log(`   - Parcels: ${stats.parcelsCreated} created, ${stats.parcelsUpdated} updated`);
      console.log(`   - Errors: ${stats.errors.length}`);
      console.log(`   - Duration: ${(stats.duration / 1000).toFixed(2)}s`);
    } catch (error) {
      console.error(`\n❌ Failed to seed ${state}:`, error);
    }
  }

  // Summary
  console.log('\n\n📊 SEEDING SUMMARY');
  console.log('==================');
  console.log(`Total jurisdictions: ${allStats.reduce((sum, s) => sum + s.jurisdictionsCreated + s.jurisdictionsUpdated, 0)}`);
  console.log(`Total parcels: ${allStats.reduce((sum, s) => sum + s.parcelsCreated + s.parcelsUpdated, 0)}`);
  console.log(`Total errors: ${allStats.reduce((sum, s) => sum + s.errors.length, 0)}`);
  console.log(`Total time: ${(allStats.reduce((sum, s) => sum + s.duration, 0) / 1000).toFixed(2)}s`);

  await prisma.$disconnect();
  process.exit(allStats.every(s => s.errors.length === 0) ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
