/**
 * Markup Palette Service
 * Discipline-specific markup palettes
 */

export interface MarkupPalette {
  discipline: string;
  tools: Array<{
    type: string;
    name: string;
    icon: string;
    defaultColor: string;
    defaultStrokeWidth: number;
  }>;
  colors: string[];
  severityColors: {
    MINOR: string;
    MAJOR: string;
    CRITICAL: string;
  };
}

export class MarkupPaletteService {
  private palettes: Map<string, MarkupPalette> = new Map();

  constructor() {
    this.initializePalettes();
  }

  /**
   * Get palette for discipline
   */
  getPalette(discipline: string): MarkupPalette {
    return this.palettes.get(discipline) || this.getDefaultPalette();
  }

  /**
   * Get default palette
   */
  private getDefaultPalette(): MarkupPalette {
    return {
      discipline: 'DEFAULT',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'rectangle', name: 'Rectangle', icon: '□', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'circle', name: 'Circle', icon: '○', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'line', name: 'Line', icon: '—', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'text', name: 'Text', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
        {type: 'stamp', name: 'Stamp', icon: '✓', defaultColor: '#00FF00', defaultStrokeWidth: 0},
      ],
      colors: ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#00FFFF', '#000000'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    };
  }

  /**
   * Initialize discipline-specific palettes
   */
  private initializePalettes() {
    // Building Palette
    this.palettes.set('BUILDING', {
      discipline: 'BUILDING',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'rectangle', name: 'Area', icon: '□', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'line', name: 'Dimension', icon: '—', defaultColor: '#0000FF', defaultStrokeWidth: 1},
        {type: 'text', name: 'Note', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
        {type: 'stamp', name: 'Approved', icon: '✓', defaultColor: '#00FF00', defaultStrokeWidth: 0},
      ],
      colors: ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    });

    // Electrical Palette
    this.palettes.set('ELECTRICAL', {
      discipline: 'ELECTRICAL',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'circle', name: 'Circuit', icon: '○', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'line', name: 'Wire', icon: '—', defaultColor: '#0000FF', defaultStrokeWidth: 1},
        {type: 'text', name: 'Note', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
      ],
      colors: ['#FF0000', '#0000FF', '#00FF00', '#FFFF00'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    });

    // Plumbing Palette
    this.palettes.set('PLUMBING', {
      discipline: 'PLUMBING',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#0000FF', defaultStrokeWidth: 2},
        {type: 'line', name: 'Pipe', icon: '—', defaultColor: '#0000FF', defaultStrokeWidth: 2},
        {type: 'circle', name: 'Fixture', icon: '○', defaultColor: '#0000FF', defaultStrokeWidth: 2},
        {type: 'text', name: 'Note', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
      ],
      colors: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    });

    // Structural Palette
    this.palettes.set('STRUCTURAL', {
      discipline: 'STRUCTURAL',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'rectangle', name: 'Member', icon: '□', defaultColor: '#FF0000', defaultStrokeWidth: 2},
        {type: 'line', name: 'Dimension', icon: '—', defaultColor: '#0000FF', defaultStrokeWidth: 1},
        {type: 'text', name: 'Note', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
      ],
      colors: ['#FF0000', '#0000FF', '#8B4513', '#FFFF00'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    });

    // Zoning Palette
    this.palettes.set('ZONING', {
      discipline: 'ZONING',
      tools: [
        {type: 'arrow', name: 'Arrow', icon: '→', defaultColor: '#0000FF', defaultStrokeWidth: 2},
        {type: 'rectangle', name: 'Setback', icon: '□', defaultColor: '#0000FF', defaultStrokeWidth: 2},
        {type: 'line', name: 'Property Line', icon: '—', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'text', name: 'Note', icon: 'T', defaultColor: '#000000', defaultStrokeWidth: 1},
        {type: 'highlight', name: 'Highlight', icon: '▬', defaultColor: '#FFFF00', defaultStrokeWidth: 0},
      ],
      colors: ['#0000FF', '#00FF00', '#FFFF00', '#FF0000'],
      severityColors: {
        MINOR: '#FFFF00',
        MAJOR: '#FFA500',
        CRITICAL: '#FF0000',
      },
    });
  }

  /**
   * Get all palettes
   */
  getAllPalettes(): MarkupPalette[] {
    return Array.from(this.palettes.values());
  }
}

// Singleton instance
export const markupPaletteService = new MarkupPaletteService();
