// ============================================================
// PERMIT DETAIL PAGE
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermitDocuments } from '@/components/permit/permit-documents';
import { PermitCorrections } from '@/components/permit/permit-corrections';
import { PermitInspections } from '@/components/permit/permit-inspections';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, FileText, AlertCircle, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export default function PermitDetailPage() {
  const params = useParams();
  const permitId = params.id as string;
  const supabase = createClient();

  const { data: permit, isLoading } = useQuery({
    queryKey: ['permit', permitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Permit')
        .select('*')
        .eq('id', permitId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!permitId,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading permit...</div>;
  }

  if (!permit) {
    return <div className="text-center py-8 text-red-600">Permit not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/permits">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {permit.permitType} Permit
          </h1>
          <p className="text-gray-500 mt-1">
            {permit.permitNumber || 'Draft'} • {permit.scope}
          </p>
        </div>
        <Badge className="text-sm">
          {permit.kealeeStatus.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Project Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(permit.valuation)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">AI Review Score</CardTitle>
          </CardHeader>
          <CardContent>
            {permit.aiReviewScore !== null ? (
              <p className="text-2xl font-bold">{permit.aiReviewScore}/100</p>
            ) : (
              <p className="text-sm text-gray-500">Not reviewed</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{permit.kealeeStatus.replace(/_/g, ' ')}</p>
            {permit.submittedAt && (
              <p className="text-xs text-gray-500 mt-1">
                Submitted: {formatDate(permit.submittedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">
            Documents
            {permit.plans && permit.plans.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {permit.plans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="corrections">
            Corrections
            <AlertCircle className="h-4 w-4 ml-2" />
          </TabsTrigger>
          <TabsTrigger value="inspections">
            Inspections
            <ClipboardCheck className="h-4 w-4 ml-2" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Applicant</p>
                  <p className="font-medium">{permit.applicantName}</p>
                  <p className="text-sm text-gray-600">{permit.applicantEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Property Address</p>
                  <p className="font-medium">{permit.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(permit.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(permit.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <PermitDocuments permitId={permitId} />
        </TabsContent>

        <TabsContent value="corrections">
          <PermitCorrections permitId={permitId} />
        </TabsContent>

        <TabsContent value="inspections">
          <PermitInspections permitId={permitId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
