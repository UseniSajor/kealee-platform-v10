// ============================================================
// CODE COMPLIANCE - CODE PARSER
// Parse building codes (ICC, NFPA, etc.)
// ============================================================

import { CodeRule } from '../../types';

export class CodeParser {
  /**
   * Parse code rule from text or structured data
   */
  parseRule(
    source: string | {
      code: string;
      section: string;
      title: string;
      description: string;
      category: string;
      requirements: string[];
    }
  ): CodeRule {
    if (typeof source === 'string') {
      return this.parseRuleFromText(source);
    }

    return {
      id: `${source.code}-${source.section}`,
      code: source.code,
      section: source.section,
      title: source.title,
      description: source.description,
      category: source.category as CodeRule['category'],
      requirements: source.requirements,
      applicableTo: undefined
    };
  }

  /**
   * Parse multiple rules
   */
  parseRules(sources: Array<string | CodeRule>): CodeRule[] {
    return sources.map(source => {
      if (typeof source === 'string') {
        return this.parseRuleFromText(source);
      }
      return source;
    });
  }

  /**
   * Parse rule from text format
   * Format: "CODE SECTION - Title: Description. Requirements: ..."
   */
  private parseRuleFromText(text: string): CodeRule {
    // Extract code and section (e.g., "IBC 2021 R301.1")
    const codeSectionMatch = text.match(/([A-Z]+)\s+(\d{4})\s+([A-Z]?\d+\.\d+)/);
    const code = codeSectionMatch ? `${codeSectionMatch[1]} ${codeSectionMatch[2]}` : 'UNKNOWN';
    const section = codeSectionMatch ? codeSectionMatch[3] : 'UNKNOWN';

    // Extract title (after section number, before colon)
    const titleMatch = text.match(/[A-Z]?\d+\.\d+\s+([^:]+):/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Rule';

    // Extract description (after first colon)
    const descMatch = text.match(/:\s*([^.]+)/);
    const description = descMatch ? descMatch[1].trim() : text;

    // Extract requirements (lines starting with bullet or number)
    const requirements: string[] = [];
    const reqMatches = text.matchAll(/(?:[-•*]|\d+\.)\s+([^\n]+)/g);
    for (const match of reqMatches) {
      requirements.push(match[1].trim());
    }

    // Infer category from section or keywords
    const category = this.inferCategory(section, text);

    return {
      id: `${code}-${section}`,
      code,
      section,
      title,
      description,
      category,
      requirements: requirements.length > 0 ? requirements : [description]
    };
  }

  /**
   * Infer category from section number or keywords
   */
  private inferCategory(
    section: string,
    text: string
  ): CodeRule['category'] {
    const lowerText = text.toLowerCase();
    const sectionUpper = section.toUpperCase();

    // Check by section prefixes
    if (sectionUpper.startsWith('R3') || sectionUpper.startsWith('R4')) {
      return 'structural';
    }
    if (sectionUpper.startsWith('R6') || sectionUpper.startsWith('R7')) {
      return 'fire';
    }
    if (sectionUpper.startsWith('R11')) {
      return 'energy';
    }
    if (sectionUpper.startsWith('E') || lowerText.includes('accessibility')) {
      return 'accessibility';
    }
    if (lowerText.includes('plumbing') || sectionUpper.startsWith('P')) {
      return 'plumbing';
    }
    if (lowerText.includes('electrical') || sectionUpper.startsWith('E')) {
      return 'electrical';
    }
    if (lowerText.includes('mechanical') || sectionUpper.startsWith('M')) {
      return 'mechanical';
    }

    // Default based on keywords
    if (lowerText.includes('egress') || lowerText.includes('exit')) {
      return 'fire';
    }
    if (lowerText.includes('ramp') || lowerText.includes('accessible')) {
      return 'accessibility';
    }

    return 'structural'; // Default
  }

  /**
   * Load rules from JSON file or API
   */
  async loadRules(source: string | CodeRule[]): Promise<CodeRule[]> {
    if (Array.isArray(source)) {
      return source;
    }

    // If source is a URL, fetch it
    if (source.startsWith('http')) {
      const response = await fetch(source);
      const data = await response.json();
      const rules = Array.isArray(data) ? data : [data];
      return rules.map((r: any) => this.parseRule(r));
    }

    // Otherwise, treat as file path (would need fs in Node.js)
    throw new Error('File path loading not implemented in browser context');
  }

  /**
   * Filter rules by criteria
   */
  filterRules(
    rules: CodeRule[],
    criteria: {
      code?: string;
      category?: CodeRule['category'];
      section?: string;
      applicableTo?: string[];
    }
  ): CodeRule[] {
    return rules.filter(rule => {
      if (criteria.code && rule.code !== criteria.code) return false;
      if (criteria.category && rule.category !== criteria.category) return false;
      if (criteria.section && rule.section !== criteria.section) return false;
      if (criteria.applicableTo && rule.applicableTo) {
        const hasMatch = criteria.applicableTo.some(type =>
          rule.applicableTo?.includes(type)
        );
        if (!hasMatch) return false;
      }
      return true;
    });
  }
}
