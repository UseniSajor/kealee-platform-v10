// ============================================================
// NEW INSPECTION REQUEST
// ============================================================

'use client';

import { useSearchParams } from 'next/navigation';
import { InspectionRequestForm } from '@permits/src/components/inspection/inspection-request-form';

export default function NewInspectionPage() {
  const searchParams = useSearchParams();
  const permitId = searchParams.get('permitId') || '';

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Request Inspection</h1>
        <p className="text-gray-500 mt-1">Schedule a new inspection for your permit</p>
      </div>
      <InspectionRequestForm permitId={permitId} />
    </div>
  );
}
