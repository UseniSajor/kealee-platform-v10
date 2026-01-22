import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Download,
  Mail,
  FileText,
  Calendar,
  Eye,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { formatDate } from '../../utils/format';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { Skeleton } from '../ui/Skeleton';
import { accountingApi } from '../../api/accounting.api';

interface Statement {
  id: string;
  statementType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  sentAt?: Date;
  viewedAt?: Date;
  documentUrl: string;
  status: 'GENERATED' | 'SENT' | 'VIEWED';
  metadata?: any;
}

export function StatementViewer() {
  const { escrowId } = useParams<{ escrowId: string }>();
  const navigate = useNavigate();
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { data: statements, isLoading, error } = useQuery<Statement[]>({
    queryKey: ['statements', escrowId],
    queryFn: () => accountingApi.getStatements(escrowId!),
    enabled: !!escrowId,
  });

  const handleDownload = async (statement: Statement) => {
    setIsDownloading(true);
    try {
      const response = await fetch(statement.documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${statement.id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download statement:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEmail = async (statement: Statement) => {
    setIsSending(true);
    try {
      await accountingApi.sendStatement(statement.id);
      alert('Statement sent to your email address');
    } catch (error) {
      console.error('Failed to send statement:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleView = (statement: Statement) => {
    setSelectedStatement(statement);
    // Mark as viewed
    if (statement.status === 'SENT') {
      accountingApi.markStatementViewed(statement.id);
    }
  };

  if (isLoading) {
    return <StatementViewerSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load statements</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate(`/escrow/${escrowId}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Account Statements</h1>
            <p className="text-gray-600 mt-1">{statements?.length || 0} statements available</p>
          </div>
          <Button
            onClick={() => navigate(`/escrow/${escrowId}/statements/generate`)}
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Custom Statement
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statement List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Statements</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {statements && statements.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {statements.map((statement) => (
                    <StatementListItem
                      key={statement.id}
                      statement={statement}
                      selected={selectedStatement?.id === statement.id}
                      onSelect={() => handleView(statement)}
                      onDownload={() => handleDownload(statement)}
                      onEmail={() => handleEmail(statement)}
                      isDownloading={isDownloading}
                      isSending={isSending}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No statements available</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Statements are generated monthly
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2">Statement Information</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Monthly statements are generated on the 1st of each month</li>
                <li>Statements include all completed transactions</li>
                <li>You can generate custom statements for any date range</li>
                <li>All statements are stored for 7 years</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        {/* Statement Preview */}
        <div className="lg:col-span-2">
          {selectedStatement ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {getStatementTypeName(selectedStatement.statementType)} Statement
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(selectedStatement.periodStart)} - {formatDate(selectedStatement.periodEnd)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(selectedStatement)}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownload(selectedStatement)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* PDF Preview */}
                <div className="bg-gray-100 rounded-lg h-[600px] flex items-center justify-center">
                  <iframe
                    src={selectedStatement.documentUrl}
                    className="w-full h-full rounded-lg"
                    title="Statement Preview"
                  />
                </div>

                {/* Statement Details */}
                <div className="mt-6 grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Generated</p>
                    <p className="font-medium">{formatDate(selectedStatement.generatedAt)}</p>
                  </div>
                  {selectedStatement.sentAt && (
                    <div>
                      <p className="text-sm text-gray-600">Sent</p>
                      <p className="font-medium">{formatDate(selectedStatement.sentAt)}</p>
                    </div>
                  )}
                  {selectedStatement.viewedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Viewed</p>
                      <p className="font-medium">{formatDate(selectedStatement.viewedAt)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <StatementStatusBadge status={selectedStatement.status} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">Select a statement to view</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose a statement from the list to preview or download
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Sub-components
interface StatementListItemProps {
  statement: Statement;
  selected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onEmail: () => void;
  isDownloading: boolean;
  isSending: boolean;
}

function StatementListItem({
  statement,
  selected,
  onSelect,
  onDownload,
  onEmail,
  isDownloading,
  isSending,
}: StatementListItemProps) {
  return (
    <div
      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
        selected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <p className="font-medium text-gray-900 truncate">
              {getStatementTypeName(statement.statementType)}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-gray-500" />
            <p className="text-sm text-gray-600">
              {formatDate(statement.periodStart)} - {formatDate(statement.periodEnd)}
            </p>
          </div>
          <div className="mt-2">
            <StatementStatusBadge status={statement.status} />
          </div>
        </div>
        <div className="flex flex-col gap-1 ml-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            disabled={isDownloading}
            className="h-8 w-8 p-0"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEmail();
            }}
            disabled={isSending}
            className="h-8 w-8 p-0"
          >
            <Mail className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatementStatusBadge({ status }: { status: string }) {
  const variants: Record<string, any> = {
    GENERATED: { label: 'Generated', variant: 'secondary' },
    SENT: { label: 'Sent', variant: 'warning' },
    VIEWED: { label: 'Viewed', variant: 'success' },
  };

  const config = variants[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
}

function getStatementTypeName(type: string): string {
  const names: Record<string, string> = {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    ANNUAL: 'Annual',
    CUSTOM: 'Custom',
  };
  return names[type] || type;
}

function StatementViewerSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-[600px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StatementViewer;

