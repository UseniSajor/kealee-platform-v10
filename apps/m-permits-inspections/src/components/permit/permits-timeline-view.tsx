// ============================================================
// PERMITS TIMELINE VIEW
// Timeline visualization of permit progress
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import Link from 'next/link';

export function PermitsTimelineView() {
  const supabase = createClient();

  const { data: permits, isLoading } = useQuery({
    queryKey: ['permits', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Permit')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ISSUED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'CORRECTIONS_REQUESTED':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'ISSUED':
        return 'bg-green-100 text-green-800';
      case 'UNDER_REVIEW':
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'CORRECTIONS_REQUESTED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading permits...</div>;
  }

  return (
    <div className="space-y-4">
      {permits && permits.length > 0 ? (
        permits.map((permit: any) => (
          <Link key={permit.id} href={`/dashboard/permits/${permit.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(permit.kealeeStatus)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{permit.permitType}</h3>
                        <p className="text-sm text-gray-600 mt-1">{permit.scope}</p>
                      </div>
                      <Badge className={getStatusColor(permit.kealeeStatus)}>
                        {permit.kealeeStatus.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                      {permit.permitNumber && (
                        <span>Permit #: {permit.permitNumber}</span>
                      )}
                      <span>Created: {formatDateTime(permit.createdAt)}</span>
                      {permit.submittedAt && (
                        <span>Submitted: {formatDateTime(permit.submittedAt)}</span>
                      )}
                      {permit.approvedAt && (
                        <span className="text-green-600">
                          Approved: {formatDateTime(permit.approvedAt)}
                        </span>
                      )}
                    </div>
                    {permit.aiReviewScore !== null && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">AI Review Score:</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                            <div
                              className={`h-2 rounded-full ${
                                permit.aiReviewScore >= 75
                                  ? 'bg-green-600'
                                  : permit.aiReviewScore >= 50
                                  ? 'bg-yellow-600'
                                  : 'bg-red-600'
                              }`}
                              style={{ width: `${permit.aiReviewScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{permit.aiReviewScore}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>No permits found</p>
        </div>
      )}
    </div>
  );
}
