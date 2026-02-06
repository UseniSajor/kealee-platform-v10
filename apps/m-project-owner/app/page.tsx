// apps/m-project-owner/app/page.tsx
// Project Owner Portal Landing Page - app.kealee.com

import { Metadata } from 'next';
import { ProjectOwnerLandingClient } from './ProjectOwnerLandingClient';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Project Owner Portal | Kealee - Complete Project Control',
  description: 'Full visibility over your construction project — from readiness checklists to milestone payments, everything in one place. Start from $49/mo.',
  keywords: [
    'construction project management',
    'homeowner portal',
    'project tracking',
    'milestone payments',
    'escrow protection',
    'contractor management',
  ],
  openGraph: {
    title: 'Project Owner Portal | Kealee',
    description: 'Complete project control. Complete confidence. From $49/mo.',
    url: 'https://app.kealee.com',
    siteName: 'Kealee',
    images: [
      {
        url: '/og-project-owner.png',
        width: 1200,
        height: 630,
        alt: 'Kealee Project Owner Portal',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Project Owner Portal | Kealee',
    description: 'Complete project control. Complete confidence.',
    images: ['/og-project-owner.png'],
  },
};

export default function ProjectOwnerLandingPage() {
  return <ProjectOwnerLandingClient />;
}
