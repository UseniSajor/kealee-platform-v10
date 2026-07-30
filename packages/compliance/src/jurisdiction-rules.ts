export type JurisdictionOutcome = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE'
  | 'MISSING_DATA' | 'PROFESSIONAL_DETERMINATION_REQUIRED';

export interface RuleAuthority {
  agency: string;
  title: string;
  url: string;
  effectiveDate?: string;
  lastVerifiedDate: string;
}
export interface JurisdictionCheckResult {
  ruleKey: string;
  outcome: JurisdictionOutcome;
  requirement: string;
  inputs: Record<string, unknown>;
  authority: RuleAuthority;
  responsibleDiscipline: string;
  remediation?: string;
  blocksSubmission: boolean;
}
export interface JurisdictionRulePack<TInput> {
  jurisdictionCode: string;
  version: string;
  evaluate(input: TInput): JurisdictionCheckResult[];
}

export function canLabelPermitReady(results: JurisdictionCheckResult[]): boolean {
  return !results.some((check) => check.blocksSubmission || check.outcome === 'FAIL'
    || check.outcome === 'MISSING_DATA' || check.outcome === 'PROFESSIONAL_DETERMINATION_REQUIRED');
}
