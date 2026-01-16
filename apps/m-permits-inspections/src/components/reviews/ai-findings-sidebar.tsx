// ============================================================
// AI FINDINGS SIDEBAR - Severity indicators and one-click approval
// ============================================================

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle,
  MapPin,
  Clock,
  Check,
  X
} from 'lucide-react';

interface AIFinding {
  id: string;
  type: 'code_violation' | 'missing_element' | 'dimension_issue' | 'inconsistency';
  severity: 'critical' | 'major' | 'minor' | 'info';
  description: string;
  location?: {
    page: number;
    x?: number;
    y?: number;
  };
  codeReference?: string;
  suggestedFix?: string;
  confidence: number; // 0-1
  approved?: boolean;
  dismissed?: boolean;
}

interface AIFindingsSidebarProps {
  findings?: AIFinding[];
  reviewId: string;
  onApproveFinding: (findingId: string) => void;
}

export function AIFindingsSidebar({
  findings = [],
  reviewId,
  onApproveFinding,
}: AIFindingsSidebarProps) {
  const [dismissedFindings, setDismissedFindings] = useState<Set<string>>(new Set());

  const severityConfig = {
    critical: {
      icon: AlertCircle,
      color: 'destructive',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    major: {
      icon: AlertTriangle,
      color: 'secondary',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    minor: {
      icon: Info,
      color: 'default',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    info: {
      icon: Info,
      color: 'outline',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  };

  const handleApprove = async (findingId: string) => {
    onApproveFinding(findingId);
    // Mark as approved
    await fetch(`/api/reviews/${reviewId}/findings/${findingId}/approve`, {
      method: 'POST',
    });
  };

  const handleDismiss = async (findingId: string) => {
    setDismissedFindings(new Set(dismissedFindings).add(findingId));
    await fetch(`/api/reviews/${reviewId}/findings/${findingId}/dismiss`, {
      method: 'POST',
    });
  };

  const visibleFindings = findings.filter(f => !dismissedFindings.has(f.id));
  const criticalFindings = visibleFindings.filter(f => f.severity === 'critical');
  const majorFindings = visibleFindings.filter(f => f.severity === 'major');
  const minorFindings = visibleFindings.filter(f => f.severity === 'minor');
  const infoFindings = visibleFindings.filter(f => f.severity === 'info');

  return (
    <div className="p-4 space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Findings Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Critical</span>
            <Badge variant="destructive">{criticalFindings.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Major</span>
            <Badge variant="secondary">{majorFindings.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Minor</span>
            <Badge variant="default">{minorFindings.length}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Info</span>
            <Badge variant="outline">{infoFindings.length}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="space-y-3">
        {visibleFindings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No AI findings</p>
          </div>
        ) : (
          [...criticalFindings, ...majorFindings, ...minorFindings, ...infoFindings].map(
            (finding) => {
              const config = severityConfig[finding.severity];
              const Icon = config.icon;

              return (
                <Card
                  key={finding.id}
                  className={`${config.bgColor} ${config.borderColor} border-2`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 text-${config.color}`} />
                        <Badge variant={config.color as any}>{finding.severity}</Badge>
                        <Badge variant="outline">
                          {Math.round(finding.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(finding.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(finding.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm font-medium mb-2">{finding.description}</p>

                    {finding.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3" />
                        <span>Page {finding.location.page}</span>
                      </div>
                    )}

                    {finding.codeReference && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Code: {finding.codeReference}
                      </div>
                    )}

                    {finding.suggestedFix && (
                      <div className="mt-2 p-2 bg-white rounded border">
                        <p className="text-xs font-medium mb-1">Suggested Fix:</p>
                        <p className="text-xs text-muted-foreground">
                          {finding.suggestedFix}
                        </p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => {
                        // Navigate to location in PDF
                        if (finding.location) {
                          // Scroll to page and highlight
                          console.log('Navigate to:', finding.location);
                        }
                      }}
                    >
                      Go to Location
                    </Button>
                  </CardContent>
                </Card>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
