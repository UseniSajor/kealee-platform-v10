// ============================================================
// INSPECTION DETAIL PAGE
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@permits/src/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Badge } from '@permits/src/components/ui/badge';
import { Button } from '@permits/src/components/ui/button';
import { formatDateTime } from '@permits/src/lib/utils';
import { CheckCircle, XCircle, Clock, MapPin, Camera } from 'lucide-react';
import Link from 'next/link';

export default function InspectionDetailPage() {
  const params = useParams();
  const inspectionId = params.id as string;
  const supabase = createClient();

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Inspection')
        .select('*, Permit(permitNumber, permitType, scope)')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!inspectionId,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading inspection...</div>;
  }

  if (!inspection) {
    return <div className="text-center py-8 text-red-600">Inspection not found</div>;
  }

  const permit = (inspection as any).Permit;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/permits/dashboard/inspections">
          <Button variant="ghost" size="icon">
            ←
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {inspection.inspectionType.replace(/_/g, ' ')}
          </h1>
          <p className="text-gray-500 mt-1">
            Permit: {permit?.permitNumber || 'N/A'} • {permit?.permitType}
          </p>
        </div>
        {inspection.result && (
          <Badge
            className={
              inspection.result === 'PASS'
                ? 'bg-green-100 text-green-800'
                : inspection.result === 'FAIL'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }
          >
            {inspection.result.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Requested Date</p>
              <p className="font-medium">
                {inspection.requestedDate && formatDateTime(inspection.requestedDate)}
              </p>
            </div>
            {inspection.scheduledDate && (
              <div>
                <p className="text-sm text-gray-500">Scheduled Date</p>
                <p className="font-medium">{formatDateTime(inspection.scheduledDate)}</p>
                {inspection.scheduledWindow && (
                  <p className="text-xs text-gray-500">Window: {inspection.scheduledWindow}</p>
                )}
              </div>
            )}
            {inspection.isRemote && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">Remote Inspection</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {inspection.result && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{inspection.result.replace(/_/g, ' ')}</p>
              </div>
              {inspection.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="font-medium">{formatDateTime(inspection.completedAt)}</p>
                </div>
              )}
              {inspection.passedItems !== null && (
                <div>
                  <p className="text-sm text-gray-500">Items Passed</p>
                  <p className="font-medium">
                    {inspection.passedItems}
                    {inspection.totalItems && ` / ${inspection.totalItems}`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {inspection.inspectorNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Inspector Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{inspection.inspectorNotes}</p>
          </CardContent>
        </Card>
      )}

      {inspection.deficiencies && (inspection.deficiencies as any[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Deficiencies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(inspection.deficiencies as any[]).map((def: any, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <span className="text-sm">{def.description || def}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {inspection.sitePhotos && (inspection.sitePhotos as string[]).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pre-Inspection Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {(inspection.sitePhotos as string[]).map((url: string, i: number) => (
                <img
                  key={i}
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
