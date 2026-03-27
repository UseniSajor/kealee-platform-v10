import { prisma } from '../src/client';

async function run(sql: string) {
  try { await prisma.$executeRawUnsafe(sql); } catch(e: any) { console.warn('skip:', e.message.slice(0,60)); }
}

async function main() {
  await run(`CREATE TABLE IF NOT EXISTS orchestration_gates (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, project_id TEXT NOT NULL, session_id TEXT, gate_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'PENDING', workflow_type TEXT NOT NULL, decision_payload JSONB, reason_codes JSONB, confidence_score DOUBLE PRECISION, risk_score DOUBLE PRECISION, resolved_by TEXT, resolved_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_pid_idx ON orchestration_gates(project_id)`);
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_status_idx ON orchestration_gates(status)`);
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_wf_idx ON orchestration_gates(workflow_type)`);
  console.log('✓ orchestration_gates done');

  await run(`CREATE TABLE IF NOT EXISTS orchestration_action_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, project_id TEXT NOT NULL, session_id TEXT, workflow_type TEXT NOT NULL, action_type TEXT NOT NULL, input_payload JSONB, output_payload JSONB, confidence_score DOUBLE PRECISION, risk_score DOUBLE PRECISION, decision TEXT, reason_codes JSONB, approval_gate_id TEXT, overridden_by TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
  await run(`CREATE INDEX IF NOT EXISTS orch_log_pid_idx ON orchestration_action_log(project_id)`);
  await run(`CREATE INDEX IF NOT EXISTS orch_log_dec_idx ON orchestration_action_log(decision)`);
  console.log('✓ orchestration_action_log done');
}

main().then(() => { prisma.$disconnect(); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
