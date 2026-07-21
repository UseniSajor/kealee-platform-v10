/**
 * Sensor Data Ingestion Service
 *
 * Handles IoT sensor device registration, reading ingestion,
 * threshold alerting, and time-series queries for project sensors.
 */

import { prismaAny as prisma } from '../../utils/prisma-helper';
const p = prisma as any;

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterDeviceInput {
  projectId: string;
  type: string;
  name: string;
  location: string;
  deviceId: string;
  config?: DeviceConfig;
  metadata?: Record<string, any>;
  installedBy?: string;
  firmwareVersion?: string;
}

export interface DeviceConfig {
  alertAbove?: number;
  alertBelow?: number;
  rateOfChangeAlert?: number; // max change per hour
  unit?: string;
  readingIntervalMs?: number;
}

export interface ReadingInput {
  value: number;
  unit: string;
  timestamp?: string;
}

export interface BatchReadingInput {
  deviceId: string;
  readings: ReadingInput[];
}

export interface SensorAlert {
  deviceId: string;
  deviceName: string;
  sensorType: string;
  location: string;
  projectId: string;
  value: number;
  unit: string;
  threshold: number;
  alertType: 'above_threshold' | 'below_threshold' | 'rate_of_change';
  severity: 'warning' | 'critical';
  message: string;
}

export interface AggregatedReading {
  timestamp: string;
  avg: number;
  min: number;
  max: number;
  count: number;
}

export interface DeviceWithLatestReading {
  id: string;
  projectId: string;
  type: string;
  name: string;
  location: string;
  deviceId: string;
  status: string;
  batteryLevel: number | null;
  lastReading: Date | null;
  config: any;
  latestValue: number | null;
  latestUnit: string | null;
  todayMin: number | null;
  todayMax: number | null;
  alertCount: number;
}

export interface SensorSummary {
  projectId: string;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  activeAlerts: number;
  devices: DeviceWithLatestReading[];
}

// ============================================================================
// SERVICE
// ============================================================================

class SensorService {
  // ──────────────────────────────────────────────────────────────
  // Device Registration
  // ──────────────────────────────────────────────────────────────

  /**
   * Register a new sensor device for a project
   */
  async registerDevice(input: RegisterDeviceInput) {
    // Check if device ID already exists
    const existing = await p.sensorDevice.findUnique({
      where: { deviceId: input.deviceId },
    });

    if (existing) {
      throw new Error(`Device with ID "${input.deviceId}" already registered`);
    }

    // Verify project exists
    const project = await p.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, name: true },
    });

    if (!project) {
      throw new Error(`Project "${input.projectId}" not found`);
    }

    const device = await p.sensorDevice.create({
      data: {
        projectId: input.projectId,
        type: input.type,
        name: input.name,
        location: input.location,
        deviceId: input.deviceId,
        config: input.config || null,
        metadata: input.metadata || null,
        installedBy: input.installedBy,
        firmwareVersion: input.firmwareVersion,
        installedAt: new Date(),
        status: 'active',
      },
    });

    return device;
  }

  /**
   * Update a sensor device (name, location, config, status)
   */
  async updateDevice(
    deviceId: string,
    updates: Partial<Pick<RegisterDeviceInput, 'name' | 'location' | 'config' | 'metadata' | 'firmwareVersion'>> & {
      status?: string;
      batteryLevel?: number;
    }
  ) {
    const device = await p.sensorDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new Error(`Device "${deviceId}" not found`);
    }

    return p.sensorDevice.update({
      where: { deviceId },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.location !== undefined && { location: updates.location }),
        ...(updates.config !== undefined && { config: updates.config }),
        ...(updates.metadata !== undefined && { metadata: updates.metadata }),
        ...(updates.firmwareVersion !== undefined && { firmwareVersion: updates.firmwareVersion }),
        ...(updates.status !== undefined && { status: updates.status }),
        ...(updates.batteryLevel !== undefined && { batteryLevel: updates.batteryLevel }),
      },
    });
  }

  /**
   * Deactivate (soft-delete) a sensor device
   */
  async deactivateDevice(deviceId: string) {
    return p.sensorDevice.update({
      where: { deviceId },
      data: { status: 'inactive' },
    });
  }

  // ──────────────────────────────────────────────────────────────
  // Reading Ingestion
  // ──────────────────────────────────────────────────────────────

  /**
   * Ingest a batch of sensor readings for a device.
   * Checks thresholds and returns any triggered alerts.
   */
  async ingestReadings(input: BatchReadingInput): Promise<{
    stored: number;
    alerts: SensorAlert[];
  }> {
    // Look up device
    const device = await p.sensorDevice.findUnique({
      where: { deviceId: input.deviceId },
    });

    if (!device) {
      throw new Error(`Device "${input.deviceId}" not found`);
    }

    if (device.status === 'inactive') {
      throw new Error(`Device "${input.deviceId}" is inactive`);
    }

    const config = (device.config as DeviceConfig) || {};
    const alerts: SensorAlert[] = [];

    // Get previous reading for rate-of-change detection
    const previousReading = await p.sensorReading.findFirst({
      where: { deviceId: device.id },
      orderBy: { timestamp: 'desc' },
    });

    // Prepare readings with alert flags
    const readingsToInsert = input.readings.map((reading) => {
      const timestamp = reading.timestamp ? new Date(reading.timestamp) : new Date();
      let alert = false;
      let alertType: string | null = null;

      // Check thresholds
      if (config.alertAbove !== undefined && reading.value > config.alertAbove) {
        alert = true;
        alertType = 'above_threshold';
        const severity = reading.value > config.alertAbove * 1.2 ? 'critical' : 'warning';
        alerts.push({
          deviceId: input.deviceId,
          deviceName: device.name,
          sensorType: device.type,
          location: device.location,
          projectId: device.projectId,
          value: reading.value,
          unit: reading.unit,
          threshold: config.alertAbove,
          alertType: 'above_threshold',
          severity,
          message: `${device.name} reading ${reading.value}${reading.unit} exceeds threshold of ${config.alertAbove}${reading.unit}`,
        });
      }

      if (config.alertBelow !== undefined && reading.value < config.alertBelow) {
        alert = true;
        alertType = 'below_threshold';
        const severity = reading.value < config.alertBelow * 0.8 ? 'critical' : 'warning';
        alerts.push({
          deviceId: input.deviceId,
          deviceName: device.name,
          sensorType: device.type,
          location: device.location,
          projectId: device.projectId,
          value: reading.value,
          unit: reading.unit,
          threshold: config.alertBelow,
          alertType: 'below_threshold',
          severity,
          message: `${device.name} reading ${reading.value}${reading.unit} below threshold of ${config.alertBelow}${reading.unit}`,
        });
      }

      // Rate of change detection
      if (config.rateOfChangeAlert !== undefined && previousReading) {
        const prevTimestamp = new Date(previousReading.timestamp).getTime();
        const hours = (timestamp.getTime() - prevTimestamp) / (1000 * 60 * 60);
        if (hours > 0) {
          const ratePerHour = Math.abs(reading.value - previousReading.value) / hours;
          if (ratePerHour > config.rateOfChangeAlert) {
            alert = true;
            alertType = 'rate_of_change';
            alerts.push({
              deviceId: input.deviceId,
              deviceName: device.name,
              sensorType: device.type,
              location: device.location,
              projectId: device.projectId,
              value: reading.value,
              unit: reading.unit,
              threshold: config.rateOfChangeAlert,
              alertType: 'rate_of_change',
              severity: 'warning',
              message: `${device.name} changing rapidly: ${ratePerHour.toFixed(1)}${reading.unit}/hr (threshold: ${config.rateOfChangeAlert}${reading.unit}/hr)`,
            });
          }
        }
      }

      return {
        deviceId: device.id,
        value: reading.value,
        unit: reading.unit,
        timestamp,
        alert,
        alertType,
      };
    });

    // Batch insert readings
    const result = await p.sensorReading.createMany({
      data: readingsToInsert,
    });

    // Update device lastReading timestamp
    const latestTimestamp = readingsToInsert.reduce(
      (max, r) => (r.timestamp > max ? r.timestamp : max),
      readingsToInsert[0].timestamp
    );

    await p.sensorDevice.update({
      where: { deviceId: input.deviceId },
      data: {
        lastReading: latestTimestamp,
        status: 'active', // Mark as active on successful reading
      },
    });

    return {
      stored: result.count,
      alerts,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // Query Methods
  // ──────────────────────────────────────────────────────────────

  /**
   * Get all sensors for a project with latest readings and today's stats
   */
  async getProjectSensors(projectId: string): Promise<SensorSummary> {
    const devices = await p.sensorDevice.findMany({
      where: { projectId, status: { not: 'inactive' } },
      orderBy: { name: 'asc' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch latest reading + today's stats for each device
    const devicesWithReadings: DeviceWithLatestReading[] = await Promise.all(
      devices.map(async (device: any) => {
        // Latest reading
        const latest = await p.sensorReading.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: 'desc' },
        });

        // Today's min/max
        const todayReadings = await p.sensorReading.findMany({
          where: {
            deviceId: device.id,
            timestamp: { gte: todayStart },
          },
          select: { value: true },
        });

        const values = todayReadings.map((r: any) => r.value);
        const todayMin = values.length > 0 ? Math.min(...values) : null;
        const todayMax = values.length > 0 ? Math.max(...values) : null;

        // Today's alert count
        const alertCount = await p.sensorReading.count({
          where: {
            deviceId: device.id,
            alert: true,
            timestamp: { gte: todayStart },
          },
        });

        return {
          id: device.id,
          projectId: device.projectId,
          type: device.type,
          name: device.name,
          location: device.location,
          deviceId: device.deviceId,
          status: device.status,
          batteryLevel: device.batteryLevel,
          lastReading: device.lastReading,
          config: device.config,
          latestValue: latest?.value ?? null,
          latestUnit: latest?.unit ?? null,
          todayMin,
          todayMax,
          alertCount,
        };
      })
    );

    return {
      projectId,
      totalDevices: devices.length,
      activeDevices: devices.filter((d: any) => d.status === 'active').length,
      offlineDevices: devices.filter((d: any) => d.status === 'offline').length,
      lowBatteryDevices: devices.filter((d: any) => d.status === 'low_battery').length,
      activeAlerts: devicesWithReadings.reduce((sum, d) => sum + d.alertCount, 0),
      devices: devicesWithReadings,
    };
  }

  /**
   * Get time-series history for a specific device.
   * Supports interval aggregation (1m, 5m, 15m, 1h, 6h, 1d).
   */
  async getDeviceHistory(
    deviceId: string,
    options: {
      from?: Date;
      to?: Date;
      interval?: string; // '1m', '5m', '15m', '1h', '6h', '1d'
      limit?: number;
    } = {}
  ): Promise<{
    device: any;
    readings: any[];
    aggregated?: AggregatedReading[];
  }> {
    const device = await p.sensorDevice.findUnique({
      where: { deviceId },
    });

    if (!device) {
      throw new Error(`Device "${deviceId}" not found`);
    }

    const from = options.from || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default 24h
    const to = options.to || new Date();
    const limit = options.limit || 500;

    // If no aggregation, return raw readings
    if (!options.interval) {
      const readings = await p.sensorReading.findMany({
        where: {
          deviceId: device.id,
          timestamp: { gte: from, lte: to },
        },
        orderBy: { timestamp: 'asc' },
        take: limit,
        select: {
          id: true,
          value: true,
          unit: true,
          timestamp: true,
          alert: true,
          alertType: true,
        },
      });

      return { device, readings };
    }

    // For aggregated data, fetch raw and aggregate in-memory
    // (PostgreSQL aggregation could be done with raw SQL for better performance at scale)
    const allReadings = await p.sensorReading.findMany({
      where: {
        deviceId: device.id,
        timestamp: { gte: from, lte: to },
      },
      orderBy: { timestamp: 'asc' },
      select: {
        value: true,
        timestamp: true,
      },
    });

    const intervalMs = this.parseInterval(options.interval);
    const aggregated = this.aggregateReadings(allReadings, intervalMs);

    return { device, readings: [], aggregated };
  }

  /**
   * Get recent alerts across all sensors for a project
   */
  async getProjectAlerts(
    projectId: string,
    options: { limit?: number; since?: Date } = {}
  ) {
    const devices = await p.sensorDevice.findMany({
      where: { projectId },
      select: { id: true, name: true, type: true, location: true, deviceId: true },
    });

    const deviceIds = devices.map((d: any) => d.id);
    const deviceMap = new Map<string, any>(devices.map((d: any) => [d.id, d]));

    const since = options.since || new Date(Date.now() - 24 * 60 * 60 * 1000);

    const alertReadings = await p.sensorReading.findMany({
      where: {
        deviceId: { in: deviceIds },
        alert: true,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
      take: options.limit || 50,
    });

    return alertReadings.map((reading: any) => {
      const device = deviceMap.get(reading.deviceId);
      return {
        ...reading,
        deviceName: device?.name,
        sensorType: device?.type,
        location: device?.location,
        hardwareId: device?.deviceId,
      };
    });
  }

  /**
   * Get sensor data summary for AI/predictive analysis.
   * Returns last 24h averages, peaks, and alert counts per sensor type.
   */
  async getSensorAnalysisSummary(projectId: string): Promise<{
    projectId: string;
    sensors: Array<{
      deviceId: string;
      name: string;
      type: string;
      location: string;
      unit: string;
      avg24h: number;
      min24h: number;
      max24h: number;
      current: number;
      alertCount24h: number;
      thresholdAbove?: number;
      thresholdBelow?: number;
      status: string;
    }>;
    alertSummary: string;
  }> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const devices = await p.sensorDevice.findMany({
      where: { projectId, status: { not: 'inactive' } },
    });

    const sensors = await Promise.all(
      devices.map(async (device: any) => {
        const readings = await p.sensorReading.findMany({
          where: {
            deviceId: device.id,
            timestamp: { gte: since },
          },
          select: { value: true, unit: true, alert: true },
        });

        const values = readings.map((r: any) => r.value);
        const config = (device.config as DeviceConfig) || {};
        const latest = await p.sensorReading.findFirst({
          where: { deviceId: device.id },
          orderBy: { timestamp: 'desc' },
        });

        return {
          deviceId: device.deviceId,
          name: device.name,
          type: device.type,
          location: device.location,
          unit: latest?.unit || config.unit || '',
          avg24h: values.length > 0 ? Math.round((values.reduce((s: number, v: number) => s + v, 0) / values.length) * 10) / 10 : 0,
          min24h: values.length > 0 ? Math.min(...values) : 0,
          max24h: values.length > 0 ? Math.max(...values) : 0,
          current: latest?.value ?? 0,
          alertCount24h: readings.filter((r: any) => r.alert).length,
          thresholdAbove: config.alertAbove,
          thresholdBelow: config.alertBelow,
          status: device.status,
        };
      })
    );

    // Build human-readable alert summary
    const alertSensors = sensors.filter((s) => s.alertCount24h > 0);
    const alertSummary = alertSensors.length > 0
      ? alertSensors
          .map((s) => `${s.name} (${s.location}): ${s.alertCount24h} alerts, current ${s.current}${s.unit}`)
          .join('; ')
      : 'No sensor alerts in the last 24 hours';

    return { projectId, sensors, alertSummary };
  }

  // ──────────────────────────────────────────────────────────────
  // Staleness Detection
  // ──────────────────────────────────────────────────────────────

  /**
   * Check for stale devices (no reading in expected interval)
   * and mark them as offline. Returns newly-offline devices.
   */
  async detectStaleDevices(staleThresholdMinutes: number = 30): Promise<any[]> {
    const threshold = new Date(Date.now() - staleThresholdMinutes * 60 * 1000);

    const staleDevices = await p.sensorDevice.findMany({
      where: {
        status: 'active',
        lastReading: { lt: threshold },
      },
    });

    if (staleDevices.length > 0) {
      await p.sensorDevice.updateMany({
        where: {
          id: { in: staleDevices.map((d: any) => d.id) },
        },
        data: { status: 'offline' },
      });
    }

    return staleDevices;
  }

  // ──────────────────────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────────────────────

  private parseInterval(interval: string): number {
    const match = interval.match(/^(\d+)(m|h|d)$/);
    if (!match) return 60 * 60 * 1000; // Default 1h

    const num = parseInt(match[1]);
    switch (match[2]) {
      case 'm': return num * 60 * 1000;
      case 'h': return num * 60 * 60 * 1000;
      case 'd': return num * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  private aggregateReadings(
    readings: Array<{ value: number; timestamp: Date }>,
    intervalMs: number
  ): AggregatedReading[] {
    if (readings.length === 0) return [];

    const buckets = new Map<number, number[]>();

    for (const r of readings) {
      const ts = new Date(r.timestamp).getTime();
      const bucketKey = Math.floor(ts / intervalMs) * intervalMs;
      const bucket = buckets.get(bucketKey) || [];
      bucket.push(r.value);
      buckets.set(bucketKey, bucket);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([ts, values]) => ({
        timestamp: new Date(ts).toISOString(),
        avg: Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      }));
  }
}

export const sensorService = new SensorService();
