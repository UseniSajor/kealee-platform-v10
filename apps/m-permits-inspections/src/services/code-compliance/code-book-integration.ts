/**
 * Code Book Integration Service
 * Integration with digital code books (ICC, NFPA, etc.)
 */

import {createClient} from '@/lib/supabase/client';

export interface CodeBook {
  id: string;
  name: string; // "IBC 2021", "NEC 2020", "IPC 2021", "NFPA 101", "ADA Standards 2010"
  publisher: string; // "ICC", "NFPA", "ICC", "NFPA", "DOJ"
  edition: string;
  year: number;
  code: string; // "IBC", "NEC", "IPC", "NFPA_101", "ADA"
  sections: CodeSection[];
  active: boolean;
}

export interface CodeSection {
  id: string;
  codeBookId: string;
  sectionNumber: string; // "1006.2", "220.42", "403.1"
  title: string;
  text: string;
  category: string; // "Egress", "Electrical Load", "Fixtures", etc.
  requirements: CodeRequirement[];
  references: string[]; // Other section numbers
  updatedAt: Date;
}

export interface CodeRequirement {
  id: string;
  sectionId: string;
  type: 'MINIMUM' | 'MAXIMUM' | 'REQUIRED' | 'PROHIBITED' | 'SPECIFIC';
  parameter: string; // "width", "height", "load", "fixture_count"
  unit: string; // "inches", "feet", "amps", "psf", "count"
  value?: number;
  formula?: string; // JavaScript expression
  conditions?: string; // When this requirement applies
  description: string;
}

export interface CodeComplianceCheck {
  sectionId: string;
  sectionNumber: string;
  requirement: CodeRequirement;
  actualValue?: number;
  requiredValue?: number;
  compliant: boolean;
  message: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
}

export class CodeBookIntegrationService {
  private codeBooks: Map<string, CodeBook> = new Map();
  private sectionsCache: Map<string, CodeSection> = new Map();

  constructor() {
    this.initializeDefaultCodeBooks();
  }

  /**
   * Load code books from database
   */
  async loadCodeBooks(): Promise<void> {
    const supabase = createClient();

    const {data: codeBooks} = await supabase
      .from('CodeBook')
      .select('*, sections:CodeSection(*)')
      .eq('active', true);

    if (codeBooks) {
      codeBooks.forEach(book => {
        this.codeBooks.set(book.id, this.mapCodeBook(book));
        book.sections?.forEach((section: any) => {
          this.sectionsCache.set(section.id, this.mapCodeSection(section));
        });
      });
    }
  }

  /**
   * Get code section by number
   */
  async getCodeSection(
    codeBook: string,
    sectionNumber: string
  ): Promise<CodeSection | null> {
    const sectionKey = `${codeBook}-${sectionNumber}`;
    
    // Check cache first
    const cached = this.sectionsCache.get(sectionKey);
    if (cached) {
      return cached;
    }

    // Load from database
    const supabase = createClient();
    const {data: codeBookData} = await supabase
      .from('CodeBook')
      .select('id')
      .eq('code', codeBook)
      .eq('active', true)
      .single();

    if (!codeBookData) {
      return null;
    }

    const {data: section} = await supabase
      .from('CodeSection')
      .select('*')
      .eq('codeBookId', codeBookData.id)
      .eq('sectionNumber', sectionNumber)
      .single();

    if (!section) {
      return null;
    }

    const mapped = this.mapCodeSection(section);
    this.sectionsCache.set(sectionKey, mapped);
    return mapped;
  }

  /**
   * Check compliance against code requirement
   */
  async checkCompliance(
    codeBook: string,
    sectionNumber: string,
    parameter: string,
    actualValue: number
  ): Promise<CodeComplianceCheck> {
    const section = await this.getCodeSection(codeBook, sectionNumber);
    
    if (!section) {
      throw new Error(`Code section ${codeBook} ${sectionNumber} not found`);
    }

    const requirement = section.requirements.find(r => r.parameter === parameter);
    
    if (!requirement) {
      throw new Error(`Requirement for parameter ${parameter} not found in section ${sectionNumber}`);
    }

    // Calculate required value
    const requiredValue = this.calculateRequiredValue(requirement, actualValue);

    // Check compliance
    const compliant = this.checkRequirement(requirement, actualValue, requiredValue);
    
    // Determine severity
    const severity = this.determineSeverity(requirement.type, compliant, Math.abs((actualValue - (requiredValue || 0)) / (requiredValue || 1)));

    // Generate message
    const message = this.generateComplianceMessage(
      section,
      requirement,
      actualValue,
      requiredValue,
      compliant
    );

    return {
      sectionId: section.id,
      sectionNumber: section.sectionNumber,
      requirement,
      actualValue,
      requiredValue,
      compliant,
      message,
      severity,
    };
  }

  /**
   * Calculate required value from requirement
   */
  private calculateRequiredValue(
    requirement: CodeRequirement,
    actualValue: number
  ): number | undefined {
    if (requirement.value !== undefined) {
      return requirement.value;
    }

    if (requirement.formula) {
      try {
        // Evaluate formula (in production, use safe expression evaluator)
        const result = eval(requirement.formula.replace(/\{actualValue\}/g, String(actualValue)));
        return typeof result === 'number' ? result : undefined;
      } catch (error) {
        console.error('Formula evaluation error:', error);
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Check if value meets requirement
   */
  private checkRequirement(
    requirement: CodeRequirement,
    actualValue: number,
    requiredValue?: number
  ): boolean {
    if (requiredValue === undefined) {
      return true; // Can't determine compliance
    }

    switch (requirement.type) {
      case 'MINIMUM':
        return actualValue >= requiredValue;
      case 'MAXIMUM':
        return actualValue <= requiredValue;
      case 'REQUIRED':
        return Math.abs(actualValue - requiredValue) < 0.01; // Within tolerance
      case 'PROHIBITED':
        return actualValue === 0 || actualValue === requiredValue;
      case 'SPECIFIC':
        return actualValue === requiredValue;
      default:
        return true;
    }
  }

  /**
   * Determine severity of non-compliance
   */
  private determineSeverity(
    type: CodeRequirement['type'],
    compliant: boolean,
    variancePercent: number
  ): 'MINOR' | 'MAJOR' | 'CRITICAL' {
    if (compliant) {
      return 'MINOR';
    }

    // Life safety requirements are always critical
    if (type === 'MINIMUM' && variancePercent > 0.2) {
      return 'CRITICAL';
    }

    if (variancePercent > 0.1) {
      return 'MAJOR';
    }

    return 'MINOR';
  }

  /**
   * Generate compliance message
   */
  private generateComplianceMessage(
    section: CodeSection,
    requirement: CodeRequirement,
    actualValue: number,
    requiredValue: number | undefined,
    compliant: boolean
  ): string {
    const status = compliant ? 'COMPLIANT' : 'NON-COMPLIANT';
    
    if (!requiredValue) {
      return `${section.title}: ${requirement.description}`;
    }

    if (compliant) {
      return `${section.sectionNumber}: ${requirement.description}. Actual: ${actualValue} ${requirement.unit}, Required: ${requiredValue} ${requirement.unit}. Status: ${status}`;
    }

    const variance = Math.abs(actualValue - requiredValue);
    return `${section.sectionNumber}: ${requirement.description}. Actual: ${actualValue} ${requirement.unit}, Required: ${requiredValue} ${requirement.unit}. Variance: ${variance} ${requirement.unit}. Status: ${status}`;
  }

  /**
   * Initialize default code books (sample structure)
   */
  private initializeDefaultCodeBooks() {
    // This would typically load from database or API
    // For now, create sample structure that can be populated
    const sampleCodeBook: CodeBook = {
      id: 'ibc-2021',
      name: 'IBC 2021',
      publisher: 'ICC',
      edition: '2021',
      year: 2021,
      code: 'IBC',
      sections: [],
      active: true,
    };

    this.codeBooks.set('ibc-2021', sampleCodeBook);
  }

  /**
   * Map database record to CodeBook
   */
  private mapCodeBook(record: any): CodeBook {
    return {
      id: record.id,
      name: record.name,
      publisher: record.publisher,
      edition: record.edition,
      year: record.year,
      code: record.code,
      sections: (record.sections || []).map(this.mapCodeSection),
      active: record.active,
    };
  }

  /**
   * Map database record to CodeSection
   */
  private mapCodeSection(record: any): CodeSection {
    return {
      id: record.id,
      codeBookId: record.codeBookId,
      sectionNumber: record.sectionNumber,
      title: record.title,
      text: record.text,
      category: record.category,
      requirements: record.requirements || [],
      references: record.references || [],
      updatedAt: new Date(record.updatedAt),
    };
  }

  /**
   * Import code book from external source
   */
  async importCodeBook(data: {
    name: string;
    publisher: string;
    edition: string;
    year: number;
    code: string;
    sections: Array<{
      sectionNumber: string;
      title: string;
      text: string;
      category: string;
      requirements: Omit<CodeRequirement, 'id' | 'sectionId'>[];
    }>;
  }): Promise<CodeBook> {
    const supabase = createClient();

    // Create code book
    const {data: codeBook} = await supabase
      .from('CodeBook')
      .insert({
        name: data.name,
        publisher: data.publisher,
        edition: data.edition,
        year: data.year,
        code: data.code,
        active: true,
      })
      .select()
      .single();

    if (!codeBook) {
      throw new Error('Failed to create code book');
    }

    // Create sections
    for (const sectionData of data.sections) {
      const {data: section} = await supabase
        .from('CodeSection')
        .insert({
          codeBookId: codeBook.id,
          sectionNumber: sectionData.sectionNumber,
          title: sectionData.title,
          text: sectionData.text,
          category: sectionData.category,
          requirements: sectionData.requirements,
          references: [],
        })
        .select()
        .single();

      if (section) {
        const mapped = this.mapCodeSection(section);
        this.sectionsCache.set(`${data.code}-${sectionData.sectionNumber}`, mapped);
      }
    }

    const mapped = this.mapCodeBook(codeBook);
    this.codeBooks.set(codeBook.id, mapped);
    return mapped;
  }
}

// Singleton instance
export const codeBookIntegrationService = new CodeBookIntegrationService();
