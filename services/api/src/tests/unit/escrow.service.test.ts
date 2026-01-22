/**
 * Escrow Service Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { testPrisma, seedTestData, clearDatabase } from '../setup';
import { escrowService } from '../../modules/escrow/escrow.service';
import { Decimal } from '@kealee/database';

describe('EscrowService', () => {
  let testData: Awaited<ReturnType<typeof seedTestData>>;

  beforeEach(async () => {
    await clearDatabase();
    testData = await seedTestData();
  });

  describe('createEscrowAgreement', () => {
    it('should create escrow agreement for valid contract', async () => {
      const escrow = await escrowService.createEscrowAgreement(
        testData.contract.id,
        testData.user.id
      );

      expect(escrow).toBeDefined();
      expect(escrow.contractId).toBe(testData.contract.id);
      expect(escrow.status).toBe('PENDING_DEPOSIT');
      expect(escrow.totalContractAmount).toBe(10000);
      expect(escrow.currentBalance).toBe(0);
    });

    it('should throw error for duplicate escrow', async () => {
      await escrowService.createEscrowAgreement(
        testData.contract.id,
        testData.user.id
      );

      await expect(
        escrowService.createEscrowAgreement(
          testData.contract.id,
          testData.user.id
        )
      ).rejects.toThrow('Escrow already exists');
    });

    it('should throw error for invalid contract', async () => {
      await expect(
        escrowService.createEscrowAgreement(
          'invalid_contract_id',
          testData.user.id
        )
      ).rejects.toThrow();
    });
  });

  describe('recordDeposit', () => {
    it('should record deposit and update balance', async () => {
      const amount = new Decimal(1000);
      const transaction = await escrowService.recordDeposit(
        testData.escrow.id,
        amount,
        testData.user.id,
        'test_payment_123'
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('DEPOSIT');
      expect(transaction.amount).toEqual(amount);
      expect(transaction.status).toBe('COMPLETED');

      // Check escrow balance updated
      const updatedEscrow = await testPrisma.escrowAgreement.findUnique({
        where: { id: testData.escrow.id },
      });

      expect(updatedEscrow?.currentBalance).toEqual(amount);
      expect(updatedEscrow?.availableBalance).toEqual(amount);
    });

    it('should activate escrow when initial deposit met', async () => {
      const initialDepositAmount = new Decimal(
        testData.escrow.initialDepositAmount
      );

      await escrowService.recordDeposit(
        testData.escrow.id,
        initialDepositAmount,
        testData.user.id,
        'test_payment_456'
      );

      const updatedEscrow = await testPrisma.escrowAgreement.findUnique({
        where: { id: testData.escrow.id },
      });

      expect(updatedEscrow?.status).toBe('ACTIVE');
      expect(updatedEscrow?.activatedAt).toBeDefined();
    });

    it('should create journal entry for deposit', async () => {
      const amount = new Decimal(500);
      const transaction = await escrowService.recordDeposit(
        testData.escrow.id,
        amount,
        testData.user.id,
        'test_payment_789'
      );

      expect(transaction.journalEntryId).toBeDefined();

      const journalEntry = await testPrisma.journalEntry.findUnique({
        where: { id: transaction.journalEntryId! },
        include: { lines: true },
      });

      expect(journalEntry).toBeDefined();
      expect(journalEntry?.status).toBe('POSTED');
      expect(journalEntry?.lines).toHaveLength(2); // Debit and Credit
    });
  });

  describe('releasePayment', () => {
    beforeEach(async () => {
      // Fund escrow before testing releases
      await escrowService.recordDeposit(
        testData.escrow.id,
        new Decimal(5000),
        testData.user.id,
        'test_funding'
      );
    });

    it('should release payment and create transaction', async () => {
      const releaseAmount = new Decimal(1000);
      const transaction = await escrowService.releasePayment(
        testData.escrow.id,
        'milestone_123',
        releaseAmount,
        testData.user.id
      );

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('RELEASE');
      expect(transaction.amount).toEqual(releaseAmount);
      expect(transaction.status).toBe('PROCESSING');
    });

    it('should throw error if insufficient balance', async () => {
      await expect(
        escrowService.releasePayment(
          testData.escrow.id,
          'milestone_999',
          new Decimal(10000), // More than available
          testData.user.id
        )
      ).rejects.toThrow('Insufficient escrow balance');
    });

    it('should throw error if escrow frozen', async () => {
      // Freeze escrow
      await testPrisma.escrowAgreement.update({
        where: { id: testData.escrow.id },
        data: { status: 'FROZEN' },
      });

      await expect(
        escrowService.releasePayment(
          testData.escrow.id,
          'milestone_456',
          new Decimal(500),
          testData.user.id
        )
      ).rejects.toThrow('Escrow is frozen');
    });

    it('should throw error if active holds exist', async () => {
      // Place hold
      await escrowService.placeHold(
        testData.escrow.id,
        new Decimal(1000),
        'DISPUTE',
        testData.user.id,
        'Test hold'
      );

      await expect(
        escrowService.releasePayment(
          testData.escrow.id,
          'milestone_789',
          new Decimal(500),
          testData.user.id
        )
      ).rejects.toThrow('Cannot release payment with active holds');
    });
  });

  describe('placeHold', () => {
    beforeEach(async () => {
      // Fund escrow
      await escrowService.recordDeposit(
        testData.escrow.id,
        new Decimal(3000),
        testData.user.id,
        'test_funding'
      );
    });

    it('should place hold and reduce available balance', async () => {
      const holdAmount = new Decimal(1000);
      const hold = await escrowService.placeHold(
        testData.escrow.id,
        holdAmount,
        'DISPUTE',
        testData.user.id,
        'Test dispute hold'
      );

      expect(hold).toBeDefined();
      expect(hold.status).toBe('ACTIVE');
      expect(hold.amount).toEqual(holdAmount);

      const updatedEscrow = await testPrisma.escrowAgreement.findUnique({
        where: { id: testData.escrow.id },
      });

      expect(updatedEscrow?.availableBalance).toEqual(new Decimal(2000)); // 3000 - 1000
      expect(updatedEscrow?.heldBalance).toEqual(holdAmount);
    });

    it('should throw error if insufficient available balance', async () => {
      await expect(
        escrowService.placeHold(
          testData.escrow.id,
          new Decimal(5000), // More than available
          'MANUAL',
          testData.user.id,
          'Test hold'
        )
      ).rejects.toThrow('Insufficient available balance');
    });

    it('should freeze escrow for dispute holds', async () => {
      await escrowService.placeHold(
        testData.escrow.id,
        new Decimal(500),
        'DISPUTE',
        testData.user.id,
        'Dispute hold'
      );

      const updatedEscrow = await testPrisma.escrowAgreement.findUnique({
        where: { id: testData.escrow.id },
      });

      expect(updatedEscrow?.status).toBe('FROZEN');
    });
  });

  describe('releaseHold', () => {
    let holdId: string;

    beforeEach(async () => {
      // Fund escrow and place hold
      await escrowService.recordDeposit(
        testData.escrow.id,
        new Decimal(2000),
        testData.user.id,
        'test_funding'
      );

      const hold = await escrowService.placeHold(
        testData.escrow.id,
        new Decimal(500),
        'COMPLIANCE',
        testData.user.id,
        'Test hold'
      );

      holdId = hold.id;
    });

    it('should release hold and restore available balance', async () => {
      const hold = await escrowService.releaseHold(holdId, testData.user.id);

      expect(hold.status).toBe('RELEASED');
      expect(hold.releasedAt).toBeDefined();

      const updatedEscrow = await testPrisma.escrowAgreement.findUnique({
        where: { id: testData.escrow.id },
      });

      expect(updatedEscrow?.availableBalance).toEqual(new Decimal(2000)); // Restored
      expect(updatedEscrow?.heldBalance).toEqual(new Decimal(0));
    });

    it('should throw error if hold already released', async () => {
      await escrowService.releaseHold(holdId, testData.user.id);

      await expect(
        escrowService.releaseHold(holdId, testData.user.id)
      ).rejects.toThrow('Hold already released');
    });
  });

  describe('calculateBalances', () => {
    it('should calculate correct balances', async () => {
      // Make multiple deposits
      await escrowService.recordDeposit(
        testData.escrow.id,
        new Decimal(1000),
        testData.user.id,
        'deposit_1'
      );

      await escrowService.recordDeposit(
        testData.escrow.id,
        new Decimal(1500),
        testData.user.id,
        'deposit_2'
      );

      const balances = await escrowService.calculateBalances(testData.escrow.id);

      expect(balances.totalDeposits).toEqual(new Decimal(2500));
      expect(balances.currentBalance).toEqual(new Decimal(2500));
      expect(balances.availableBalance).toEqual(new Decimal(2500));
      expect(balances.heldBalance).toEqual(new Decimal(0));
      expect(balances.discrepancy).toEqual(new Decimal(0));
    });

    it('should detect balance discrepancies', async () => {
      // Manually create discrepancy by updating balance directly
      await testPrisma.escrowAgreement.update({
        where: { id: testData.escrow.id },
        data: { currentBalance: new Decimal(1000) },
      });

      const balances = await escrowService.calculateBalances(testData.escrow.id);

      expect(balances.discrepancy).not.toEqual(new Decimal(0));
    });
  });
});

