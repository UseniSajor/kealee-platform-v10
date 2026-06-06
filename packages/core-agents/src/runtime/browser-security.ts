/**
 * Browser Security — URL validation, isolation, audit logging
 *
 * Constraints:
 * - Block private IPs, localhost, file:// protocols
 * - Sanitize cookies (prevent credential leakage)
 * - User-agent obfuscation
 * - Audit trail of all navigations + interactions
 */

export interface BrowserSecurityAuditLog {
  timestamp: string;
  action: 'navigate' | 'click' | 'input' | 'extract' | 'screenshot';
  url?: string;
  selector?: string;
  success: boolean;
  risk?: 'blocked' | 'warning' | 'safe';
}

const BLOCKED_PATTERNS = [
  /^file:\/\//i,
  /^(http|https):\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
  /^(http|https):\/\/(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/i, // Private IPs
  /^(http|https):\/\/([a-z0-9-]+\.)?internal\./i,
  /^(http|https):\/\/([a-z0-9-]+\.)?local$/i,
];

const OBFUSCATED_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
];

export class BrowserSecurity {
  private auditLog: BrowserSecurityAuditLog[] = [];

  /**
   * Validate URL against security constraints
   */
  isUrlAllowed(url: string): boolean {
    try {
      new URL(url); // Validate format
    } catch {
      return false;
    }

    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(url)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get a random obfuscated user agent
   */
  getRandomUserAgent(): string {
    return OBFUSCATED_USER_AGENTS[
      Math.floor(Math.random() * OBFUSCATED_USER_AGENTS.length)
    ];
  }

  /**
   * Log an action for audit trail
   */
  logAction(log: BrowserSecurityAuditLog): void {
    this.auditLog.push(log);
  }

  /**
   * Assess risk level of a navigation
   */
  assessRisk(url: string): 'safe' | 'warning' | 'blocked' {
    if (!this.isUrlAllowed(url)) return 'blocked';
    if (/^(http):\/\//i.test(url)) return 'warning'; // HTTP without S
    return 'safe';
  }

  getAuditLog(): BrowserSecurityAuditLog[] {
    return this.auditLog;
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}
