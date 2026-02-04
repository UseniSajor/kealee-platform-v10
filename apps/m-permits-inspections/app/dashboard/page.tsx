// apps/m-permits-inspections/app/dashboard/page.tsx
// Permit Dashboard Page (SSR, requires auth)

import type { Metadata } from 'next';
import { PermitDashboardClient } from '../../components/PermitDashboardClient';

export const metadata: Metadata = {
  title: 'My Permits | Kealee Permits Dashboard',
  description: 'Track and manage your building permit applications from submission to approval.',
};

// Mock permit data - in production, this would come from the database
async function getPermits(userId: string) {
  // Simulated database fetch
  const permits = [
    {
      id: '1',
      permitNumber: 'BP-2026-001234',
      address: '1234 Wisconsin Ave NW, Washington, DC 20007',
      type: 'building' as const,
      jurisdiction: 'Washington, DC',
      status: 'in_review' as const,
      progress: 2,
      lastUpdated: '2 hours ago',
      submittedDate: 'Jan 28, 2026',
      estimatedApproval: 'Feb 10, 2026',
      notes: 'Structural review in progress. Waiting for fire marshal approval.',
    },
    {
      id: '2',
      permitNumber: 'EP-2026-005678',
      address: '456 M Street SE, Washington, DC 20003',
      type: 'electrical' as const,
      jurisdiction: 'Washington, DC',
      status: 'approved' as const,
      progress: 4,
      lastUpdated: '1 day ago',
      submittedDate: 'Jan 15, 2026',
      estimatedApproval: 'Jan 29, 2026',
      inspector: 'James Wilson',
    },
    {
      id: '3',
      permitNumber: 'MC-2026-002345',
      address: '789 River Rd, Bethesda, MD 20816',
      type: 'mechanical' as const,
      jurisdiction: 'Montgomery County, MD',
      status: 'corrections' as const,
      progress: 2,
      lastUpdated: '3 days ago',
      submittedDate: 'Jan 20, 2026',
      notes: 'Missing HVAC load calculations. Please upload updated mechanical drawings.',
    },
    {
      id: '4',
      permitNumber: 'BP-2026-003456',
      address: '321 Charles St, Baltimore, MD 21201',
      type: 'renovation' as const,
      jurisdiction: 'Baltimore City, MD',
      status: 'submitted' as const,
      progress: 1,
      lastUpdated: '5 hours ago',
      submittedDate: 'Feb 3, 2026',
      estimatedApproval: 'Feb 17, 2026',
    },
    {
      id: '5',
      permitNumber: 'PP-2026-007890',
      address: '555 Lee Hwy, Arlington, VA 22201',
      type: 'plumbing' as const,
      jurisdiction: 'Arlington County, VA',
      status: 'inspection' as const,
      progress: 4,
      lastUpdated: '6 hours ago',
      submittedDate: 'Jan 10, 2026',
      inspector: 'Sarah Martinez',
      notes: 'Inspection scheduled for Feb 5, 2026 at 10:00 AM.',
    },
    {
      id: '6',
      permitNumber: 'BP-2025-009876',
      address: '888 Georgia Ave, Silver Spring, MD 20910',
      type: 'building' as const,
      jurisdiction: 'Montgomery County, MD',
      status: 'complete' as const,
      progress: 5,
      lastUpdated: '2 weeks ago',
      submittedDate: 'Dec 1, 2025',
      inspector: 'Michael Chen',
    },
    {
      id: '7',
      permitNumber: 'DP-2026-001111',
      address: '100 Pratt St, Baltimore, MD 21202',
      type: 'demolition' as const,
      jurisdiction: 'Baltimore City, MD',
      status: 'in_review' as const,
      progress: 2,
      lastUpdated: '4 days ago',
      submittedDate: 'Jan 25, 2026',
      estimatedApproval: 'Feb 8, 2026',
    },
  ];

  return permits;
}

export default async function PermitDashboardPage() {
  // In production, get userId from auth session
  const userId = 'user-123';
  const permits = await getPermits(userId);

  return <PermitDashboardClient initialPermits={permits} />;
}
