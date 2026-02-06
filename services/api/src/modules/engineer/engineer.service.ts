/**
 * Engineering Services Module
 *
 * Provides backend services for m-engineer app including:
 * - Service quotes and pricing
 * - Project management
 * - Engineer assignment
 * - Deliverable tracking
 * - Payment processing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Engineering service types
export type EngineeringDiscipline = 'STRUCTURAL' | 'MEP' | 'CIVIL' | 'GEOTECHNICAL';
export type EngineeringPackageTier = 'BASIC_REVIEW' | 'STANDARD_DESIGN' | 'PREMIUM_SERVICE' | 'ENTERPRISE';
export type EngineeringProjectStatus =
  | 'QUOTE_REQUESTED'
  | 'QUOTE_SENT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_RECEIVED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'UNDER_REVIEW'
  | 'REVISIONS_REQUESTED'
  | 'COMPLETED'
  | 'DELIVERED';

// Pricing configuration
export const ENGINEERING_PACKAGE_FEES: Record<EngineeringPackageTier, number> = {
  BASIC_REVIEW: 1500,
  STANDARD_DESIGN: 4500,
  PREMIUM_SERVICE: 12000,
  ENTERPRISE: 0, // Custom pricing
};

export const ENGINEERING_DISCIPLINE_BASE_FEES: Record<EngineeringDiscipline, number> = {
  STRUCTURAL: 1500,
  MEP: 2000,
  CIVIL: 2500,
  GEOTECHNICAL: 1800,
};

export const PLATFORM_COMMISSION_RATE = 0.03; // 3% (per SOP v2 Section 1.3)

// Turnaround times in days
export const TURNAROUND_TIMES: Record<EngineeringPackageTier, { min: number; max: number }> = {
  BASIC_REVIEW: { min: 7, max: 10 },
  STANDARD_DESIGN: { min: 5, max: 7 },
  PREMIUM_SERVICE: { min: 3, max: 5 },
  ENTERPRISE: { min: 1, max: 3 },
};

// Interfaces
export interface EngineeringQuoteRequest {
  userId: string;
  projectName: string;
  projectDescription: string;
  disciplines: EngineeringDiscipline[];
  packageTier: EngineeringPackageTier;
  address?: string;
  squareFootage?: number;
  projectType?: string; // residential, commercial, industrial
  urgency?: 'STANDARD' | 'RUSH' | 'EMERGENCY';
  attachments?: string[];
}

export interface EngineeringQuote {
  id: string;
  basePrice: number;
  platformFee: number;
  totalPrice: number;
  turnaroundDays: { min: number; max: number };
  disciplines: EngineeringDiscipline[];
  packageTier: EngineeringPackageTier;
  validUntil: Date;
}

export interface EngineeringProject {
  id: string;
  userId: string;
  projectName: string;
  status: EngineeringProjectStatus;
  disciplines: EngineeringDiscipline[];
  packageTier: EngineeringPackageTier;
  assignedEngineerId?: string;
  totalPrice: number;
  platformFee: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  deliverables?: EngineeringDeliverable[];
}

export interface EngineeringDeliverable {
  id: string;
  projectId: string;
  name: string;
  type: 'STAMPED_DRAWINGS' | 'CALCULATIONS' | 'REPORT' | 'SPECIFICATIONS';
  fileUrl?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';
  createdAt: Date;
}

/**
 * Calculate quote for engineering services
 */
export async function calculateQuote(request: EngineeringQuoteRequest): Promise<EngineeringQuote> {
  let basePrice = ENGINEERING_PACKAGE_FEES[request.packageTier];

  // For enterprise, calculate based on disciplines
  if (request.packageTier === 'ENTERPRISE' || basePrice === 0) {
    basePrice = request.disciplines.reduce((total, discipline) => {
      return total + ENGINEERING_DISCIPLINE_BASE_FEES[discipline] * 2; // Enterprise multiplier
    }, 0);
  }

  // Add discipline-specific pricing for multi-discipline projects
  if (request.disciplines.length > 1 && request.packageTier !== 'ENTERPRISE') {
    const additionalDisciplineFee = request.disciplines.slice(1).reduce((total, discipline) => {
      return total + ENGINEERING_DISCIPLINE_BASE_FEES[discipline] * 0.75; // 75% for additional disciplines
    }, 0);
    basePrice += additionalDisciplineFee;
  }

  // Rush fee
  if (request.urgency === 'RUSH') {
    basePrice *= 1.5; // 50% rush fee
  } else if (request.urgency === 'EMERGENCY') {
    basePrice *= 2; // 100% emergency fee
  }

  // Square footage adjustment for larger projects
  if (request.squareFootage && request.squareFootage > 5000) {
    const sqftMultiplier = 1 + (request.squareFootage - 5000) / 10000 * 0.5;
    basePrice *= Math.min(sqftMultiplier, 2); // Cap at 2x
  }

  const platformFee = Math.round(basePrice * PLATFORM_COMMISSION_RATE);
  const totalPrice = basePrice; // Platform fee is included in base price

  const turnaround = TURNAROUND_TIMES[request.packageTier];

  return {
    id: `quote_${Date.now()}`,
    basePrice,
    platformFee,
    totalPrice,
    turnaroundDays: turnaround,
    disciplines: request.disciplines,
    packageTier: request.packageTier,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
}

/**
 * Create engineering project after payment
 */
export async function createEngineeringProject(
  userId: string,
  quoteId: string,
  projectDetails: Partial<EngineeringQuoteRequest>
): Promise<EngineeringProject> {
  // In real implementation, fetch quote from database
  const quote = await calculateQuote({
    userId,
    projectName: projectDetails.projectName || 'Engineering Project',
    projectDescription: projectDetails.projectDescription || '',
    disciplines: projectDetails.disciplines || ['STRUCTURAL'],
    packageTier: projectDetails.packageTier || 'STANDARD_DESIGN',
  });

  const turnaround = TURNAROUND_TIMES[quote.packageTier];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + turnaround.max);

  const project: EngineeringProject = {
    id: `eng_proj_${Date.now()}`,
    userId,
    projectName: projectDetails.projectName || 'Engineering Project',
    status: 'PENDING_PAYMENT',
    disciplines: quote.disciplines,
    packageTier: quote.packageTier,
    totalPrice: quote.totalPrice,
    platformFee: quote.platformFee,
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate,
  };

  // Store in database (simplified for now)
  // await prisma.engineeringProject.create({ data: project });

  return project;
}

/**
 * Update project status after payment
 */
export async function markProjectPaid(projectId: string): Promise<EngineeringProject> {
  // In real implementation:
  // const project = await prisma.engineeringProject.update({
  //   where: { id: projectId },
  //   data: { paymentStatus: 'PAID', status: 'PAYMENT_RECEIVED' }
  // });

  return {
    id: projectId,
    userId: 'user_123',
    projectName: 'Project',
    status: 'PAYMENT_RECEIVED',
    disciplines: ['STRUCTURAL'],
    packageTier: 'STANDARD_DESIGN',
    totalPrice: 4500,
    platformFee: 135,
    paymentStatus: 'PAID',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Assign engineer to project
 */
export async function assignEngineer(
  projectId: string,
  engineerId: string
): Promise<EngineeringProject> {
  return {
    id: projectId,
    userId: 'user_123',
    projectName: 'Project',
    status: 'ASSIGNED',
    disciplines: ['STRUCTURAL'],
    packageTier: 'STANDARD_DESIGN',
    assignedEngineerId: engineerId,
    totalPrice: 4500,
    platformFee: 135,
    paymentStatus: 'PAID',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Update project progress
 */
export async function updateProjectStatus(
  projectId: string,
  status: EngineeringProjectStatus
): Promise<EngineeringProject> {
  const completedAt = status === 'COMPLETED' ? new Date() : undefined;

  return {
    id: projectId,
    userId: 'user_123',
    projectName: 'Project',
    status,
    disciplines: ['STRUCTURAL'],
    packageTier: 'STANDARD_DESIGN',
    totalPrice: 4500,
    platformFee: 158,
    paymentStatus: 'PAID',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt,
  };
}

/**
 * Add deliverable to project
 */
export async function addDeliverable(
  projectId: string,
  deliverable: Omit<EngineeringDeliverable, 'id' | 'createdAt'>
): Promise<EngineeringDeliverable> {
  return {
    id: `del_${Date.now()}`,
    projectId,
    name: deliverable.name,
    type: deliverable.type,
    fileUrl: deliverable.fileUrl,
    status: deliverable.status,
    createdAt: new Date(),
  };
}

/**
 * Get user's engineering projects
 */
export async function getUserProjects(userId: string): Promise<EngineeringProject[]> {
  // In real implementation:
  // return prisma.engineeringProject.findMany({
  //   where: { userId },
  //   orderBy: { createdAt: 'desc' }
  // });

  return [];
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string): Promise<EngineeringProject | null> {
  // In real implementation:
  // return prisma.engineeringProject.findUnique({
  //   where: { id: projectId },
  //   include: { deliverables: true }
  // });

  return null;
}

/**
 * Get available engineers for a discipline
 */
export async function getAvailableEngineers(discipline: EngineeringDiscipline): Promise<any[]> {
  // In real implementation, query engineers table
  return [
    { id: 'eng_1', name: 'John Smith, PE', discipline, availability: 'HIGH' },
    { id: 'eng_2', name: 'Sarah Chen, PE', discipline, availability: 'MEDIUM' },
  ];
}

/**
 * Calculate engineer payout (after platform fee)
 */
export function calculateEngineerPayout(totalPrice: number): {
  platformFee: number;
  engineerPayout: number;
} {
  const platformFee = Math.round(totalPrice * PLATFORM_COMMISSION_RATE);
  const engineerPayout = totalPrice - platformFee;

  return { platformFee, engineerPayout };
}
