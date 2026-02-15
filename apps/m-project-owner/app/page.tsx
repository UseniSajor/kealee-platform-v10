// apps/m-project-owner/app/page.tsx
// Homeowner & Project Owner Services - Design, Permits, Construction

import { Metadata } from 'next';
import { ProjectOwnerLandingClient } from './ProjectOwnerLandingClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Homeowner Construction Services | Kealee - Design, Permits & Project Management',
  description: 'Professional construction services for homeowners — from architectural design and permits to contractor selection and project management. Escrow-protected payments.',
  keywords: [
    'homeowner construction services',
    'residential construction management',
    'construction permit services',
    'architectural design for homeowners',
    'contractor selection',
    'escrow payment protection',
    'home renovation services',
    'construction project management',
  ],
  openGraph: {
    title: 'Homeowner Construction Services | Kealee',
    description: 'From plans to permits to construction — we handle it all. Professional services for homeowners.',
    url: 'https://app.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-project-owner.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Homeowner Construction Services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homeowner Construction Services | Kealee',
    description: 'From plans to permits to construction — we handle it all.',
    images: ['/og-project-owner.png'],
  },
};

export default function ProjectOwnerLandingPage() {
  return <ProjectOwnerLandingClient />;
}
