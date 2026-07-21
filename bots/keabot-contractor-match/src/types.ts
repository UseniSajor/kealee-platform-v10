export interface Contractor {
  id: string;
  name: string;
  trades: string[];
  serviceArea: string[];
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  licenseNumber: string;
  licenseStatus: 'valid' | 'expired' | 'suspended';
  insuranceActive: boolean;
  insuranceExpiry: Date;
  isActive: boolean;
  priceRangeLow: number;
  priceRangeHigh: number;
  availability: string; // e.g. "2 weeks"
  photoUrl?: string;
}

export interface ContractorScore {
  contractorId: string;
  totalScore: number;
  breakdown: {
    tradeMatch: number;    // 35%
    location: number;      // 20%
    experience: number;    // 20%
    rating: number;        // 15%
    availability: number;  // 10%
  };
  distance: number; // km
}

export interface MatchResult {
  contractorId: string;
  name: string;
  score: number;
  distance: string;
  rating: number;
  yearsExperience: number;
  bidPrice: string;
  availability: string;
  licenseValid: boolean;
  insuranceActive: boolean;
  trades: string[];
}

export interface MatchQuery {
  projectId: string;
  trade: string;
  location: { lat: number; lng: number; city: string };
  budget: number;
  radiusKm?: number; // default 25
}

export interface BidRequest {
  contractorId: string;
  projectId: string;
  projectDescription: string;
  trade: string;
  budget: number;
  timeline: string;
  location: string;
}

export interface VerificationResult {
  contractorId: string;
  licenseStatus: 'valid' | 'expired' | 'suspended' | 'unknown';
  insuranceStatus: 'active' | 'expired' | 'unknown';
  licenseExpiry?: Date;
  insuranceExpiry?: Date;
  verified: boolean;
  issues: string[];
}
