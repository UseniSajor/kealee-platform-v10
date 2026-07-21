/**
 * DXF R12 writer for AutoCAD engine.
 * Generates ASCII DXF files with AIA layer naming standards.
 * Phase 1: Lines, polylines, text, circles. No blocks or nested structures.
 */

import type {
  GeometryModel,
  Point,
  DXFExportOptions,
} from './types';

export class DXFWriter {
  /**
   * Generate DXF R12 ASCII format from geometry model.
   */
  static generateDXF(
    model: GeometryModel,
    options: DXFExportOptions = {},
  ): string {
    const {
      include_dimensions = true,
      include_doors = true,
      include_windows = true,
      include_rooms = false,
      precision = 3,
      layer_prefix = 'A',
    } = options;

    const lines: string[] = [];

    // DXF Header
    lines.push(...this.generateHeader(model, layer_prefix));

    // DXF Entities
    lines.push('SECTION');
    lines.push('2');
    lines.push('ENTITIES');

    // Draw walls
    for (const wall of model.walls) {
      const layer = this.formatLayer(wall.layer, layer_prefix);
      for (const segment of wall.segments) {
        lines.push(...this.generateLine(segment.start, segment.end, layer, precision));
      }

      // Draw wall thickness as offset polyline (inner surface)
      if (wall.thickness > 0.01) {
        const innerLayer = this.formatLayer(`${wall.layer}-INNER`, layer_prefix);
        for (const segment of wall.segments) {
          const offset = wall.thickness / 2;
          const normal = this.getPerpendicularDirection(segment.start, segment.end);
          const p1 = {
            x: segment.start.x + normal.x * offset,
            y: segment.start.y + normal.y * offset,
          };
          const p2 = {
            x: segment.end.x + normal.x * offset,
            y: segment.end.y + normal.y * offset,
          };
          lines.push(...this.generateLine(p1, p2, innerLayer, precision));
        }
      }
    }

    // Draw doors
    if (include_doors) {
      for (const door of model.doors) {
        const layer = this.formatLayer(`${door.layer}-DOOR`, layer_prefix);
        lines.push(...this.generateDoor(door, layer, precision));
      }
    }

    // Draw windows
    if (include_windows) {
      for (const window of model.windows) {
        const layer = this.formatLayer(`${window.layer}-WINDOW`, layer_prefix);
        lines.push(...this.generateWindow(window, layer, precision));
      }
    }

    // Draw dimensions
    if (include_dimensions) {
      for (const dim of model.dimensions) {
        const layer = this.formatLayer(dim.layer, layer_prefix);
        lines.push(...this.generateDimension(dim, layer, precision));
      }
    }

    // Draw room outlines (optional)
    if (include_rooms) {
      for (const room of model.rooms) {
        const layer = this.formatLayer(`${room.layer}-ROOM`, layer_prefix);
        lines.push(...this.generatePolyline(room.polygon, layer, true, precision));
      }
    }

    lines.push('ENDSEC');

    // DXF Footer
    lines.push(...this.generateFooter());

    return lines.join('\r\n');
  }

  /**
   * DXF file header section.
   */
  private static generateHeader(model: GeometryModel, layer_prefix: string): string[] {
    return [
      'SECTION',
      '2',
      'HEADER',
      '$ACADVER',
      '1',
      'AC1009', // DXF R12
      '$EXTMIN',
      '10',
      model.bounds.minX.toFixed(3),
      '20',
      model.bounds.minY.toFixed(3),
      '$EXTMAX',
      '10',
      model.bounds.maxX.toFixed(3),
      '20',
      model.bounds.maxY.toFixed(3),
      '$UNITS',
      '70',
      '1', // Feet
      'ENDSEC',
      'SECTION',
      '2',
      'TABLES',
      'TABLE',
      '2',
      'LAYER',
      '70',
      '0',
      ...this.generateLayerTable(model, layer_prefix),
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'TABLE',
      '2',
      'LTYPE',
      '70',
      '1',
      'LTYPE',
      '2',
      'CONTINUOUS',
      '70',
      '0',
      '3',
      'Solid line',
      '72',
      '65',
      '73',
      '0',
      '40',
      '0.0',
      'ENDTAB',
      'TABLE',
      '2',
      'STYLE',
      '70',
      '1',
      'STYLE',
      '2',
      'STANDARD',
      '70',
      '0',
      '40',
      '0.0',
      '41',
      '1.0',
      '50',
      '0.0',
      '71',
      '0',
      '42',
      '1.0',
      '3',
      'arial.shx',
      '4',
      '',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
      'ENDTAB',
    ];
  }

  /**
   * Generate layer definitions for all unique layers.
   */
  private static generateLayerTable(model: GeometryModel, prefix: string): string[] {
    const layers = new Set<string>();

    // Collect all layer names
    for (const wall of model.walls) {
      layers.add(wall.layer);
    }
    for (const door of model.doors) {
      layers.add(door.layer);
    }
    for (const window of model.windows) {
      layers.add(window.layer);
    }
    for (const dim of model.dimensions) {
      layers.add(dim.layer);
    }

    const lines: string[] = [];
    const layerColors: Record<string, number> = {
      'A-WALL': 1, // Red
      'A-DOOR': 2, // Yellow
      'A-WINDOW': 3, // Green
      'A-DIM': 4, // Cyan
      'A-ROOM': 5, // Magenta
    };

    for (const layer of layers) {
      const color = layerColors[this.formatLayer(layer, prefix)] || 7; // White default
      lines.push(
        'LAYER',
        '2',
        this.formatLayer(layer, prefix),
        '70',
        '0',
        '62',
        color.toString(),
        '6',
        'CONTINUOUS',
      );
    }

    return lines;
  }

  /**
   * Generate a LINE entity.
   */
  private static generateLine(
    start: Point,
    end: Point,
    layer: string,
    precision: number,
  ): string[] {
    const fmt = (n: number) => n.toFixed(precision);
    return [
      'LINE',
      '8',
      layer,
      '62',
      '7', // White
      '10',
      fmt(start.x),
      '20',
      fmt(start.y),
      '30',
      '0',
      '11',
      fmt(end.x),
      '21',
      fmt(end.y),
      '31',
      '0',
    ];
  }

  /**
   * Generate door representation (simplified: line + text label).
   */
  private static generateDoor(
    door: any,
    layer: string,
    precision: number,
  ): string[] {
    const fmt = (n: number) => n.toFixed(precision);
    const lines: string[] = [];

    // Draw door swing arc (simplified as circle)
    const radius = door.width / 2;
    lines.push(
      'CIRCLE',
      '8',
      layer,
      '62',
      '2', // Yellow
      '10',
      fmt(door.location.x),
      '20',
      fmt(door.location.y),
      '30',
      '0',
      '40',
      fmt(radius),
    );

    // Label
    lines.push(
      'TEXT',
      '8',
      layer,
      '62',
      '2',
      '10',
      fmt(door.location.x),
      '20',
      fmt(door.location.y - 0.5),
      '40',
      '0.25',
      '1',
      `DOOR-${door.width.toFixed(1)}FT`,
    );

    return lines;
  }

  /**
   * Generate window representation (simplified: line + text).
   */
  private static generateWindow(
    window: any,
    layer: string,
    precision: number,
  ): string[] {
    const fmt = (n: number) => n.toFixed(precision);
    return [
      'LINE',
      '8',
      layer,
      '62',
      '3', // Green
      '10',
      fmt(window.location.x - window.width / 2),
      '20',
      fmt(window.location.y),
      '30',
      '0',
      '11',
      fmt(window.location.x + window.width / 2),
      '21',
      fmt(window.location.y),
      '31',
      '0',
      'TEXT',
      '8',
      layer,
      '62',
      '3',
      '10',
      fmt(window.location.x),
      '20',
      fmt(window.location.y + 0.3),
      '40',
      '0.2',
      '1',
      `WIN-${window.width.toFixed(1)}FT`,
    ];
  }

  /**
   * Generate dimension text and line.
   */
  private static generateDimension(
    dim: any,
    layer: string,
    precision: number,
  ): string[] {
    const fmt = (n: number) => n.toFixed(precision);
    const lines: string[] = [];

    // Dimension line
    lines.push(
      'LINE',
      '8',
      layer,
      '62',
      '4', // Cyan
      '10',
      fmt(dim.start.x),
      '20',
      fmt(dim.start.y),
      '30',
      '0',
      '11',
      fmt(dim.end.x),
      '21',
      fmt(dim.end.y),
      '31',
      '0',
    );

    // Dimension text
    const midX = (dim.start.x + dim.end.x) / 2;
    const midY = (dim.start.y + dim.end.y) / 2;

    lines.push(
      'TEXT',
      '8',
      layer,
      '62',
      '4',
      '10',
      fmt(midX),
      '20',
      fmt(midY + 0.2),
      '40',
      '0.2',
      '1',
      `${dim.value.toFixed(2)}${dim.unit}`,
    );

    return lines;
  }

  /**
   * Generate POLYLINE entity.
   */
  private static generatePolyline(
    vertices: Point[],
    layer: string,
    closed: boolean,
    precision: number,
  ): string[] {
    const fmt = (n: number) => n.toFixed(precision);
    const lines: string[] = [
      'POLYLINE',
      '8',
      layer,
      '62',
      '5', // Magenta
      '70',
      closed ? '1' : '0', // Closed flag
    ];

    for (const v of vertices) {
      lines.push(
        'VERTEX',
        '8',
        layer,
        '10',
        fmt(v.x),
        '20',
        fmt(v.y),
        '30',
        '0',
      );
    }

    lines.push('SEQEND', '8', layer);
    return lines;
  }

  /**
   * DXF file footer (OBJECTS section).
   */
  private static generateFooter(): string[] {
    return [
      'SECTION',
      '2',
      'OBJECTS',
      'DICTIONARY',
      '3',
      'ACAD_GROUP',
      'DICTIONARY',
      '3',
      'ACAD_LAYOUT',
      'LAYOUT',
      '2',
      'Layout1',
      'LAYOUT',
      '2',
      'Layout2',
      'ENDSEC',
      'EOF',
    ];
  }

  /**
   * Format layer name with AIA standard prefix.
   */
  private static formatLayer(name: string, prefix: string): string {
    if (name.startsWith(prefix)) return name;
    return `${prefix}-${name.toUpperCase()}`;
  }

  /**
   * Get perpendicular unit direction (left normal).
   */
  private static getPerpendicularDirection(
    start: Point,
    end: Point,
  ): { x: number; y: number } {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    return len > 0 ? { x: -dy / len, y: dx / len } : { x: 0, y: 1 };
  }
}
