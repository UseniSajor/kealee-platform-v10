// apps/m-marketplace/app/network/[slug]/page.tsx
// Kealee Network - Business Profile Page (wired to real API)

import { Metadata } from 'next';
import { ProfilePageClient } from './ProfilePageClient';

export const dynamic = 'force-dynamic';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Fetch a contractor profile from the backend by ID.
 *  The [slug] segment is actually the contractor profile UUID. */
async function fetchProfile(id: string) {
  try {
    const res = await fetch(`${API_URL}/marketplace/contractors/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile ?? data ?? null;
  } catch {
    return null;
  }
}

/** Map the raw API contractor profile into the shape ProfilePageClient expects */
function mapApiToProfile(raw: any, id: string) {
  return {
    id: raw.id || id,
    slug: raw.businessName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id,
    businessName: raw.businessName || 'Unknown Business',
    legalName: raw.legalName || raw.businessName || '',
    principalName: raw.user?.name || '',
    type: raw.type || 'gc',
    tagline: raw.tagline || '',
    bio: raw.description || '',
    logo: raw.logo || null,
    coverPhoto: raw.coverPhoto || null,
    trades: Array.isArray(raw.specialties) ? raw.specialties : [],
    specialties: Array.isArray(raw.specialties) ? raw.specialties : [],
    sectors: raw.sectors || ['residential', 'commercial'],
    location: raw.location || { city: '', state: '' },
    serviceAreas: raw.serviceAreas || [],
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : 0,
    stats: {
      projectsCompleted: raw.projectsCompleted ?? undefined,
      yearsInBusiness: raw.yearsInBusiness ?? undefined,
      responseTime: raw.responseTime ?? undefined,
      onTimeRate: raw.onTimeRate ?? undefined,
      repeatClientRate: raw.repeatClientRate ?? undefined,
    },
    badges: raw.verified ? ['verified' as const] : [],
    availability:
      raw.availableCapacity === 'Available' ? 'available' :
      raw.availableCapacity === 'Limited' ? 'busy' : 'unavailable',
    memberSince: raw.memberSince || raw.createdAt || '',
    email: raw.user?.email || raw.email || '',
    phone: raw.user?.phone || raw.phone || '',
    website: raw.website || '',
    socialLinks: raw.socialLinks || {},
    licenses: raw.licenses || [],
    insurance: raw.insurance || [],
    certifications: raw.certifications || [],
    portfolio: Array.isArray(raw.portfolio) ? raw.portfolio.map((p: any) => ({
      id: p.id,
      title: p.projectName || p.title || 'Untitled',
      description: p.description || '',
      projectType: p.projectType || p.category || '',
      sector: p.sector || '',
      location: p.location || '',
      completionDate: p.completedAt || p.completionDate || '',
      projectValue: p.projectValue ?? p.contractValue ?? null,
      images: p.imageUrls || p.images || [],
      tags: p.tags || [],
    })) : [],
    reviews: raw.reviews || [],
    services: raw.services || [],
  };
}

// Dynamic metadata
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const raw = await fetchProfile(params.slug);
  if (!raw) {
    return { title: 'Profile Not Found | Kealee Network' };
  }

  const businessName = raw.businessName || 'Contractor';
  const description = raw.description || raw.tagline || '';

  return {
    title: `${businessName} | Kealee Network`,
    description: description.substring(0, 200) || `${businessName} on the Kealee Network`,
    openGraph: {
      title: `${businessName} | Kealee Network`,
      description: description.substring(0, 200),
    },
  };
}

export default async function ProfilePage({ params }: { params: { slug: string } }) {
  const raw = await fetchProfile(params.slug);

  // If the API doesn't return a profile, show an empty state rather than a 404
  // so the page still renders gracefully when the backend is unreachable
  if (!raw) {
    return <ProfilePageClient profile={null} />;
  }

  const profile = mapApiToProfile(raw, params.slug);
  return <ProfilePageClient profile={profile} />;
}
