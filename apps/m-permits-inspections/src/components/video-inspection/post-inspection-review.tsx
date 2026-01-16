'use client';

import React, {useState} from 'react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
  FileText,
  Video,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
} from 'lucide-react';
import {
  VideoInspectionReport,
  Deficiency,
  VideoReference,
  ComplianceStatus,
} from '@/types/video-inspection';

interface PostInspectionReviewProps {
  report: VideoInspectionReport;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: (report: VideoInspectionReport) => void;
}

export function PostInspectionReview({
  report,
  onApprove,
  onReject,
  onEdit,
}: PostInspectionReviewProps) {
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency | null>(null);

  const getComplianceBadgeColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-700';
      case 'non-compliant':
        return 'bg-red-100 text-red-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'major':
        return 'bg-orange-100 text-orange-700';
      case 'minor':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inspection Report Review</h1>
          <p className="text-gray-500 mt-1">
            Generated {report.generatedAt.toLocaleDateString()} by {report.generatedBy}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={getComplianceBadgeColor(report.complianceStatus)}>
            {report.complianceStatus.toUpperCase()}
          </Badge>
          <Button variant="outline" onClick={() => onEdit(report)}>
            Edit Report
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <p className="text-gray-700">{report.summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-red-600">
              {report.deficiencies.filter((d) => d.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-500">Critical Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {report.deficiencies.filter((d) => d.severity === 'major').length}
            </div>
            <div className="text-sm text-gray-500">Major Issues</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {report.deficiencies.filter((d) => d.severity === 'minor').length}
            </div>
            <div className="text-sm text-gray-500">Minor Issues</div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="deficiencies" className="w-full">
        <TabsList>
          <TabsTrigger value="deficiencies">
            Deficiencies ({report.deficiencies.length})
          </TabsTrigger>
          <TabsTrigger value="video">Video Evidence</TabsTrigger>
          <TabsTrigger value="recommendations">
            Recommendations ({report.recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        {/* Deficiencies Tab */}
        <TabsContent value="deficiencies" className="space-y-4">
          {report.deficiencies.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">
              No deficiencies found. Inspection is compliant.
            </Card>
          ) : (
            report.deficiencies.map((deficiency) => (
              <Card
                key={deficiency.id}
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedDeficiency(deficiency)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityBadgeColor(deficiency.severity)}>
                        {deficiency.severity}
                      </Badge>
                      <span className="text-sm font-medium">{deficiency.category}</span>
                      {deficiency.aiDetected && (
                        <Badge variant="outline" className="text-xs">
                          AI Detected
                        </Badge>
                      )}
                      {deficiency.inspectorConfirmed && (
                        <Badge variant="outline" className="text-xs bg-green-50">
                          Confirmed
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{deficiency.description}</p>
                    {deficiency.codeReference && (
                      <p className="text-sm text-gray-500">
                        Code: {deficiency.codeReference}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTimestamp(deficiency.videoTimestamp)}
                      </div>
                      {deficiency.screenshotUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(deficiency.screenshotUrl, '_blank');
                          }}>
                          <Eye className="w-4 h-4 mr-1" />
                          View Screenshot
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Video Evidence Tab */}
        <TabsContent value="video" className="space-y-4">
          {report.videoReferences.map((ref) => (
            <Card key={ref.timestamp} className="p-4">
              <div className="flex items-start gap-4">
                {ref.screenshotUrl && (
                  <img
                    src={ref.screenshotUrl}
                    alt={`Evidence at ${formatTimestamp(ref.timestamp)}`}
                    className="w-32 h-24 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{formatTimestamp(ref.timestamp)}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{ref.description}</p>
                  {ref.findings.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Findings:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {ref.findings.map((finding, index) => (
                          <li key={index}>{finding}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {report.recommendations.map((recommendation, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <p className="text-gray-700">{recommendation}</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments" className="space-y-4">
          {report.attachments.map((attachment) => (
            <Card key={attachment.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {attachment.type === 'video' ? (
                    <Video className="w-5 h-5 text-blue-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <p className="font-medium">{attachment.description}</p>
                    {attachment.timestamp && (
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(attachment.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(attachment.url, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onReject('Needs revision')}>
          Reject
        </Button>
        <Button onClick={onApprove}>Approve Report</Button>
      </div>
    </div>
  );
}
