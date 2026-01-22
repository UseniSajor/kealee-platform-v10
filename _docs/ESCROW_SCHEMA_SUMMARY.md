# Escrow System Schema Summary

**Created:** January 21, 2026  
**Status:** ✅ Complete  
**Integration:** Stage 5 Finance & Trust Module

---

## 📋 Overview

Enhanced the existing escrow models to support full escrow management with:
- **Automated escrow account creation** when contracts are signed
- **Double-entry accounting integration** via JournalEntry links
- **Escrow holds** for disputes, compliance, and manual freezes
- **Complete audit trail** with user tracking
- **Interest-bearing escrow** support

---

## 🗄️ Models

### 1. **EscrowAgreement** (Enhanced)

**Purpose:** Main escrow account linked 1:1 with a Contract

**Key Fields:**

#### Identification:
- `id` - UUID primary key
- `contractId` - Unique FK to ContractAgreement
- `projectId` - FK to Project
- `escrowAccountNumber` - Unique auto-generated (ESC-YYYYMMDD-XXXX)

#### Financial Fields:
- `totalContractAmount` - Total contract value (Decimal 18,2)
- `initialDepositAmount` - Required initial deposit (Decimal 18,2)
- `holdbackPercentage` - Default 10% holdback
- `currentBalance` - Current total funds (Decimal 18,2)
- `availableBalance` - Available for release (Decimal 18,2)
- `heldBalance` - Frozen due to holds (Decimal 18,2)

#### Interest Tracking:
- `interestRate` - For interest-bearing escrows (Decimal 5,4) e.g., 0.0250 = 2.5%
- `interestAccrued` - Total interest earned (Decimal 18,2)

#### Status & Lifecycle:
- `status` - PENDING_DEPOSIT | ACTIVE | FROZEN | CLOSED
- `createdAt` - When escrow agreement created
- `activatedAt` - When first deposit received
- `closedAt` - When escrow completed/closed
- `updatedAt` - Last modification

**Relationships:**
- `contract` → ContractAgreement (1:1)
- `project` → Project
- `transactions` → EscrowTransaction[] (1:many)
- `holds` → EscrowHold[] (1:many)
- `disputes` → Dispute[]

**Indexes:**
- `contractId` (unique)
- `projectId`
- `status`
- `escrowAccountNumber` (unique)

---

### 2. **EscrowTransaction** (Enhanced)

**Purpose:** Track all financial movements in/out of escrow

**Key Fields:**

#### Identification & Linking:
- `id` - UUID primary key
- `escrowId` - FK to EscrowAgreement
- `journalEntryId` - **Unique FK to JournalEntry** (accounting integration)

#### Transaction Details:
- `type` - DEPOSIT | RELEASE | REFUND | FEE | INTEREST
- `amount` - Transaction amount (Decimal 18,2)
- `currency` - Default "USD"

#### Balance Tracking:
- `balanceBefore` - Balance before transaction (Decimal 18,2)
- `balanceAfter` - Balance after transaction (Decimal 18,2)

#### Status & Processing:
- `status` - PENDING | PROCESSING | COMPLETED | FAILED | REVERSED
- `scheduledDate` - When transaction is scheduled
- `processedDate` - When transaction actually completed

#### Payment & Reference:
- `reference` - External reference (payment ID, milestone ID, etc.)
- `stripePaymentId` - Stripe payment reference (if applicable)

#### Audit Trail:
- `initiatedBy` - User ID who initiated transaction
- `approvedBy` - User ID who approved (if required for large amounts)

#### Flexible Storage:
- `metadata` - JSON field for flexible data (e.g., milestone details, payment metadata)

**Relationships:**
- `escrow` → EscrowAgreement
- `journalEntry` → JournalEntry (1:1 - every transaction creates accounting entry)
- `initiator` → User (who initiated)
- `approver` → User (who approved)

**Indexes:**
- `escrowId`
- `status`
- `type`
- `processedDate`
- `initiatedBy`
- `reference`

---

### 3. **EscrowHold** (New Model)

**Purpose:** Freeze funds in escrow due to disputes, compliance, liens, or manual holds

**Key Fields:**

#### Hold Details:
- `id` - UUID primary key
- `escrowId` - FK to EscrowAgreement
- `amount` - Amount to hold (Decimal 18,2)
- `reason` - DISPUTE | COMPLIANCE | MANUAL | LIEN
- `status` - ACTIVE | RELEASED
- `notes` - Text explanation of hold

#### Lifecycle:
- `placedBy` - User ID who placed the hold
- `releasedBy` - User ID who released the hold
- `placedAt` - When hold was placed
- `releasedAt` - When hold was released
- `expiresAt` - Optional expiration date

**Relationships:**
- `escrow` → EscrowAgreement
- `placer` → User (who placed hold)
- `releaser` → User (who released hold)

**Indexes:**
- `escrowId`
- `status`
- `placedBy`
- `placedAt`

**Business Rules:**
- When hold is ACTIVE, `heldBalance` in EscrowAgreement increases
- `availableBalance` = `currentBalance` - `heldBalance`
- Holds can expire automatically if `expiresAt` is set
- Only authorized users can release holds

---

## 🔗 Relationship Summary

```
ContractAgreement (1:1) ↔ EscrowAgreement
                            ↓
                ├─── EscrowTransaction (1:many)
                │         ↓
                │    JournalEntry (1:1) - Accounting integration
                │
                └─── EscrowHold (1:many)
                      
User → initiatedBy, approvedBy (EscrowTransaction)
User → placedBy, releasedBy (EscrowHold)
```

---

## 📊 New Enums

### EscrowStatus (Enhanced)
```prisma
enum EscrowStatus {
  PENDING_DEPOSIT  // New: Escrow created, waiting for initial deposit
  ACTIVE          // Escrow active with funds
  FROZEN          // Escrow frozen (dispute, compliance)
  CLOSED          // Escrow completed and closed
}
```

### EscrowTransactionType (New)
```prisma
enum EscrowTransactionType {
  DEPOSIT   // Funds deposited into escrow
  RELEASE   // Funds released to contractor
  REFUND    // Funds refunded to owner
  FEE       // Platform/processing fees
  INTEREST  // Interest accrued
}
```

### EscrowTransactionStatus (New)
```prisma
enum EscrowTransactionStatus {
  PENDING     // Transaction scheduled/initiated
  PROCESSING  // Transaction being processed
  COMPLETED   // Transaction completed successfully
  FAILED      // Transaction failed
  REVERSED    // Transaction reversed
}
```

### EscrowHoldReason (New)
```prisma
enum EscrowHoldReason {
  DISPUTE     // Dispute filed
  COMPLIANCE  // Compliance issue
  MANUAL      // Manual hold by admin
  LIEN        // Lien placed on funds
}
```

### EscrowHoldStatus (New)
```prisma
enum EscrowHoldStatus {
  ACTIVE    // Hold currently active
  RELEASED  // Hold released
}
```

---

## 🔄 Integration with Accounting System

Every `EscrowTransaction` creates a corresponding `JournalEntry`:

### Example: Escrow Deposit
```typescript
// 1. Create EscrowTransaction
const transaction = await prisma.escrowTransaction.create({
  data: {
    escrowId: escrowAgreement.id,
    type: 'DEPOSIT',
    amount: 50000,
    status: 'COMPLETED',
    initiatedBy: userId,
  },
})

// 2. Create JournalEntry (double-entry accounting)
const journalEntry = await journalEntryService.createJournalEntry({
  description: `Escrow deposit for ${escrowAgreement.escrowAccountNumber}`,
  reference: 'ESCROW_DEPOSIT',
  referenceId: transaction.id,
  lines: [
    {
      accountId: escrowHoldingsAccountId,    // 1020 - Escrow Holdings (Asset)
      debit: 50000,
      credit: 0,
    },
    {
      accountId: escrowLiabilityAccountId,   // 2010 - Escrow Liability
      debit: 0,
      credit: 50000,
    },
  ],
  createdBy: userId,
})

// 3. Link transaction to journal entry
await prisma.escrowTransaction.update({
  where: { id: transaction.id },
  data: { journalEntryId: journalEntry.id },
})
```

### Example: Milestone Payment Release
```typescript
// 1. Create EscrowTransaction
const transaction = await prisma.escrowTransaction.create({
  data: {
    escrowId: escrowAgreement.id,
    type: 'RELEASE',
    amount: 10000,
    reference: `MILESTONE_${milestoneId}`,
    status: 'COMPLETED',
    initiatedBy: userId,
  },
})

// 2. Create JournalEntry
const journalEntry = await journalEntryService.createJournalEntry({
  description: `Milestone payment release for ${escrowAgreement.escrowAccountNumber}`,
  reference: 'MILESTONE_PAYMENT',
  referenceId: transaction.id,
  lines: [
    {
      accountId: escrowLiabilityAccountId,   // 2010 - Escrow Liability
      debit: 10000,
      credit: 0,
    },
    {
      accountId: cashAccountId,              // 1001 - Cash
      debit: 0,
      credit: 10000,
    },
  ],
  createdBy: userId,
})

// 3. Post journal entry to update balances
await journalEntryService.postJournalEntry({
  entryId: journalEntry.id,
  postedBy: userId,
})
```

---

## 💼 Business Logic Rules

### 1. **Escrow Creation**
- Automatically created when `ContractAgreement.status` changes to `SIGNED`
- `escrowAccountNumber` auto-generated: `ESC-YYYYMMDD-0001`
- Initial `status` = `PENDING_DEPOSIT`
- `totalContractAmount` = contract amount
- `initialDepositAmount` = calculated percentage (e.g., 20%)

### 2. **Initial Deposit**
- Required to activate escrow
- When first deposit received:
  - `status` changes from `PENDING_DEPOSIT` → `ACTIVE`
  - `activatedAt` timestamp set
  - Creates `EscrowTransaction` with `type=DEPOSIT`
  - Creates corresponding `JournalEntry`

### 3. **Balance Management**
- `currentBalance` = sum of all COMPLETED deposits - releases
- `heldBalance` = sum of all ACTIVE holds
- `availableBalance` = `currentBalance` - `heldBalance`
- Cannot release more than `availableBalance`

### 4. **Holds**
- Placed automatically for disputes
- Placed manually by admins for compliance
- When hold placed:
  - `heldBalance` increases
  - `availableBalance` decreases
- When hold released:
  - `heldBalance` decreases
  - `availableBalance` increases
- Holds can expire automatically

### 5. **Milestone Payments**
- Contractor completes milestone
- Owner approves milestone
- Payment released from escrow:
  - Creates `EscrowTransaction` with `type=RELEASE`
  - Creates `JournalEntry` to record payment
  - Updates `currentBalance` and `availableBalance`
  - Sends notification to contractor

### 6. **Interest-Bearing Escrows**
- If `interestRate` is set:
  - Interest calculated daily/monthly
  - Creates `EscrowTransaction` with `type=INTEREST`
  - Adds to `interestAccrued`
  - Adds to `currentBalance`

### 7. **Escrow Closure**
- All milestones completed
- All holds released
- Final balance = 0 (or refunded)
- `status` → `CLOSED`
- `closedAt` timestamp set
- Creates final accounting entries

---

## 🔍 Query Examples

### Get Escrow with All Transactions
```typescript
const escrow = await prisma.escrowAgreement.findUnique({
  where: { id: escrowId },
  include: {
    contract: true,
    project: true,
    transactions: {
      include: {
        journalEntry: true,
        initiator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    },
    holds: {
      where: { status: 'ACTIVE' },
      include: {
        placer: { select: { id: true, name: true } },
      },
    },
  },
})
```

### Get Active Holds
```typescript
const activeHolds = await prisma.escrowHold.findMany({
  where: {
    escrowId,
    status: 'ACTIVE',
  },
  include: {
    placer: { select: { name: true } },
  },
})
```

### Get Transaction History
```typescript
const transactions = await prisma.escrowTransaction.findMany({
  where: {
    escrowId,
    status: 'COMPLETED',
  },
  include: {
    journalEntry: {
      include: {
        lines: {
          include: {
            account: { select: { code: true, name: true } },
          },
        },
      },
    },
  },
  orderBy: { processedDate: 'desc' },
})
```

---

## 📈 Performance Considerations

### Indexes:
- ✅ All foreign keys indexed
- ✅ Status fields indexed for filtering
- ✅ Unique constraints on `contractId` and `escrowAccountNumber`
- ✅ Composite indexes for common queries

### Balance Calculations:
- ✅ `currentBalance`, `availableBalance`, `heldBalance` stored as calculated fields
- ✅ Updated transactionally with each transaction/hold
- ✅ Avoids expensive aggregation queries

### Audit Trail:
- ✅ Every transaction has full audit trail
- ✅ User tracking on all modifications
- ✅ Linked to accounting system for full transparency

---

## 🚀 Next Steps

1. ✅ **Schema Enhanced** - Complete
2. ⏳ **Create EscrowService** - Implement business logic
3. ⏳ **Create API Routes** - Expose escrow operations
4. ⏳ **Create Frontend Types** - Mirror backend types
5. ⏳ **Create Frontend Components** - Escrow dashboard UI
6. ⏳ **Integrate with Contracts** - Auto-create on contract signing
7. ⏳ **Integrate with Milestones** - Auto-release on approval
8. ⏳ **Stripe Integration** - Payment processing

---

## 📊 Schema Statistics

- **Models**: 3 (EscrowAgreement, EscrowTransaction, EscrowHold)
- **Enums**: 4 new + 1 enhanced (5 total)
- **Relationships**: 10 relations
- **Indexes**: 16 indexes
- **Precision**: Decimal(18,2) for all money fields
- **Audit Fields**: Full user tracking on all models

---

**Status**: ✅ Schema Enhanced & Validated  
**Prisma Client**: ✅ Generated Successfully  
**Ready For**: Service Layer Implementation

