/**
 * Test Setup
 * Global setup for all tests
 */

import { PrismaClient } from '@kealee/database';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Test database client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/kealee_test',
    },
  },
});

// Setup before all tests
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Connect to test database
  await testPrisma.$connect();
  
  // Run migrations
  // NOTE: Run `pnpm db:migrate:deploy` before tests in CI
  
  console.log('✅ Test environment ready');
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Disconnect from test database
  await testPrisma.$disconnect();
  
  console.log('✅ Test environment cleaned');
});

// Reset database before each test
beforeEach(async () => {
  // Clear all tables
  await clearDatabase();
});

// Cleanup after each test
afterEach(async () => {
  // Optional: Additional cleanup
});

/**
 * Clear all tables in test database
 */
export async function clearDatabase() {
  const tables = [
    'EscrowTransaction',
    'EscrowHold',
    'EscrowAgreement',
    'DepositRequest',
    'JournalLine',
    'JournalEntry',
    'Account',
    'PaymentMethod',
    // Add other tables as needed
  ];

  for (const table of tables) {
    try {
      await testPrisma.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch (error) {
      // Table might not exist
    }
  }
}

/**
 * Seed test data
 */
export async function seedTestData() {
  // Create test user
  const user = await testPrisma.user.create({
    data: {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'hashed_password',
      role: 'CONTRACTOR',
      status: 'ACTIVE',
    },
  });

  // Create test contract
  const contract = await testPrisma.contract.create({
    data: {
      title: 'Test Contract',
      scope: 'Test project scope',
      totalAmount: 10000,
      status: 'ACTIVE',
      ownerId: user.id,
      contractorId: user.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  });

  // Create test escrow
  const escrow = await testPrisma.escrowAgreement.create({
    data: {
      contractId: contract.id,
      escrowAccountNumber: `ESC-TEST-${Date.now()}`,
      totalContractAmount: 10000,
      initialDepositAmount: 2000,
      holdbackPercentage: 10,
      currentBalance: 0,
      availableBalance: 0,
      heldBalance: 0,
      status: 'PENDING_DEPOSIT',
      interestRate: 0,
      interestAccrued: 0,
    },
  });

  return { user, contract, escrow };
}

/**
 * Generate test JWT token
 */
export function generateTestToken(userId: string): string {
  // Mock token generation
  return `test_token_${userId}`;
}

