// ============================================================
// PERMIT APPLICATION WIZARD
// Multi-step wizard for permit applications
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Save, AlertCircle } from 'lucide-react';
import { Step1ProjectInfo } from './wizard-steps/step1-project-info';
import { Step2PermitType } from './wizard-steps/step2-permit-type';
import { Step3Jurisdiction } from './wizard-steps/step3-jurisdiction';
import { Step4Documents } from './wizard-steps/step4-documents';
import { Step5Review } from './wizard-steps/step5-review';
import { applicationStorageService } from '@/services/permit-application/application-storage';

const wizardSchema = z.object({
  // Step 1: Project Info
  projectId: z.string().min(1, 'Project is required'),
  propertyId: z.string().min(1, 'Property is required'),
  address: z.string().min(1, 'Address is required'),
  parcelNumber: z.string().optional(),
  zoning: z.string().optional(),
  
  // Step 2: Permit Type
  permitType: z.string().min(1, 'Permit type is required'),
  subtype: z.string().optional(),
  scope: z.string().min(1, 'Scope is required'),
  valuation: z.number().min(0, 'Valuation must be positive'),
  squareFootage: z.number().optional(),
  
  // Step 3: Jurisdiction
  jurisdictionId: z.string().min(1, 'Jurisdiction is required'),
  
  // Step 4: Documents
  plans: z.array(z.string()).optional(),
  calculations: z.array(z.string()).optional(),
  reports: z.array(z.string()).optional(),
  
  // Applicant Info
  applicantName: z.string().min(1, 'Name is required'),
  applicantEmail: z.string().email('Invalid email'),
  applicantPhone: z.string().min(1, 'Phone is required'),
  applicantType: z.string().min(1, 'Applicant type is required'),
});

export type WizardFormData = z.infer<typeof wizardSchema>;

const steps = [
  { id: 1, title: 'Project Info', component: Step1ProjectInfo },
  { id: 2, title: 'Permit Type', component: Step2PermitType },
  { id: 3, title: 'Jurisdiction', component: Step3Jurisdiction },
  { id: 4, title: 'Documents', component: Step4Documents },
  { id: 5, title: 'Review', component: Step5Review },
];

interface PermitApplicationWizardProps {
  draftId?: string; // Resume from draft
  onSave?: (draftId: string) => void;
}

export function PermitApplicationWizard({draftId, onSave}: PermitApplicationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(draftId || null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      plans: [],
      calculations: [],
      reports: [],
    },
  });

  // Load draft if provided
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const cleanup = applicationStorageService.startAutoSave(
      'current-user-id', // Get from auth
      () => form.getValues(),
      () => currentStep,
      30000 // 30 seconds
    );

    return cleanup;
  }, [autoSaveEnabled, currentStep, form]);

  const loadDraft = async (id: string) => {
    try {
      const draft = await applicationStorageService.getSavedApplication(id);
      if (draft) {
        // Restore form data
        Object.keys(draft.data).forEach(key => {
          form.setValue(key as any, (draft.data as any)[key]);
        });
        setCurrentStep(draft.currentStep);
        setSavedDraftId(draft.id);
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const handleSave = async () => {
    try {
      const data = form.getValues();
      const saved = await applicationStorageService.saveApplication(
        'current-user-id', // Get from auth
        data,
        currentStep
      );
      setSavedDraftId(saved.id);
      setLastSaved(new Date());
      onSave?.(saved.id);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const progress = (currentStep / steps.length) * 100;

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: WizardFormData) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Map wizard form data to backend /permits/applications schema
      const payload = {
        jurisdictionId: data.jurisdictionId,
        permitType: (data.permitType || 'BUILDING').toUpperCase(),
        projectData: {
          address: data.address,
          parcelId: data.parcelNumber || undefined,
          valuation: data.valuation || 0,
          scope: data.scope || '',
          ownerName: data.applicantName || '',
          squareFootage: data.squareFootage || undefined,
        },
        documents: [
          ...(data.plans || []).map(url => ({ type: 'plan', url })),
          ...(data.calculations || []).map(url => ({ type: 'calculations', url })),
          ...(data.reports || []).map(url => ({ type: 'report', url })),
        ],
        expedited: false,
      };

      const response = await fetch(`${API_URL}/permits/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Submission failed (HTTP ${response.status})`);
      }

      const result = await response.json();

      // Clean up saved draft after successful submission
      if (savedDraftId) {
        try {
          await applicationStorageService.deleteApplication(savedDraftId);
        } catch {
          // Ignore cleanup errors
        }
      }

      // Redirect to the permit status page
      window.location.href = `/permits/status/${result.id || result.application?.id}`;
    } catch (error) {
      console.error('Submission error:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>New Permit Application</CardTitle>
          <CardDescription>
            Complete all steps to submit your permit application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    step.id <= currentStep ? 'text-primary' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                      step.id < currentStep
                        ? 'bg-primary text-white'
                        : step.id === currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step.id < currentStep ? '✓' : step.id}
                  </div>
                  <p className="text-xs mt-1">{step.title}</p>
                </div>
              ))}
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Content */}
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="min-h-[400px]">
              <CurrentStepComponent form={form} />
            </div>

            {/* Save & Resume Indicator */}
            {savedDraftId && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Progress saved {lastSaved ? `at ${lastSaved.toLocaleTimeString()}` : ''}
                </span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Progress
                </Button>
              </div>
              {currentStep < steps.length ? (
                <Button type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function getFieldsForStep(step: number): (keyof WizardFormData)[] {
  switch (step) {
    case 1:
      return ['projectId', 'propertyId', 'address'];
    case 2:
      return ['permitType', 'scope', 'valuation'];
    case 3:
      return ['jurisdictionId'];
    case 4:
      return [];
    case 5:
      return [];
    default:
      return [];
  }
}
