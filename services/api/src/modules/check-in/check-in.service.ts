/**
 * Site Check-In Service
 * GPS-verified on-site presence tracking for contractors and PMs
 */

import { PrismaClient } from '@kealee/database';

const prisma = new PrismaClient();
const p = prisma as any;

// ============================================================================
// TYPES
// ============================================================================

export interface CheckInInput {
  userId: string;
  userName: string;
  projectId: string;
  latitude?: number;
  longitude?: number;
  verified: boolean;
  distanceMeters?: number;
  manualOverride?: boolean;
  overrideNote?: string;
  role?: string;
  orgId?: string;
  deviceInfo?: string;
}

export interface CheckInRecord {
  id: string;
  userId: string;
  projectId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  distanceMeters: number | null;
  manualOverride: boolean;
  overrideNote: string | null;
  minutesOnSite: number | null;
  role: string | null;
}

// ============================================================================
// SERVICE
// ============================================================================

class CheckInService {
  /**
   * Create a new check-in
   */
  async checkIn(input: CheckInInput): Promise<CheckInRecord> {
    // Check for existing active check-in (prevent duplicates)
    const existing = await p.siteCheckIn.findFirst({
      where: {
        userId: input.userId,
        projectId: input.projectId,
        checkOutAt: null,
      },
    });

    if (existing) {
      return existing;
    }

    const checkIn = await p.siteCheckIn.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        verified: input.verified,
        distanceMeters: input.distanceMeters ?? null,
        manualOverride: input.manualOverride ?? false,
        overrideNote: input.overrideNote ?? null,
        role: input.role ?? null,
        orgId: input.orgId ?? null,
        deviceInfo: input.deviceInfo ?? null,
      },
    });

    return checkIn;
  }

  /**
   * Check out from a site
   */
  async checkOut(checkInId: string, userId: string): Promise<CheckInRecord> {
    const existing = await p.siteCheckIn.findUnique({
      where: { id: checkInId },
    });

    if (!existing) {
      throw new Error('Check-in not found');
    }

    if (existing.userId !== userId) {
      throw new Error('Not authorized to check out this check-in');
    }

    if (existing.checkOutAt) {
      return existing; // Already checked out
    }

    const now = new Date();
    const minutesOnSite = Math.round(
      (now.getTime() - new Date(existing.checkInAt).getTime()) / 60000
    );

    const updated = await p.siteCheckIn.update({
      where: { id: checkInId },
      data: {
        checkOutAt: now,
        minutesOnSite,
      },
    });

    return updated;
  }

  /**
   * Get active check-in for a user at a project
   */
  async getActiveCheckIn(userId: string, projectId: string): Promise<CheckInRecord | null> {
    return p.siteCheckIn.findFirst({
      where: {
        userId,
        projectId,
        checkOutAt: null,
      },
      orderBy: { checkInAt: 'desc' },
    });
  }

  /**
   * Get all currently checked-in users at a project
   */
  async getOnSite(projectId: string): Promise<Array<{
    userId: string;
    userName: string;
    arrivedAt: string;
    hoursOnSite: number;
    verified: boolean;
    role: string;
  }>> {
    const checkIns = await p.siteCheckIn.findMany({
      where: {
        projectId,
        checkOutAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { checkInAt: 'asc' },
    });

    return checkIns.map((ci: any) => ({
      userId: ci.userId,
      userName: ci.user?.name || ci.user?.email || 'Unknown',
      arrivedAt: ci.checkInAt.toISOString(),
      hoursOnSite: (Date.now() - new Date(ci.checkInAt).getTime()) / 3600000,
      verified: ci.verified,
      role: ci.role || ci.user?.role || 'UNKNOWN',
    }));
  }

  /**
   * Get today's check-in activity for a project
   */
  async getTodayActivity(projectId: string): Promise<{
    checkIns: CheckInRecord[];
    crewCount: number;
    totalHoursOnSite: number;
  }> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const checkIns = await p.siteCheckIn.findMany({
      where: {
        projectId,
        checkInAt: { gte: startOfDay },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { checkInAt: 'desc' },
    });

    const uniqueUsers = new Set(checkIns.map((ci: any) => ci.userId));
    const totalMinutes = checkIns.reduce((sum: number, ci: any) => {
      if (ci.minutesOnSite) return sum + ci.minutesOnSite;
      if (!ci.checkOutAt) {
        return sum + Math.round((Date.now() - new Date(ci.checkInAt).getTime()) / 60000);
      }
      return sum;
    }, 0);

    return {
      checkIns,
      crewCount: uniqueUsers.size,
      totalHoursOnSite: Math.round(totalMinutes / 60 * 10) / 10,
    };
  }

  /**
   * Get weekly attendance summary for a project
   */
  async getWeeklyAttendance(projectId: string): Promise<{
    days: Array<{
      date: string;
      dayName: string;
      attended: boolean;
      hoursOnSite: number;
      crewCount: number;
    }>;
    totalHours: number;
    expectedHours: number;
  }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday = 0
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const days: Array<{
      date: string;
      dayName: string;
      attended: boolean;
      hoursOnSite: number;
      crewCount: number;
    }> = [];

    let totalHours = 0;

    for (let i = 0; i < 5; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayCheckIns = await p.siteCheckIn.findMany({
        where: {
          projectId,
          checkInAt: { gte: dayStart, lt: dayEnd },
        },
      });

      const dayMinutes = dayCheckIns.reduce((sum: number, ci: any) => {
        if (ci.minutesOnSite) return sum + ci.minutesOnSite;
        if (!ci.checkOutAt && dayStart <= now) {
          const end = ci.checkOutAt ? new Date(ci.checkOutAt) : now;
          return sum + Math.round((end.getTime() - new Date(ci.checkInAt).getTime()) / 60000);
        }
        return sum;
      }, 0);

      const uniqueUsers = new Set(dayCheckIns.map((ci: any) => ci.userId));
      const hoursOnSite = Math.round(dayMinutes / 60 * 10) / 10;
      totalHours += hoursOnSite;

      days.push({
        date: dayStart.toISOString().split('T')[0],
        dayName: dayNames[i],
        attended: dayCheckIns.length > 0,
        hoursOnSite,
        crewCount: uniqueUsers.size,
      });
    }

    return {
      days,
      totalHours,
      expectedHours: 40, // 5 days * 8 hours
    };
  }

  /**
   * Get fleet view — all projects with their on-site status
   */
  async getFleetView(): Promise<Array<{
    projectId: string;
    projectName: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    status: 'on-site' | 'empty' | 'overdue';
    crewOnSite: Array<{
      userId: string;
      userName: string;
      arrivedAt: string;
      verified: boolean;
    }>;
    expectedToday: boolean;
  }>> {
    const projects = await prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        status: true,
      } as any,
    });

    const results = await Promise.all(
      projects.map(async (project: any) => {
        const onSite = await p.siteCheckIn.findMany({
          where: {
            projectId: project.id,
            checkOutAt: null,
          },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        });

        // Check if someone was expected today (has schedule items for today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const scheduledToday = await p.scheduleItem?.findFirst?.({
          where: {
            projectId: project.id,
            startDate: { lte: tomorrow },
            endDate: { gte: today },
          },
        });

        const isWorkHours = new Date().getHours() >= 7 && new Date().getHours() <= 17;
        const isWeekday = new Date().getDay() >= 1 && new Date().getDay() <= 5;
        const expectedToday = !!(scheduledToday && isWorkHours && isWeekday);

        let status: 'on-site' | 'empty' | 'overdue' = 'empty';
        if (onSite.length > 0) {
          status = 'on-site';
        } else if (expectedToday) {
          status = 'overdue';
        }

        return {
          projectId: project.id,
          projectName: project.name || 'Unnamed Project',
          address: project.address || '',
          latitude: project.latitude,
          longitude: project.longitude,
          status,
          crewOnSite: onSite.map((ci: any) => ({
            userId: ci.userId,
            userName: ci.user?.name || ci.user?.email || 'Unknown',
            arrivedAt: ci.checkInAt.toISOString(),
            verified: ci.verified,
          })),
          expectedToday,
        };
      })
    );

    // Sort: overdue first, then on-site, then empty
    return results.sort((a, b) => {
      const order = { overdue: 0, 'on-site': 1, empty: 2 };
      return order[a.status] - order[b.status];
    });
  }
}

export const checkInService = new CheckInService();
