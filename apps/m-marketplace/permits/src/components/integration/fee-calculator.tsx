// ============================================================
// FEE CALCULATOR
// Calculate permit fees based on jurisdiction rules
// ============================================================

'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@permits/src/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@permits/src/lib/utils';

interface FeeCalculatorProps {
  jurisdictionId: string;
  permitType: string;
  valuation: number;
}

export function FeeCalculator({
  jurisdictionId,
  permitType,
  valuation,
}: FeeCalculatorProps) {
  const supabase = createClient();

  const { data: jurisdiction, isLoading } = useQuery({
    queryKey: ['jurisdiction', jurisdictionId],
    queryFn: async () => {
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

  const calculateFee = () => {
    if (!jurisdiction?.feeSchedule) return null;

    try {
      const feeSchedule = jurisdiction.feeSchedule as any;
      
      // Simple fee calculation (would be more complex in production)
      // Example: base fee + (valuation * percentage)
      const baseFee = feeSchedule.baseFee || 100;
      const percentage = feeSchedule.percentage || 0.01; // 1%
      const calculated = baseFee + valuation * percentage;

      return {
        baseFee,
        percentageFee: valuation * percentage,
        total: calculated,
        expeditedFee: calculated * 0.2, // 20% markup for expedited
      };
    } catch (error) {
      console.error('Fee calculation error:', error);
      return null;
    }
  };

  const fees = calculateFee();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!fees) {
    return (
      <div className="text-sm text-gray-500">
        Fee calculation not available for this jurisdiction
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Estimated Fees</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Fee:</span>
            <span className="font-medium">{formatCurrency(fees.baseFee)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Valuation Fee ({fees.percentageFee / valuation * 100}%):</span>
            <span className="font-medium">{formatCurrency(fees.percentageFee)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Total Fee:</span>
            <span className="font-bold text-lg">{formatCurrency(fees.total)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Expedited Processing (optional):</span>
            <span>+{formatCurrency(fees.expeditedFee)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
