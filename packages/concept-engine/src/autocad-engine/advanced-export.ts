/**
 * Phase 4: Advanced Export (DXF R2000, blocks, metadata, PDF annotations)
 * Enhanced DXF with cell definitions, layer standards, title blocks
 */

import type { GeometryModel } from './types';
import type { MEPReport } from './mep-coordinator';
import type { Wall3D, Slab3D } from './geometry-3d';

export interface TitleBlockInfo {
  project_name: string;
  address: string;
  client: string;
  date: string;
  scale: string; // e.g., "1/4\" = 1'-0\""
  revision: number;
  drawn_by: string;
  checked_by: string;
}

export interface PDFAnnotation {
  type: 'dimension' | 'note' | 'flag' | 'revision-cloud';
  location: { x: number; y: number };
  text: string;
  color: string; // RGB hex or name
}

export class AdvancedExporter {
  /**
   * Generate DXF R2000 format (enhanced from R12).
   * Includes block definitions, xdata, extended attributes.
   */
  static generateDXFR2000(
    model: GeometryModel,
    mepReport?: MEPReport,
    titleBlock?: TitleBlockInfo,
  ): string {
    const lines: string[] = [];

    // R2000 Header
    lines.push(...this.generateR2000Header(model, titleBlock));

    // BLOCKS section (cell/symbol definitions)
    lines.push(...this.generateBlocksSection(mepReport));

    // ENTITIES section
    lines.push('SECTION');
    lines.push('2');
    lines.push('ENTITIES');

    // Draw model geometry
    for (const wall of model.walls) {
      for (const seg of wall.segments) {
        lines.push('LINE');
        lines.push('8');
        lines.push('A-WALL');
        lines.push('10');
        lines.push(seg.start.x.toFixed(3));
        lines.push('20');
        lines.push(seg.start.y.toFixed(3));
        lines.push('11');
        lines.push(seg.end.x.toFixed(3));
        lines.push('21');
        lines.push(seg.end.y.toFixed(3));
      }
    }

    // Insert electrical fixtures as blocks
    if (mepReport?.electrical_fixtures) {
      for (const fixture of mepReport.electrical_fixtures) {
        const blockName = fixture.type === 'outlet' ? 'OUTLET-BLOCK' : 'SWITCH-BLOCK';
        lines.push('INSERT');
        lines.push('2');
        lines.push(blockName);
        lines.push('8');
        lines.push('A-ELEC');
        lines.push('10');
        lines.push(fixture.location.x.toFixed(3));
        lines.push('20');
        lines.push(fixture.location.y.toFixed(3));
        lines.push('40');
        lines.push('1.0');
        lines.push('50');
        lines.push('0');
      }
    }

    // Insert HVAC ducts as polylines
    if (mepReport?.hvac_ducts) {
      for (const duct of mepReport.hvac_ducts) {
        lines.push('LWPOLYLINE');
        lines.push('8');
        lines.push(duct.supply ? 'A-HVAC-SUPPLY' : 'A-HVAC-RETURN');
        lines.push('70');
        lines.push('0');
        lines.push('90');
        lines.push(duct.centerline.length.toString());

        for (const pt of duct.centerline) {
          lines.push('10');
          lines.push(pt.x.toFixed(3));
          lines.push('20');
          lines.push(pt.y.toFixed(3));
        }

        // Polyline width
        lines.push('43');
        lines.push((duct.diameter / 12).toFixed(2)); // Convert inches to feet
      }
    }

    // Insert plumbing fixtures
    if (mepReport?.plumbing_fixtures) {
      for (const fixture of mepReport.plumbing_fixtures) {
        lines.push('CIRCLE');
        lines.push('8');
        lines.push('A-PLUM');
        lines.push('10');
        lines.push(fixture.location.x.toFixed(3));
        lines.push('20');
        lines.push(fixture.location.y.toFixed(3));
        lines.push('40');
        lines.push('0.25'); // 3" diameter circle
      }
    }

    // Title block
    if (titleBlock) {
      lines.push(...this.generateTitleBlock(titleBlock));
    }

    lines.push('ENDSEC');

    // Objects section (for extended data)
    lines.push('SECTION');
    lines.push('2');
    lines.push('OBJECTS');
    lines.push('DICTIONARY');
    lines.push('ENDSEC');
    lines.push('EOF');

    return lines.join('\r\n');
  }

  /**
   * Generate R2000 header with version info.
   */
  private static generateR2000Header(
    model: GeometryModel,
    titleBlock?: TitleBlockInfo,
  ): string[] {
    const lines = [
      'SECTION',
      '2',
      'HEADER',
      '$ACADVER',
      '1',
      'AC1021', // DXF R2000
      '$ACADMAINTVER',
      '70',
      '0',
      '$DWGCODEPAGE',
      '3',
      'ANSI_1252',
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
      '$LIMMIN',
      '10',
      '0.0',
      '20',
      '0.0',
      '$LIMMAX',
      '10',
      (model.bounds.maxX + 5).toFixed(1),
      '20',
      (model.bounds.maxY + 5).toFixed(1),
      '$UNITS',
      '70',
      '1', // Feet
      '$TILEMODE',
      '70',
      '1',
    ];

    if (titleBlock) {
      lines.push('$TITLE');
      lines.push('1');
      lines.push(titleBlock.project_name);
    }

    lines.push('ENDSEC');
    return lines;
  }

  /**
   * Generate BLOCKS section with cell/symbol definitions.
   */
  private static generateBlocksSection(mepReport?: MEPReport): string[] {
    const lines = [
      'SECTION',
      '2',
      'BLOCKS',
      'BLOCK',
      '8',
      '0',
      '2',
      'OUTLET-BLOCK',
      '70',
      '0',
      '10',
      '0.0',
      '20',
      '0.0',
      'CIRCLE',
      '8',
      'A-ELEC',
      '62',
      '2', // Yellow
      '10',
      '0.0',
      '20',
      '0.0',
      '40',
      '0.1',
      'ENDBLK',
      '8',
      '0',
      'BLOCK',
      '8',
      '0',
      '2',
      'SWITCH-BLOCK',
      '70',
      '0',
      '10',
      '0.0',
      '20',
      '0.0',
      'LINE',
      '8',
      'A-ELEC',
      '62',
      '2',
      '10',
      '0.0',
      '20',
      '-0.15',
      '11',
      '0.0',
      '21',
      '0.15',
      'ENDBLK',
      '8',
      '0',
    ];

    return lines;
  }

  /**
   * Generate title block (text annotations).
   */
  private static generateTitleBlock(info: TitleBlockInfo): string[] {
    const x = 30; // Position in lower right (typical)
    const y = 2;
    const textHeight = 0.2;

    const lines = [
      'TEXT',
      '8',
      'A-ANNO-TTLK',
      '10',
      x.toFixed(1),
      '20',
      y.toFixed(1),
      '40',
      textHeight.toString(),
      '1',
      `PROJECT: ${info.project_name}`,
      'TEXT',
      '8',
      'A-ANNO-TTLK',
      '10',
      x.toFixed(1),
      '20',
      (y - 0.3).toFixed(2),
      '40',
      textHeight.toString(),
      '1',
      `ADDRESS: ${info.address}`,
      'TEXT',
      '8',
      'A-ANNO-TTLK',
      '10',
      x.toFixed(1),
      '20',
      (y - 0.6).toFixed(2),
      '40',
      textHeight.toString(),
      '1',
      `DATE: ${info.date}`,
      'TEXT',
      '8',
      'A-ANNO-TTLK',
      '10',
      x.toFixed(1),
      '20',
      (y - 0.9).toFixed(2),
      '40',
      textHeight.toString(),
      '1',
      `SCALE: ${info.scale}`,
    ];

    return lines;
  }

  /**
   * Generate PDF annotation overlay (markup layer).
   * Returns JSON for embedding in PDF or annotation file.
   */
  static generatePDFAnnotations(
    model: GeometryModel,
    mepReport: MEPReport,
  ): PDFAnnotation[] {
    const annotations: PDFAnnotation[] = [];

    // Flag code compliance issues
    for (const issue of mepReport.code_issues) {
      if (issue.severity === 'error') {
        annotations.push({
          type: 'revision-cloud',
          location: { x: model.bounds.minX, y: model.bounds.maxY },
          text: `⚠ ${issue.description}`,
          color: '#FF0000', // Red
        });
      }
    }

    // Add MEP notes
    let noteY = model.bounds.maxY - 2;
    annotations.push({
      type: 'note',
      location: { x: model.bounds.minX + 1, y: noteY },
      text: `Electrical: ${mepReport.electrical_fixtures.length} outlets/switches`,
      color: '#FFFF00', // Yellow
    });

    noteY -= 0.5;
    annotations.push({
      type: 'note',
      location: { x: model.bounds.minX + 1, y: noteY },
      text: `HVAC: ${mepReport.hvac_ducts.length} ducts`,
      color: '#0000FF', // Blue
    });

    noteY -= 0.5;
    annotations.push({
      type: 'note',
      location: { x: model.bounds.minX + 1, y: noteY },
      text: `Plumbing: ${mepReport.plumbing_fixtures.length} fixtures`,
      color: '#00FF00', // Green
    });

    return annotations;
  }

  /**
   * Export geometry as IFC-compatible JSON (simplified).
   * Preparation for Phase 5 (Revit/BIM integration).
   */
  static generateIFCJSON(
    model: GeometryModel,
    walls3d: Wall3D[] = [],
    slabs3d: Slab3D[] = [],
  ): any {
    return {
      ifcType: 'IfcBuilding',
      name: model.name,
      walls: walls3d.map(w => ({
        ifcType: 'IfcWall',
        id: w.id,
        height: w.height,
        thickness: w.thickness,
      })),
      slabs: slabs3d.map(s => ({
        ifcType: 'IfcSlab',
        id: s.id,
        thickness: s.thickness,
      })),
      bounds: model.bounds,
      export_date: new Date().toISOString(),
    };
  }
}
