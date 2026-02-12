// apps/m-marketplace/app/network/page.tsx
// Kealee Construction Network - Search & Browse

import { Metadata } from 'next';
import Image from 'next/image';
import { NetworkSearchClient } from './NetworkSearchClient';
import { sectionImages } from '@kealee/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Construction Network | Kealee',
  description: 'Find trusted contractors, architects, engineers, and construction professionals in the DC-Baltimore corridor. Verified, licensed, and ready to work.',
  openGraph: {
    title: 'Kealee Construction Network',
    description: 'Find the right construction professional for your project.',
    url: 'https://kealee.com/network',
  },
};

// Mock profile data
const mockProfiles = [
  {
    id: '1',
    slug: 'capital-city-builders',
    businessName: 'Capital City Builders',
    principalName: 'James Rodriguez',
    type: 'gc' as const,
    trades: ['Residential Construction', 'Commercial Buildouts', 'Renovations', 'Additions'],
    specialties: ['Luxury Homes', 'Historic Preservation'],
    sectors: ['residential' as const, 'commercial' as const],
    location: { city: 'Bethesda', state: 'MD' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.9,
    reviewCount: 127,
    stats: { projectsCompleted: 85, yearsInBusiness: 12, responseTime: '< 2 hrs', onTimeRate: '98%' },
    badges: ['licensed' as const, 'insured' as const, 'background_checked' as const, 'verified' as const],
    availability: 'available' as const,
    memberSince: '2020-03-15',
  },
  {
    id: '2',
    slug: 'dmv-electric-pro',
    businessName: 'DMV Electric Pro',
    principalName: 'Sarah Chen',
    type: 'specialty_contractor' as const,
    trades: ['Electrical', 'EV Charging Installation', 'Smart Home', 'Panel Upgrades'],
    specialties: ['Commercial Electrical', 'Solar Integration'],
    sectors: ['residential' as const, 'commercial' as const],
    location: { city: 'Arlington', state: 'VA' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.8,
    reviewCount: 89,
    stats: { projectsCompleted: 120, yearsInBusiness: 8, responseTime: '< 1 hr', onTimeRate: '99%' },
    badges: ['licensed' as const, 'insured' as const, 'verified' as const],
    availability: 'busy' as const,
    memberSince: '2021-06-10',
  },
  {
    id: '3',
    slug: 'chesapeake-architecture',
    businessName: 'Chesapeake Architecture',
    principalName: 'Michael Thompson',
    type: 'architect' as const,
    trades: ['Modern Design', 'Historic Restoration', 'Sustainable Design'],
    specialties: ['LEED Certification', 'Passive House'],
    sectors: ['residential' as const, 'commercial' as const, 'mixed_use' as const],
    location: { city: 'Washington', state: 'DC' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 5.0,
    reviewCount: 45,
    stats: { projectsCompleted: 62, yearsInBusiness: 15, responseTime: '< 4 hrs' },
    badges: ['licensed' as const, 'verified' as const, 'preferred' as const],
    availability: 'available' as const,
    memberSince: '2019-11-20',
  },
  {
    id: '4',
    slug: 'potomac-plumbing',
    businessName: 'Potomac Plumbing & HVAC',
    principalName: 'David Martinez',
    type: 'specialty_contractor' as const,
    trades: ['Plumbing', 'HVAC', 'Gas Lines', 'Water Heaters'],
    specialties: ['Commercial HVAC', 'Radiant Floor Heating'],
    sectors: ['residential' as const, 'commercial' as const],
    location: { city: 'Rockville', state: 'MD' },
    serviceAreas: ['DC', 'MD'],
    rating: 4.7,
    reviewCount: 156,
    stats: { projectsCompleted: 200, yearsInBusiness: 20, responseTime: '< 30 min', onTimeRate: '97%' },
    badges: ['licensed' as const, 'insured' as const, 'background_checked' as const],
    availability: 'available' as const,
    memberSince: '2020-01-05',
  },
  {
    id: '5',
    slug: 'nova-structural',
    businessName: 'NoVA Structural Engineering',
    principalName: 'Emily Park',
    type: 'engineer' as const,
    trades: ['Structural Engineering', 'Foundation Design', 'Seismic Analysis'],
    specialties: ['Historic Structures', 'Steel Design'],
    sectors: ['residential' as const, 'commercial' as const, 'industrial' as const],
    location: { city: 'Falls Church', state: 'VA' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.9,
    reviewCount: 38,
    stats: { projectsCompleted: 150, yearsInBusiness: 10, responseTime: '< 2 hrs' },
    badges: ['licensed' as const, 'insured' as const, 'verified' as const],
    availability: 'busy' as const,
    memberSince: '2021-02-28',
  },
  {
    id: '6',
    slug: 'beltway-builders-supply',
    businessName: 'Beltway Builders Supply',
    principalName: 'Tom Wilson',
    type: 'supplier' as const,
    trades: ['Lumber', 'Hardware', 'Building Materials', 'Tools'],
    specialties: ['Wholesale Pricing', 'Job Site Delivery'],
    sectors: ['residential' as const, 'commercial' as const, 'industrial' as const],
    location: { city: 'Laurel', state: 'MD' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.6,
    reviewCount: 210,
    stats: { yearsInBusiness: 25, responseTime: '< 1 hr' },
    badges: ['verified' as const, 'preferred' as const],
    availability: 'available' as const,
    memberSince: '2019-05-15',
  },
  {
    id: '7',
    slug: 'dc-development-group',
    businessName: 'DC Development Group',
    principalName: 'Angela Washington',
    type: 'owner_developer' as const,
    trades: ['Multi-Family', 'Mixed-Use', 'Adaptive Reuse'],
    specialties: ['Opportunity Zones', 'Affordable Housing'],
    sectors: ['commercial' as const, 'mixed_use' as const],
    location: { city: 'Washington', state: 'DC' },
    serviceAreas: ['DC', 'MD'],
    rating: 4.8,
    reviewCount: 22,
    stats: { projectsCompleted: 15, yearsInBusiness: 7 },
    badges: ['verified' as const],
    availability: 'available' as const,
    memberSince: '2022-01-10',
  },
  {
    id: '8',
    slug: 'heritage-roofing',
    businessName: 'Heritage Roofing & Exteriors',
    principalName: 'Kevin O\'Brien',
    type: 'specialty_contractor' as const,
    trades: ['Roofing', 'Siding', 'Gutters', 'Windows'],
    specialties: ['Slate Roofing', 'Historic Restoration'],
    sectors: ['residential' as const, 'commercial' as const],
    location: { city: 'Silver Spring', state: 'MD' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.9,
    reviewCount: 178,
    stats: { projectsCompleted: 300, yearsInBusiness: 18, responseTime: '< 2 hrs', onTimeRate: '96%' },
    badges: ['licensed' as const, 'insured' as const, 'background_checked' as const, 'verified' as const],
    availability: 'unavailable' as const,
    memberSince: '2020-04-20',
  },
  {
    id: '9',
    slug: 'fairfax-interiors',
    businessName: 'Fairfax Fine Interiors',
    principalName: 'Lisa Morgan',
    type: 'specialty_contractor' as const,
    trades: ['Interior Finishing', 'Custom Millwork', 'Painting', 'Flooring'],
    specialties: ['Luxury Finishes', 'Custom Cabinetry'],
    sectors: ['residential' as const, 'commercial' as const],
    location: { city: 'Fairfax', state: 'VA' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 5.0,
    reviewCount: 67,
    stats: { projectsCompleted: 95, yearsInBusiness: 12, responseTime: '< 3 hrs', onTimeRate: '99%' },
    badges: ['licensed' as const, 'insured' as const, 'verified' as const, 'preferred' as const],
    availability: 'available' as const,
    memberSince: '2020-08-12',
  },
];

export default function NetworkPage() {
  return (
    <>
      {/* Hero Banner */}
      <section className="relative h-64 overflow-hidden">
        <Image
          src={sectionImages.handshake.src}
          alt={sectionImages.handshake.alt}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
        <div className="relative flex items-center justify-center h-full">
          <div className="text-center px-6">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Construction Network</h1>
            <p className="text-lg text-white/85 max-w-2xl mx-auto">
              Find trusted contractors, architects, engineers, and construction professionals in the DC-Baltimore corridor.
            </p>
          </div>
        </div>
      </section>
      <NetworkSearchClient initialProfiles={mockProfiles} />
    </>
  );
}
