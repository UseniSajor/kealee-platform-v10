// ============================================================
// INSPECTIONS DASHBOARD
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function InspectionsPage() {
  const supabase = createClient();

  const { data: inspections, isLoading } = useQuery({
    queryKey: ['inspections', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Inspection')
        .select('*, Permit(permitNumber, permitType)')
        .order('scheduledDate', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const upcoming = inspections?.filter(
    (i: any) => i.scheduledDate && new Date(i.scheduledDate) > new Date() && !i.result
  ) || [];
  const completed = inspections?.filter((i: any) => i.result) || [];
  const pending = inspections?.filter((i: any) => !i.scheduledDate && !i.result) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inspections</h1>
          <p className="text-gray-500 mt-1">Manage inspection requests and results</p>
        </div>
        <Link href="/dashboard/inspections/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Request Inspection
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcoming.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pending.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Inspections */}
      {upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Inspections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcoming.map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">
                      {inspection.inspectionType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Permit: {inspection.Permit?.permitNumber || 'N/A'} •{' '}
                      {inspection.scheduledDate && formatDateTime(inspection.scheduledDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {inspection.readyToSchedule && (
                      <Badge variant="outline" className="bg-green-50">
                        Ready
                      </Badge>
                    )}
                    <Link href={`/dashboard/inspections/${inspection.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Completed */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completed.slice(0, 10).map((inspection: any) => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {inspection.result === 'PASS' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : inspection.result === 'FAIL' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {inspection.inspectionType.replace(/_/g, ' ')}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {inspection.completedAt && formatDateTime(inspection.completedAt)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      inspection.result === 'PASS'
                        ? 'bg-green-100 text-green-800'
                        : inspection.result === 'FAIL'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {inspection.result?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
