/**
 * Seed loader — writes a JSON snapshot and optionally upserts into Prisma.
 *
 * Usage:
 *   pnpm --filter @kealee/seeds seed:load              # JSON snapshot only
 *   DATABASE_URL=... pnpm --filter @kealee/seeds seed:load   # also upserts to DB
 *
 * Outputs: dist/seed-snapshot.json  (always written)
 * DB tables: populated when DATABASE_URL is set (uses @kealee/database PrismaClient)
 */

import * as fs from "fs";
import * as path from "path";
import { keacoreSeedBlueprint } from "../index";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

function log(symbol: string, color: string, msg: string): void {
  console.log(`${color}${symbol}${RESET}  ${msg}`);
}

// ─── Snapshot writer ──────────────────────────────────────────────────────────

function writeSnapshot(): void {
  const outDir = path.resolve(__dirname, "../../dist");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "seed-snapshot.json");
  const counts: Record<string, number> = {};
  for (const [key, arr] of Object.entries(keacoreSeedBlueprint)) {
    counts[key] = (arr as unknown[]).length;
  }

  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        counts,
        blueprint: keacoreSeedBlueprint,
      },
      null,
      2
    )
  );

  log("✓", GREEN, `Snapshot written → ${outFile}`);
  for (const [key, count] of Object.entries(counts)) {
    log(" ", "", `  ${key}: ${count} records`);
  }
}

// ─── Prisma upserts ───────────────────────────────────────────────────────────

async function upsertToDatabase(): Promise<void> {
  // Dynamic import so the script doesn't fail when @kealee/database isn't in scope
  let PrismaClient: new () => {
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
    intentSeed: { upsert: (args: unknown) => Promise<unknown> };
    workflowTemplate: { upsert: (args: unknown) => Promise<unknown> };
    serviceOffering: { upsert: (args: unknown) => Promise<unknown> };
    jurisdictionConfig: { upsert: (args: unknown) => Promise<unknown> };
    roleDefinition: { upsert: (args: unknown) => Promise<unknown> };
    policyRule: { upsert: (args: unknown) => Promise<unknown> };
    promptTemplate: { upsert: (args: unknown) => Promise<unknown> };
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require("@kealee/database");
    PrismaClient = db.PrismaClient ?? db.default?.PrismaClient;
  } catch {
    log(
      "⚠",
      YELLOW,
      "@kealee/database not resolvable — skipping DB upserts. Snapshot still written."
    );
    return;
  }

  const prisma = new PrismaClient();
  await prisma.$connect();

  try {
    // Intents
    for (const intent of keacoreSeedBlueprint.intents) {
      await prisma.intentSeed.upsert({
        where: { code: intent.code },
        update: intent,
        create: intent,
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.intents.length} intents`);

    // Workflow templates — store steps as JSON
    for (const wf of keacoreSeedBlueprint.workflows) {
      await prisma.workflowTemplate.upsert({
        where: { code: wf.code },
        update: { ...wf, steps: JSON.stringify(wf.steps) },
        create: { ...wf, steps: JSON.stringify(wf.steps) },
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.workflows.length} workflow templates`);

    // Service offerings
    for (const svc of keacoreSeedBlueprint.services) {
      await prisma.serviceOffering.upsert({
        where: { code: svc.code },
        update: svc,
        create: svc,
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.services.length} service offerings`);

    // Jurisdictions
    for (const j of keacoreSeedBlueprint.jurisdictions) {
      await prisma.jurisdictionConfig.upsert({
        where: { code: j.code },
        update: j,
        create: j,
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.jurisdictions.length} jurisdictions`);

    // Roles
    for (const role of keacoreSeedBlueprint.roles) {
      await prisma.roleDefinition.upsert({
        where: { code: role.code },
        update: role,
        create: role,
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.roles.length} roles`);

    // Rules
    for (const rule of keacoreSeedBlueprint.rules) {
      await prisma.policyRule.upsert({
        where: { code: rule.code },
        update: { ...rule, when: JSON.stringify(rule.when), effect: JSON.stringify(rule.effect) },
        create: { ...rule, when: JSON.stringify(rule.when), effect: JSON.stringify(rule.effect) },
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.rules.length} rules`);

    // Prompts / policies
    for (const prompt of keacoreSeedBlueprint.prompts) {
      await prisma.promptTemplate.upsert({
        where: { code: prompt.code },
        update: prompt,
        create: prompt,
      });
    }
    log("✓", GREEN, `Upserted ${keacoreSeedBlueprint.prompts.length} prompt policies`);
  } finally {
    await prisma.$disconnect();
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n📦 KeaCore Seed Loader\n");

  writeSnapshot();

  if (process.env.DATABASE_URL) {
    console.log("\n🗄️  DATABASE_URL detected — upserting to Prisma...\n");
    await upsertToDatabase();
  } else {
    log(
      "ℹ",
      YELLOW,
      "No DATABASE_URL — set it to also upsert seeds into the database."
    );
  }

  console.log("\n✅ Done.\n");
}

main().catch((err) => {
  console.error(`${RED}✗ Seed load failed:${RESET}`, err);
  process.exit(1);
});
