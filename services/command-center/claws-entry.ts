/**
 * KEALEE CLAWS — Main Entry Point
 * Boots all 8 claws, connects EventBus + Redis, starts gateway.
 * See: _docs/kealee-architecture.md §7 (Phase 7: Entry Point)
 *
 * Usage: tsx services/command-center/claws-entry.ts
 */

import { PrismaClient } from '@prisma/client';
import { EventBus } from '@kealee/events';

// Claw classes
import { AcquisitionPreConClaw } from './claws/acquisition-precon/index';
import { ContractCommercialsClaw } from './claws/contract-commercials/index';
import { ScheduleFieldOpsClaw } from './claws/schedule-field-ops/index';
import { BudgetCostClaw } from './claws/budget-cost/index';
import { PermitsComplianceClaw } from './claws/permits-compliance/index';
import { DocsCommunicationClaw } from './claws/docs-communication/index';
import { RiskPredictionClaw } from './claws/risk-prediction/index';
import { CommandAutomationClaw } from './claws/command-automation/index';

// Infrastructure
import { ClawRegistry } from './claws/registry';
import { buildClawsGateway } from './gateway/claws-router';

const PORT = parseInt(process.env.CLAWS_PORT || '3002', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main(): Promise<void> {
  console.log('\n[Kealee Claws] Initializing...');

  // 1. Initialize shared infrastructure
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('[Kealee Claws] Prisma connected');

  const eventBus = new EventBus(process.env.REDIS_URL);
  await eventBus.connect();
  console.log('[Kealee Claws] EventBus connected');

  // 2. Create all 8 claw instances
  const clawA = new AcquisitionPreConClaw(eventBus, prisma);
  const clawB = new ContractCommercialsClaw(eventBus, prisma);
  const clawC = new ScheduleFieldOpsClaw(eventBus, prisma);
  const clawD = new BudgetCostClaw(eventBus, prisma);
  const clawE = new PermitsComplianceClaw(eventBus, prisma);
  const clawF = new DocsCommunicationClaw(eventBus, prisma);
  const clawG = new RiskPredictionClaw(eventBus, prisma);
  const clawH = new CommandAutomationClaw(eventBus, prisma);

  // 3. Register in ClawRegistry
  const registry = new ClawRegistry();
  registry.register(clawA);
  registry.register(clawB);
  registry.register(clawC);
  registry.register(clawD);
  registry.register(clawE);
  registry.register(clawF);
  registry.register(clawG);
  registry.register(clawH);

  // 4. Start all claws (subscribe to events, register workers)
  await registry.startAll();

  // 5. Start gateway server
  const server = await buildClawsGateway(prisma);
  await server.listen({ port: PORT, host: HOST });

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║               KEALEE CLAWS SYSTEM — ONLINE                       ║
╠═══════════════════════════════════════════════════════════════════╣
║  Port:       ${String(PORT).padEnd(54)}║
║  Claws:      ${String(registry.getAll().length + ' / 8').padEnd(54)}║
║  EventBus:   Connected                                            ║
║  Prisma:     Connected                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  Claws Active:                                                    ║
║  A: Acquisition & PreCon     — ${clawA.name.padEnd(35)}║
║  B: Contract & Commercials   — ${clawB.name.padEnd(35)}║
║  C: Schedule & Field Ops     — ${clawC.name.padEnd(35)}║
║  D: Budget & Cost Control    — ${clawD.name.padEnd(35)}║
║  E: Permits & Compliance     — ${clawE.name.padEnd(35)}║
║  F: Docs & Communication     — ${clawF.name.padEnd(35)}║
║  G: Risk & Predictions       — ${clawG.name.padEnd(35)}║
║  H: Command & Automation     — ${clawH.name.padEnd(35)}║
╠═══════════════════════════════════════════════════════════════════╣
║  Routes:                                                          ║
║  /api/claws/acquisition/*  → Claw A (bids, estimates)             ║
║  /api/claws/contracts/*    → Claw B (contracts, COs, payments)    ║
║  /api/claws/schedule/*     → Claw C (schedule, visits)            ║
║  /api/claws/budget/*       → Claw D (budget, forecasts)           ║
║  /api/claws/permits/*      → Claw E (permits, inspections)        ║
║  /api/claws/docs/*         → Claw F (documents)                   ║
║  /api/claws/risk/*         → Claw G (predictions, decisions)      ║
║  /api/claws/command/*      → Claw H (tasks, automation)           ║
║  /api/messenger/*          → Kealee Messenger                     ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  // 6. Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Kealee Claws] Received ${signal}, shutting down...`);
    try {
      await server.close();
      await eventBus.disconnect();
      await prisma.$disconnect();
      console.log('[Kealee Claws] Shutdown complete');
      process.exit(0);
    } catch (err) {
      console.error('[Kealee Claws] Shutdown error:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Kealee Claws] Fatal error:', err);
  process.exit(1);
});
