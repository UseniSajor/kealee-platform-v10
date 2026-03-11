/**
 * @kealee/core-ddts — Digital Development Twin System
 *
 * Central nervous system for project lifecycle tracking.
 * Every project gets a digital twin that aggregates state from all OS services.
 */

export { TwinManager } from './twin-manager';
export { TwinStateMachine } from './state-machine';
export { HealthCalculator } from './health-calculator';
export { TwinEventEmitter } from './twin-event-emitter';

export type {
  TwinTier,
  TwinStatus,
  TwinHealthStatus,
  TwinMetrics,
  TwinKPIDefinition,
  PhaseTransition,
  CreateTwinInput,
  UpdateTwinInput,
  TwinSnapshotInput,
  TwinEventInput,
  KPIUpdate,
} from './types';

export type {
  ActorInfo,
  EmitOptions,
  KPIUpdateWithDelta,
} from './twin-event-emitter';

export { PHASE_ORDER, DEFAULT_KPIS } from './types';
