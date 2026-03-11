/**
 * TwinEventEmitter -- Utility for OS services to emit twin events
 *
 * Bridges the gap between domain services and the DDTS system.
 * Every state-changing operation in an OS service should call
 * one of the emit methods here so the project's Digital Twin
 * stays up to date.
 *
 * Usage in any service:
 *   import { TwinEventEmitter } from '@kealee/core-ddts';
 *   const emitter = new TwinEventEmitter(publisher, prisma);
 *   await emitter.emitProjectEvent('pm.permit.submitted', projectId, { permitId, permitType });
 *
 * This:
 * 1. Finds the DigitalTwin for the project
 * 2. Records a TwinEvent in the database
 * 3. Publishes to Redis Streams for consumer groups
 * 4. Optionally updates relevant KPIs
 * 5. Recalculates twin health if KPIs changed
 */

import type { PrismaClient } from '@kealee/database';
import { StreamPublisher, createEvent } from '@kealee/core-events';
import type { EventEnvelope } from '@kealee/core-events';
import { TwinManager } from './twin-manager';
import type { KPIUpdate, TwinEventInput, TwinStatus } from './types';

// ---- Public Types --------------------------------------------------------

export interface ActorInfo {
  type: 'USER' | 'SYSTEM' | 'AI' | 'BOT';
  id: string;
}

export interface EmitOptions {
  /** Severity override (defaults to INFO) */
  severity?: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  /** Human-readable description */
  description?: string;
  /** Link this event to a prior event */
  correlationId?: string;
  /** Event that caused this one */
  causedBy?: string;
}

export interface KPIUpdateWithDelta {
  kpiKey: string;
  /** Absolute new value */
  value?: number;
  /** Additive delta applied to current value (ignored if `value` is set) */
  delta?: number;
}

// ---- TwinEventEmitter ----------------------------------------------------

export class TwinEventEmitter {
  private readonly manager: TwinManager;

  constructor(
    private readonly publisher: StreamPublisher,
    private readonly prisma: PrismaClient,
  ) {
    this.manager = new TwinManager(prisma);
  }

  // -- Core methods --------------------------------------------------------

  /**
   * Emit an event for a project (looks up the twin automatically).
   *
   * If the project does not yet have a twin the call is a no-op so
   * callers never have to worry about ordering.
   */
  async emitProjectEvent(
    eventType: string,
    projectId: string,
    payload: Record<string, unknown>,
    actor?: ActorInfo,
    options?: EmitOptions,
  ): Promise<void> {
    const twin = await this.manager.getTwinByProject(projectId);
    if (!twin) {
      // No twin yet -- silently skip
      return;
    }
    await this.emitTwinEvent(eventType, twin.id, { ...payload, projectId }, actor, options);
  }

  /**
   * Emit an event directly against a known twin ID.
   */
  async emitTwinEvent(
    eventType: string,
    twinId: string,
    payload: Record<string, unknown>,
    actor?: ActorInfo,
    options?: EmitOptions,
  ): Promise<void> {
    // 1. Persist the event in the database
    const twinEventInput: TwinEventInput = {
      eventType,
      source: this.deriveSource(eventType),
      severity: options?.severity ?? 'INFO',
      payload,
      description: options?.description,
      correlationId: options?.correlationId,
      causedBy: options?.causedBy,
      actorType: actor?.type ?? 'SYSTEM',
      actorId: actor?.id,
    };

    await this.manager.recordEvent(twinId, twinEventInput);

    // 2. Publish to Redis Streams for real-time consumers
    const twin = await this.prisma.digitalTwin.findUnique({
      where: { id: twinId },
      select: { projectId: true, orgId: true },
    });

    const envelope: EventEnvelope = createEvent({
      type: eventType,
      source: twinEventInput.source,
      projectId: (twin?.projectId as string) ?? undefined,
      orgId: (twin?.orgId as string) ?? undefined,
      entity: { type: 'DigitalTwin', id: twinId },
      severity: twinEventInput.severity,
      payload,
      initiatorType: actor?.type ?? 'SYSTEM',
      initiatorId: actor?.id ?? twinEventInput.source,
    });

    await this.publisher.publish(envelope);
  }

  /**
   * Emit an event AND update one or more KPIs in a single call.
   *
   * KPI updates support either an absolute `value` or an additive `delta`.
   * After KPIs are written the twin health is automatically recalculated.
   */
  async emitAndUpdateKPI(
    eventType: string,
    projectId: string,
    kpiUpdates: KPIUpdateWithDelta[],
    payload: Record<string, unknown>,
    actor?: ActorInfo,
    options?: EmitOptions,
  ): Promise<void> {
    const twin = await this.manager.getTwinByProject(projectId);
    if (!twin) return;

    // Resolve deltas to absolute values
    const resolvedUpdates: KPIUpdate[] = [];
    for (const update of kpiUpdates) {
      if (update.value !== undefined) {
        resolvedUpdates.push({ kpiKey: update.kpiKey, value: update.value });
      } else if (update.delta !== undefined) {
        const currentKPI = (twin as any).kpis?.find((k: any) => k.kpiKey === update.kpiKey);
        const currentValue: number = currentKPI?.currentValue ?? 0;
        resolvedUpdates.push({ kpiKey: update.kpiKey, value: currentValue + update.delta });
      }
    }

    // Update KPIs (also recalculates health internally)
    if (resolvedUpdates.length > 0) {
      await this.manager.updateKPIs(twin.id, resolvedUpdates);
    }

    // Emit the event (includes persisting + publishing)
    await this.emitTwinEvent(
      eventType,
      twin.id,
      {
        ...payload,
        projectId,
        kpiUpdates: resolvedUpdates,
      },
      actor,
      options,
    );
  }

  /**
   * Emit a phase transition event for a project.
   *
   * This delegates to TwinManager.transitionPhase which validates the
   * state machine, records the event, and auto-snapshots.
   * An additional Redis Stream event is published for real-time listeners.
   */
  async emitPhaseTransition(
    projectId: string,
    newPhase: TwinStatus,
    actor?: ActorInfo,
    reason?: string,
  ): Promise<void> {
    const twin = await this.manager.getTwinByProject(projectId);
    if (!twin) return;

    const previousPhase = twin.status;

    // TwinManager.transitionPhase validates the transition, records event,
    // and creates an automatic snapshot
    await this.manager.transitionPhase(twin.id, newPhase, reason);

    // Publish to Redis Streams so consumers get real-time notification
    const envelope: EventEnvelope = createEvent({
      type: 'twin.phase.changed',
      source: 'core-ddts',
      projectId,
      orgId: (twin.orgId as string) ?? undefined,
      entity: { type: 'DigitalTwin', id: twin.id },
      severity: 'MEDIUM',
      payload: {
        from: previousPhase,
        to: newPhase,
        reason,
      },
      initiatorType: actor?.type ?? 'SYSTEM',
      initiatorId: actor?.id ?? 'core-ddts',
    });

    await this.publisher.publish(envelope);
  }

  // -- Helpers -------------------------------------------------------------

  /**
   * Derive the `source` field from the event type prefix.
   * "pm.permit.submitted"  -> "os-pm"
   * "land.parcel.created"  -> "os-land"
   * "twin.kpi.updated"     -> "core-ddts"
   */
  private deriveSource(eventType: string): string {
    const prefix = eventType.split('.')[0];
    const sourceMap: Record<string, string> = {
      pm: 'os-pm',
      land: 'os-land',
      feasibility: 'os-feas',
      development: 'os-dev',
      operations: 'os-ops',
      twin: 'core-ddts',
      bot: 'keabot',
      integration: 'integrations',
      marketplace: 'marketplace',
      estimation: 'estimation',
      payment: 'os-pay',
    };
    return sourceMap[prefix] ?? `os-${prefix}`;
  }
}
