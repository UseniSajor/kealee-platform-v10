// ============================================================
// CODE COMPLIANCE - COMPLIANCE CHECKER
// Main compliance checking service
// ============================================================

import { CodeParser } from './code-parser';
import { RuleEngine } from './rule-engine';
import OpenAI from 'openai';
import { 
  AIResult, 
  ComplianceResult, 
  ComplianceCheck, 
  CodeRule,
  PlanAnalysisResult,
  Dimension,
  DetectedElement
} from '../../types';

export class ComplianceChecker {
  private codeParser: CodeParser;
  private ruleEngine: RuleEngine;
  private openai: OpenAI | null = null;
  private rules: CodeRule[] = [];

  constructor(apiKey?: string) {
    this.codeParser = new CodeParser();
    this.ruleEngine = new RuleEngine();
    
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Load code rules
   */
  async loadRules(source: string | CodeRule[]): Promise<void> {
    this.rules = await this.codeParser.loadRules(source);
    this.ruleEngine.loadRules(this.rules);
  }

  /**
   * Check compliance using plan analysis results
   */
  async checkCompliance(
    planAnalysis: PlanAnalysisResult,
    context: {
      permitType: string;
      projectData?: Record<string, any>;
      jurisdictionId?: string;
    }
  ): Promise<AIResult<ComplianceResult>> {
    const startTime = Date.now();

    try {
      // Get applicable rules
      const applicableRules = this.rules.filter(rule => {
        if (!rule.applicableTo || rule.applicableTo.length === 0) return true;
        return rule.applicableTo.includes(context.permitType);
      });

      // Run rule-based checks
      const checks = this.ruleEngine.checkAllRules({
        dimensions: planAnalysis.dimensions,
        elements: planAnalysis.elements,
        projectData: context.projectData,
        permitType: context.permitType
      });

      // Enhance with AI if available
      if (this.openai && planAnalysis.issues) {
        const aiChecks = await this.enhanceWithAI(
          planAnalysis,
          applicableRules,
          context
        );
        checks.push(...aiChecks);
      }

      // Calculate overall status
      const criticalIssues = checks.filter(c => 
        c.status === 'fail' && c.rule.category === 'structural'
      ).length;
      const majorIssues = checks.filter(c => 
        c.status === 'fail' && ['fire', 'accessibility'].includes(c.rule.category)
      ).length;
      const minorIssues = checks.filter(c => 
        c.status === 'fail' && !['structural', 'fire', 'accessibility'].includes(c.rule.category)
      ).length;

      const overallStatus = criticalIssues > 0
        ? 'non_compliant'
        : majorIssues > 0
        ? 'needs_review'
        : 'compliant';

      const result: ComplianceResult = {
        checks,
        overallStatus,
        criticalIssues,
        majorIssues,
        minorIssues,
        applicableRules: applicableRules.length,
        checkedRules: checks.length
      };

      return {
        success: true,
        data: result,
        confidence: this.calculateConfidence(checks),
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Compliance check failed',
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Check specific rule
   */
  checkRule(
    ruleId: string,
    context: {
      dimensions?: Dimension[];
      elements?: DetectedElement[];
      projectData?: Record<string, any>;
    }
  ): ComplianceCheck | null {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) return null;

    return this.ruleEngine.checkRule(rule, context);
  }

  /**
   * Enhance compliance checks with AI analysis
   */
  private async enhanceWithAI(
    planAnalysis: PlanAnalysisResult,
    rules: CodeRule[],
    context: {
      permitType: string;
      jurisdictionId?: string;
    }
  ): Promise<ComplianceCheck[]> {
    if (!this.openai) return [];

    try {
      const prompt = `Analyze these building plans for code compliance with the following rules:

${rules.slice(0, 10).map(r => `- ${r.code} ${r.section}: ${r.title} - ${r.description}`).join('\n')}

Plan issues detected:
${planAnalysis.issues?.map(i => `- ${i.severity}: ${i.description}`).join('\n') || 'None'}

Provide compliance assessment for each rule. Return JSON array with:
- ruleId: rule identifier
- status: "pass", "fail", "warning", or "needs_review"
- message: explanation
- confidence: 0-1
- suggestedFix: optional fix suggestion`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a building code compliance expert. Analyze plans against code requirements accurately.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const aiResults = JSON.parse(content);
      const checks: ComplianceCheck[] = [];

      if (Array.isArray(aiResults)) {
        aiResults.forEach((result: any) => {
          const rule = rules.find(r => r.id === result.ruleId);
          if (rule) {
            checks.push({
              ruleId: rule.id,
              rule,
              status: result.status || 'needs_review',
              message: result.message || 'AI analysis completed',
              confidence: result.confidence || 0.7,
              suggestedFix: result.suggestedFix
            });
          }
        });
      }

      return checks;
    } catch (error) {
      console.error('AI enhancement failed:', error);
      return [];
    }
  }

  /**
   * Calculate overall confidence from checks
   */
  private calculateConfidence(checks: ComplianceCheck[]): number {
    if (checks.length === 0) return 0.5;

    const confidences = checks
      .map(c => c.confidence)
      .filter(c => c > 0);

    if (confidences.length === 0) return 0.5;

    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  /**
   * Get rules by category
   */
  getRulesByCategory(category: CodeRule['category']): CodeRule[] {
    return this.rules.filter(r => r.category === category);
  }

  /**
   * Add custom rule
   */
  addCustomRule(rule: CodeRule): void {
    this.rules.push(rule);
    this.ruleEngine.loadRules(this.rules);
  }
}
