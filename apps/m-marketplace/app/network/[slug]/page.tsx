// apps/m-marketplace/app/network/[slug]/page.tsx
// Kealee Construction Network - Business Profile Page

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfilePageClient } from './ProfilePageClient';

// Mock profile data
const mockProfiles: Record<string, any> = {
  'capital-city-builders': {
    id: '1',
    slug: 'capital-city-builders',
    businessName: 'Capital City Builders',
    legalName: 'Capital City Builders LLC',
    principalName: 'James Rodriguez',
    type: 'gc',
    tagline: 'Building Excellence Since 2012',
    bio: 'Capital City Builders is a full-service general contractor specializing in residential and commercial construction throughout the DC-Baltimore corridor. With over a decade of experience, we\'ve built our reputation on quality craftsmanship, transparent communication, and delivering projects on time and within budget. Our team of skilled professionals is committed to turning your vision into reality.',
    logo: null,
    coverPhoto: null,
    trades: ['Residential Construction', 'Commercial Buildouts', 'Renovations', 'Additions', 'Custom Homes'],
    specialties: ['Luxury Homes', 'Historic Preservation', 'Green Building'],
    sectors: ['residential', 'commercial'],
    location: { city: 'Bethesda', state: 'MD', address: '4720 Montgomery Lane', zip: '20814' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.9,
    reviewCount: 127,
    stats: { projectsCompleted: 85, yearsInBusiness: 12, responseTime: '< 2 hrs', onTimeRate: '98%', repeatClientRate: '75%' },
    badges: ['licensed', 'insured', 'background_checked', 'verified'],
    availability: 'available',
    memberSince: '2020-03-15',
    email: 'info@capitalcitybuilders.com',
    phone: '(301) 555-0123',
    website: 'https://capitalcitybuilders.com',
    socialLinks: { linkedin: 'https://linkedin.com/company/capital-city-builders', instagram: 'https://instagram.com/capitalcitybuilders' },
    licenses: [
      { id: '1', type: 'General Contractor', number: 'MD-GC-12345', state: 'MD', expirationDate: '2025-12-31', verified: true },
      { id: '2', type: 'Home Improvement', number: 'MHIC-123456', state: 'MD', expirationDate: '2025-06-30', verified: true },
      { id: '3', type: 'General Contractor', number: 'VA-GC-67890', state: 'VA', expirationDate: '2025-09-30', verified: true },
    ],
    insurance: [
      { id: '1', type: 'general_liability', carrier: 'Hartford Insurance', coverageAmount: 2000000, expirationDate: '2025-04-15', verified: true },
      { id: '2', type: 'workers_comp', carrier: 'State Fund', coverageAmount: 1000000, expirationDate: '2025-04-15', verified: true },
    ],
    certifications: [
      { id: '1', name: 'LEED Green Associate', issuingOrg: 'USGBC', verified: true },
      { id: '2', name: 'EPA Lead-Safe Certified', issuingOrg: 'EPA', verified: true },
    ],
    portfolio: [
      { id: '1', title: 'Chevy Chase Modern Renovation', description: 'Complete gut renovation of a 1950s colonial into a modern open-concept home', projectType: 'Whole Home Renovation', sector: 'residential', location: 'Chevy Chase, MD', completionDate: '2024-06', projectValue: 750000, images: ['/placeholder-project-1.jpg'], tags: ['Modern', 'Renovation'] },
      { id: '2', title: 'Georgetown Historic Restoration', description: 'Meticulous restoration of a 19th century townhouse while adding modern amenities', projectType: 'Historic Restoration', sector: 'residential', location: 'Georgetown, DC', completionDate: '2024-03', projectValue: 1200000, images: ['/placeholder-project-2.jpg'], tags: ['Historic', 'Restoration'] },
      { id: '3', title: 'Bethesda Office Buildout', description: 'Complete buildout of 15,000 SF office space for tech startup', projectType: 'Commercial Buildout', sector: 'commercial', location: 'Bethesda, MD', completionDate: '2023-11', projectValue: 450000, images: ['/placeholder-project-3.jpg'], tags: ['Commercial', 'Office'] },
    ],
    reviews: [
      { id: '1', reviewerName: 'Sarah M.', rating: 5, title: 'Exceptional work on our kitchen renovation', content: 'James and his team were absolutely fantastic. They completed our kitchen renovation on time and the quality exceeded our expectations. Communication was excellent throughout the project.', projectType: 'Kitchen Renovation', date: '2024-08-15', verified: true },
      { id: '2', reviewerName: 'Michael T.', rating: 5, title: 'Professional from start to finish', content: 'We hired Capital City for our basement finishing project. The attention to detail was impressive and they handled all permits and inspections seamlessly.', projectType: 'Basement Finishing', date: '2024-07-20', verified: true },
      { id: '3', reviewerName: 'Jennifer L.', rating: 4, title: 'Great quality, minor scheduling delays', content: 'The final result is beautiful and the craftsmanship is top-notch. There were a few scheduling delays but the team communicated proactively about them.', projectType: 'Addition', date: '2024-06-10', verified: true },
    ],
    services: [
      { id: '1', name: 'Design-Build Consultation', description: 'Initial consultation to discuss your project vision and provide preliminary estimates', category: 'Consultation', priceType: 'fixed', price: 0, priceUnit: 'Free' },
      { id: '2', name: 'Full Project Management', description: 'End-to-end project management including scheduling, subcontractor coordination, and inspections', category: 'Project Management', priceType: 'project', price: null },
      { id: '3', name: 'Kitchen Renovation', description: 'Complete kitchen renovation including cabinets, countertops, appliances, and finishes', category: 'Renovation', priceType: 'project', price: 50000 },
      { id: '4', name: 'Bathroom Renovation', description: 'Full bathroom renovation including fixtures, tile, and finishes', category: 'Renovation', priceType: 'project', price: 25000 },
      { id: '5', name: 'Home Addition', description: 'Room additions including foundation, framing, and full finishing', category: 'New Construction', priceType: 'quote' },
    ],
  },
  'dmv-electric-pro': {
    id: '2',
    slug: 'dmv-electric-pro',
    businessName: 'DMV Electric Pro',
    legalName: 'DMV Electric Pro Inc.',
    principalName: 'Sarah Chen',
    type: 'specialty_contractor',
    tagline: 'Powering the DMV with Excellence',
    bio: 'DMV Electric Pro is a leading electrical contractor serving residential and commercial clients throughout DC, Maryland, and Virginia. We specialize in EV charging installations, smart home systems, and commercial electrical work. Our team of master electricians brings expertise and reliability to every project.',
    logo: null,
    coverPhoto: null,
    trades: ['Electrical', 'EV Charging Installation', 'Smart Home', 'Panel Upgrades', 'Commercial Electrical'],
    specialties: ['Tesla Certified', 'Solar Integration', 'Home Automation'],
    sectors: ['residential', 'commercial'],
    location: { city: 'Arlington', state: 'VA', address: '2100 Clarendon Blvd', zip: '22201' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 4.8,
    reviewCount: 89,
    stats: { projectsCompleted: 120, yearsInBusiness: 8, responseTime: '< 1 hr', onTimeRate: '99%' },
    badges: ['licensed', 'insured', 'verified'],
    availability: 'busy',
    memberSince: '2021-06-10',
    email: 'hello@dmvelectricpro.com',
    phone: '(703) 555-0456',
    website: 'https://dmvelectricpro.com',
    licenses: [
      { id: '1', type: 'Master Electrician', number: 'VA-ME-98765', state: 'VA', expirationDate: '2025-08-31', verified: true },
      { id: '2', type: 'Master Electrician', number: 'MD-ME-54321', state: 'MD', expirationDate: '2025-05-31', verified: true },
    ],
    insurance: [
      { id: '1', type: 'general_liability', carrier: 'Liberty Mutual', coverageAmount: 1000000, expirationDate: '2025-03-15', verified: true },
    ],
    certifications: [
      { id: '1', name: 'Tesla Certified Installer', issuingOrg: 'Tesla', verified: true },
      { id: '2', name: 'NABCEP Solar PV Installer', issuingOrg: 'NABCEP', verified: true },
    ],
    portfolio: [
      { id: '1', title: 'Residential EV Charging Network', description: 'Installed Level 2 EV chargers in a 50-unit condo building', projectType: 'EV Charging', sector: 'residential', location: 'Arlington, VA', completionDate: '2024-05', projectValue: 85000, images: [], tags: ['EV', 'Multi-Family'] },
    ],
    reviews: [
      { id: '1', reviewerName: 'David K.', rating: 5, title: 'Fast and professional EV charger install', content: 'Sarah and her team installed our Tesla charger in one day. Clean work and great price.', projectType: 'EV Charging', date: '2024-09-01', verified: true },
    ],
    services: [
      { id: '1', name: 'EV Charger Installation', description: 'Level 2 EV charger installation for home or business', category: 'EV Charging', priceType: 'fixed', price: 1500 },
      { id: '2', name: 'Panel Upgrade', description: 'Electrical panel upgrade to 200A service', category: 'Electrical', priceType: 'fixed', price: 2500 },
    ],
  },
  'chesapeake-architecture': {
    id: '3',
    slug: 'chesapeake-architecture',
    businessName: 'Chesapeake Architecture',
    legalName: 'Chesapeake Architecture PLLC',
    principalName: 'Michael Thompson, AIA',
    type: 'architect',
    tagline: 'Design that Inspires',
    bio: 'Chesapeake Architecture is a design-forward architecture firm specializing in sustainable residential and commercial projects. Founded by Michael Thompson, AIA, our practice combines timeless design principles with cutting-edge sustainable building practices.',
    logo: null,
    coverPhoto: null,
    trades: ['Modern Design', 'Historic Restoration', 'Sustainable Design', 'Space Planning'],
    specialties: ['LEED Certification', 'Passive House', 'Adaptive Reuse'],
    sectors: ['residential', 'commercial', 'mixed_use'],
    location: { city: 'Washington', state: 'DC', address: '1050 Connecticut Ave NW', zip: '20036' },
    serviceAreas: ['DC', 'MD', 'VA'],
    rating: 5.0,
    reviewCount: 45,
    stats: { projectsCompleted: 62, yearsInBusiness: 15, responseTime: '< 4 hrs' },
    badges: ['licensed', 'verified', 'preferred'],
    availability: 'available',
    memberSince: '2019-11-20',
    email: 'studio@chesapeakearch.com',
    phone: '(202) 555-0789',
    website: 'https://chesapeakearch.com',
    licenses: [
      { id: '1', type: 'Registered Architect', number: 'DC-AR-1234', state: 'DC', expirationDate: '2025-12-31', verified: true },
    ],
    insurance: [
      { id: '1', type: 'professional', carrier: 'AXA XL', coverageAmount: 2000000, expirationDate: '2025-06-30', verified: true },
    ],
    certifications: [
      { id: '1', name: 'LEED AP BD+C', issuingOrg: 'USGBC', verified: true },
      { id: '2', name: 'Certified Passive House Designer', issuingOrg: 'PHIUS', verified: true },
    ],
    portfolio: [],
    reviews: [],
    services: [
      { id: '1', name: 'Schematic Design', description: 'Initial design concepts and space planning', category: 'Design', priceType: 'project', price: 5000 },
      { id: '2', name: 'Full Architectural Services', description: 'Complete design through construction administration', category: 'Design', priceType: 'quote' },
    ],
  },
};

// Static params for SSG
export async function generateStaticParams() {
  return Object.keys(mockProfiles).map((slug) => ({ slug }));
}

// Dynamic metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const profile = mockProfiles[params.slug];
  if (!profile) {
    return { title: 'Profile Not Found | Kealee Network' };
  }

  return {
    title: `${profile.businessName} | Kealee Construction Network`,
    description: profile.tagline || `${profile.businessName} - ${profile.type} serving ${profile.serviceAreas.join(', ')}`,
    openGraph: {
      title: `${profile.businessName} | Kealee Network`,
      description: profile.bio?.substring(0, 200),
    },
  };
}

export default function ProfilePage({ params }: { params: { slug: string } }) {
  const profile = mockProfiles[params.slug];

  if (!profile) {
    notFound();
  }

  return <ProfilePageClient profile={profile} />;
}
