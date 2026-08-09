export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Kealee Estimation - Cost Estimation Platform',
  description: 'Professional cost estimation and takeoff management with powered by AI tools insights',
};

export default function EstimationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>{children}</Providers>
  );
}
