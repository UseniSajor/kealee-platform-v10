/**
 * Expedited Fee Calculator Service
 * Premium fee calculation (15-25% of permit cost)
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface ExpeditedFeeCalculation {
  permitId: string;
  basePermitFee: number;
  expeditedFee: number;
  expeditedFeePercentage: number; // 15-25%
  totalFee: number;
  serviceLevel: 'STANDARD' | 'EXPEDITED' | 'RUSH';
  turnaroundTime: number; // hours
  guarantee: string;
}

export interface ExpeditedFeeOptions {
  serviceLevel: 'EXPEDITED' | 'RUSH';
  basePermitFee: number;
  jurisdictionId?: string;
}

export class ExpeditedFeeCalculatorService {
  /**
   * Calculate expedited fee
   */
  async calculateExpeditedFee(
    permitId: string,
    options: ExpeditedFeeOptions
  ): Promise<ExpeditedFeeCalculation> {
    const supabase = createClient();

    // Get permit details
    const {data: permit} = await supabase
      .from('Permit')
      .select('feeAmount, jurisdictionId')
      .eq('id', permitId)
      .single();

    const baseFee = options.basePermitFee || permit?.feeAmount || 0;

    // Determine fee percentage based on service level
    let feePercentage: number;
    let turnaroundTime: number;
    let guarantee: string;

    if (options.serviceLevel === 'RUSH') {
      feePercentage = 25; // 25% for rush
      turnaroundTime = 48; // 48 hours
      guarantee = '48-hour review guarantee';
    } else {
      // EXPEDITED
      feePercentage = 20; // 20% for expedited (can be 15-25% based on jurisdiction)
      turnaroundTime = 72; // 72 hours
      guarantee = '72-hour review guarantee';
    }

    // Check jurisdiction-specific rates
    if (permit?.jurisdictionId) {
      const {data: jurisdiction} = await supabase
        .from('Jurisdiction')
        .select('settings')
        .eq('id', permit.jurisdictionId)
        .single();

      if (jurisdiction?.settings) {
        const settings = jurisdiction.settings as any;
        if (settings.expeditedFeePercentage) {
          feePercentage = settings.expeditedFeePercentage;
        }
        if (settings.expeditedTurnaroundHours) {
          turnaroundTime = settings.expeditedTurnaroundHours;
        }
      }
    }

    const expeditedFee = Math.round((baseFee * feePercentage) / 100);
    const totalFee = baseFee + expeditedFee;

    return {
      permitId,
      basePermitFee: baseFee,
      expeditedFee,
      expeditedFeePercentage: feePercentage,
      totalFee,
      serviceLevel: options.serviceLevel,
      turnaroundTime,
      guarantee,
    };
  }

  /**
   * Get expedited fee options
   */
  getExpeditedFeeOptions(basePermitFee: number): Array<{
    serviceLevel: 'EXPEDITED' | 'RUSH';
    feePercentage: number;
    fee: number;
    turnaroundTime: number;
    guarantee: string;
  }> {
    return [
      {
        serviceLevel: 'EXPEDITED',
        feePercentage: 20,
        fee: Math.round((basePermitFee * 20) / 100),
        turnaroundTime: 72,
        guarantee: '72-hour review guarantee',
      },
      {
        serviceLevel: 'RUSH',
        feePercentage: 25,
        fee: Math.round((basePermitFee * 25) / 100),
        turnaroundTime: 48,
        guarantee: '48-hour review guarantee',
      },
    ];
  }
}

// Singleton instance
export const expeditedFeeCalculatorService = new ExpeditedFeeCalculatorService();
