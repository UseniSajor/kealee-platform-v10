// ============================================================
// WIZARD STEP 2: PERMIT TYPE
// ============================================================

'use client';

import { UseFormReturn } from 'react-hook-form';
import { WizardFormData } from '../application-wizard';
import { Input } from '@permits/src/components/ui/input';
import { Label } from '@permits/src/components/ui/label';
import { Textarea } from '@permits/src/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@permits/src/components/ui/select';
import { Card } from '@permits/src/components/ui/card';
import { Badge } from '@permits/src/components/ui/badge';
import { useEffect } from 'react';
import { FeeCalculator } from '@permits/src/components/integration/fee-calculator';
import { feeCalculatorService } from '@permits/src/services/permit-application/fee-calculator';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@permits/src/lib/supabase/client';

const PERMIT_TYPES = [
  { value: 'BUILDING', label: 'Building Permit' },
  { value: 'ELECTRICAL', label: 'Electrical Permit' },
  { value: 'PLUMBING', label: 'Plumbing Permit' },
  { value: 'MECHANICAL', label: 'Mechanical Permit' },
  { value: 'FIRE', label: 'Fire Permit' },
  { value: 'GRADING', label: 'Grading Permit' },
  { value: 'DEMOLITION', label: 'Demolition Permit' },
  { value: 'SIGN', label: 'Sign Permit' },
  { value: 'FENCE', label: 'Fence Permit' },
  { value: 'ROOFING', label: 'Roofing Permit' },
  { value: 'HVAC', label: 'HVAC Permit' },
  { value: 'SOLAR', label: 'Solar Permit' },
  { value: 'POOL', label: 'Pool Permit' },
];

const APPLICANT_TYPES = [
  { value: 'OWNER', label: 'Property Owner' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'ARCHITECT', label: 'Architect' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'DESIGN_BUILDER', label: 'Design-Builder' },
  { value: 'DEVELOPER', label: 'Developer' },
];

interface Step2PermitTypeProps {
  form: UseFormReturn<WizardFormData>;
}

// Conditional questions based on permit type
const CONDITIONAL_QUESTIONS: Record<string, Array<{id: string; label: string; type: 'text' | 'number' | 'select'; options?: string[]}>> = {
  BUILDING: [
    {id: 'occupancyType', label: 'Occupancy Type', type: 'select', options: ['Residential', 'Commercial', 'Mixed Use', 'Industrial']},
    {id: 'numberOfStories', label: 'Number of Stories', type: 'number'},
    {id: 'constructionType', label: 'Construction Type', type: 'select', options: ['Type I', 'Type II', 'Type III', 'Type IV', 'Type V']},
  ],
  ELECTRICAL: [
    {id: 'serviceSize', label: 'Electrical Service Size (Amps)', type: 'number'},
    {id: 'newCircuits', label: 'Number of New Circuits', type: 'number'},
    {id: 'panelUpgrade', label: 'Panel Upgrade Required?', type: 'select', options: ['Yes', 'No']},
  ],
  PLUMBING: [
    {id: 'fixtureCount', label: 'Number of New Fixtures', type: 'number'},
    {id: 'waterHeater', label: 'Water Heater Replacement?', type: 'select', options: ['Yes', 'No']},
    {id: 'sewerConnection', label: 'New Sewer Connection?', type: 'select', options: ['Yes', 'No']},
  ],
  MECHANICAL: [
    {id: 'hvacType', label: 'HVAC System Type', type: 'select', options: ['Central Air', 'Heat Pump', 'Furnace', 'Ductless', 'Other']},
    {id: 'tonnage', label: 'System Tonnage', type: 'number'},
    {id: 'ductwork', label: 'New Ductwork Required?', type: 'select', options: ['Yes', 'No']},
  ],
  SOLAR: [
    {id: 'systemSize', label: 'System Size (kW)', type: 'number'},
    {id: 'panelCount', label: 'Number of Panels', type: 'number'},
    {id: 'batteryStorage', label: 'Battery Storage Included?', type: 'select', options: ['Yes', 'No']},
  ],
  POOL: [
    {id: 'poolType', label: 'Pool Type', type: 'select', options: ['In-ground', 'Above-ground']},
    {id: 'poolSize', label: 'Pool Size (gallons)', type: 'number'},
    {id: 'spaIncluded', label: 'Spa Included?', type: 'select', options: ['Yes', 'No']},
  ],
};

export function Step2PermitType({ form }: Step2PermitTypeProps) {
  const { register, formState: { errors }, watch, setValue } = form;
  const supabase = createClient();
  const permitType = watch('permitType');
  const valuation = watch('valuation') || 0;
  const squareFootage = watch('squareFootage');
  const jurisdictionId = watch('jurisdictionId');

  // Get conditional questions for selected permit type
  const conditionalQuestions = permitType ? (CONDITIONAL_QUESTIONS[permitType] || []) : [];

  // Fetch jurisdiction fee schedule
  const { data: jurisdiction } = useQuery({
    queryKey: ['jurisdiction', jurisdictionId],
    queryFn: async () => {
      if (!jurisdictionId) return null;
      const { data, error } = await supabase
        .from('Jurisdiction')
        .select('feeSchedule, name')
        .eq('id', jurisdictionId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!jurisdictionId,
  });

  // Calculate fees
  const fees = jurisdiction && permitType && valuation > 0
    ? feeCalculatorService.calculateFees(
        jurisdiction.feeSchedule || {},
        permitType,
        valuation,
        squareFootage,
        false // expedited
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Permit Type & Scope</h2>
        <p className="text-gray-600">
          Select the type of permit and describe the work to be performed
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="permitType">Permit Type *</Label>
          <Select
            value={watch('permitType') || ''}
            onValueChange={(value) => setValue('permitType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select permit type" />
            </SelectTrigger>
            <SelectContent>
              {PERMIT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.permitType && (
            <p className="text-sm text-red-600">{errors.permitType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtype">Subtype / Description</Label>
          <Input
            id="subtype"
            {...register('subtype')}
            placeholder="e.g., Kitchen Remodel, New Deck, Addition"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="scope">Scope of Work *</Label>
          <Textarea
            id="scope"
            {...register('scope')}
            placeholder="Describe the work to be performed..."
            rows={4}
          />
          {errors.scope && (
            <p className="text-sm text-red-600">{errors.scope.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valuation">Project Valuation ($) *</Label>
            <Input
              id="valuation"
              type="number"
              step="0.01"
              min="0"
              {...register('valuation', { valueAsNumber: true })}
              placeholder="0.00"
            />
            {errors.valuation && (
              <p className="text-sm text-red-600">{errors.valuation.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Total project cost including materials and labor
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="squareFootage">Square Footage</Label>
            <Input
              id="squareFootage"
              type="number"
              {...register('squareFootage', { valueAsNumber: true })}
              placeholder="Optional"
            />
            <p className="text-xs text-gray-500">
              Total square footage of work area
            </p>
          </div>
        </div>

        {/* Conditional Questions */}
        {conditionalQuestions.length > 0 && (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Label className="text-blue-900 mb-3 block">
              Additional Information Required for {permitType} Permit
            </Label>
            <div className="space-y-4">
              {conditionalQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id}>{question.label}</Label>
                  {question.type === 'select' ? (
                    <Select
                      value={watch(question.id as any) || ''}
                      onValueChange={(value) => setValue(question.id as any, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${question.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {question.options?.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={question.id}
                      type={question.type}
                      {...register(question.id as any, question.type === 'number' ? { valueAsNumber: true } : {})}
                      placeholder={`Enter ${question.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Fee Calculation Display */}
        {fees && jurisdictionId && (
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-green-900 font-semibold">Estimated Permit Fees</Label>
              <Badge variant="outline" className="bg-white">
                {jurisdiction?.name || 'Jurisdiction'}
              </Badge>
            </div>
            <div className="space-y-2">
              {fees.breakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.description}:</span>
                  <span className="font-medium">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="font-semibold text-green-900">Total Estimated Fee:</span>
                <span className="font-bold text-lg text-green-900">
                  ${fees.total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Final fee will be calculated upon application review
              </p>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          <Label htmlFor="applicantType">Applicant Type *</Label>
          <Select
            value={watch('applicantType') || ''}
            onValueChange={(value) => setValue('applicantType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select applicant type" />
            </SelectTrigger>
            <SelectContent>
              {APPLICANT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.applicantType && (
            <p className="text-sm text-red-600">{errors.applicantType.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="applicantName">Applicant Name *</Label>
            <Input
              id="applicantName"
              {...register('applicantName')}
              placeholder="Full name"
            />
            {errors.applicantName && (
              <p className="text-sm text-red-600">{errors.applicantName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicantEmail">Email *</Label>
            <Input
              id="applicantEmail"
              type="email"
              {...register('applicantEmail')}
              placeholder="email@example.com"
            />
            {errors.applicantEmail && (
              <p className="text-sm text-red-600">{errors.applicantEmail.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="applicantPhone">Phone *</Label>
          <Input
            id="applicantPhone"
            type="tel"
            {...register('applicantPhone')}
            placeholder="(555) 123-4567"
          />
          {errors.applicantPhone && (
            <p className="text-sm text-red-600">{errors.applicantPhone.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
