/**
 * OS-Land Parcel Service Tests
 * Tests CRUD operations, zoning analysis, project conversion, development scoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock PrismaClient ────────────────────────────────────────

const mockPrisma = {
  parcel: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  parcelZoning: {
    create: vi.fn(),
  },
  siteAssessment: {
    create: vi.fn(),
    update: vi.fn(),
  },
  parcelComparable: {
    create: vi.fn(),
  },
  parcelDocument: {
    create: vi.fn(),
  },
  parcelNote: {
    create: vi.fn(),
  },
  landOffer: {
    create: vi.fn(),
    update: vi.fn(),
  },
  project: {
    create: vi.fn(),
  },
};

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

// Import after mock
import { parcelService } from '../parcel.service';

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createParcel ─────────────────────────────────────────────

describe('parcelService.createParcel', () => {
  it('creates a parcel with IDENTIFIED status and includes zoning/assessments', async () => {
    const input = {
      orgId: 'org_001',
      label: 'Downtown Lot A',
      parcelNumber: 'APN-12345',
      legalDesc: 'Lot 5, Block 2, Downtown Addition',
      address: '123 Main St',
      city: 'Austin',
      county: 'Travis',
      state: 'TX',
      zipCode: '78701',
      latitude: 30.2672,
      longitude: -97.7431,
      acreage: 2.5,
      currentUse: 'Vacant',
      currentOwner: 'City of Austin',
      identifiedBy: 'user_001',
    };

    const mockParcel = {
      id: 'parcel_001',
      ...input,
      status: 'IDENTIFIED',
      zoning: [],
      assessments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockPrisma.parcel.create.mockResolvedValue(mockParcel);

    const result = await parcelService.createParcel(input);

    expect(result).toEqual(mockParcel);
    expect(result.status).toBe('IDENTIFIED');

    expect(mockPrisma.parcel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org_001',
        label: 'Downtown Lot A',
        parcelNumber: 'APN-12345',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        latitude: 30.2672,
        longitude: -97.7431,
        acreage: 2.5,
        status: 'IDENTIFIED',
      }),
      include: { zoning: true, assessments: true },
    });
  });

  it('creates a parcel with only required fields', async () => {
    const input = { orgId: 'org_002', label: 'Rural Parcel' };

    mockPrisma.parcel.create.mockResolvedValue({
      id: 'parcel_002',
      orgId: 'org_002',
      label: 'Rural Parcel',
      status: 'IDENTIFIED',
      zoning: [],
      assessments: [],
    });

    const result = await parcelService.createParcel(input);

    expect(result.status).toBe('IDENTIFIED');
    expect(mockPrisma.parcel.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orgId: 'org_002',
        label: 'Rural Parcel',
        status: 'IDENTIFIED',
        parcelNumber: undefined,
        address: undefined,
      }),
      include: { zoning: true, assessments: true },
    });
  });
});

// ── addZoning ────────────────────────────────────────────────

describe('parcelService.addZoning', () => {
  it('adds zoning analysis with all fields', async () => {
    const zoningData = {
      zoningCode: 'CBD-2',
      zoningDesc: 'Central Business District, Sub-Area 2',
      overlay: 'Historic Preservation',
      jurisdiction: 'City of Austin',
      maxDensity: 60,
      maxHeight: 120,
      maxFAR: 8.0,
      maxLotCoverage: 100,
      frontSetback: 0,
      sideSetback: 0,
      rearSetback: 10,
      allowedUses: ['Office', 'Retail', 'Residential', 'Mixed-Use'],
      conditionalUses: ['Hotel', 'Entertainment'],
      prohibitedUses: ['Heavy Industrial'],
      parkingRatio: 1.5,
      sourceUrl: 'https://austin.gov/zoning/cbd-2',
    };

    const mockZoning = {
      id: 'zoning_001',
      parcelId: 'parcel_001',
      ...zoningData,
      createdAt: new Date(),
    };

    mockPrisma.parcelZoning.create.mockResolvedValue(mockZoning);

    const result = await parcelService.addZoning('parcel_001', zoningData);

    expect(result).toEqual(mockZoning);
    expect(mockPrisma.parcelZoning.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parcelId: 'parcel_001',
        zoningCode: 'CBD-2',
        maxDensity: 60,
        maxHeight: 120,
        allowedUses: ['Office', 'Retail', 'Residential', 'Mixed-Use'],
        conditionalUses: ['Hotel', 'Entertainment'],
        prohibitedUses: ['Heavy Industrial'],
      }),
    });
  });

  it('defaults array fields to empty arrays when not provided', async () => {
    const zoningData = {
      zoningCode: 'R-1',
      zoningDesc: 'Single Family Residential',
    };

    mockPrisma.parcelZoning.create.mockResolvedValue({
      id: 'zoning_002',
      parcelId: 'parcel_002',
      ...zoningData,
      allowedUses: [],
      conditionalUses: [],
      prohibitedUses: [],
    });

    await parcelService.addZoning('parcel_002', zoningData);

    expect(mockPrisma.parcelZoning.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        allowedUses: [],
        conditionalUses: [],
        prohibitedUses: [],
      }),
    });
  });
});

// ── convertToProject ─────────────────────────────────────────

describe('parcelService.convertToProject', () => {
  it('creates a project from parcel and marks parcel as CONVERTED', async () => {
    const mockParcel = {
      id: 'parcel_100',
      orgId: 'org_001',
      label: 'Downtown Lot',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      latitude: 30.2672,
      longitude: -97.7431,
      status: 'ACQUIRED',
    };

    const mockProject = {
      id: 'proj_new_001',
      name: 'Downtown Tower',
      orgId: 'org_001',
      ownerId: 'user_001',
      description: 'Mixed-use downtown development',
      address: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      latitude: 30.2672,
      longitude: -97.7431,
      status: 'ACTIVE',
    };

    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue(mockParcel);
    mockPrisma.project.create.mockResolvedValue(mockProject);
    mockPrisma.parcel.update.mockResolvedValue({
      ...mockParcel,
      status: 'CONVERTED',
      projectId: 'proj_new_001',
    });

    const result = await parcelService.convertToProject('parcel_100', {
      name: 'Downtown Tower',
      orgId: 'org_001',
      ownerId: 'user_001',
      description: 'Mixed-use downtown development',
    });

    expect(result).toEqual(mockProject);

    // Verify project was created with parcel's location data
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Downtown Tower',
        orgId: 'org_001',
        ownerId: 'user_001',
        description: 'Mixed-use downtown development',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        latitude: 30.2672,
        longitude: -97.7431,
        status: 'ACTIVE',
      }),
    });

    // Verify parcel was marked as CONVERTED with project link
    expect(mockPrisma.parcel.update).toHaveBeenCalledWith({
      where: { id: 'parcel_100' },
      data: {
        status: 'CONVERTED',
        projectId: 'proj_new_001',
      },
    });
  });

  it('propagates parcel location fields to the new project', async () => {
    const mockParcel = {
      id: 'parcel_101',
      address: '456 Oak Ave',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      latitude: 32.7767,
      longitude: -96.7970,
    };

    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue(mockParcel);
    mockPrisma.project.create.mockResolvedValue({ id: 'proj_002' });
    mockPrisma.parcel.update.mockResolvedValue({});

    await parcelService.convertToProject('parcel_101', {
      name: 'Oak Ave Project',
      orgId: 'org_001',
      ownerId: 'user_001',
    });

    const createCall = mockPrisma.project.create.mock.calls[0][0];
    expect(createCall.data.address).toBe('456 Oak Ave');
    expect(createCall.data.city).toBe('Dallas');
    expect(createCall.data.latitude).toBe(32.7767);
    expect(createCall.data.longitude).toBe(-96.7970);
  });

  it('throws when parcel not found', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockRejectedValue(
      new Error('No Parcel found'),
    );

    await expect(
      parcelService.convertToProject('nonexistent', {
        name: 'Test',
        orgId: 'org_001',
        ownerId: 'user_001',
      }),
    ).rejects.toThrow('No Parcel found');

    expect(mockPrisma.project.create).not.toHaveBeenCalled();
  });
});

// ── calculateDevelopmentScore ─────────────────────────────────

describe('parcelService.calculateDevelopmentScore', () => {
  it('returns base score of 50 for parcel with no zoning or assessments', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_200',
      zoning: [],
      assessments: [],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_200');

    expect(score).toBe(50);
  });

  it('adds points for having zoning data', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_201',
      zoning: [{
        maxDensity: 10, // Not > 20, no density bonus
        maxHeight: 30,  // Not > 40, no height bonus
        allowedUses: ['Residential', 'Office'], // Not > 3, no use bonus
      }],
      assessments: [],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_201');

    // Base 50 + 5 (has zoning data) = 55
    expect(score).toBe(55);
  });

  it('adds full zoning bonuses for high-density, tall, multi-use zoning', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_202',
      zoning: [{
        maxDensity: 30,  // > 20: +10
        maxHeight: 60,   // > 40: +5
        allowedUses: ['Office', 'Retail', 'Residential', 'Mixed-Use'], // > 3: +5
      }],
      assessments: [],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_202');

    // Base 50 + 10 (density) + 5 (height) + 5 (uses) + 5 (has zoning) = 75
    expect(score).toBe(75);
  });

  it('adds points for completed/cleared assessments (capped at 15)', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_203',
      zoning: [],
      assessments: [
        { status: 'COMPLETED' },
        { status: 'CLEARED' },
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },  // 4th completed, but capped at 3*5=15
      ],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_203');

    // Base 50 + min(4*5, 15) = 50 + 15 = 65
    expect(score).toBe(65);
  });

  it('subtracts points for flagged assessments', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_204',
      zoning: [],
      assessments: [
        { status: 'FLAGGED' },
        { status: 'FLAGGED' },
      ],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_204');

    // Base 50 - 2*10 = 30
    expect(score).toBe(30);
  });

  it('adds points for location data and acreage', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_205',
      zoning: [],
      assessments: [],
      latitude: 30.2672,
      longitude: -97.7431,
      acreage: 5.0,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_205');

    // Base 50 + 5 (lat/lng) + 5 (acreage) = 60
    expect(score).toBe(60);
  });

  it('clamps score to 0-100 range', async () => {
    // Create scenario that would go below 0
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_206',
      zoning: [],
      assessments: [
        { status: 'FLAGGED' },
        { status: 'FLAGGED' },
        { status: 'FLAGGED' },
        { status: 'FLAGGED' },
        { status: 'FLAGGED' },
        { status: 'FLAGGED' }, // 6 * -10 = -60 from base 50 = -10 -> clamped to 0
      ],
      latitude: null,
      longitude: null,
      acreage: null,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_206');
    expect(score).toBe(0);
  });

  it('calculates a comprehensive score with all factors', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_207',
      zoning: [{
        maxDensity: 25,  // > 20: +10
        maxHeight: 50,   // > 40: +5
        allowedUses: ['Office', 'Retail', 'Residential', 'Hotel'], // > 3: +5
      }],
      assessments: [
        { status: 'COMPLETED' },
        { status: 'CLEARED' },
        { status: 'FLAGGED' },
      ],
      latitude: 30.2672,
      longitude: -97.7431,
      acreage: 3.0,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    const score = await parcelService.calculateDevelopmentScore('parcel_207');

    // Base 50
    // + 10 (density > 20) + 5 (height > 40) + 5 (uses > 3) + 5 (has zoning) = +25
    // + min(2*5, 15) = +10 (completed assessments)
    // - 1*10 = -10 (flagged)
    // + 5 (has location) + 5 (has acreage) = +10
    // Total: 50 + 25 + 10 - 10 + 10 = 85
    expect(score).toBe(85);
  });

  it('updates the parcel with computed score and scoring factors', async () => {
    mockPrisma.parcel.findUniqueOrThrow.mockResolvedValue({
      id: 'parcel_208',
      zoning: [{ maxDensity: 5, maxHeight: 20, allowedUses: ['Residential'] }],
      assessments: [{ status: 'COMPLETED' }],
      latitude: 30.0,
      longitude: -97.0,
      acreage: 1.5,
    });
    mockPrisma.parcel.update.mockResolvedValue({});

    await parcelService.calculateDevelopmentScore('parcel_208');

    expect(mockPrisma.parcel.update).toHaveBeenCalledWith({
      where: { id: 'parcel_208' },
      data: {
        developmentScore: expect.any(Number),
        scoringFactors: expect.objectContaining({
          zoningData: true,
          completedAssessments: 1,
          flaggedAssessments: 0,
          hasLocation: true,
          hasAcreage: true,
        }),
      },
    });
  });
});

// ── listParcels ──────────────────────────────────────────────

describe('parcelService.listParcels', () => {
  it('lists parcels for an org with default pagination', async () => {
    const mockParcels = [
      { id: 'p1', label: 'Parcel 1', zoning: [] },
      { id: 'p2', label: 'Parcel 2', zoning: [] },
    ];

    mockPrisma.parcel.findMany.mockResolvedValue(mockParcels);
    mockPrisma.parcel.count.mockResolvedValue(2);

    const result = await parcelService.listParcels('org_001');

    expect(result.parcels).toEqual(mockParcels);
    expect(result.total).toBe(2);
    expect(mockPrisma.parcel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org_001' },
        take: 50,
        skip: 0,
      }),
    );
  });

  it('filters by status and state', async () => {
    mockPrisma.parcel.findMany.mockResolvedValue([]);
    mockPrisma.parcel.count.mockResolvedValue(0);

    await parcelService.listParcels('org_001', { status: 'ACQUIRED', state: 'TX' });

    expect(mockPrisma.parcel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orgId: 'org_001', status: 'ACQUIRED', state: 'TX' },
      }),
    );
  });

  it('applies custom limit and offset', async () => {
    mockPrisma.parcel.findMany.mockResolvedValue([]);
    mockPrisma.parcel.count.mockResolvedValue(0);

    await parcelService.listParcels('org_001', { limit: 10, offset: 20 });

    expect(mockPrisma.parcel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 20,
      }),
    );
  });
});

// ── createOffer ──────────────────────────────────────────────

describe('parcelService.createOffer', () => {
  it('creates an offer and updates parcel status to OFFER_PENDING', async () => {
    mockPrisma.parcel.update.mockResolvedValue({ id: 'parcel_300', status: 'OFFER_PENDING' });
    mockPrisma.landOffer.create.mockResolvedValue({
      id: 'offer_001',
      parcelId: 'parcel_300',
      offerAmount: 500000,
      status: 'DRAFT',
    });

    const result = await parcelService.createOffer('parcel_300', {
      offerAmount: 500000,
      earnestMoney: 25000,
      ddPeriodDays: 45,
      notes: 'Initial offer',
      createdBy: 'user_001',
    });

    expect(result.status).toBe('DRAFT');
    expect(result.offerAmount).toBe(500000);

    // Parcel status updated first
    expect(mockPrisma.parcel.update).toHaveBeenCalledWith({
      where: { id: 'parcel_300' },
      data: { status: 'OFFER_PENDING' },
    });

    // Then offer created
    expect(mockPrisma.landOffer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parcelId: 'parcel_300',
        offerAmount: 500000,
        earnestMoney: 25000,
        ddPeriodDays: 45,
        status: 'DRAFT',
      }),
    });
  });
});
