'use client';

import { CardGridSkeleton } from '@kealee/ui';

export default function MarketplaceLoading() {
  return (
    <div className="p-6">
      <CardGridSkeleton count={9} />
    </div>
  );
}
