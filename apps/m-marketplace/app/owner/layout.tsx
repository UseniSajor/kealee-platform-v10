// Nested layout for /owner routes — inherits root layout from app/layout.tsx

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Homeowner Services | Kealee',
  description: 'Professional project services for homeowners — from concept design and architecture to permits, contractor selection, and escrow-protected construction management.',
};

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
