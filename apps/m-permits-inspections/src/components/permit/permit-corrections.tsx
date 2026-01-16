// ============================================================
// PERMIT CORRECTIONS
// Track and resolve corrections
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface PermitCorrectionsProps {
  permitId: string;
}

export function PermitCorrections({ permitId }: PermitCorrectionsProps) {
  const supabase = createClient();

  const { data: corrections, isLoading } = useQuery({
    queryKey: ['permit-corrections', permitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('PermitCorrection')
        .select('*')
        .eq('permitId', permitId)
        .order('receivedAt', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'OVERDUE':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'MAJOR':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading corrections...</div>;
  }

  return (
    <div className="space-y-4">
      {corrections && corrections.length > 0 ? (
        corrections.map((correction: any) => (
          <Card key={correction.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(correction.status)}
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      {correction.rawText.substring(0, 100)}
                      {correction.rawText.length > 100 && '...'}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getSeverityColor(correction.severity)}>
                        {correction.severity}
                      </Badge>
                      <Badge variant="outline">{correction.status}</Badge>
                      {correction.discipline && (
                        <Badge variant="outline">{correction.discipline}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Text:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {correction.rawText}
                  </p>
                </div>

                {correction.affectedSheets && correction.affectedSheets.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Affected Sheets:</p>
                    <div className="flex flex-wrap gap-2">
                      {correction.affectedSheets.map((sheet: string, i: number) => (
                        <Badge key={i} variant="outline">{sheet}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Assigned To:</p>
                    <p className="font-medium">{correction.assignedTo}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Due Date:</p>
                    <p className="font-medium">
                      {correction.dueDate ? formatDate(correction.dueDate) : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Received:</p>
                    <p className="font-medium">{formatDate(correction.receivedAt)}</p>
                  </div>
                  {correction.resolvedAt && (
                    <div>
                      <p className="text-gray-500">Resolved:</p>
                      <p className="font-medium text-green-600">
                        {formatDate(correction.resolvedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {correction.resolutionNotes && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Resolution Notes:</p>
                    <p className="text-sm text-gray-700">{correction.resolutionNotes}</p>
                  </div>
                )}

                {correction.status === 'PENDING' && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm">Mark In Progress</Button>
                    <Button size="sm" variant="outline">Resolve</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
            <p className="text-gray-500">No corrections requested</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
