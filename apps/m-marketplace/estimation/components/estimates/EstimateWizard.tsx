'use client';

import { useState } from 'react';
import { Card, CardContent } from '@estimation/components/ui/card';
import { Button } from '@estimation/components/ui/button';
import { Progress } from '@estimation/components/ui/progress';
import { Check } from 'lucide-react';
import { cn } from '@estimation/lib/utils';

// Import wizard steps
import { BasicInfoStep } from './wizard/BasicInfoStep';
import { ScopeAnalysisStep } from './wizard/ScopeAnalysisStep';
import { BuildEstimateStep } from './wizard/BuildEstimateStep';
import { SettingsStep } from './wizard/SettingsStep';
import { ReviewStep } from './wizard/ReviewStep';

const steps = [
  { id: 1, name: 'Basic Information', component: BasicInfoStep },
  { id: 2, name: 'Scope Analysis', component: ScopeAnalysisStep },
  { id: 3, name: 'Build Estimate', component: BuildEstimateStep },
  { id: 4, name: 'Settings & Markup', component: SettingsStep },
  { id: 5, name: 'Review & Export', component: ReviewStep },
];

interface EstimateWizardProps {
  onComplete: (data: any) => void;
  isSubmitting?: boolean;
}

export function EstimateWizard({ onComplete, isSubmitting = false }: EstimateWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [estimateData, setEstimateData] = useState<any>({
    basicInfo: {},
    scopeAnalysis: {},
    sections: [],
    settings: {},
  });

  const progress = (currentStep / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep - 1].component;

  const handleNext = (stepData: any) => {
    setEstimateData((prev: any) => ({
      ...prev,
      ...stepData,
    }));

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit
      onComplete({ ...estimateData, ...stepData });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <Progress value={progress} className="h-2" />

            {/* Step Indicators */}
            <div className="flex justify-between">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center gap-2 flex-1',
                    step.id !== steps.length && 'relative'
                  )}
                >
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                      step.id < currentStep
                        ? 'bg-primary text-primary-foreground'
                        : step.id === currentStep
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Step Name */}
                  <span
                    className={cn(
                      'text-xs font-medium text-center hidden sm:block',
                      step.id === currentStep
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.name}
                  </span>

                  {/* Connector Line */}
                  {step.id !== steps.length && (
                    <div className="absolute top-4 left-[calc(50%+1rem)] right-[calc(-50%+1rem)] h-0.5 bg-muted hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-8">
          <CurrentStepComponent
            data={estimateData}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 1}
            isLast={currentStep === steps.length}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
