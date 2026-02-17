// apps/m-project-owner/app/page.tsx
// Homeowner & Project Owner Services - Design, Permits & Project Management

import { Metadata } from 'next';
import { ProjectOwnerLandingClient } from './ProjectOwnerLandingClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Homeowner Project Services | Kealee - Design, Permits & Project Management',
  description: 'Professional project services for homeowners — from architectural design and permits to contractor selection and project management. Escrow-protected payments.',
  keywords: [
    'homeowner project services',
    'residential project management',
    'permit services',
    'architectural design for homeowners',
    'contractor selection',
    'escrow payment protection',
    'home renovation services',
    'project management',
  ],
  openGraph: {
    title: 'Homeowner Project Services | Kealee',
    description: 'From plans to permits to build — we handle it all. Professional services for homeowners.',
    url: 'https://app.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-project-owner.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Homeowner Project Services',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Homeowner Project Services | Kealee',
    description: 'From plans to permits to build — we handle it all.',
    images: ['/og-project-owner.png'],
  },
};

export default function ProjectOwnerLandingPage() {
  return <ProjectOwnerLandingClient />;
}
