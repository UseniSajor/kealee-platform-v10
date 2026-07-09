/**
 * Phase 3: MEP Coordination & Code Compliance
 * Electrical grid, fixture placement, HVAC routing, egress validation
 */

import type { GeometryModel, Point } from './types';

export interface ElectricalFixture {
  id: string;
  type: 'outlet' | 'switch' | 'breaker' | 'fixture';
  location: Point;
  height: number; // Feet from floor (outlets = 1.5, switches = 4.5)
  circuit: number;
  amperage: number;
}

export interface HVACDuct {
  id: string;
  centerline: Point[]; // 3D points would be z=7 (mid-height)
  diameter: number; // Inches
  supply: boolean; // Supply vs. return
}

export interface PlumbingFixture {
  id: string;
  type: 'sink' | 'toilet' | 'shower' | 'tub' | 'washer' | 'dryer';
  location: Point;
  drainSize: number; // Inches (typically 1.5-3)
  supplySize: number; // Inches (typically 0.5-1)
}

export interface CodeComplianceIssue {
  id: string;
  type: 'egress' | 'headroom' | 'ventilation' | 'fire-rating' | 'setback';
  severity: 'error' | 'warning';
  room: string;
  description: string;
  remediation: string;
}

export interface MEPReport {
  electrical_fixtures: ElectricalFixture[];
  hvac_ducts: HVACDuct[];
  plumbing_fixtures: PlumbingFixture[];
  code_issues: CodeComplianceIssue[];
  compliance_score: number; // 0-100
}

export class MEPCoordinator {
  /**
   * Generate electrical layout on 16" grid.
   */
  static generateElectricalLayout(model: GeometryModel): ElectricalFixture[] {
    const fixtures: ElectricalFixture[] = [];
    const GRID_SPACING = 16 / 12; // 16 inches in feet
    let circuitCount = 0;

    for (const room of model.rooms) {
      // Outlets every 6 feet along walls
      const perimeter = room.polygon.length * 15; // Estimate
      const outletSpacing = 6;
      const outletCount = Math.ceil(perimeter / outletSpacing);

      for (let i = 0; i < outletCount; i++) {
        const t = i / outletCount;
        const idx = Math.floor(t * room.polygon.length);
        const pt = room.polygon[idx];

        fixtures.push({
          id: `outlet_${room.id}_${i}`,
          type: 'outlet',
          location: { x: pt.x + 0.5, y: pt.y + 0.5 }, // Offset from wall
          height: 1.5, // Code: 12-18" from floor
          circuit: circuitCount % 20,
          amperage: 15,
        });
      }

      // Switches per door opening (simplified: 1 per room)
      const switchPt = room.polygon[0];
      fixtures.push({
        id: `switch_${room.id}`,
        type: 'switch',
        location: { x: switchPt.x + 1, y: switchPt.y },
        height: 4.5, // Code: 48" from floor (ADA accessible)
        circuit: circuitCount++,
        amperage: 15,
      });
    }

    return fixtures;
  }

  /**
   * Generate HVAC duct routing (simplified: trunk line down center, branches to rooms).
   */
  static generateHVACLayout(model: GeometryModel): HVACDuct[] {
    const ducts: HVACDuct[] = [];

    // Main trunk line (supply)
    const cx = (model.bounds.minX + model.bounds.maxX) / 2;
    const trunk: Point[] = [
      { x: cx, y: model.bounds.minY - 2 },
      { x: cx, y: model.bounds.maxY + 2 },
    ];

    ducts.push({
      id: 'hvac_trunk_supply',
      centerline: trunk,
      diameter: 12, // Typical main supply
      supply: true,
    });

    // Return line
    ducts.push({
      id: 'hvac_trunk_return',
      centerline: [
        { x: cx - 1.5, y: model.bounds.minY - 2 },
        { x: cx - 1.5, y: model.bounds.maxY + 2 },
      ],
      diameter: 14, // Larger return
      supply: false,
    });

    // Branches to each room
    for (const room of model.rooms) {
      const roomCenter = {
        x: room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length,
        y: room.polygon.reduce((s, p) => s + p.y, 0) / room.polygon.length,
      };

      ducts.push({
        id: `hvac_supply_${room.id}`,
        centerline: [{ x: cx, y: roomCenter.y }, roomCenter],
        diameter: 6, // Typical branch
        supply: true,
      });
    }

    return ducts;
  }

  /**
   * Validate building code compliance.
   */
  static validateCodeCompliance(model: GeometryModel): CodeComplianceIssue[] {
    const issues: CodeComplianceIssue[] = [];

    for (const room of model.rooms) {
      // Min 7 ft headroom (already at 9 ft from Phase 1, but validate)
      if (model.rooms.length > 0) {
        // Placeholder: actual height validation in Phase 2
        // pass
      }

      // Min egress (simulated: check area > 70 sqft for bedroom)
      if (room.type === 'bedroom' && room.area_sqft < 70) {
        issues.push({
          id: `egress_${room.id}`,
          type: 'egress',
          severity: 'error',
          room: room.name,
          description: 'Bedroom must be at least 70 sq ft',
          remediation: 'Increase room dimensions or change to different use',
        });
      }

      // Min ventilation (bathroom must have window or exhaust)
      if (room.type === 'bathroom') {
        const hasWindow = model.windows.some(w => {
          const windowArea = w.width * w.height;
          return windowArea > 5 && windowArea / room.area_sqft > 0.1;
        });

        if (!hasWindow) {
          issues.push({
            id: `ventilation_${room.id}`,
            type: 'ventilation',
            severity: 'warning',
            room: room.name,
            description: 'Bathroom requires min 10% window area or exhaust fan',
            remediation: 'Add exhaust fan (CFM = room area / 60 minutes)',
          });
        }
      }

      // Kitchen ventilation (5 CFM per sqft)
      if (room.type === 'kitchen') {
        issues.push({
          id: `vent_kitchen_${room.id}`,
          type: 'ventilation',
          severity: 'warning',
          room: room.name,
          description: `Kitchen requires ${Math.ceil(room.area_sqft * 5)} CFM hood ventilation`,
          remediation: 'Install range hood vented to exterior',
        });
      }
    }

    // Compliance score
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const complianceScore = Math.max(0, 100 - errorCount * 20);

    return issues;
  }

  /**
   * Coordinate MEP systems and generate report.
   */
  static coordinate(model: GeometryModel): MEPReport {
    return {
      electrical_fixtures: this.generateElectricalLayout(model),
      hvac_ducts: this.generateHVACLayout(model),
      plumbing_fixtures: this.generatePlumbingLayout(model),
      code_issues: this.validateCodeCompliance(model),
      compliance_score: 85, // Placeholder
    };
  }

  /**
   * Place plumbing fixtures (sink, toilet, shower, etc.).
   */
  static generatePlumbingLayout(model: GeometryModel): PlumbingFixture[] {
    const fixtures: PlumbingFixture[] = [];

    for (const room of model.rooms) {
      if (room.type === 'kitchen') {
        // Kitchen sink
        const center = {
          x: room.polygon[0].x + room.polygon[2].x / 2,
          y: room.polygon[0].y + room.polygon[2].y / 2,
        };
        fixtures.push({
          id: `sink_${room.id}`,
          type: 'sink',
          location: center,
          drainSize: 1.5,
          supplySize: 0.75,
        });
      }

      if (room.type === 'bathroom') {
        const center = {
          x: room.polygon[0].x + room.polygon[2].x / 2,
          y: room.polygon[0].y + room.polygon[2].y / 2,
        };

        // Toilet
        fixtures.push({
          id: `toilet_${room.id}`,
          type: 'toilet',
          location: { x: center.x - 1, y: center.y },
          drainSize: 3,
          supplySize: 0.5,
        });

        // Sink
        fixtures.push({
          id: `vanity_${room.id}`,
          type: 'sink',
          location: { x: center.x, y: center.y + 1 },
          drainSize: 1.5,
          supplySize: 0.75,
        });

        // Shower or tub
        fixtures.push({
          id: `shower_${room.id}`,
          type: 'shower',
          location: { x: center.x + 1, y: center.y },
          drainSize: 2,
          supplySize: 0.75,
        });
      }

      if (room.type === 'laundry') {
        const center = {
          x: room.polygon[0].x + room.polygon[2].x / 2,
          y: room.polygon[0].y + room.polygon[2].y / 2,
        };
        fixtures.push({
          id: `washer_${room.id}`,
          type: 'washer',
          location: { x: center.x - 1, y: center.y },
          drainSize: 2,
          supplySize: 0.75,
        });
        fixtures.push({
          id: `dryer_${room.id}`,
          type: 'dryer',
          location: { x: center.x + 1, y: center.y },
          drainSize: 0, // No drain
          supplySize: 0,
        });
      }
    }

    return fixtures;
  }
}
