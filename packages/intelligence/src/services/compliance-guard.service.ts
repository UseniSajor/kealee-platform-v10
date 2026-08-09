import type {
  ComplianceGuardService,
  ComplianceCheckInput,
  ComplianceCheckResult,
} from './interfaces.js'

const PROTECTED_CLASS_TERMS = [
  'race',
  'religion',
  'health',
  'disability',
  'family status',
  'ethnicity',
  'national origin',
  'sexual orientation',
  'gender identity',
  'pregnancy',
  'age discrimination',
]

const PROHIBITED_GUARANTEE_PATTERNS = [
  /guaranteed\s+permit/i,
  /permit\s+approved/i,
  /100%\s+approval/i,
  /legal\s+guarantee/i,
  /pre-?approved/i,
  /credit\s+score/i,
  /loan\s+approved/i,
]

export class ComplianceGuard implements ComplianceGuardService {
  async check(input: ComplianceCheckInput): Promise<ComplianceCheckResult> {
    const violations: string[] = []
    const flags: string[] = []

    const textFields = [
      input.audienceSegment,
      input.recommendedMessageAngle,
      ...(input.crmTags ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    for (const term of PROTECTED_CLASS_TERMS) {
      if (textFields.includes(term)) {
        violations.push(`Protected-class targeting detected: ${term}`)
      }
    }

    for (const pattern of PROHIBITED_GUARANTEE_PATTERNS) {
      if (input.recommendedMessageAngle && pattern.test(input.recommendedMessageAngle)) {
        violations.push('Prohibited permit/legal guarantee in message angle')
      }
    }

    if (
      input.paidAdSpendRecommendation != null &&
      input.approvedAdSpendThreshold != null &&
      input.paidAdSpendRecommendation > input.approvedAdSpendThreshold
    ) {
      flags.push('paid_ad_spend_above_threshold')
    }

    if (input.targetingCriteria) {
      const sensitiveKeys = ['ssn', 'health', 'medical', 'disability', 'religion', 'race']
      for (const key of Object.keys(input.targetingCriteria)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          violations.push(`Sensitive personal data in targeting: ${key}`)
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations,
      flags,
    }
  }
}

export const complianceGuard = new ComplianceGuard()
