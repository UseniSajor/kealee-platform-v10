// packages/ui/src/components/StepIndicator.tsx
// Kealee Platform Step Indicator Component

import React from 'react';
import { cn } from '../lib/utils';

// Simple Check icon component (replace with lucide-react when available)
const CheckIcon = ({ size = 20 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export interface Step {
  id: string;
  title: string;
  subtitle?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center flex-shrink-0">
            {/* Step Circle */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200',
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {index < currentStep ? <CheckIcon size={20} /> : index + 1}
            </div>

            {/* Step Label */}
            <div className="ml-3 hidden md:block">
              <p
                className={cn(
                  'text-sm font-medium',
                  index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                )}
              >
                {step.title}
              </p>
              {step.subtitle && (
                <p className="text-xs text-gray-500">{step.subtitle}</p>
              )}
            </div>
          </div>

          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-0.5 mx-4 transition-all duration-300',
                index < currentStep ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
