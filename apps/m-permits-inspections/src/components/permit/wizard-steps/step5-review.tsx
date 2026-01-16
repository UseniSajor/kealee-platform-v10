// ============================================================
// WIZARD STEP 5: REVIEW & AI PRE-REVIEW
// ============================================================

'use client';

import { UseFormReturn } from 'react-hook-form';
import { WizardFormData } from '../application-wizard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { AIReviewService } from '@kealee/shared-ai';
import { Loader2, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Step5ReviewProps {
  form: UseFormReturn<WizardFormData>;
}

export function Step5Review({ form }: Step5ReviewProps) {
  const [aiReviewing, setAiReviewing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const formData = form.watch();

  const runAIReview = async () => {
    setAiReviewing(true);
    try {
      const aiService = new AIReviewService({
        openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
        jurisdictionConfigs: [],
      });

      const result = await aiService.reviewPermit({
        permitId: 'draft',
        jurisdictionId: formData.jurisdictionId,
        permitType: formData.permitType,
        plans: (formData.plans || []).map((url) => ({ url, type: 'floor_plan' as const })),
        documents: [
          ...(formData.calculations || []).map((url) => ({ url, type: 'calculations' })),
          ...(formData.reports || []).map((url) => ({ url, type: 'reports' })),
        ],
        reviewSource: 'client_side_pre_review',
      });

      if (result.success) {
        setAiResult(result.data);
      }
    } catch (error) {
      console.error('AI review error:', error);
    } finally {
      setAiReviewing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review & Submit</h2>
        <p className="text-gray-600">
          Review your application details and run AI pre-review before submitting
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Application Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Application Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Permit Type</p>
              <p className="font-medium">{formData.permitType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Scope</p>
              <p className="font-medium">{formData.scope}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valuation</p>
              <p className="font-medium">{formatCurrency(formData.valuation || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Applicant</p>
              <p className="font-medium">{formData.applicantName}</p>
              <p className="text-sm text-gray-600">{formData.applicantEmail}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <p className="font-medium">
                {((formData.plans?.length || 0) + 
                  (formData.calculations?.length || 0) + 
                  (formData.reports?.length || 0))} file(s)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI Review */}
        <Card>
          <CardHeader>
            <CardTitle>AI Pre-Review</CardTitle>
            <CardDescription>
              Get instant feedback before submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!aiResult && !aiReviewing && (
              <Button onClick={runAIReview} className="w-full">
                Run AI Review
              </Button>
            )}

            {aiReviewing && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-600">Analyzing application...</span>
              </div>
            )}

            {aiResult && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Score</span>
                  <Badge
                    variant={
                      aiResult.overallScore >= 75
                        ? 'default'
                        : aiResult.overallScore >= 50
                        ? 'secondary'
                        : 'destructive'
                    }
                  >
                    {aiResult.overallScore}/100
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  {aiResult.readyToSubmit ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-600">Ready to submit</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm text-yellow-600">Needs corrections</span>
                    </>
                  )}
                </div>

                {aiResult.planIssues && aiResult.planIssues.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Issues Found:</p>
                    <div className="space-y-1">
                      {aiResult.planIssues.slice(0, 3).map((issue: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <AlertTriangle
                            className={`h-4 w-4 mt-0.5 ${
                              issue.severity === 'critical'
                                ? 'text-red-600'
                                : issue.severity === 'major'
                                ? 'text-orange-600'
                                : 'text-yellow-600'
                            }`}
                          />
                          <span className="text-gray-700">{issue.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiResult.missingDocuments && aiResult.missingDocuments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-600">Missing Documents:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {aiResult.missingDocuments.map((doc: string, i: number) => (
                        <li key={i}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Review Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: 'Project and property information complete', checked: !!formData.projectId },
              { label: 'Permit type and scope clearly described', checked: !!formData.permitType && !!formData.scope },
              { label: 'Jurisdiction selected', checked: !!formData.jurisdictionId },
              { label: 'Required documents uploaded', checked: (formData.plans?.length || 0) > 0 },
              { label: 'Applicant information provided', checked: !!formData.applicantName && !!formData.applicantEmail },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.checked ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className={item.checked ? 'text-gray-700' : 'text-gray-400'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
