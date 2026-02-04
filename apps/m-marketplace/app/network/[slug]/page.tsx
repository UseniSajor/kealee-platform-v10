// apps/m-marketplace/app/network/[slug]/page.tsx
// Business Profile Page

import type { Metadata } from 'next';
import { NetworkProfileClient } from '../../../components/NetworkProfileClient';

export const dynamic = 'force-static';

// Mock data for profiles
const mockProfilesData: Record<string, ProfileData> = {
  'precision-build-co': {
    id: '1',
    slug: 'precision-build-co',
    businessName: 'Precision Build Co.',
    principalName: 'Marcus Johnson',
    type: 'gc',
    typeLabel: 'General Contractor',
    trades: ['General Construction', 'Renovation', 'Additions', 'Custom Homes', 'Commercial TI'],
    sectors: ['residential', 'commercial'],
    rating: 4.9,
    reviewCount: 127,
    location: {
      city: 'Bethesda',
      state: 'MD',
      serviceRadius: 50,
    },
    stats: {
      projectsCompleted: 245,
      yearsExperience: 18,
      responseTime: '2 hours',
    },
    badges: ['Top Rated', 'Verified', 'Fast Response', 'Background Checked'],
    availability: 'available',
    memberSince: '2019',
    verified: {
      licensed: true,
      insured: true,
      backgroundChecked: true,
    },
    bio: 'Precision Build Co. has been serving the DC-Baltimore metro area for over 18 years. We specialize in high-quality residential renovations, additions, and custom home construction. Our team of skilled craftsmen takes pride in delivering exceptional results on time and on budget. We believe in transparent communication and treat every project like it\'s our own home.',
    specialties: [
      'Kitchen & Bath Remodeling',
      'Home Additions',
      'Custom Homes',
      'Historic Restoration',
      'Commercial Tenant Improvements',
    ],
    services: [
      {
        id: '1',
        name: 'Full Home Renovation',
        description: 'Complete home transformation including structural, mechanical, and finishes.',
        priceRange: { min: 150000, max: 500000, unit: 'project' },
        popular: true,
      },
      {
        id: '2',
        name: 'Kitchen Remodel',
        description: 'Full kitchen renovation including cabinets, counters, appliances, and layout changes.',
        priceRange: { min: 35000, max: 150000, unit: 'project' },
        popular: true,
      },
      {
        id: '3',
        name: 'Bathroom Remodel',
        description: 'Complete bathroom renovation with fixtures, tile, and vanity.',
        priceRange: { min: 15000, max: 50000, unit: 'project' },
      },
      {
        id: '4',
        name: 'Home Addition',
        description: 'Room additions, bump-outs, and second story additions.',
        priceRange: { min: 100000, max: 400000, unit: 'project' },
      },
      {
        id: '5',
        name: 'Basement Finishing',
        description: 'Transform your basement into livable space with full finishing.',
        priceRange: { min: 40000, max: 120000, unit: 'project' },
      },
    ],
    portfolio: [
      {
        id: '1',
        title: 'Modern Kitchen Transformation',
        description: 'Complete gut renovation of a 1960s kitchen into a modern open-concept space with custom cabinetry and quartz countertops.',
        images: ['/portfolio/kitchen-1.jpg', '/portfolio/kitchen-2.jpg'],
        completedDate: '2024-11',
        projectType: 'Kitchen Remodel',
        sector: 'residential',
        value: 85000,
        location: 'Bethesda, MD',
      },
      {
        id: '2',
        title: 'Colonial Addition',
        description: 'Two-story addition adding a master suite and family room to a 1940s colonial home.',
        images: ['/portfolio/addition-1.jpg'],
        completedDate: '2024-08',
        projectType: 'Home Addition',
        sector: 'residential',
        value: 250000,
        location: 'Chevy Chase, MD',
      },
      {
        id: '3',
        title: 'Historic Row House Renovation',
        description: 'Full renovation of a Capitol Hill row house while preserving historic character.',
        images: ['/portfolio/rowhome-1.jpg'],
        completedDate: '2024-05',
        projectType: 'Full Renovation',
        sector: 'residential',
        value: 425000,
        location: 'Washington, DC',
      },
    ],
    reviews: [
      {
        id: '1',
        rating: 5,
        title: 'Exceeded all expectations',
        content: 'Marcus and his team were incredible to work with. They completed our kitchen renovation ahead of schedule and the quality is outstanding. Communication was excellent throughout.',
        authorName: 'Jennifer M.',
        authorType: 'homeowner',
        projectType: 'Kitchen Remodel',
        createdAt: '2024-12-15',
        verified: true,
      },
      {
        id: '2',
        rating: 5,
        title: 'Professional and trustworthy',
        content: 'We hired Precision Build for a major addition and couldn\'t be happier. They handled all the permits, kept us informed, and delivered beautiful work.',
        authorName: 'Robert & Sarah C.',
        authorType: 'homeowner',
        projectType: 'Home Addition',
        createdAt: '2024-10-22',
        verified: true,
      },
      {
        id: '3',
        rating: 4,
        title: 'Great work, minor delays',
        content: 'Quality of work is excellent. There were some delays due to supply chain issues, but the team communicated well and the final result was worth the wait.',
        authorName: 'Michael T.',
        authorType: 'homeowner',
        projectType: 'Bathroom Remodel',
        createdAt: '2024-09-08',
        verified: true,
      },
    ],
    credentials: [
      {
        type: 'license',
        name: 'Maryland Home Improvement License',
        issuedBy: 'Maryland Home Improvement Commission',
        number: 'MHIC #123456',
        expirationDate: '2026-06-30',
        verified: true,
      },
      {
        type: 'license',
        name: 'DC Basic Business License',
        issuedBy: 'DC DLCP',
        number: 'BBL-789012',
        expirationDate: '2025-12-31',
        verified: true,
      },
      {
        type: 'insurance',
        name: 'General Liability Insurance',
        issuedBy: 'Hartford Insurance',
        expirationDate: '2025-08-15',
        verified: true,
      },
      {
        type: 'insurance',
        name: 'Workers Compensation',
        issuedBy: 'State Farm',
        expirationDate: '2025-08-15',
        verified: true,
      },
      {
        type: 'certification',
        name: 'EPA Lead-Safe Certified',
        issuedBy: 'EPA',
        number: 'NAT-12345-1',
        verified: true,
      },
    ],
  },
  'capital-electric': {
    id: '2',
    slug: 'capital-electric',
    businessName: 'Capital Electric Services',
    principalName: 'Sarah Chen',
    type: 'specialty_contractor',
    typeLabel: 'Specialty Contractor',
    trades: ['Electrical', 'Panel Upgrades', 'EV Charging', 'Smart Home', 'Commercial Electrical'],
    sectors: ['residential', 'commercial'],
    rating: 4.8,
    reviewCount: 89,
    location: {
      city: 'Silver Spring',
      state: 'MD',
      serviceRadius: 40,
    },
    stats: {
      projectsCompleted: 312,
      yearsExperience: 12,
      responseTime: '1 hour',
    },
    badges: ['Licensed Master', 'Fast Response', 'Emergency Service'],
    availability: 'available',
    memberSince: '2020',
    verified: {
      licensed: true,
      insured: true,
      backgroundChecked: true,
    },
    bio: 'Capital Electric Services is a woman-owned electrical contracting company specializing in residential and light commercial electrical work. As a Master Electrician with over 12 years of experience, I lead a team of licensed professionals dedicated to safety, quality, and customer service.',
    specialties: [
      'Electrical Panel Upgrades',
      'EV Charger Installation',
      'Smart Home Wiring',
      'Whole House Rewiring',
      'Commercial Tenant Build-Outs',
    ],
    services: [
      {
        id: '1',
        name: 'Panel Upgrade',
        description: '200A electrical panel upgrade with new breakers and grounding.',
        priceRange: { min: 2500, max: 5000, unit: 'project' },
        popular: true,
      },
      {
        id: '2',
        name: 'EV Charger Installation',
        description: 'Level 2 EV charger installation including dedicated circuit.',
        priceRange: { min: 800, max: 2500, unit: 'project' },
        popular: true,
      },
      {
        id: '3',
        name: 'Smart Home Setup',
        description: 'Smart switch installation, hub setup, and integration.',
        priceRange: { min: 500, max: 3000, unit: 'project' },
      },
    ],
    portfolio: [],
    reviews: [
      {
        id: '1',
        rating: 5,
        title: 'Fast and professional',
        content: 'Sarah and her team installed our EV charger in just one day. Very professional and cleaned up everything perfectly.',
        authorName: 'David L.',
        authorType: 'homeowner',
        projectType: 'EV Charger Installation',
        createdAt: '2024-11-20',
        verified: true,
      },
    ],
    credentials: [
      {
        type: 'license',
        name: 'Maryland Master Electrician License',
        issuedBy: 'Maryland Board of Master Electricians',
        number: 'ME-45678',
        expirationDate: '2026-03-31',
        verified: true,
      },
      {
        type: 'insurance',
        name: 'General Liability Insurance',
        issuedBy: 'Nationwide',
        expirationDate: '2025-09-30',
        verified: true,
      },
    ],
  },
  'harbor-view-architects': {
    id: '3',
    slug: 'harbor-view-architects',
    businessName: 'Harbor View Architects',
    principalName: 'David Park, AIA',
    type: 'architect',
    typeLabel: 'Architect',
    trades: ['Residential Architecture', 'Commercial Architecture', 'Historic Preservation', 'Sustainable Design'],
    sectors: ['residential', 'commercial'],
    rating: 4.9,
    reviewCount: 64,
    location: {
      city: 'Baltimore',
      state: 'MD',
      serviceRadius: 75,
    },
    stats: {
      projectsCompleted: 89,
      yearsExperience: 22,
      responseTime: '1 day',
    },
    badges: ['AIA Member', 'LEED AP', 'Top Rated', 'Historic Specialist'],
    availability: 'busy',
    memberSince: '2018',
    verified: {
      licensed: true,
      insured: true,
      backgroundChecked: true,
    },
    bio: 'Harbor View Architects is a boutique architecture firm specializing in thoughtful residential design and historic preservation. With over 22 years of experience, we create spaces that balance modern functionality with timeless design principles.',
    specialties: [
      'Custom Home Design',
      'Historic Renovation',
      'Addition Design',
      'Interior Architecture',
      'LEED Certification Consulting',
    ],
    services: [
      {
        id: '1',
        name: 'Custom Home Design',
        description: 'Full architectural services for new custom homes.',
        priceRange: { min: 15000, max: 75000, unit: 'project' },
        popular: true,
      },
      {
        id: '2',
        name: 'Addition/Renovation Design',
        description: 'Architectural design for home additions and major renovations.',
        priceRange: { min: 5000, max: 25000, unit: 'project' },
        popular: true,
      },
    ],
    portfolio: [],
    reviews: [],
    credentials: [
      {
        type: 'license',
        name: 'Maryland Architect License',
        issuedBy: 'Maryland Board of Architects',
        number: 'ARC-7890',
        expirationDate: '2025-12-31',
        verified: true,
      },
      {
        type: 'certification',
        name: 'LEED AP BD+C',
        issuedBy: 'USGBC',
        verified: true,
      },
    ],
  },
};

interface ProfileData {
  id: string;
  slug: string;
  businessName: string;
  principalName?: string;
  type: string;
  typeLabel: string;
  trades: string[];
  sectors: string[];
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
  availability: 'available' | 'busy' | 'unavailable';
  memberSince: string;
  verified: {
    licensed: boolean;
    insured: boolean;
    backgroundChecked: boolean;
  };
  bio?: string;
  specialties?: string[];
  services?: {
    id: string;
    name: string;
    description: string;
    priceRange?: { min: number; max: number; unit: string };
    popular?: boolean;
  }[];
  portfolio?: {
    id: string;
    title: string;
    description: string;
    images: string[];
    completedDate: string;
    projectType: string;
    sector: string;
    value?: number;
    location: string;
  }[];
  reviews?: {
    id: string;
    rating: number;
    title: string;
    content: string;
    authorName: string;
    authorType: string;
    projectType: string;
    createdAt: string;
    verified: boolean;
  }[];
  credentials?: {
    type: string;
    name: string;
    issuedBy: string;
    number?: string;
    expirationDate?: string;
    verified: boolean;
  }[];
}

export async function generateStaticParams() {
  return Object.keys(mockProfilesData).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = mockProfilesData[params.slug];

  if (!profile) {
    return {
      title: 'Profile Not Found | Kealee Network',
    };
  }

  return {
    title: `${profile.businessName} | Kealee Construction Network`,
    description: profile.bio?.slice(0, 160) || `${profile.businessName} - ${profile.typeLabel} serving ${profile.location.city}, ${profile.location.state}`,
    openGraph: {
      title: `${profile.businessName} - ${profile.typeLabel}`,
      description: profile.bio?.slice(0, 160) || `Verified ${profile.typeLabel} on Kealee`,
      url: `https://kealee.com/network/${profile.slug}`,
      siteName: 'Kealee',
      locale: 'en_US',
      type: 'profile',
    },
  };
}

export default function NetworkProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = mockProfilesData[params.slug];

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Profile Not Found</h1>
          <p className="text-gray-600 mt-2">This business profile does not exist.</p>
        </div>
      </div>
    );
  }

  return <NetworkProfileClient profile={profile} />;
}
