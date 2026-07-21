// ============================================================
// WIZARD STEP 3: JURISDICTION
// ============================================================

'use client';

import { UseFormReturn } from 'react-hook-form';
import { WizardFormData } from '../application-wizard';
import { Label } from '@permits/src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@permits/src/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@permits/src/lib/supabase/client';
import { JurisdictionSelector } from '@permits/src/components/integration/jurisdiction-selector';
import { FeeCalculator } from '@permits/src/components/integration/fee-calculator';
import { Card, CardContent } from '@permits/src/components/ui/card';

interface Step3JurisdictionProps {
  form: UseFormReturn<WizardFormData>;
}

export function Step3Jurisdiction({ form }: Step3JurisdictionProps) {
  const { watch, setValue, formState: { errors } } = form;
  const supabase = createClient();
  const selectedJurisdictionId = watch('jurisdictionId');
  const permitType = watch('permitType');
  const valuation = watch('valuation');

  // Fetch jurisdictions
  const { data: jurisdictions } = useQuery({
    queryKey: ['jurisdictions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Jurisdiction')
        .select('id, name, code, state, county, city')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Jurisdiction Selection</h2>
        <p className="text-gray-600">
          Select the jurisdiction where this permit will be submitted
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="jurisdictionId">Jurisdiction *</Label>
          <JurisdictionSelector
            value={selectedJurisdictionId || ''}
            onValueChange={(value) => setValue('jurisdictionId', value)}
            jurisdictions={jurisdictions || []}
          />
          {errors.jurisdictionId && (
            <p className="text-sm text-red-600">{errors.jurisdictionId.message}</p>
          )}
        </div>

        {selectedJurisdictionId && permitType && valuation && (
          <Card>
            <CardContent className="pt-6">
              <FeeCalculator
                jurisdictionId={selectedJurisdictionId}
                permitType={permitType}
                valuation={valuation}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
