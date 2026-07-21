// packages/shared/src/types/network.ts
// Kealee Network Types

export type ProfessionalType =
  | 'gc'
  | 'specialty_contractor'
  | 'architect'
  | 'engineer'
  | 'supplier'
  | 'owner_developer';

export type Sector =
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'government'
  | 'mixed_use';

export type AvailabilityStatus = 'available' | 'busy' | 'unavailable';

export type VerificationBadge =
  | 'licensed'
  | 'insured'
  | 'background_checked'
  | 'verified'
  | 'preferred';

export interface NetworkProfile {
  id: string;
  slug: string;

  // Business Info
  businessName: string;
  legalName?: string;
  principalName: string;
  type: ProfessionalType;

  // Display
  logo?: string;
  coverPhoto?: string;
  tagline?: string;
  bio?: string;

  // Trades & Specialties
  trades: string[];
  specialties: string[];
  sectors: Sector[];

  // Location
  location: {
    address?: string;
    city: string;
    state: string;
    zip?: string;
    lat?: number;
    lng?: number;
    serviceRadius?: number; // miles
  };
  serviceAreas: string[]; // e.g., ["DC", "MD", "VA"]

  // Ratings & Reviews
  rating: number;
  reviewCount: number;

  // Stats
  stats: {
    projectsCompleted?: number;
    yearsInBusiness?: number;
    responseTime?: string;
    onTimeRate?: string;
    repeatClientRate?: string;
  };

  // Verification
  badges: VerificationBadge[];

  // Availability
  availability: AvailabilityStatus;

  // Membership
  memberSince: string; // ISO date
  lastActive?: string; // ISO date

  // Contact
  email?: string;
  phone?: string;
  website?: string;

  // Social
  socialLinks?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  };
}

export interface NetworkProfileLicense {
  id: string;
  profileId: string;
  type: string;
  number: string;
  state: string;
  expirationDate: string;
  verified: boolean;
}

export interface NetworkProfileInsurance {
  id: string;
  profileId: string;
  type: 'general_liability' | 'workers_comp' | 'professional' | 'auto';
  carrier: string;
  policyNumber?: string;
  coverageAmount: number;
  expirationDate: string;
  verified: boolean;
}

export interface NetworkProfileCertification {
  id: string;
  profileId: string;
  name: string;
  issuingOrg: string;
  issueDate?: string;
  expirationDate?: string;
  verified: boolean;
}

export interface PortfolioProject {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  projectType: string;
  sector: Sector;
  location: string;
  completionDate?: string;
  projectValue?: number;
  images: string[];
  tags: string[];
}

export interface NetworkReview {
  id: string;
  profileId: string;
  reviewerName: string;
  reviewerTitle?: string;
  rating: number;
  title?: string;
  content: string;
  projectType?: string;
  date: string;
  verified: boolean;
  response?: {
    content: string;
    date: string;
  };
}

export interface NetworkService {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  category: string;
  priceType: 'fixed' | 'hourly' | 'project' | 'quote';
  price?: number;
  priceUnit?: string;
}

// Search & Filter Types
export interface NetworkSearchFilters {
  query?: string;
  types?: ProfessionalType[];
  trades?: string[];
  sectors?: Sector[];
  minRating?: number;
  availability?: AvailabilityStatus[];
  serviceArea?: string;
  badges?: VerificationBadge[];
  sortBy?: 'best_match' | 'highest_rated' | 'most_jobs' | 'nearest';
}

export interface NetworkSearchResult {
  profiles: NetworkProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Mock Data Generation Helpers
export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  gc: 'General Contractor',
  specialty_contractor: 'Specialty Contractor',
  architect: 'Architect',
  engineer: 'Engineer',
  supplier: 'Supplier',
  owner_developer: 'Owner/Developer',
};

export const SECTOR_LABELS: Record<Sector, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  government: 'Government',
  mixed_use: 'Mixed-Use',
};

export const VERIFICATION_BADGE_LABELS: Record<VerificationBadge, string> = {
  licensed: 'Licensed',
  insured: 'Insured',
  background_checked: 'Background Checked',
  verified: 'Verified',
  preferred: 'Preferred Partner',
};
