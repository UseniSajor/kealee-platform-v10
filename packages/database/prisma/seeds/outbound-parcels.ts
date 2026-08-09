import { prisma } from '../../src/index';
import { ParcelStatus } from '@prisma/client';


const PARCEL_SEED_DATA = [
  {
    parcelNumber: 'ARL-R6-001',
    label: 'Arlington Residential Lot',
    address: '1420 N Court House Rd',
    city: 'Arlington',
    county: 'Arlington',
    state: 'VA',
    zipCode: '22201',
    latitude: 38.89,
    longitude: -77.09,
    acreage: 0.195,
    squareFeet: 8500,
    currentUse: 'residential',
    currentOwner: 'Robert Davis',
    ownerContact: {
      name: 'Robert Davis',
      phone: '+15715550123',
      email: 'robert.davis@example.com',
      address: '1420 N Court House Rd, Arlington, VA 22201'
    },
    scoringFactors: {
      yearBuilt: 1968,
      lotCoveragePct: 22,
      stories: 1,
      lastSoldDate: '2015-08-23',
      structureSize: 1800,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-6',
      zoningDesc: 'One-Family Dwelling District',
      overlay: 'None',
      maxLotCoverage: 30,
      maxHeight: 35,
      allowedUses: ['single_family', 'accessory_dwelling']
    }
  },
  {
    parcelNumber: 'MC-R90-002',
    label: 'Bethesda Older Single Family',
    address: '8600 Rockville Pike',
    city: 'Bethesda',
    county: 'Montgomery',
    state: 'MD',
    zipCode: '20814',
    latitude: 39.00,
    longitude: -77.10,
    acreage: 0.12,
    squareFeet: 5200,
    currentUse: 'residential',
    currentOwner: 'Elizabeth Smith',
    ownerContact: {
      name: 'Elizabeth Smith',
      phone: '+13015550198',
      email: 'elizabeth.s@example.com',
      address: '8600 Rockville Pike, Bethesda, MD 20814'
    },
    scoringFactors: {
      yearBuilt: 1974,
      lotCoveragePct: 41,
      stories: 2,
      lastSoldDate: '2026-02-01', // Recently sold! Fits Whole-Home / Gut Renovation
      structureSize: 2200,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-90',
      zoningDesc: 'One-Family Residential',
      overlay: 'None',
      maxLotCoverage: 50,
      maxHeight: 40,
      allowedUses: ['single_family']
    }
  },
  {
    parcelNumber: 'MC-R1-003',
    label: 'McLean Outdated Kitchen/Bath',
    address: '1004 Flagstaff Ct',
    city: 'McLean',
    county: 'Fairfax',
    state: 'VA',
    zipCode: '22101',
    latitude: 38.93,
    longitude: -77.18,
    acreage: 0.42,
    squareFeet: 18400,
    currentUse: 'residential',
    currentOwner: 'Thomas Anderson',
    ownerContact: {
      name: 'Thomas Anderson',
      phone: '+17035550177',
      email: 'tanderson@example.com',
      address: '1004 Flagstaff Ct, McLean, VA 22101'
    },
    scoringFactors: {
      yearBuilt: 1978, // Older home, no recent sale. Fits Kitchen/Bath Remodels
      lotCoveragePct: 12,
      stories: 2,
      lastSoldDate: '2012-04-15',
      structureSize: 3200,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-1',
      zoningDesc: 'Residential One Unit per Acre',
      overlay: 'None',
      maxLotCoverage: 20,
      maxHeight: 35,
      allowedUses: ['single_family']
    }
  },
  {
    parcelNumber: 'ARL-R5-004',
    label: 'Arlington Split Level with Basement',
    address: '2100 Wilson Blvd',
    city: 'Arlington',
    county: 'Arlington',
    state: 'VA',
    zipCode: '22201',
    latitude: 38.89,
    longitude: -77.08,
    acreage: 0.287,
    squareFeet: 12500,
    currentUse: 'residential',
    currentOwner: 'Arlington Dev LLC',
    ownerContact: {
      name: 'Arlington Dev LLC',
      phone: '+17035550188',
      email: 'acquisitions@arlingtondev.com',
      address: '4400 Fairfax Dr, Arlington, VA 22203'
    },
    scoringFactors: {
      yearBuilt: 1992,
      lotCoveragePct: 18,
      stories: 2, // 2 stories - fits Basement Renovation
      lastSoldDate: '2018-11-30',
      structureSize: 2800,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-5',
      zoningDesc: 'One-Family Dwelling District',
      overlay: 'None',
      maxLotCoverage: 40,
      maxHeight: 35,
      allowedUses: ['single_family']
    }
  },
  {
    parcelNumber: 'MC-R200-005',
    label: 'Potomac Large Acreage Lot',
    address: '8800 Bradley Blvd',
    city: 'Potomac',
    county: 'Montgomery',
    state: 'MD',
    zipCode: '20854',
    latitude: 39.01,
    longitude: -77.21,
    acreage: 0.505,
    squareFeet: 22000,
    currentUse: 'residential',
    currentOwner: 'Sarah Jenkins',
    ownerContact: {
      name: 'Sarah Jenkins',
      phone: '+13015550299',
      email: 's.jenkins@example.com',
      address: '8800 Bradley Blvd, Potomac, MD 20854'
    },
    scoringFactors: {
      yearBuilt: 1998,
      lotCoveragePct: 15, // Huge backyard, low coverage. Fits Garden/Landscape Design!
      stories: 2,
      lastSoldDate: '2021-06-12',
      structureSize: 4500,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-200',
      zoningDesc: 'One-Family Residential',
      overlay: 'None',
      maxLotCoverage: 25,
      maxHeight: 40,
      allowedUses: ['single_family']
    }
  },
  {
    parcelNumber: 'FFX-R2-006',
    label: 'McLean Vacant / Teardown Lot',
    address: '1100 Chain Bridge Rd',
    city: 'McLean',
    county: 'Fairfax',
    state: 'VA',
    zipCode: '22101',
    latitude: 38.94,
    longitude: -77.17,
    acreage: 0.344,
    squareFeet: 15000,
    currentUse: 'vacant', // Vacant currentUse! Fits New Home Build!
    currentOwner: 'Builders Union LLC',
    ownerContact: {
      name: 'Builders Union LLC',
      phone: '+17035550300',
      email: 'contact@buildersunion.com',
      address: '1200 Old Dominion Dr, McLean, VA 22101'
    },
    scoringFactors: {
      yearBuilt: 1948,
      lotCoveragePct: 4, // Teardown or vacant
      stories: 1,
      lastSoldDate: '2025-10-05',
      structureSize: 600, // Very small structure on 15k sqft lot
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'None'
    },
    zoning: {
      zoningCode: 'R-2',
      zoningDesc: 'Residential Two Units per Acre',
      overlay: 'None',
      maxLotCoverage: 20,
      maxHeight: 35,
      allowedUses: ['single_family']
    }
  },
  {
    parcelNumber: 'DC-MU4-007',
    label: 'Georgetown Historic Rowhouse',
    address: '3200 M St NW',
    city: 'Washington',
    county: 'Washington',
    state: 'DC',
    zipCode: '20007',
    latitude: 38.90,
    longitude: -77.06,
    acreage: 0.071,
    squareFeet: 3100,
    currentUse: 'residential',
    currentOwner: 'James Miller',
    ownerContact: {
      name: 'James Miller',
      phone: '+12025550144',
      email: 'james.miller@example.com',
      address: '1004 Potomac St NW, Washington, DC 20007'
    },
    scoringFactors: {
      yearBuilt: 1912, // Built in 1912! Fits Historic Renovation!
      lotCoveragePct: 78,
      stories: 3,
      lastSoldDate: '2008-09-14',
      structureSize: 2400,
      hasCodeViolations: false,
      hasUnpermittedWork: false,
      overlay: 'Historic Georgetown (HP)'
    },
    zoning: {
      zoningCode: 'MU-4',
      zoningDesc: 'Mixed Use Low Density',
      overlay: 'Historic Georgetown Overlay',
      maxLotCoverage: 80,
      maxHeight: 50,
      allowedUses: ['residential', 'commercial', 'mixed_use']
    }
  },
  {
    parcelNumber: 'FFX-R3-008',
    label: 'Alexandria Riverfront Lot',
    address: '600 Fort Hunt Rd',
    city: 'Alexandria',
    county: 'Fairfax',
    state: 'VA',
    zipCode: '22308',
    latitude: 38.77,
    longitude: -77.06,
    acreage: 0.218,
    squareFeet: 9500,
    currentUse: 'residential',
    currentOwner: 'David Vance',
    ownerContact: {
      name: 'David Vance',
      phone: '+17035550411',
      email: 'david.vance@example.com',
      address: '600 Fort Hunt Rd, Alexandria, VA 22308'
    },
    scoringFactors: {
      yearBuilt: 1988,
      lotCoveragePct: 28,
      stories: 2,
      lastSoldDate: '2020-03-24',
      structureSize: 2600,
      hasCodeViolations: true, // Has code violations or unpermitted work - needs Permit Coordination!
      hasUnpermittedWork: true,
      overlay: 'Chesapeake Bay Resource Protection Area (RPA)' // RPA Overlay requires permit coordination package!
    },
    zoning: {
      zoningCode: 'R-3',
      zoningDesc: 'Residential Three Units per Acre',
      overlay: 'Chesapeake Bay RPA Overlay',
      maxLotCoverage: 35,
      maxHeight: 35,
      allowedUses: ['single_family']
    }
  }
];

async function seed() {
  console.log('🌱 Starting Outbound Property Intelligence Seeding...');

  // 1. Ensure Organization exists
  let org = await prisma.org.findFirst({
    where: { slug: 'kealee-platform' }
  });

  if (!org) {
    org = await prisma.org.create({
      data: {
        name: 'Kealee Platform',
        slug: 'kealee-platform',
        description: 'Outbound target scanning organization'
      }
    });
    console.log(`Created default Org: ${org.name} (${org.id})`);
  } else {
    console.log(`Using existing Org: ${org.name} (${org.id})`);
  }

  // 2. Insert Parcels & Zonings
  for (const item of PARCEL_SEED_DATA) {
    // Delete existing parcel with same parcel number to prevent key conflict
    const existing = await prisma.parcel.findFirst({
      where: { parcelNumber: item.parcelNumber, orgId: org.id }
    });

    if (existing) {
      await prisma.parcel.delete({ where: { id: existing.id } });
    }

    const { zoning, ...parcelData } = item;

    const parcel = await prisma.parcel.create({
      data: {
        orgId: org.id,
        parcelNumber: parcelData.parcelNumber,
        label: parcelData.label,
        address: parcelData.address,
        city: parcelData.city,
        county: parcelData.county,
        state: parcelData.state,
        zipCode: parcelData.zipCode,
        latitude: parcelData.latitude,
        longitude: parcelData.longitude,
        acreage: parcelData.acreage,
        squareFeet: parcelData.squareFeet,
        currentUse: parcelData.currentUse,
        currentOwner: parcelData.currentOwner,
        ownerContact: parcelData.ownerContact as any,
        scoringFactors: parcelData.scoringFactors as any,
        status: ParcelStatus.IDENTIFIED
      }
    });

    await prisma.parcelZoning.create({
      data: {
        parcelId: parcel.id,
        zoningCode: zoning.zoningCode,
        zoningDesc: zoning.zoningDesc,
        overlay: zoning.overlay,
        maxLotCoverage: zoning.maxLotCoverage,
        maxHeight: zoning.maxHeight,
        allowedUses: zoning.allowedUses
      }
    });

    console.log(`✅ Seeded parcel ${parcelData.parcelNumber} (${parcelData.address}) matching: ${parcelData.label}`);
  }

  console.log('🎉 Outbound Property Intelligence Seeding completed successfully.');
}

seed()
  .catch((err) => {
    console.error('Error seeding outbound parcels:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
