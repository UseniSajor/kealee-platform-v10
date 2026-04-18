const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMigration() {
  try {
    console.log('Checking migration status...');
    
    // Get all migrations
    const migrations = await prisma._executeRaw`
      SELECT id, migration_name, finished_at, rolled_back_at 
      FROM "_prisma_migrations" 
      ORDER BY started_at DESC
    `;
    
    console.log('Migrations:', migrations);
    
    // Check if orchestration_gates exists
    const tableExists = await prisma._executeRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'orchestration_gates'
      ) as exists
    `;
    
    console.log('orchestration_gates exists:', tableExists);
    
    if (tableExists && Array.isArray(tableExists) && tableExists[0]) {
      console.log('Table already exists, marking migration as applied...');
      
      // Mark the failed migration as applied
      await prisma._executeRaw`
        UPDATE "_prisma_migrations"
        SET finished_at = NOW(), rolled_back_at = NULL
        WHERE migration_name = '20260414000001_keabot_service_availability'
        AND finished_at IS NULL
      `;
      
      console.log('✅ Migration marked as applied');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigration();
