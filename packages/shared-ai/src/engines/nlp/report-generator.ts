// ============================================================
// NLP - REPORT GENERATOR
// Generate human-readable reports from AI analysis
// ============================================================

import OpenAI from 'openai';
import { 
  AIResult, 
  ReviewResult, 
  PlanIssue, 
  ComplianceCheck,
  PlanAnalysisResult
} from '../../types';

export class ReportGenerator {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate comprehensive review report
   */
  async generateReviewReport(
    reviewResult: ReviewResult
  ): Promise<AIResult<string>> {
    const startTime = Date.now();

    try {
      if (!this.openai) {
        return this.generateBasicReport(reviewResult, startTime);
      }

      const prompt = `Generate a professional, clear building permit review report based on this analysis:

Overall Score: ${reviewResult.overallScore}/100
Ready to Submit: ${reviewResult.readyToSubmit ? 'Yes' : 'No'}

Plan Issues:
${reviewResult.planIssues.map((issue, i) => 
  `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}${issue.suggestedFix ? `\n   Fix: ${issue.suggestedFix}` : ''}`
).join('\n')}

Code Violations:
${reviewResult.codeViolations.map((violation, i) => 
  `${i + 1}. ${violation.rule.code} ${violation.rule.section}: ${violation.message}${violation.suggestedFix ? `\n   Fix: ${violation.suggestedFix}` : ''}`
).join('\n')}

Missing Documents:
${reviewResult.missingDocuments.join(', ') || 'None'}

Suggested Fixes:
${reviewResult.suggestedFixes.map((fix, i) => 
  `${i + 1}. [${fix.priority.toUpperCase()}] ${fix.issue}\n   ${fix.fix}`
).join('\n')}

Generate a professional report with:
1. Executive Summary
2. Overall Assessment
3. Critical Issues (if any)
4. Major Issues
5. Minor Issues / Recommendations
6. Missing Information
7. Next Steps

Use clear, professional language suitable for architects, engineers, and contractors.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional building permit review report writer. Write clear, actionable reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const report = response.choices[0]?.message?.content || '';

      return {
        success: true,
        data: report,
        confidence: 0.9,
        processingTimeMs: Date.now() - startTime
      };
    } catch (error) {
      return this.generateBasicReport(reviewResult, startTime);
    }
  }

  /**
   * Generate basic report without AI
   */
  private generateBasicReport(
    reviewResult: ReviewResult,
    startTime: number
  ): AIResult<string> {
    const sections: string[] = [];

    // Executive Summary
    sections.push('# Building Permit Review Report\n');
    sections.push(`**Overall Score:** ${reviewResult.overallScore}/100`);
    sections.push(`**Status:** ${reviewResult.readyToSubmit ? 'Ready to Submit' : 'Needs Corrections'}\n`);

    // Critical Issues
    const criticalIssues = reviewResult.planIssues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      sections.push('## Critical Issues\n');
      criticalIssues.forEach((issue, i) => {
        sections.push(`${i + 1}. ${issue.description}`);
        if (issue.suggestedFix) {
          sections.push(`   **Fix:** ${issue.suggestedFix}`);
        }
      });
      sections.push('');
    }

    // Major Issues
    const majorIssues = reviewResult.planIssues.filter(i => i.severity === 'major');
    if (majorIssues.length > 0) {
      sections.push('## Major Issues\n');
      majorIssues.forEach((issue, i) => {
        sections.push(`${i + 1}. ${issue.description}`);
        if (issue.suggestedFix) {
          sections.push(`   **Fix:** ${issue.suggestedFix}`);
        }
      });
      sections.push('');
    }

    // Code Violations
    if (reviewResult.codeViolations.length > 0) {
      sections.push('## Code Violations\n');
      reviewResult.codeViolations.forEach((violation, i) => {
        sections.push(`${i + 1}. ${violation.rule.code} ${violation.rule.section}: ${violation.message}`);
        if (violation.suggestedFix) {
          sections.push(`   **Fix:** ${violation.suggestedFix}`);
        }
      });
      sections.push('');
    }

    // Missing Documents
    if (reviewResult.missingDocuments.length > 0) {
      sections.push('## Missing Documents\n');
      sections.push(reviewResult.missingDocuments.map(doc => `- ${doc}`).join('\n'));
      sections.push('');
    }

    // Suggested Fixes
    if (reviewResult.suggestedFixes.length > 0) {
      sections.push('## Recommended Actions\n');
      reviewResult.suggestedFixes.forEach((fix, i) => {
        sections.push(`${i + 1}. [${fix.priority.toUpperCase()}] ${fix.issue}`);
        sections.push(`   ${fix.fix}`);
      });
    }

    const report = sections.join('\n');

    return {
      success: true,
      data: report,
      confidence: 0.7,
      processingTimeMs: Date.now() - startTime,
      fallbackUsed: true
    };
  }

  /**
   * Generate summary for specific issue category
   */
  generateIssueSummary(
    issues: PlanIssue[],
    category: 'critical' | 'major' | 'minor' | 'all' = 'all'
  ): string {
    const filtered = category === 'all'
      ? issues
      : issues.filter(i => i.severity === category);

    if (filtered.length === 0) {
      return `No ${category === 'all' ? '' : category} issues found.`;
    }

    const summary = filtered
      .map((issue, i) => `${i + 1}. ${issue.description}`)
      .join('\n');

    return summary;
  }

  /**
   * Generate compliance summary
   */
  generateComplianceSummary(
    checks: ComplianceCheck[]
  ): string {
    const passed = checks.filter(c => c.status === 'pass').length;
    const failed = checks.filter(c => c.status === 'fail').length;
    const warnings = checks.filter(c => c.status === 'warning').length;
    const needsReview = checks.filter(c => c.status === 'needs_review').length;

    return `Compliance Check Summary:
- Passed: ${passed}
- Failed: ${failed}
- Warnings: ${warnings}
- Needs Review: ${needsReview}
- Total Checks: ${checks.length}`;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(
    reviewResult: ReviewResult
  ): string {
    return this.generateBasicReport(reviewResult, Date.now()).data || '';
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(
    reviewResult: ReviewResult
  ): string {
    const markdown = this.generateMarkdownReport(reviewResult);
    
    // Simple markdown to HTML conversion (basic)
    let html = markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>\n');

    return `<html><body>${html}</body></html>`;
  }
}
