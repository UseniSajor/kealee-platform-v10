import { prisma } from '../src/client';
async function run(sql: string) {
  try { await prisma.$executeRawUnsafe(sql); console.log('OK:', sql.slice(0,60)); } 
  catch(e: any) { console.warn('skip:', e.message.slice(0,80)); }
}
async function main() {
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_pid_idx ON orchestration_gates("projectId")`);
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_status_idx ON orchestration_gates(status)`);
  await run(`CREATE INDEX IF NOT EXISTS orch_gates_wf_idx ON orchestration_gates("workflowType")`);
  await run(`CREATE INDEX IF NOT EXISTS orch_log_pid_idx ON orchestration_action_log("projectId")`);
  await run(`CREATE INDEX IF NOT EXISTS orch_log_dec_idx ON orchestration_action_log(decision)`);
  await run(`CREATE INDEX IF NOT EXISTS orch_log_wf_idx ON orchestration_action_log("workflowType")`);
}
main().then(() => { prisma.$disconnect(); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
