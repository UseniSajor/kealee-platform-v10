// packages/shared/src/types/network.ts
// Types for the Kealee Construction Network

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

export interface NetworkProfile {
  id: string;
  slug: string;
  businessName: string;
  principalName?: string;
  type: ProfessionalType;
  typeLabel: string;
  trades: string[];
  sectors: Sector[];
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    state: string;
    serviceRadius: number;
  };
  stats: {
    projectsCompleted: number;
    yearsExperience: number;
    responseTime: string;
  };
  badges: string[];
  availability: AvailabilityStatus;
  memberSince: string;
  verified: {
    licensed: boolean;
    insured: boolean;
    backgroundChecked: boolean;
  };
  logo?: string;
  coverPhoto?: string;
  bio?: string;
  specialties?: string[];
  services?: NetworkService[];
  portfolio?: PortfolioProject[];
  reviews?: NetworkReview[];
  credentials?: Credential[];
}

export interface NetworkService {
  id: string;
  name: string;
  description: string;
  priceRange?: {
    min: number;
    max: number;
    unit: string;
  };
  popular?: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  images: string[];
  completedDate: string;
  projectType: string;
  sector: Sector;
  value?: number;
  location: string;
}

export interface NetworkReview {
  id: string;
  rating: number;
  title: string;
  content: string;
  authorName: string;
  authorType: 'homeowner' | 'contractor' | 'developer';
  projectType: string;
  createdAt: string;
  verified: boolean;
}

export interface Credential {
  type: 'license' | 'insurance' | 'certification' | 'bonding';
  name: string;
  issuedBy: string;
  number?: string;
  expirationDate?: string;
  verified: boolean;
}

export interface NetworkSearchFilters {
  query?: string;
  location?: string;
  professionalType?: ProfessionalType[];
  trades?: string[];
  minRating?: number;
  availability?: AvailabilityStatus[];
  sectors?: Sector[];
  sortBy?: 'best_match' | 'highest_rated' | 'most_jobs';
}

export interface NetworkSearchResult {
  profiles: NetworkProfile[];
  total: number;
  page: number;
  pageSize: number;
  filters: NetworkSearchFilters;
}

// Professional type labels
export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  gc: 'General Contractor',
  specialty_contractor: 'Specialty Contractor',
  architect: 'Architect',
  engineer: 'Engineer',
  supplier: 'Supplier',
  owner_developer: 'Owner/Developer',
};

// Sector labels
export const SECTOR_LABELS: Record<Sector, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  industrial: 'Industrial',
  government: 'Government',
  mixed_use: 'Mixed-Use',
};

// Common trades
export const COMMON_TRADES = [
  'General Construction',
  'Electrical',
  'Plumbing',
  'HVAC',
  'Roofing',
  'Carpentry',
  'Concrete',
  'Masonry',
  'Painting',
  'Flooring',
  'Drywall',
  'Landscaping',
  'Demolition',
  'Excavation',
  'Steel/Iron Work',
  'Glass/Glazing',
  'Insulation',
  'Fire Protection',
  'Elevators',
  'Solar Installation',
];
