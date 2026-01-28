// ============================================================
// EMAIL PARSER
// Parse jurisdiction emails for status updates and corrections
// ============================================================

import { IntegrationResult } from '../types';

export class EmailParser {
  /**
   * Parse email for permit status update
   */
  async parseStatusEmail(
    emailBody: string,
    emailSubject: string
  ): Promise<IntegrationResult<{
    permitNumber?: string;
    status?: string;
    message?: string;
    dates?: {
      submitted?: Date;
      approved?: Date;
    };
  }>> {
    try {
      // Extract permit number
      const permitNumber = this.extractPermitNumber(emailBody, emailSubject);
      
      // Extract status
      const status = this.extractStatus(emailBody, emailSubject);
      
      // Extract dates
      const dates = this.extractDates(emailBody);

      return {
        success: true,
        data: {
          permitNumber,
          status,
          message: emailBody,
          dates,
        },
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Email parsing failed',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Parse correction email
   */
  async parseCorrectionEmail(
    emailBody: string,
    emailSubject: string
  ): Promise<IntegrationResult<{
    permitNumber?: string;
    issues: Array<{
      description: string;
      severity: 'critical' | 'major' | 'minor';
      affectedSheets?: string[];
    }>;
    dueDate?: Date;
  }>> {
    try {
      const permitNumber = this.extractPermitNumber(emailBody, emailSubject);
      const issues = this.extractIssues(emailBody);
      const dueDate = this.extractDueDate(emailBody);

      return {
        success: true,
        data: {
          permitNumber,
          issues,
          dueDate,
        },
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Correction email parsing failed',
        tier: 'MANUAL',
        provider: 'CUSTOM',
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Extract permit number
   */
  private extractPermitNumber(body: string, subject: string): string | undefined {
    const text = `${subject} ${body}`;
    const patterns = [
      /permit\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i,
      /application\s*(?:number|#|no\.?)\s*:?\s*([A-Z0-9-]+)/i,
      /\b([A-Z]{2,4}-\d{4}-\d{6})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return undefined;
  }

  /**
   * Extract status
   */
  private extractStatus(body: string, subject: string): string | undefined {
    const text = `${subject} ${body}`.toLowerCase();
    
    if (text.includes('approved') || text.includes('issued')) return 'APPROVED';
    if (text.includes('under review') || text.includes('in review')) return 'UNDER_REVIEW';
    if (text.includes('submitted') || text.includes('received')) return 'SUBMITTED';
    if (text.includes('rejected') || text.includes('denied')) return 'REJECTED';
    if (text.includes('correction') || text.includes('revision')) return 'CORRECTIONS_REQUESTED';
    
    return undefined;
  }

  /**
   * Extract dates
   */
  private extractDates(text: string): {
    submitted?: Date;
    approved?: Date;
  } {
    const dates: { submitted?: Date; approved?: Date } = {};
    const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
    const matches = Array.from(text.matchAll(datePattern));

    // Try to identify dates by context
    matches.forEach((match, index) => {
      const dateStr = match[1];
      const context = text.substring(Math.max(0, match.index! - 20), match.index! + 20).toLowerCase();
      
      if (context.includes('submitted') || context.includes('filed')) {
        dates.submitted = this.parseDate(dateStr);
      } else if (context.includes('approved') || context.includes('issued')) {
        dates.approved = this.parseDate(dateStr);
      }
    });

    return dates;
  }

  /**
   * Extract issues from correction email
   */
  private extractIssues(text: string): Array<{
    description: string;
    severity: 'critical' | 'major' | 'minor';
    affectedSheets?: string[];
  }> {
    const issues: Array<{
      description: string;
      severity: 'critical' | 'major' | 'minor';
      affectedSheets?: string[];
    }> = [];

    // Split by common separators
    const sections = text.split(/\n\n|\r\n\r\n|•|\d+\./).filter(s => s.trim().length > 20);

    sections.forEach((section) => {
      const lower = section.toLowerCase();
      let severity: 'critical' | 'major' | 'minor' = 'minor';

      if (lower.includes('critical') || lower.includes('must') || lower.includes('required')) {
        severity = 'critical';
      } else if (lower.includes('major') || lower.includes('important')) {
        severity = 'major';
      }

      // Extract sheet references
      const sheetMatches = section.match(/(?:sheet|page)\s*([A-Z]?\d+[\.-]?\d*)/gi);
      const affectedSheets = sheetMatches?.map(m => m.replace(/sheet|page/gi, '').trim()) || [];

      issues.push({
        description: section.trim(),
        severity,
        affectedSheets: affectedSheets.length > 0 ? affectedSheets : undefined,
      });
    });

    return issues;
  }

  /**
   * Extract due date
   */
  private extractDueDate(text: string): Date | undefined {
    const patterns = [
      /due\s+(?:by|on|before)?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(?:by|before)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return this.parseDate(match[1]);
      }
    }

    return undefined;
  }

  /**
   * Parse date string
   */
  private parseDate(dateStr: string): Date | undefined {
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }
}
