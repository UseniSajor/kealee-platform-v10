/**
 * Test Setup
 * Global test configuration and mocks
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@kealee/database';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/kealee_test';
process.env.APP_ENV = 'test';

// Global test setup
beforeAll(async () => {
  console.log('🧪 Test suite starting...');
  
  // Optional: Run migrations on test database
  // await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  // await execSync('pnpm prisma migrate deploy', { stdio: 'inherit' });
});

// Clean up between tests
beforeEach(async () => {
  // Clean up test data
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
      } catch (error) {
        console.log(`Note: Could not truncate ${tablename}`, error);
      }
    }
  }
});

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect();
  console.log('🧪 Test suite completed.');
});
