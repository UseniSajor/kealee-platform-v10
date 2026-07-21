import { prisma } from '../src/client';
async function main() {
  const tables = await prisma.$queryRawUnsafe<any[]>(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('orchestration_gates','orchestration_action_log')
  `);
  console.log('Tables found:', tables.map((t: any) => t.table_name));
  
  if (tables.some((t: any) => t.table_name === 'orchestration_gates')) {
    const cols = await prisma.$queryRawUnsafe<any[]>(`SELECT column_name FROM information_schema.columns WHERE table_name = 'orchestration_gates' ORDER BY ordinal_position`);
    console.log('orchestration_gates columns:', cols.map((c: any) => c.column_name));
  }
}
main().then(() => { prisma.$disconnect(); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
