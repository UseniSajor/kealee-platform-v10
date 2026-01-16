/**
 * Comment Templates Service
 * Auto-generate review comments templates
 */

export interface CommentTemplate {
  id: string;
  codeSection: string;
  title: string;
  template: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  category: string;
  discipline: string;
  applicableTo: string[]; // Permit types
  variables?: string[]; // Template variables like {dimension}, {code}
}

export interface GeneratedComment {
  templateId: string;
  comment: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  codeReference: string;
  category: string;
  pageNumber?: number;
  coordinateX?: number;
  coordinateY?: number;
}

export class CommentTemplatesService {
  private templates: CommentTemplate[] = [];

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Generate comment from template
   */
  generateComment(
    templateId: string,
    variables?: Record<string, string>
  ): GeneratedComment | null {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      return null;
    }

    let comment = template.template;

    // Replace variables
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        comment = comment.replace(new RegExp(`{${key}}`, 'g'), value);
      }
    }

    return {
      templateId: template.id,
      comment,
      severity: template.severity,
      codeReference: template.codeSection,
      category: template.category,
    };
  }

  /**
   * Get templates for discipline and permit type
   */
  getTemplates(
    discipline: string,
    permitType: string,
    category?: string
  ): CommentTemplate[] {
    return this.templates.filter(
      t =>
        t.discipline === discipline &&
        (t.applicableTo.includes(permitType) || t.applicableTo.length === 0) &&
        (!category || t.category === category)
    );
  }

  /**
   * Suggest comments based on checklist item
   */
  suggestComments(
    checklistItem: string,
    discipline: string,
    permitType: string
  ): GeneratedComment[] {
    const suggestions: GeneratedComment[] = [];

    // Find relevant templates
    const relevantTemplates = this.templates.filter(
      t =>
        t.discipline === discipline &&
        (t.applicableTo.includes(permitType) || t.applicableTo.length === 0) &&
        (t.title.toLowerCase().includes(checklistItem.toLowerCase()) ||
          checklistItem.toLowerCase().includes(t.title.toLowerCase()))
    );

    for (const template of relevantTemplates) {
      const comment = this.generateComment(template.id);
      if (comment) {
        suggestions.push(comment);
      }
    }

    return suggestions;
  }

  /**
   * Initialize comment templates
   */
  private initializeTemplates() {
    this.templates = [
      // Building Code Templates
      {
        id: 'tpl-1',
        codeSection: 'IBC Section 1006',
        title: 'Insufficient Egress Width',
        template:
          'Egress width is insufficient. Minimum required width is {width} inches per IBC Section 1006.2. Provide {requiredWidth} inches total width.',
        severity: 'CRITICAL',
        category: 'Life Safety',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['width', 'requiredWidth'],
      },
      {
        id: 'tpl-2',
        codeSection: 'IBC Section 703',
        title: 'Missing Fire Rating',
        template:
          'Fire-rated assembly required per IBC Section 703. Provide {rating} hour fire-resistance rating between {location1} and {location2}.',
        severity: 'CRITICAL',
        category: 'Life Safety',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING'],
        variables: ['rating', 'location1', 'location2'],
      },
      {
        id: 'tpl-3',
        codeSection: 'IBC Section 1607',
        title: 'Insufficient Live Load',
        template:
          'Live load design is insufficient. Minimum required live load is {load} psf per IBC Table 1607.1. Revise structural calculations.',
        severity: 'MAJOR',
        category: 'Structural',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING'],
        variables: ['load'],
      },
      {
        id: 'tpl-4',
        codeSection: 'ADA Standards Section 206',
        title: 'Accessible Route Required',
        template:
          'Accessible route required per ADA Standards Section 206. Provide accessible path from {point1} to {point2} with maximum {slope}% slope.',
        severity: 'MAJOR',
        category: 'Accessibility',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['point1', 'point2', 'slope'],
      },
      // Zoning Templates
      {
        id: 'tpl-5',
        codeSection: 'Zoning Code Section 3.1',
        title: 'Setback Violation',
        template:
          'Front setback violation. Minimum required setback is {setback} feet. Proposed building is {actual} feet from property line. Revise site plan.',
        severity: 'CRITICAL',
        category: 'Setbacks',
        discipline: 'ZONING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['setback', 'actual'],
      },
      {
        id: 'tpl-6',
        codeSection: 'Zoning Code Section 4.1',
        title: 'Height Violation',
        template:
          'Building height exceeds maximum allowed. Maximum height is {maxHeight} feet. Proposed building is {actualHeight} feet. Revise design.',
        severity: 'CRITICAL',
        category: 'Height',
        discipline: 'ZONING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['maxHeight', 'actualHeight'],
      },
      // Electrical Templates
      {
        id: 'tpl-7',
        codeSection: 'NEC Article 220',
        title: 'Service Size Inadequate',
        template:
          'Electrical service size is inadequate. Calculated load is {calculatedLoad} amps. Minimum service size required is {requiredSize} amps per NEC Article 220. Upgrade service.',
        severity: 'MAJOR',
        category: 'Service',
        discipline: 'ELECTRICAL',
        applicableTo: ['ELECTRICAL', 'BUILDING'],
        variables: ['calculatedLoad', 'requiredSize'],
      },
      {
        id: 'tpl-8',
        codeSection: 'NEC Article 250',
        title: 'Grounding System Required',
        template:
          'Grounding and bonding system required per NEC Article 250. Provide equipment grounding conductor and bonding jumper details.',
        severity: 'CRITICAL',
        category: 'Grounding',
        discipline: 'ELECTRICAL',
        applicableTo: ['ELECTRICAL'],
      },
      // Plumbing Templates
      {
        id: 'tpl-9',
        codeSection: 'IPC Section 403',
        title: 'Fixture Count Insufficient',
        template:
          'Fixture count is insufficient per IPC Section 403. Provide {requiredCount} {fixtureType} fixtures. Currently showing {actualCount}.',
        severity: 'MAJOR',
        category: 'Fixtures',
        discipline: 'PLUMBING',
        applicableTo: ['PLUMBING', 'BUILDING'],
        variables: ['requiredCount', 'fixtureType', 'actualCount'],
      },
      {
        id: 'tpl-10',
        codeSection: 'IPC Section 701',
        title: 'Drainage Slope Insufficient',
        template:
          'Drainage pipe slope is insufficient. Minimum required slope is {slope}% per IPC Section 701.2. Revise plumbing plan.',
        severity: 'MAJOR',
        category: 'Drainage',
        discipline: 'PLUMBING',
        applicableTo: ['PLUMBING'],
        variables: ['slope'],
      },
      // Structural Templates
      {
        id: 'tpl-11',
        codeSection: 'IBC Section 1603',
        title: 'Structural Calculations Required',
        template:
          'Structural calculations required per IBC Section 1603. Provide sealed structural calculations for {element}.',
        severity: 'CRITICAL',
        category: 'Structural',
        discipline: 'STRUCTURAL',
        applicableTo: ['BUILDING'],
        variables: ['element'],
      },
      {
        id: 'tpl-12',
        codeSection: 'IBC Section 2304',
        title: 'Connection Details Missing',
        template:
          'Connection details missing for {connectionType}. Provide detailed connection drawings per IBC Section 2304.',
        severity: 'MAJOR',
        category: 'Connections',
        discipline: 'STRUCTURAL',
        applicableTo: ['BUILDING'],
        variables: ['connectionType'],
      },
      // General Templates
      {
        id: 'tpl-13',
        codeSection: 'General',
        title: 'Scale Missing',
        template: 'Drawing scale not indicated. Provide scale notation on all drawings.',
        severity: 'MINOR',
        category: 'Drawing Quality',
        discipline: 'BUILDING',
        applicableTo: [],
      },
      {
        id: 'tpl-14',
        codeSection: 'General',
        title: 'North Arrow Missing',
        template: 'North arrow not shown on site plan. Provide north arrow for orientation.',
        severity: 'MINOR',
        category: 'Drawing Quality',
        discipline: 'ZONING',
        applicableTo: ['BUILDING'],
      },
      {
        id: 'tpl-15',
        codeSection: 'General',
        title: 'Dimensions Missing',
        template:
          'Dimensions missing for {element}. Provide clear dimensions on {drawingType} drawing.',
        severity: 'MINOR',
        category: 'Drawing Quality',
        discipline: 'BUILDING',
        applicableTo: [],
        variables: ['element', 'drawingType'],
      },
    ];
  }

  /**
   * Add custom template
   */
  addTemplate(template: CommentTemplate): void {
    this.templates.push(template);
  }

  /**
   * Get all templates
   */
  getAllTemplates(): CommentTemplate[] {
    return [...this.templates];
  }
}

// Singleton instance
export const commentTemplatesService = new CommentTemplatesService();
