/**
 * Orientation model — scores natural light based on room position
 * relative to the building footprint perimeter.
 *
 * Without actual GPS/survey data, we infer exterior exposure from
 * how close each room is to the bounding box edge of the layout.
 */

import type { RoomType } from './types';
import { EXTERIOR_PREFERRED } from './layout-constraints';

export type CompassBearing = 'N' | 'S' | 'E' | 'W' | 'unknown';

export interface RoomLightProfile {
  roomId: string;
  roomType: RoomType;
  exteriorExposure: 'none' | 'partial' | 'full';
  estimatedBearing: CompassBearing;
  lightScore: number;  // 0–100
}

export interface OrientationConfig {
  /** Compass direction the front of the building faces (from address/GPS if available) */
  buildingFrontFacing?: CompassBearing;
  /** Total footprint bounds (output of optimizer) */
  totalWidthFt: number;
  totalDepthFt: number;
}

/** Light quality by bearing (southern exposure is best in northern hemisphere) */
const BEARING_QUALITY: Record<CompassBearing, number> = {
  S: 100,
  SE: 90,
  SW: 85,
  E: 75,
  W: 65,
  N: 40,
  NE: 50,
  NW: 45,
  unknown: 60,
} as Record<string, number>;

/** Threshold in feet from footprint edge to count as "exterior exposure" */
const EXTERIOR_THRESHOLD_FT = 6;

export function scoreRoomLighting(
  rooms: Array<{ id: string; type: RoomType; x: number; y: number; widthFt: number; depthFt: number }>,
  config: OrientationConfig,
): RoomLightProfile[] {
  const { totalWidthFt, totalDepthFt, buildingFrontFacing = 'unknown' } = config;

  return rooms.map(room => {
    const roomRight  = room.x + room.widthFt;
    const roomBottom = room.y + room.depthFt;

    const nearLeft   = room.x < EXTERIOR_THRESHOLD_FT;
    const nearRight  = roomRight > totalWidthFt - EXTERIOR_THRESHOLD_FT;
    const nearTop    = room.y < EXTERIOR_THRESHOLD_FT;
    const nearBottom = roomBottom > totalDepthFt - EXTERIOR_THRESHOLD_FT;

    const exposedSides = [nearLeft, nearRight, nearTop, nearBottom].filter(Boolean).length;

    let exteriorExposure: RoomLightProfile['exteriorExposure'] = 'none';
    if (exposedSides >= 2) exteriorExposure = 'full';
    else if (exposedSides === 1) exteriorExposure = 'partial';

    // Infer compass bearing from position and building front
    const estimatedBearing = inferBearing(nearLeft, nearRight, nearTop, nearBottom, buildingFrontFacing);

    // Score: exterior-preferred rooms get bonus for having exposure
    const isPreferred = EXTERIOR_PREFERRED.has(room.type);
    let lightScore = 50; // base

    if (exteriorExposure === 'full') lightScore = 90;
    else if (exteriorExposure === 'partial') lightScore = 70;
    else if (isPreferred) lightScore = 30; // penalty: should have light but doesn't

    // Adjust for bearing quality
    const bearingBonus = (BEARING_QUALITY[estimatedBearing] ?? 60) - 60;
    lightScore = Math.max(0, Math.min(100, lightScore + bearingBonus * 0.2));

    return {
      roomId: room.id,
      roomType: room.type,
      exteriorExposure,
      estimatedBearing,
      lightScore: Math.round(lightScore),
    };
  });
}

function inferBearing(
  nearLeft: boolean,
  nearRight: boolean,
  nearTop: boolean,
  nearBottom: boolean,
  frontFacing: CompassBearing,
): CompassBearing {
  if (!nearLeft && !nearRight && !nearTop && !nearBottom) return 'unknown';

  // Map layout edges to compass directions based on building orientation
  // Default: top = North, bottom = South, left = West, right = East
  const edgeMap: Record<string, CompassBearing> = {
    top: frontFacing === 'unknown' ? 'N' : frontFacing,
    bottom: frontFacing === 'S' ? 'N' : 'S',
    left: 'W',
    right: 'E',
  };

  if (nearTop) return edgeMap.top;
  if (nearBottom) return edgeMap.bottom;
  if (nearRight) return edgeMap.right;
  if (nearLeft) return edgeMap.left;
  return 'unknown';
}

/**
 * Overall natural light score for a layout.
 * Heavily penalizes habitable rooms with no exterior exposure.
 */
export function scoreLayoutLighting(profiles: RoomLightProfile[]): number {
  if (profiles.length === 0) return 100;

  const preferredRooms = profiles.filter(p => EXTERIOR_PREFERRED.has(p.roomType));
  if (preferredRooms.length === 0) return 100;

  const totalLightScore = preferredRooms.reduce((sum, p) => sum + p.lightScore, 0);
  return Math.round(totalLightScore / preferredRooms.length);
}
