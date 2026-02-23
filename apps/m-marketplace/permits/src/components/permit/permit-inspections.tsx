// ============================================================
// PERMIT INSPECTIONS
// Inspection management for permit
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@permits/src/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Badge } from '@permits/src/components/ui/badge';
import { Button } from '@permits/src/components/ui/button';
import { PlusCircle, CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';
import { formatDate, formatDateTime } from '@permits/src/lib/utils';
import Link from 'next/link';

interface PermitInspectionsProps {
  permitId: string;
}

export function PermitInspections({ permitId }: PermitInspectionsProps) {
  const supabase = createClient();

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['permit-inspections', permitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Inspection')
        .select('*')
        .eq('permitId', permitId)
        .order('scheduledDate', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getResultIcon = (result?: string) => {
    switch (result) {
      case 'PASS':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'FAIL':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'PARTIAL_PASS':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case 'PASS':
        return 'bg-green-100 text-green-800';
      case 'FAIL':
        return 'bg-red-100 text-red-800';
      case 'PARTIAL_PASS':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading inspections...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Inspections</h2>
          <p className="text-sm text-gray-500">Schedule and track inspections</p>
        </div>
        <Link href={`/dashboard/inspections/new?permitId=${permitId}`}>
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Inspection
          </Button>
        </Link>
      </div>

      {inspections && inspections.length > 0 ? (
        inspections.map((inspection: any) => (
          <Card key={inspection.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getResultIcon(inspection.result)}
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {inspection.inspectionType.replace(/_/g, ' ')}
                    </CardTitle>
                    {inspection.description && (
                      <p className="text-sm text-gray-600 mt-1">{inspection.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {inspection.result && (
                        <Badge className={getResultColor(inspection.result)}>
                          {inspection.result.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      {inspection.isRemote && (
                        <Badge variant="outline">Remote</Badge>
                      )}
                      {inspection.isReinspection && (
                        <Badge variant="outline">Reinspection</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {inspection.scheduledDate && (
                    <div>
                      <p className="text-gray-500">Scheduled:</p>
                      <p className="font-medium">
                        {formatDateTime(inspection.scheduledDate)}
                      </p>
                      {inspection.scheduledWindow && (
                        <p className="text-xs text-gray-500">
                          Window: {inspection.scheduledWindow}
                        </p>
                      )}
                    </div>
                  )}
                  {inspection.completedAt && (
                    <div>
                      <p className="text-gray-500">Completed:</p>
                      <p className="font-medium">
                        {formatDateTime(inspection.completedAt)}
                      </p>
                    </div>
                  )}
                  {inspection.inspectorNotes && (
                    <div className="col-span-2">
                      <p className="text-gray-500 mb-1">Inspector Notes:</p>
                      <p className="text-sm text-gray-700">{inspection.inspectorNotes}</p>
                    </div>
                  )}
                  {inspection.deficiencies && (
                    <div className="col-span-2">
                      <p className="text-gray-500 mb-1">Deficiencies:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700">
                        {(inspection.deficiencies as any[]).map((def: any, i: number) => (
                          <li key={i}>{def.description || def}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {inspection.result && (
                  <div className="flex items-center gap-4 pt-2 border-t">
                    {inspection.passedItems !== null && (
                      <div className="text-sm">
                        <span className="text-gray-500">Passed: </span>
                        <span className="font-medium text-green-600">
                          {inspection.passedItems}
                        </span>
                        {inspection.totalItems && (
                          <span className="text-gray-500"> / {inspection.totalItems}</span>
                        )}
                      </div>
                    )}
                    {inspection.failedItems !== null && inspection.failedItems > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Failed: </span>
                        <span className="font-medium text-red-600">
                          {inspection.failedItems}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!inspection.result && inspection.scheduledDate && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">View Checklist</Button>
                    <Button size="sm" variant="outline">Upload Photos</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No inspections scheduled</p>
            <Link href={`/dashboard/inspections/new?permitId=${permitId}`}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Request First Inspection
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
