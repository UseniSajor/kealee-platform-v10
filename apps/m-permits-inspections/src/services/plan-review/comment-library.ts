/**
 * Comment Library Service
 * Common code violations comment library
 */

export interface CommentLibraryItem {
  id: string;
  codeSection: string;
  title: string;
  comment: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  category: string;
  discipline: string;
  applicableTo: string[]; // Permit types
  variables?: string[]; // Template variables
}

export class CommentLibraryService {
  private library: CommentLibraryItem[] = [];

  constructor() {
    this.initializeLibrary();
  }

  /**
   * Get comments for discipline and category
   */
  getComments(
    discipline: string,
    category?: string,
    permitType?: string
  ): CommentLibraryItem[] {
    return this.library.filter(
      item =>
        item.discipline === discipline &&
        (!category || item.category === category) &&
        (!permitType || item.applicableTo.length === 0 || item.applicableTo.includes(permitType))
    );
  }

  /**
   * Search comments
   */
  searchComments(query: string): CommentLibraryItem[] {
    const queryLower = query.toLowerCase();
    return this.library.filter(
      item =>
        item.title.toLowerCase().includes(queryLower) ||
        item.comment.toLowerCase().includes(queryLower) ||
        item.codeSection.toLowerCase().includes(queryLower)
    );
  }

  /**
   * Get comment by ID
   */
  getComment(id: string): CommentLibraryItem | undefined {
    return this.library.find(item => item.id === id);
  }

  /**
   * Add custom comment
   */
  addComment(comment: CommentLibraryItem): void {
    this.library.push(comment);
  }

  /**
   * Initialize comment library
   */
  private initializeLibrary() {
    this.library = [
      // Building Code Comments
      {
        id: 'lib-1',
        codeSection: 'IBC Section 1006',
        title: 'Insufficient Egress Width',
        comment:
          'Egress width is insufficient. Minimum required width is {width} inches per IBC Section 1006.2. Provide {requiredWidth} inches total width.',
        severity: 'CRITICAL',
        category: 'Life Safety',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['width', 'requiredWidth'],
      },
      {
        id: 'lib-2',
        codeSection: 'IBC Section 703',
        title: 'Missing Fire Rating',
        comment:
          'Fire-rated assembly required per IBC Section 703. Provide {rating} hour fire-resistance rating between {location1} and {location2}.',
        severity: 'CRITICAL',
        category: 'Life Safety',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING'],
        variables: ['rating', 'location1', 'location2'],
      },
      {
        id: 'lib-3',
        codeSection: 'IBC Section 1607',
        title: 'Insufficient Live Load',
        comment:
          'Live load design is insufficient. Minimum required live load is {load} psf per IBC Table 1607.1. Revise structural calculations.',
        severity: 'MAJOR',
        category: 'Structural',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING'],
        variables: ['load'],
      },
      {
        id: 'lib-4',
        codeSection: 'ADA Standards Section 206',
        title: 'Accessible Route Required',
        comment:
          'Accessible route required per ADA Standards Section 206. Provide accessible path from {point1} to {point2} with maximum {slope}% slope.',
        severity: 'MAJOR',
        category: 'Accessibility',
        discipline: 'BUILDING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['point1', 'point2', 'slope'],
      },
      // Zoning Comments
      {
        id: 'lib-5',
        codeSection: 'Zoning Code Section 3.1',
        title: 'Setback Violation',
        comment:
          'Front setback violation. Minimum required setback is {setback} feet. Proposed building is {actual} feet from property line. Revise site plan.',
        severity: 'CRITICAL',
        category: 'Setbacks',
        discipline: 'ZONING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['setback', 'actual'],
      },
      {
        id: 'lib-6',
        codeSection: 'Zoning Code Section 4.1',
        title: 'Height Violation',
        comment:
          'Building height exceeds maximum allowed. Maximum height is {maxHeight} feet. Proposed building is {actualHeight} feet. Revise design.',
        severity: 'CRITICAL',
        category: 'Height',
        discipline: 'ZONING',
        applicableTo: ['BUILDING', 'ADDITION'],
        variables: ['maxHeight', 'actualHeight'],
      },
      // Electrical Comments
      {
        id: 'lib-7',
        codeSection: 'NEC Article 220',
        title: 'Service Size Inadequate',
        comment:
          'Electrical service size is inadequate. Calculated load is {calculatedLoad} amps. Minimum service size required is {requiredSize} amps per NEC Article 220. Upgrade service.',
        severity: 'MAJOR',
        category: 'Service',
        discipline: 'ELECTRICAL',
        applicableTo: ['ELECTRICAL', 'BUILDING'],
        variables: ['calculatedLoad', 'requiredSize'],
      },
      {
        id: 'lib-8',
        codeSection: 'NEC Article 250',
        title: 'Grounding System Required',
        comment:
          'Grounding and bonding system required per NEC Article 250. Provide equipment grounding conductor and bonding jumper details.',
        severity: 'CRITICAL',
        category: 'Grounding',
        discipline: 'ELECTRICAL',
        applicableTo: ['ELECTRICAL'],
      },
      // Plumbing Comments
      {
        id: 'lib-9',
        codeSection: 'IPC Section 403',
        title: 'Fixture Count Insufficient',
        comment:
          'Fixture count is insufficient per IPC Section 403. Provide {requiredCount} {fixtureType} fixtures. Currently showing {actualCount}.',
        severity: 'MAJOR',
        category: 'Fixtures',
        discipline: 'PLUMBING',
        applicableTo: ['PLUMBING', 'BUILDING'],
        variables: ['requiredCount', 'fixtureType', 'actualCount'],
      },
      // Structural Comments
      {
        id: 'lib-10',
        codeSection: 'IBC Section 1603',
        title: 'Structural Calculations Required',
        comment:
          'Structural calculations required per IBC Section 1603. Provide sealed structural calculations for {element}.',
        severity: 'CRITICAL',
        category: 'Structural',
        discipline: 'STRUCTURAL',
        applicableTo: ['BUILDING'],
        variables: ['element'],
      },
      // General Drawing Quality
      {
        id: 'lib-11',
        codeSection: 'General',
        title: 'Scale Missing',
        comment: 'Drawing scale not indicated. Provide scale notation on all drawings.',
        severity: 'MINOR',
        category: 'Drawing Quality',
        discipline: 'BUILDING',
        applicableTo: [],
      },
      {
        id: 'lib-12',
        codeSection: 'General',
        title: 'Dimensions Missing',
        comment:
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
   * Get categories for discipline
   */
  getCategories(discipline: string): string[] {
    const categories = new Set<string>();
    this.library
      .filter(item => item.discipline === discipline)
      .forEach(item => categories.add(item.category));
    return Array.from(categories);
  }
}

// Singleton instance
export const commentLibraryService = new CommentLibraryService();
