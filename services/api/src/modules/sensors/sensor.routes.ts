/**
 * Sensor Data Ingestion Routes
 *
 * POST /readings         — Ingest batch readings (API key auth)
 * POST /register         — Register new device (PM/Admin)
 * GET  /project/:projectId — All sensors + latest readings
 * GET  /:deviceId/history — Time-series data for charts
 * GET  /project/:projectId/alerts — Recent alerts
 * GET  /project/:projectId/analysis — AI-ready sensor summary
 * PATCH /:deviceId        — Update device config/status
 * DELETE /:deviceId       — Deactivate device
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../../middleware/validation.middleware';
import { sensorService } from './sensor.service';
import { notifySensorAlert, notifySensorOffline } from '@kealee/realtime';

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

const registerDeviceSchema = z.object({
  projectId: z.string().uuid(),
  type: z.enum(['temperature', 'humidity', 'vibration', 'noise', 'water_leak', 'air_quality', 'motion']),
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  deviceId: z.string().min(1).max(100),
  config: z.object({
    alertAbove: z.number().optional(),
    alertBelow: z.number().optional(),
    rateOfChangeAlert: z.number().optional(),
    unit: z.string().optional(),
    readingIntervalMs: z.number().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  installedBy: z.string().optional(),
  firmwareVersion: z.string().optional(),
});

const ingestReadingsSchema = z.object({
  deviceId: z.string().min(1),
  readings: z.array(z.object({
    value: z.number(),
    unit: z.string().min(1),
    timestamp: z.string().datetime().optional(),
  })).min(1).max(100), // Max 100 readings per batch
});

const updateDeviceSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  config: z.object({
    alertAbove: z.number().optional(),
    alertBelow: z.number().optional(),
    rateOfChangeAlert: z.number().optional(),
    unit: z.string().optional(),
    readingIntervalMs: z.number().optional(),
  }).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['active', 'offline', 'low_battery', 'error']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  firmwareVersion: z.string().optional(),
});

const historyQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  interval: z.enum(['1m', '5m', '15m', '1h', '6h', '1d']).optional(),
  limit: z.string().transform(Number).optional(),
});

const deviceIdParamSchema = z.object({
  deviceId: z.string().min(1),
});

const projectIdParamSchema = z.object({
  projectId: z.string().uuid(),
});

// ============================================================================
// ROUTES
// ============================================================================

export async function sensorRoutes(fastify: FastifyInstance) {

  // ── POST /readings — Ingest batch readings ──────────────────
  fastify.post(
    '/readings',
    { preHandler: [validateBody(ingestReadingsSchema)] },
    async (request, reply) => {
      try {
        const data = ingestReadingsSchema.parse(request.body);
        const result = await sensorService.ingestReadings(data);

        // Fire-and-forget: broadcast any alerts via Supabase Realtime
        for (const alert of result.alerts) {
          notifySensorAlert({
            projectId: alert.projectId,
            deviceId: alert.deviceId,
            deviceName: alert.deviceName,
            sensorType: alert.sensorType,
            location: alert.location,
            value: alert.value,
            unit: alert.unit,
            threshold: alert.threshold,
            alertType: alert.alertType,
            severity: alert.severity,
            message: alert.message,
          }).catch((err) =>
            console.error('[Sensor] Failed to broadcast alert:', err)
          );
        }

        return reply.status(200).send({
          success: true,
          stored: result.stored,
          alerts: result.alerts.length,
          alertDetails: result.alerts,
        });
      } catch (err: any) {
        return reply.status(err.message.includes('not found') ? 404 : 400).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── POST /register — Register new sensor device ──────────────
  fastify.post(
    '/register',
    { preHandler: [validateBody(registerDeviceSchema)] },
    async (request, reply) => {
      try {
        const data = registerDeviceSchema.parse(request.body);
        const device = await sensorService.registerDevice(data);

        return reply.status(201).send({
          success: true,
          device,
        });
      } catch (err: any) {
        return reply.status(err.message.includes('already registered') ? 409 : 400).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /project/:projectId — All sensors for project ────────
  fastify.get(
    '/project/:projectId',
    { preHandler: [validateParams(projectIdParamSchema)] },
    async (request, reply) => {
      try {
        const { projectId } = projectIdParamSchema.parse(request.params);
        const summary = await sensorService.getProjectSensors(projectId);

        return reply.send({
          success: true,
          ...summary,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /:deviceId/history — Time-series data ─────────────────
  fastify.get(
    '/:deviceId/history',
    {
      preHandler: [
        validateParams(deviceIdParamSchema),
        validateQuery(historyQuerySchema),
      ],
    },
    async (request, reply) => {
      try {
        const { deviceId } = deviceIdParamSchema.parse(request.params);
        const query = historyQuerySchema.parse(request.query);

        const result = await sensorService.getDeviceHistory(deviceId, {
          from: query.from ? new Date(query.from) : undefined,
          to: query.to ? new Date(query.to) : undefined,
          interval: query.interval,
          limit: query.limit,
        });

        return reply.send({
          success: true,
          device: {
            id: result.device.id,
            name: result.device.name,
            type: result.device.type,
            location: result.device.location,
            deviceId: result.device.deviceId,
          },
          readings: result.readings,
          aggregated: result.aggregated || null,
        });
      } catch (err: any) {
        return reply.status(err.message.includes('not found') ? 404 : 500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /project/:projectId/alerts — Recent alerts ────────────
  fastify.get(
    '/project/:projectId/alerts',
    { preHandler: [validateParams(projectIdParamSchema)] },
    async (request, reply) => {
      try {
        const { projectId } = projectIdParamSchema.parse(request.params);
        const query = request.query as any;
        const since = query.since ? new Date(query.since) : undefined;
        const limit = query.limit ? parseInt(query.limit) : undefined;

        const alerts = await sensorService.getProjectAlerts(projectId, { since, limit });

        return reply.send({
          success: true,
          count: alerts.length,
          alerts,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── GET /project/:projectId/analysis — AI-ready summary ──────
  fastify.get(
    '/project/:projectId/analysis',
    { preHandler: [validateParams(projectIdParamSchema)] },
    async (request, reply) => {
      try {
        const { projectId } = projectIdParamSchema.parse(request.params);
        const summary = await sensorService.getSensorAnalysisSummary(projectId);

        return reply.send({
          success: true,
          ...summary,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── PATCH /:deviceId — Update device config ──────────────────
  fastify.patch(
    '/:deviceId',
    {
      preHandler: [
        validateParams(deviceIdParamSchema),
        validateBody(updateDeviceSchema),
      ],
    },
    async (request, reply) => {
      try {
        const { deviceId } = deviceIdParamSchema.parse(request.params);
        const updates = updateDeviceSchema.parse(request.body);
        const device = await sensorService.updateDevice(deviceId, updates);

        return reply.send({
          success: true,
          device,
        });
      } catch (err: any) {
        return reply.status(err.message.includes('not found') ? 404 : 400).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── DELETE /:deviceId — Deactivate device ─────────────────────
  fastify.delete(
    '/:deviceId',
    { preHandler: [validateParams(deviceIdParamSchema)] },
    async (request, reply) => {
      try {
        const { deviceId } = deviceIdParamSchema.parse(request.params);
        await sensorService.deactivateDevice(deviceId);

        return reply.send({
          success: true,
          message: `Device "${deviceId}" deactivated`,
        });
      } catch (err: any) {
        return reply.status(err.message.includes('not found') ? 404 : 500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );

  // ── POST /detect-stale — Check for stale devices ──────────────
  // Called by cron job or admin
  fastify.post(
    '/detect-stale',
    async (request, reply) => {
      try {
        const query = request.query as any;
        const thresholdMinutes = query.thresholdMinutes
          ? parseInt(query.thresholdMinutes)
          : 30;

        const staleDevices = await sensorService.detectStaleDevices(thresholdMinutes);

        // Broadcast offline notifications
        for (const device of staleDevices) {
          notifySensorOffline({
            projectId: device.projectId,
            deviceId: device.deviceId,
            deviceName: device.name,
            sensorType: device.type,
            location: device.location,
            value: 0,
            unit: '',
            severity: 'warning',
            alertType: 'offline',
            message: `${device.name} (${device.location}) has gone offline — no readings for ${thresholdMinutes} minutes`,
          }).catch((err) =>
            console.error('[Sensor] Failed to broadcast offline:', err)
          );
        }

        return reply.send({
          success: true,
          staleCount: staleDevices.length,
          devices: staleDevices.map((d: any) => ({
            deviceId: d.deviceId,
            name: d.name,
            lastReading: d.lastReading,
          })),
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          error: err.message,
        });
      }
    }
  );
}
