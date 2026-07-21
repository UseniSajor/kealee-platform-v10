/**
 * APP-12: SMART SCHEDULER — GPS CREW TRACKING
 * Geofenced crew check-in/out with hours tracking and realtime broadcasts.
 */

import { PrismaClient } from '@prisma/client';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { createLogger } from '@kealee/observability';

const prisma = new PrismaClient();
const eventBus = getEventBus('crew-tracking');
const logger = createLogger('crew-tracking');

// ============================================================================
// CONSTANTS
// ============================================================================

/** Geofence radius in meters — crew must be within this distance to verify */
const GEOFENCE_RADIUS = 200;

/** Earth radius in meters for Haversine formula */
const EARTH_RADIUS = 6_371_000;

// ============================================================================
// TYPES
// ============================================================================

export interface CrewCheckInParams {
  projectId: string;
  userId: string;
  type: 'ARRIVE' | 'DEPART';
  latitude: number;
  longitude: number;
  notes?: string;
  photo?: string;
}

export interface CrewCheckInResult {
  id: string;
  projectId: string;
  userId: string;
  type: 'ARRIVE' | 'DEPART';
  verified: boolean;
  distance: number;
  hoursOnSite?: number;
  createdAt: Date;
}

export interface OnSiteCrewMember {
  userId: string;
  userName: string;
  arrivedAt: Date;
  hoursOnSite: number;
  verified: boolean;
}

export interface DailyCrewReport {
  projectId: string;
  date: string;
  totalCrewMembers: number;
  totalHours: number;
  entries: Array<{
    userId: string;
    userName: string;
    arrivedAt: Date | null;
    departedAt: Date | null;
    hoursOnSite: number;
    verified: boolean;
  }>;
}

// ============================================================================
// HAVERSINE DISTANCE
// ============================================================================

/**
 * Calculate distance between two lat/lng points using the Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

// ============================================================================
// CREW TRACKING SERVICE
// ============================================================================

class CrewTrackingService {
  /**
   * Record a crew member check-in (ARRIVE) or check-out (DEPART).
   *
   * - Validates GPS against project coordinates with 200m geofence
   * - On DEPART: finds matching ARRIVE and calculates hoursOnSite
   * - Broadcasts realtime event to project channel
   */
  async recordCheckIn(params: CrewCheckInParams): Promise<CrewCheckInResult> {
    const { projectId, userId, type, latitude, longitude, notes, photo } = params;

    // Get project for GPS coordinates
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, latitude: true, longitude: true, name: true },
    });

    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Calculate distance from project site
    let distance = 0;
    let verified = false;

    if (project.latitude != null && project.longitude != null) {
      distance = haversineDistance(
        latitude,
        longitude,
        project.latitude,
        project.longitude
      );
      verified = distance <= GEOFENCE_RADIUS;
    }

    // For DEPART: find matching ARRIVE and calculate hours on site
    let hoursOnSite: number | undefined;

    if (type === 'DEPART') {
      // Find the most recent ARRIVE for this user/project without a matching DEPART
      const lastArrive = await (prisma as any).crewCheckIn.findFirst({
        where: {
          projectId,
          userId,
          type: 'ARRIVE',
        },
        orderBy: { createdAt: 'desc' },
      });

      if (lastArrive) {
        // Check there's no DEPART after this ARRIVE
        const departAfterArrive = await (prisma as any).crewCheckIn.findFirst({
          where: {
            projectId,
            userId,
            type: 'DEPART',
            createdAt: { gt: lastArrive.createdAt },
          },
        });

        if (!departAfterArrive) {
          const arriveTime = new Date(lastArrive.createdAt).getTime();
          const departTime = Date.now();
          hoursOnSite = (departTime - arriveTime) / (1000 * 60 * 60);
          hoursOnSite = Math.round(hoursOnSite * 100) / 100; // Round to 2 decimals
        }
      }
    }

    // Create the check-in record
    const checkIn = await (prisma as any).crewCheckIn.create({
      data: {
        projectId,
        userId,
        type,
        latitude,
        longitude,
        verified,
        distance: Math.round(distance * 100) / 100,
        hoursOnSite: hoursOnSite ?? null,
        notes: notes || null,
        photo: photo || null,
      },
    });

    // Get user name for broadcast
    let userName = 'Unknown';
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      if (user?.name) userName = user.name;
    } catch {
      // User lookup failed — continue with 'Unknown'
    }

    // Publish crew event via event bus
    const eventType = type === 'ARRIVE' ? EVENT_TYPES.CREW_ARRIVED : EVENT_TYPES.CREW_DEPARTED;

    eventBus.publish(eventType, {
      projectId,
      userId,
      userName,
      type,
      verified,
      hoursOnSite,
      timestamp: new Date().toISOString(),
    }).catch((err) => {
      logger.error({ err, projectId }, 'Failed to publish crew event');
    });

    logger.info(
      {
        projectId,
        userId,
        type,
        verified,
        distance: Math.round(distance),
        hoursOnSite,
      },
      `Crew ${type === 'ARRIVE' ? 'check-in' : 'check-out'} recorded`
    );

    return {
      id: checkIn.id,
      projectId,
      userId,
      type,
      verified,
      distance: Math.round(distance * 100) / 100,
      hoursOnSite,
      createdAt: checkIn.createdAt,
    };
  }

  /**
   * Get crew members currently on-site (have ARRIVE without matching DEPART).
   */
  async getOnSiteCrew(projectId: string): Promise<OnSiteCrewMember[]> {
    // Get all ARRIVEs for the project today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const arrivals = await (prisma as any).crewCheckIn.findMany({
      where: {
        projectId,
        type: 'ARRIVE',
        createdAt: { gte: todayStart },
      },
      orderBy: { createdAt: 'desc' },
    });

    // For each arrival, check if there's a departure after it
    const onSite: OnSiteCrewMember[] = [];
    const processedUsers = new Set<string>();

    for (const arrival of arrivals) {
      if (processedUsers.has(arrival.userId)) continue;
      processedUsers.add(arrival.userId);

      const departure = await (prisma as any).crewCheckIn.findFirst({
        where: {
          projectId,
          userId: arrival.userId,
          type: 'DEPART',
          createdAt: { gt: arrival.createdAt },
        },
      });

      if (!departure) {
        // Still on site
        const hoursOnSite =
          (Date.now() - new Date(arrival.createdAt).getTime()) / (1000 * 60 * 60);

        // Get user name
        let userName = 'Unknown';
        try {
          const user = await prisma.user.findUnique({
            where: { id: arrival.userId },
            select: { name: true },
          });
          if (user?.name) userName = user.name;
        } catch {
          // ignore
        }

        onSite.push({
          userId: arrival.userId,
          userName,
          arrivedAt: arrival.createdAt,
          hoursOnSite: Math.round(hoursOnSite * 100) / 100,
          verified: arrival.verified,
        });
      }
    }

    return onSite;
  }

  /**
   * Get daily crew report — all check-ins/outs with hours summary.
   */
  async getDailyCrewReport(
    projectId: string,
    date?: Date
  ): Promise<DailyCrewReport> {
    const targetDate = date || new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const checkIns = await (prisma as any).crewCheckIn.findMany({
      where: {
        projectId,
        createdAt: { gte: dayStart, lte: dayEnd },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by user
    const userMap = new Map<
      string,
      { arrives: any[]; departs: any[] }
    >();

    for (const ci of checkIns) {
      if (!userMap.has(ci.userId)) {
        userMap.set(ci.userId, { arrives: [], departs: [] });
      }
      const entry = userMap.get(ci.userId)!;
      if (ci.type === 'ARRIVE') {
        entry.arrives.push(ci);
      } else {
        entry.departs.push(ci);
      }
    }

    // Build entries
    const entries: DailyCrewReport['entries'] = [];
    let totalHours = 0;

    for (const [userId, { arrives, departs }] of userMap) {
      let userName = 'Unknown';
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        if (user?.name) userName = user.name;
      } catch {
        // ignore
      }

      // Pair arrives with departs
      let userHours = 0;
      for (let i = 0; i < arrives.length; i++) {
        const arrive = arrives[i];
        const depart = departs[i]; // May be undefined if still on site

        if (depart && depart.hoursOnSite) {
          userHours += Number(depart.hoursOnSite);
        } else if (!depart) {
          // Still on site — calculate from arrive to now
          userHours +=
            (Date.now() - new Date(arrive.createdAt).getTime()) /
            (1000 * 60 * 60);
        }
      }

      userHours = Math.round(userHours * 100) / 100;
      totalHours += userHours;

      entries.push({
        userId,
        userName,
        arrivedAt: arrives[0]?.createdAt || null,
        departedAt: departs[departs.length - 1]?.createdAt || null,
        hoursOnSite: userHours,
        verified: arrives.some((a: any) => a.verified),
      });
    }

    return {
      projectId,
      date: dayStart.toISOString().split('T')[0],
      totalCrewMembers: userMap.size,
      totalHours: Math.round(totalHours * 100) / 100,
      entries,
    };
  }
}

export const crewTrackingService = new CrewTrackingService();
