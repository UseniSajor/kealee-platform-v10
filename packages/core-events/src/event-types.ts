/**
 * V20 Event Types — extends v10 event types with new OS service domains
 */

export const EVENT_TYPES_V20 = {
  // ── DDTS (Digital Twin) ─────────────────────────────────────
  twin: {
    created: 'twin.created',
    updated: 'twin.updated',
    phase: { changed: 'twin.phase.changed' },
    health: {
      changed: 'twin.health.changed',
      critical: 'twin.health.critical',
    },
    snapshot: { created: 'twin.snapshot.created' },
    module: {
      activated: 'twin.module.activated',
      deactivated: 'twin.module.deactivated',
    },
    kpi: {
      updated: 'twin.kpi.updated',
      breached: 'twin.kpi.breached',
    },
  },

  // ── OS-Land ─────────────────────────────────────────────────
  land: {
    parcel: {
      created: 'land.parcel.created',
      updated: 'land.parcel.updated',
      statusChanged: 'land.parcel.statusChanged',
      converted: 'land.parcel.converted', // Parcel → Project
    },
    zoning: {
      analyzed: 'land.zoning.analyzed',
      updated: 'land.zoning.updated',
    },
    assessment: {
      ordered: 'land.assessment.ordered',
      completed: 'land.assessment.completed',
      flagged: 'land.assessment.flagged',
    },
    offer: {
      submitted: 'land.offer.submitted',
      accepted: 'land.offer.accepted',
      rejected: 'land.offer.rejected',
    },
  },

  // ── OS-Feas ─────────────────────────────────────────────────
  feasibility: {
    study: {
      created: 'feasibility.study.created',
      updated: 'feasibility.study.updated',
      analyzed: 'feasibility.study.analyzed', // AI analysis complete
      decided: 'feasibility.study.decided',   // GO/NO_GO decision
    },
    scenario: {
      created: 'feasibility.scenario.created',
      updated: 'feasibility.scenario.updated',
    },
  },

  // ── OS-Dev ──────────────────────────────────────────────────
  development: {
    capitalStack: {
      created: 'development.capitalStack.created',
      finalized: 'development.capitalStack.finalized',
    },
    draw: {
      submitted: 'development.draw.submitted',
      approved: 'development.draw.approved',
      funded: 'development.draw.funded',
      rejected: 'development.draw.rejected',
    },
    investor: {
      reportPublished: 'development.investor.reportPublished',
    },
    entitlement: {
      submitted: 'development.entitlement.submitted',
      approved: 'development.entitlement.approved',
      denied: 'development.entitlement.denied',
    },
  },

  // ── OS-Ops ──────────────────────────────────────────────────
  operations: {
    turnover: {
      started: 'operations.turnover.started',
      completed: 'operations.turnover.completed',
      signedOff: 'operations.turnover.signedOff',
    },
    maintenance: {
      scheduled: 'operations.maintenance.scheduled',
      workOrderCreated: 'operations.maintenance.workOrderCreated',
      workOrderCompleted: 'operations.maintenance.workOrderCompleted',
    },
    warranty: {
      claimFiled: 'operations.warranty.claimFiled',
      claimResolved: 'operations.warranty.claimResolved',
    },
  },

  // ── Bot Events ──────────────────────────────────────────────
  bot: {
    handoff: {
      requested: 'bot.handoff.requested',
      completed: 'bot.handoff.completed',
    },
    action: {
      started: 'bot.action.started',
      completed: 'bot.action.completed',
      failed: 'bot.action.failed',
    },
  },

  // ── Integration Events ──────────────────────────────────────
  integration: {
    sync: {
      started: 'integration.sync.started',
      completed: 'integration.sync.completed',
      failed: 'integration.sync.failed',
    },
    webhook: {
      received: 'integration.webhook.received',
      processed: 'integration.webhook.processed',
    },
  },
} as const;
