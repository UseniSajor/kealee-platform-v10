// ============================================================
// DASHBOARD OVERVIEW
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, ClipboardCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';

async function fetchPermits() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('Permit')
    .select('*')
    .order('createdAt', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
}

export default function DashboardPage() {
  const { data: permits, isLoading } = useQuery({
    queryKey: ['permits', 'recent'],
    queryFn: fetchPermits,
  });

  const stats = {
    total: permits?.length || 0,
    pending: permits?.filter((p: any) => p.kealeeStatus === 'DRAFT').length || 0,
    inReview: permits?.filter((p: any) => p.kealeeStatus === 'UNDER_REVIEW').length || 0,
    approved: permits?.filter((p: any) => p.kealeeStatus === 'APPROVED').length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your permits and inspections</p>
        </div>
        <Link href="/dashboard/permits/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Permit Application
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inReview}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Permits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Permits</CardTitle>
          <CardDescription>Your most recent permit applications</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : permits && permits.length > 0 ? (
            <div className="space-y-4">
              {permits.map((permit: any) => (
                <div
                  key={permit.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{permit.permitType}</h3>
                    <p className="text-sm text-gray-500">
                      {permit.permitNumber || 'Draft'} • {permit.scope}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{permit.kealeeStatus}</span>
                    <Link href={`/dashboard/permits/${permit.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No permits yet. Create your first permit application.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
