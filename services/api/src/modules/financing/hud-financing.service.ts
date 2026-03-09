import { prismaAny } from '../../utils/prisma-helper';

/**
 * HUD Financing Service — Phase 5
 * FHA eligibility, HOME program, Innovation Fund, CDBG, pro forma generation.
 * Act Alignment: FHA Multifamily Loan Limits, HOME Program Modernization, $200M Innovation Fund.
 */

interface ProjectFinancials {
  totalDevelopmentCost: number;
  landCost: number;
  constructionCost: number;
  softCosts: number;
  totalUnits: number;
  affordableUnits: number;
  marketRateUnits: number;
  avgAffordableRent: number;
  avgMarketRent: number;
  operatingExpenseRatio: number;
  amiTarget: number; // % of Area Median Income (e.g., 80 = 80% AMI)
  state: string;
  housingType: string;
}

// FHA multifamily loan limits by unit count (updated per Act)
const FHA_LOAN_LIMITS: Record<string, number> = {
  '1': 420680,
  '2': 538650,
  '3': 651050,
  '4': 809150,
  'elevator': 87897, // per unit for elevator buildings (5+)
  'non_elevator': 75836, // per unit for non-elevator (5+)
};

// HOME program income limits (simplified — 80% AMI threshold)
const HOME_AMI_THRESHOLD = 80;

export class HUDFinancingService {
  /**
   * Check FHA multifamily eligibility
   */
  async checkFHAEligibility(financials: ProjectFinancials, userId: string) {
    const prisma = prismaAny();
    const { totalUnits, totalDevelopmentCost, housingType } = financials;

    let maxLoanAmount: number;
    if (totalUnits <= 4) {
      maxLoanAmount = FHA_LOAN_LIMITS[String(totalUnits)] || FHA_LOAN_LIMITS['4'];
    } else {
      const isElevator = totalUnits >= 20;
      const perUnit = isElevator ? FHA_LOAN_LIMITS['elevator'] : FHA_LOAN_LIMITS['non_elevator'];
      maxLoanAmount = perUnit * totalUnits;
    }

    const ltv = totalDevelopmentCost > 0 ? (maxLoanAmount / totalDevelopmentCost) * 100 : 0;
    const eligible = ltv <= 85 && totalUnits >= 2;

    const result = {
      eligible,
      program: totalUnits <= 4 ? 'FHA 203(b)' : 'FHA 221(d)(4)',
      maxLoanAmount,
      estimatedLTV: Math.min(ltv, 85),
      totalDevelopmentCost,
      requirements: [
        'HUD-approved lender required',
        'Davis-Bacon prevailing wages for 12+ units',
        'Environmental review (NEPA) required',
        totalUnits >= 5 ? 'HUD Map Application required' : 'Standard FHA application',
      ],
      reasons: [] as string[],
    };

    if (!eligible) {
      if (totalUnits < 2) result.reasons.push('FHA multifamily requires 2+ units');
      if (ltv > 85) result.reasons.push(`LTV ${ltv.toFixed(1)}% exceeds 85% maximum`);
    }

    // Store eligibility check
    await prisma.hUDEligibilityCheck.create({
      data: {
        userId,
        checkType: 'FHA',
        housingType,
        totalUnits,
        totalDevelopmentCost,
        affordableUnits: financials.affordableUnits,
        amiTarget: financials.amiTarget,
        eligible,
        result: result as any,
      },
    });

    return result;
  }

  /**
   * Check HOME program eligibility (workforce housing)
   */
  async checkHOMEEligibility(financials: ProjectFinancials, userId: string) {
    const { amiTarget, affordableUnits, totalUnits } = financials;

    const affordablePercent = totalUnits > 0 ? (affordableUnits / totalUnits) * 100 : 0;
    const meetsIncomeTarget = amiTarget <= HOME_AMI_THRESHOLD;
    const meetsAffordableThreshold = affordablePercent >= 20;
    const eligible = meetsIncomeTarget && meetsAffordableThreshold;

    const maxSubsidy = affordableUnits * 40000; // Simplified HOME per-unit subsidy
    const affordabilityPeriod = affordablePercent >= 50 ? 20 : 15; // years

    const result = {
      eligible,
      program: 'HOME Investment Partnerships',
      maxSubsidyAmount: eligible ? maxSubsidy : 0,
      affordabilityPeriod,
      affordablePercent: affordablePercent.toFixed(1),
      amiTarget,
      requirements: [
        `Income target: ${amiTarget}% AMI (max ${HOME_AMI_THRESHOLD}%)`,
        `Affordable units: ${affordableUnits} of ${totalUnits} (${affordablePercent.toFixed(0)}%)`,
        `${affordabilityPeriod}-year affordability covenant required`,
        'Match funding may be required (25% non-federal)',
      ],
      reasons: [] as string[],
    };

    if (!meetsIncomeTarget) result.reasons.push(`AMI target ${amiTarget}% exceeds ${HOME_AMI_THRESHOLD}% maximum`);
    if (!meetsAffordableThreshold) result.reasons.push(`Need 20%+ affordable units (currently ${affordablePercent.toFixed(0)}%)`);

    const prisma = prismaAny();
    await prisma.hUDEligibilityCheck.create({
      data: {
        userId,
        checkType: 'HOME',
        housingType: financials.housingType,
        totalUnits,
        totalDevelopmentCost: financials.totalDevelopmentCost,
        affordableUnits,
        amiTarget,
        eligible,
        result: result as any,
      },
    });

    return result;
  }

  /**
   * Check Innovation Fund eligibility (Sec 209 — $200M)
   */
  async checkInnovationFundEligibility(financials: ProjectFinancials, userId: string) {
    const { housingType, affordableUnits, totalUnits } = financials;

    const eligibleTypes = ['ADU', 'DUPLEX', 'TRIPLEX', 'FOURPLEX', 'TOWNHOUSE', 'SMALL_APARTMENT', 'MODULAR', 'MANUFACTURED'];
    const isEligibleType = eligibleTypes.includes(housingType);
    const affordablePercent = totalUnits > 0 ? (affordableUnits / totalUnits) * 100 : 0;
    const hasAffordableComponent = affordablePercent >= 10;
    const eligible = isEligibleType && hasAffordableComponent;

    const maxGrant = eligible ? Math.min(totalUnits * 25000, 500000) : 0;

    return {
      eligible,
      program: 'Housing Innovation Fund (Sec 209)',
      maxGrantAmount: maxGrant,
      fundSize: '$200M annual',
      eligibleHousingTypes: eligibleTypes,
      requirements: [
        'Missing-middle housing type required',
        '10%+ affordable units at 80% AMI or below',
        'Pattern book design preferred (bonus points)',
        'Transit-oriented location preferred',
        'Innovative construction methods preferred (modular, 3D print)',
      ],
      reasons: !eligible ? [
        ...(!isEligibleType ? [`Housing type ${housingType} not eligible — must be missing-middle`] : []),
        ...(!hasAffordableComponent ? [`Need 10%+ affordable units (currently ${affordablePercent.toFixed(0)}%)`] : []),
      ] : [],
    };
  }

  /**
   * Check CDBG eligibility
   */
  async checkCDBGEligibility(financials: ProjectFinancials) {
    const { amiTarget, affordableUnits, totalUnits } = financials;

    const affordablePercent = totalUnits > 0 ? (affordableUnits / totalUnits) * 100 : 0;
    const meetsLMI = amiTarget <= 80; // Low-Moderate Income threshold
    const meetsBenefit = affordablePercent >= 51; // 51% benefit test
    const eligible = meetsLMI && meetsBenefit;

    return {
      eligible,
      program: 'Community Development Block Grant',
      nationalObjective: meetsBenefit ? 'Low/Moderate Income Area Benefit' : 'Not Met',
      requirements: [
        '51% of units must benefit LMI households',
        'Located in CDBG-eligible jurisdiction',
        'Public benefit documentation required',
        'Environmental review required',
        'Fair housing compliance',
      ],
      affordablePercent: affordablePercent.toFixed(1),
      amiTarget,
      reasons: !eligible ? [
        ...(!meetsLMI ? ['AMI target exceeds 80% threshold'] : []),
        ...(!meetsBenefit ? ['Less than 51% of units benefit LMI households'] : []),
      ] : [],
    };
  }

  /**
   * Generate simplified pro forma
   */
  async generateProForma(financials: ProjectFinancials) {
    const {
      totalDevelopmentCost, totalUnits, affordableUnits, marketRateUnits,
      avgAffordableRent, avgMarketRent, operatingExpenseRatio,
    } = financials;

    const grossAffordableIncome = affordableUnits * avgAffordableRent * 12;
    const grossMarketIncome = marketRateUnits * avgMarketRent * 12;
    const grossPotentialIncome = grossAffordableIncome + grossMarketIncome;
    const vacancyLoss = grossPotentialIncome * 0.05; // 5% vacancy
    const effectiveGrossIncome = grossPotentialIncome - vacancyLoss;
    const operatingExpenses = effectiveGrossIncome * (operatingExpenseRatio / 100);
    const noi = effectiveGrossIncome - operatingExpenses;
    const capRate = totalDevelopmentCost > 0 ? (noi / totalDevelopmentCost) * 100 : 0;

    // Debt service (assume 6.5% rate, 30yr amort, 75% LTV)
    const loanAmount = totalDevelopmentCost * 0.75;
    const monthlyRate = 0.065 / 12;
    const payments = 360;
    const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, payments)) / (Math.pow(1 + monthlyRate, payments) - 1);
    const annualDebtService = monthlyPayment * 12;
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0;
    const cashFlow = noi - annualDebtService;
    const equity = totalDevelopmentCost - loanAmount;
    const cashOnCash = equity > 0 ? (cashFlow / equity) * 100 : 0;

    return {
      totalDevelopmentCost,
      income: {
        grossAffordableIncome,
        grossMarketIncome,
        grossPotentialIncome,
        vacancyLoss,
        effectiveGrossIncome,
      },
      expenses: {
        operatingExpenses,
        operatingExpenseRatio,
      },
      returns: {
        noi,
        capRate: parseFloat(capRate.toFixed(2)),
        loanAmount,
        annualDebtService: Math.round(annualDebtService),
        dscr: parseFloat(dscr.toFixed(2)),
        cashFlow: Math.round(cashFlow),
        equity,
        cashOnCash: parseFloat(cashOnCash.toFixed(2)),
      },
      assumptions: {
        vacancyRate: '5%',
        interestRate: '6.5%',
        amortization: '30 years',
        ltv: '75%',
      },
    };
  }

  /**
   * Get user's eligibility check history
   */
  async getUserChecks(userId: string) {
    const prisma = prismaAny();
    return prisma.hUDEligibilityCheck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}

export const hudFinancingService = new HUDFinancingService();
