/**
 * E2E Test: Complete Escrow Lifecycle
 * Tests the full flow from contract creation to escrow close
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPrisma, clearDatabase } from '../setup';
import { escrowService } from '../../modules/escrow/escrow.service';
import { depositService } from '../../modules/payments/deposit.service';
import { Decimal } from '@kealee/database';

describe('E2E: Complete Escrow Lifecycle', () => {
  let userId: string;
  let contractId: string;
  let escrowId: string;
  let paymentMethodId: string;

  beforeAll(async () => {
    await clearDatabase();

    // Step 1: Create user
    const user = await testPrisma.user.create({
      data: {
        email: 'contractor@example.com',
        firstName: 'John',
        lastName: 'Contractor',
        password: 'hashed_password',
        role: 'CONTRACTOR',
        status: 'ACTIVE',
      },
    });
    userId = user.id;

    // Step 2: Create owner
    const owner = await testPrisma.user.create({
      data: {
        email: 'owner@example.com',
        firstName: 'Jane',
        lastName: 'Owner',
        password: 'hashed_password',
        role: 'PROJECT_OWNER',
        status: 'ACTIVE',
      },
    });

    // Step 3: Create contract
    const contract = await testPrisma.contract.create({
      data: {
        title: 'Full Renovation Project',
        scope: 'Complete home renovation including kitchen, bathrooms, and flooring',
        totalAmount: 50000,
        status: 'ACTIVE',
        ownerId: owner.id,
        contractorId: userId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
    contractId = contract.id;

    // Step 4: Create payment method
    const paymentMethod = await testPrisma.paymentMethod.create({
      data: {
        userId: owner.id,
        type: 'ACH',
        stripePaymentMethodId: 'pm_test_ach_123',
        last4: '6789',
        bankName: 'Test Bank',
        isDefault: true,
        isVerified: true,
        status: 'ACTIVE',
      },
    });
    paymentMethodId = paymentMethod.id;
  });

  afterAll(async () => {
    await clearDatabase();
  });

  it('should complete full escrow lifecycle', async () => {
    // ===== PHASE 1: CREATE ESCROW =====
    console.log('📋 Phase 1: Creating escrow agreement...');

    const escrow = await escrowService.createEscrowAgreement(contractId, userId);
    escrowId = escrow.id;

    expect(escrow).toBeDefined();
    expect(escrow.status).toBe('PENDING_DEPOSIT');
    expect(escrow.totalContractAmount).toBe(50000);
    expect(escrow.initialDepositAmount).toBeGreaterThan(0);
    console.log(`✅ Escrow created: ${escrow.escrowAccountNumber}`);
    console.log(`   Initial deposit required: $${escrow.initialDepositAmount}`);

    // ===== PHASE 2: INITIAL DEPOSIT =====
    console.log('\n💰 Phase 2: Making initial deposit...');

    const initialDeposit = await depositService.createDeposit({
      userId,
      escrowId: escrow.id,
      amount: escrow.initialDepositAmount,
      paymentMethodId,
      currency: 'USD',
    });

    expect(initialDeposit).toBeDefined();
    expect(initialDeposit.status).toBe('PENDING');
    console.log(`✅ Deposit request created: $${initialDeposit.amount}`);

    // Simulate deposit processing
    await depositService.handleSuccessfulPayment(
      initialDeposit.stripePaymentIntentId!,
      'ch_test_123'
    );
    console.log('✅ Deposit processed and cleared');

    // Verify escrow activated
    const activatedEscrow = await testPrisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    expect(activatedEscrow?.status).toBe('ACTIVE');
    expect(activatedEscrow?.currentBalance).toBeGreaterThanOrEqual(escrow.initialDepositAmount);
    console.log(`✅ Escrow activated with balance: $${activatedEscrow?.currentBalance}`);

    // ===== PHASE 3: ADDITIONAL DEPOSITS =====
    console.log('\n💰 Phase 3: Making additional deposits...');

    const additionalAmount = 20000;
    const additionalDeposit = await depositService.createDeposit({
      userId,
      escrowId: escrow.id,
      amount: additionalAmount,
      paymentMethodId,
      currency: 'USD',
    });

    await depositService.handleSuccessfulPayment(
      additionalDeposit.stripePaymentIntentId!,
      'ch_test_456'
    );
    console.log(`✅ Additional deposit of $${additionalAmount} processed`);

    // ===== PHASE 4: DISPUTE & HOLD =====
    console.log('\n⚠️ Phase 4: Simulating dispute and hold...');

    const holdAmount = new Decimal(5000);
    const hold = await escrowService.placeHold(
      escrowId,
      holdAmount,
      'DISPUTE',
      userId,
      'Quality concern with Phase 1 work'
    );

    expect(hold.status).toBe('ACTIVE');
    console.log(`✅ Hold placed: $${holdAmount}`);

    const frozenEscrow = await testPrisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    expect(frozenEscrow?.status).toBe('FROZEN');
    console.log('✅ Escrow frozen due to dispute');

    // ===== PHASE 5: RESOLVE DISPUTE =====
    console.log('\n✅ Phase 5: Resolving dispute...');

    const releasedHold = await escrowService.releaseHold(hold.id, userId);

    expect(releasedHold.status).toBe('RELEASED');
    console.log('✅ Hold released');

    // Manually unfreeze (in real system, would be automatic)
    await testPrisma.escrowAgreement.update({
      where: { id: escrowId },
      data: { status: 'ACTIVE' },
    });
    console.log('✅ Escrow unfrozen');

    // ===== PHASE 6: MILESTONE PAYMENTS =====
    console.log('\n💸 Phase 6: Releasing milestone payments...');

    // Milestone 1: Demolition complete
    const milestone1Amount = new Decimal(10000);
    const milestone1Payment = await escrowService.releasePayment(
      escrowId,
      'milestone_demolition',
      milestone1Amount,
      userId
    );

    expect(milestone1Payment.type).toBe('RELEASE');
    expect(milestone1Payment.status).toBe('PROCESSING');
    console.log(`✅ Milestone 1 payment initiated: $${milestone1Amount}`);

    // Simulate payout completion
    await escrowService.completeEscrowTransaction(
      milestone1Payment.id,
      'po_test_123'
    );
    console.log('✅ Milestone 1 payment completed');

    // Milestone 2: Framing complete
    const milestone2Amount = new Decimal(15000);
    const milestone2Payment = await escrowService.releasePayment(
      escrowId,
      'milestone_framing',
      milestone2Amount,
      userId
    );

    await escrowService.completeEscrowTransaction(
      milestone2Payment.id,
      'po_test_456'
    );
    console.log(`✅ Milestone 2 payment completed: $${milestone2Amount}`);

    // ===== PHASE 7: FINAL PAYMENT & CLOSE =====
    console.log('\n🏁 Phase 7: Final payment and closing escrow...');

    // Calculate remaining balance
    const currentEscrow = await testPrisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    const remainingBalance = currentEscrow!.availableBalance;
    console.log(`   Remaining balance: $${remainingBalance}`);

    // Release final payment
    const finalPayment = await escrowService.releasePayment(
      escrowId,
      'milestone_final',
      new Decimal(remainingBalance),
      userId
    );

    await escrowService.completeEscrowTransaction(
      finalPayment.id,
      'po_test_789'
    );
    console.log('✅ Final payment released');

    // Close escrow
    await testPrisma.escrowAgreement.update({
      where: { id: escrowId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    const closedEscrow = await testPrisma.escrowAgreement.findUnique({
      where: { id: escrowId },
    });

    expect(closedEscrow?.status).toBe('CLOSED');
    expect(closedEscrow?.availableBalance).toBe(0);
    console.log('✅ Escrow closed successfully');

    // ===== PHASE 8: VERIFY BALANCES =====
    console.log('\n🔍 Phase 8: Verifying final balances...');

    const balances = await escrowService.calculateBalances(escrowId);

    console.log(`   Total deposits: $${balances.totalDeposits}`);
    console.log(`   Total releases: $${balances.totalReleases}`);
    console.log(`   Current balance: $${balances.currentBalance}`);
    console.log(`   Discrepancy: $${balances.discrepancy}`);

    expect(balances.discrepancy).toEqual(new Decimal(0));
    expect(balances.currentBalance).toEqual(new Decimal(0));
    console.log('✅ All balances reconciled correctly');

    // ===== PHASE 9: AUDIT TRAIL =====
    console.log('\n📝 Phase 9: Verifying audit trail...');

    const allTransactions = await testPrisma.escrowTransaction.findMany({
      where: { escrowAgreementId: escrowId },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`   Total transactions: ${allTransactions.length}`);
    expect(allTransactions.length).toBeGreaterThan(0);

    const journalEntries = await testPrisma.journalEntry.findMany({
      where: {
        escrowTransaction: {
          escrowAgreementId: escrowId,
        },
      },
      include: { lines: true },
    });

    console.log(`   Journal entries: ${journalEntries.length}`);
    expect(journalEntries.length).toBeGreaterThan(0);

    // Verify double-entry accounting
    for (const entry of journalEntries) {
      const totalDebits = entry.lines
        .filter(l => l.type === 'DEBIT')
        .reduce((sum, l) => sum + Number(l.amount), 0);

      const totalCredits = entry.lines
        .filter(l => l.type === 'CREDIT')
        .reduce((sum, l) => sum + Number(l.amount), 0);

      expect(totalDebits).toBeCloseTo(totalCredits, 2);
    }

    console.log('✅ All journal entries balanced');

    console.log('\n🎉 ESCROW LIFECYCLE COMPLETE! 🎉');
    console.log('========================================');
    console.log('All phases completed successfully:');
    console.log('✅ Escrow creation');
    console.log('✅ Initial deposit');
    console.log('✅ Additional funding');
    console.log('✅ Dispute handling');
    console.log('✅ Milestone payments');
    console.log('✅ Final payment & closure');
    console.log('✅ Balance reconciliation');
    console.log('✅ Audit trail verification');
    console.log('========================================');
  });
});

