/**
 * Parcel Service — CRUD operations for parcels, zoning, assessments, offers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type ParcelStatus =
  | 'IDENTIFIED' | 'UNDER_ANALYSIS' | 'OFFER_PENDING' | 'UNDER_CONTRACT'
  | 'DUE_DILIGENCE' | 'ACQUIRED' | 'CONVERTED' | 'REJECTED' | 'ARCHIVED';

export const parcelService = {
  // ── Parcel CRUD ──────────────────────────────────────────────

  async createParcel(data: {
    orgId: string;
    label: string;
    parcelNumber?: string;
    legalDesc?: string;
    address?: string;
    city?: string;
    county?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
    acreage?: number;
    currentUse?: string;
    currentOwner?: string;
    identifiedBy?: string;
  }) {
    return prisma.parcel.create({
      data: {
        orgId: data.orgId,
        label: data.label,
        parcelNumber: data.parcelNumber,
        legalDesc: data.legalDesc,
        address: data.address,
        city: data.city,
        county: data.county,
        state: data.state,
        zipCode: data.zipCode,
        latitude: data.latitude,
        longitude: data.longitude,
        acreage: data.acreage,
        currentUse: data.currentUse,
        currentOwner: data.currentOwner,
        identifiedBy: data.identifiedBy,
        status: 'IDENTIFIED',
      },
      include: { zoning: true, assessments: true },
    });
  },

  async getParcel(id: string) {
    return prisma.parcel.findUnique({
      where: { id },
      include: {
        zoning: true,
        assessments: true,
        comparables: true,
        documents: true,
        notes: { orderBy: { createdAt: 'desc' } },
        offers: { orderBy: { offerDate: 'desc' } },
      },
    });
  },

  async listParcels(orgId: string, options?: {
    status?: ParcelStatus;
    state?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { orgId };
    if (options?.status) where.status = options.status;
    if (options?.state) where.state = options.state;

    const [parcels, total] = await Promise.all([
      prisma.parcel.findMany({
        where,
        include: { zoning: true },
        orderBy: { updatedAt: 'desc' },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      prisma.parcel.count({ where }),
    ]);

    return { parcels, total };
  },

  async updateParcel(id: string, data: Record<string, unknown>) {
    return prisma.parcel.update({
      where: { id },
      data: data as any,
      include: { zoning: true, assessments: true },
    });
  },

  async updateParcelStatus(id: string, status: ParcelStatus) {
    return prisma.parcel.update({
      where: { id },
      data: { status },
    });
  },

  // ── Zoning Analysis ────────────────────────────────────────

  async addZoning(parcelId: string, data: {
    zoningCode: string;
    zoningDesc?: string;
    overlay?: string;
    jurisdiction?: string;
    maxDensity?: number;
    maxHeight?: number;
    maxFAR?: number;
    maxLotCoverage?: number;
    frontSetback?: number;
    sideSetback?: number;
    rearSetback?: number;
    allowedUses?: string[];
    conditionalUses?: string[];
    prohibitedUses?: string[];
    parkingRatio?: number;
    sourceUrl?: string;
  }) {
    return prisma.parcelZoning.create({
      data: {
        parcelId,
        zoningCode: data.zoningCode,
        zoningDesc: data.zoningDesc,
        overlay: data.overlay,
        jurisdiction: data.jurisdiction,
        maxDensity: data.maxDensity,
        maxHeight: data.maxHeight,
        maxFAR: data.maxFAR,
        maxLotCoverage: data.maxLotCoverage,
        frontSetback: data.frontSetback,
        sideSetback: data.sideSetback,
        rearSetback: data.rearSetback,
        allowedUses: data.allowedUses ?? [],
        conditionalUses: data.conditionalUses ?? [],
        prohibitedUses: data.prohibitedUses ?? [],
        parkingRatio: data.parkingRatio,
        sourceUrl: data.sourceUrl,
      },
    });
  },

  // ── Site Assessments ───────────────────────────────────────

  async createAssessment(parcelId: string, data: {
    assessmentType: string;
    title?: string;
    description?: string;
    vendorName?: string;
    estimatedCost?: number;
  }) {
    return prisma.siteAssessment.create({
      data: {
        parcelId,
        assessmentType: data.assessmentType as any,
        title: data.title,
        description: data.description,
        vendorName: data.vendorName,
        estimatedCost: data.estimatedCost,
        status: 'NOT_STARTED',
      },
    });
  },

  async updateAssessment(id: string, data: Record<string, unknown>) {
    return prisma.siteAssessment.update({
      where: { id },
      data: data as any,
    });
  },

  // ── Comparables ────────────────────────────────────────────

  async addComparable(parcelId: string, data: {
    address?: string;
    saleDate?: Date;
    salePrice?: number;
    pricePerSqFt?: number;
    pricePerAcre?: number;
    acreage?: number;
    zoningCode?: string;
    distanceMiles?: number;
    similarity?: number;
    sourceUrl?: string;
    notes?: string;
  }) {
    return prisma.parcelComparable.create({
      data: { parcelId, ...data } as any,
    });
  },

  // ── Documents ──────────────────────────────────────────────

  async addDocument(parcelId: string, data: {
    documentType: string;
    title: string;
    description?: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    uploadedBy?: string;
  }) {
    return prisma.parcelDocument.create({
      data: { parcelId, ...data },
    });
  },

  // ── Notes ──────────────────────────────────────────────────

  async addNote(parcelId: string, data: {
    content: string;
    authorId: string;
    authorName?: string;
    isPinned?: boolean;
  }) {
    return prisma.parcelNote.create({
      data: { parcelId, ...data },
    });
  },

  // ── Offers ─────────────────────────────────────────────────

  async createOffer(parcelId: string, data: {
    offerAmount: number;
    earnestMoney?: number;
    expirationDate?: Date;
    ddPeriodDays?: number;
    notes?: string;
    createdBy?: string;
  }) {
    // Update parcel status
    await prisma.parcel.update({
      where: { id: parcelId },
      data: { status: 'OFFER_PENDING' },
    });

    return prisma.landOffer.create({
      data: {
        parcelId,
        offerAmount: data.offerAmount,
        earnestMoney: data.earnestMoney,
        expirationDate: data.expirationDate,
        ddPeriodDays: data.ddPeriodDays,
        notes: data.notes,
        createdBy: data.createdBy,
        status: 'DRAFT',
      },
    });
  },

  async updateOfferStatus(id: string, status: string, data?: Record<string, unknown>) {
    return prisma.landOffer.update({
      where: { id },
      data: { status, ...data } as any,
    });
  },

  // ── Conversion to Project ──────────────────────────────────

  async convertToProject(parcelId: string, projectData: {
    name: string;
    orgId: string;
    ownerId: string;
    description?: string;
  }) {
    const parcel = await prisma.parcel.findUniqueOrThrow({
      where: { id: parcelId },
    });

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        orgId: projectData.orgId,
        ownerId: projectData.ownerId,
        description: projectData.description,
        address: parcel.address,
        city: parcel.city,
        state: parcel.state,
        zipCode: parcel.zipCode,
        latitude: parcel.latitude,
        longitude: parcel.longitude,
        status: 'ACTIVE',
      },
    });

    // Update parcel as converted
    await prisma.parcel.update({
      where: { id: parcelId },
      data: {
        status: 'CONVERTED',
        projectId: project.id,
      },
    });

    return project;
  },

  // ── Development Scoring ────────────────────────────────────

  async calculateDevelopmentScore(parcelId: string): Promise<number> {
    const parcel = await prisma.parcel.findUniqueOrThrow({
      where: { id: parcelId },
      include: { zoning: true, assessments: true },
    });

    let score = 50; // Base score

    // Zoning factors
    if (parcel.zoning.length > 0) {
      const zoning = parcel.zoning[0];
      if (zoning.maxDensity && zoning.maxDensity > 20) score += 10;
      if (zoning.maxHeight && zoning.maxHeight > 40) score += 5;
      if (zoning.allowedUses.length > 3) score += 5;
      score += 5; // Has zoning data
    }

    // Assessment factors
    const completedAssessments = parcel.assessments.filter(
      (a: any) => a.status === 'COMPLETED' || a.status === 'CLEARED'
    );
    score += Math.min(completedAssessments.length * 5, 15);

    // Flagged assessments reduce score
    const flaggedAssessments = parcel.assessments.filter((a: any) => a.status === 'FLAGGED');
    score -= flaggedAssessments.length * 10;

    // Location data
    if (parcel.latitude && parcel.longitude) score += 5;
    if (parcel.acreage) score += 5;

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Update parcel with score
    await prisma.parcel.update({
      where: { id: parcelId },
      data: {
        developmentScore: score,
        scoringFactors: {
          zoningData: parcel.zoning.length > 0,
          completedAssessments: completedAssessments.length,
          flaggedAssessments: flaggedAssessments.length,
          hasLocation: !!(parcel.latitude && parcel.longitude),
          hasAcreage: !!parcel.acreage,
        },
      },
    });

    return score;
  },
};
