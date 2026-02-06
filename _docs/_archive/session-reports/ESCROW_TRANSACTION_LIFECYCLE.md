# Escrow Transaction Lifecycle - Complete Flow

**Date**: January 22, 2026  
**Status**: ✅ **COMPLETE**  
**Impact**: **CRITICAL** - Proper async payment processing with rollback support

---

## 🎯 **The Problem That Was Fixed**

### **Before**
```typescript
// ❌ WRONG: Release marked as COMPLETED immediately
const transaction = await tx.escrowTransaction.create({
  type: 'RELEASE',
  status: 'COMPLETED',  // ← Payment hasn't actually been sent yet!
  processedDate: new Date(),  // ← Premature
})
```

**Issue**: The escrow system marked payment releases as "completed" immediately, but the actual Stripe payout happens **asynchronously** and could fail.

### **After**
```typescript
// ✅ CORRECT: Release starts as PROCESSING
const transaction = await tx.escrowTransaction.create({
  type: 'RELEASE',
  status: 'PROCESSING',  // ← Waiting for Stripe payout
  scheduledDate: new Date(),  // ← When release was scheduled
  processedDate: null,  // ← Will be set when Stripe confirms
})

// Later, when Stripe webhook confirms...
await escrowService.completeEscrowTransaction(transactionId, payoutId)

// Or if it fails...
await escrowService.failEscrowTransaction(transactionId, reason)
```

---

## 🔄 **Complete Transaction Lifecycle**

### **Phase 1: Release Scheduled** ✅

**Trigger**: Milestone approved by Project Owner

```typescript
const transaction = await escrowService.releasePayment({
  escrowId,
  milestoneId,
  amount: new Decimal(5000),
  recipientAccountId: 'acct_contractor123',
  initiatedBy: userId,
  approvedBy: projectOwnerId,
})
```

**What Happens**:
1. ✅ **Validation**:
   - Escrow status is ACTIVE
   - No active holds (disputes)
   - Sufficient available balance
   - Milestone belongs to this contract

2. ✅ **Atomic Transaction**:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Create journal entry
     const journalEntry = await journalEntryService.createAndPostJournalEntry({
       lines: [
         { account: 'Escrow Liability', debit: 5000 },      // Reduce liability
         { account: 'Contractor Payouts', credit: 4855 },   // Net to contractor
         { account: 'Platform Fees', credit: 145 },         // Our fee (2.9% + $0.30)
       ]
     }, tx)
     
     // Create escrow transaction
     const escrowTx = await tx.escrowTransaction.create({
       type: 'RELEASE',
       status: 'PROCESSING',  // ← Key change
       scheduledDate: new Date(),
       processedDate: null,  // ← Not completed yet
       metadata: {
         platformFee: 145,
         netAmount: 4855,
         recipientAccountId: 'acct_contractor123',
       }
     })
     
     // Update escrow balances
     await tx.escrowAgreement.update({
       currentBalance: currentBalance - 5000,  // Reduce total
       availableBalance: availableBalance - 5000,  // Reduce available
     })
   })
   ```

3. ✅ **Result**:
   - Escrow balance reduced immediately
   - Journal entry posted (accounting updated)
   - Transaction status: `PROCESSING`
   - Funds no longer available for other uses
   - Stripe payout initiated (separate process)

---

### **Phase 2A: Payout Succeeds** ✅

**Trigger**: Stripe webhook event `payout.paid`

```typescript
// Stripe webhook handler calls:
await escrowService.completeEscrowTransaction(transactionId, payoutId)
```

**What Happens**:
1. ✅ **Validation**:
   - Transaction exists
   - Status is `PROCESSING`

2. ✅ **Update Transaction**:
   ```typescript
   await prisma.escrowTransaction.update({
     where: { id: transactionId },
     data: {
       status: 'COMPLETED',  // ← Now truly completed
       processedDate: new Date(),  // ← Actual completion time
       metadata: {
         ...existingMetadata,
         payoutId: 'po_stripe123',  // Link to Stripe payout
         completedAt: '2026-01-22T10:30:00Z',
       }
     }
   })
   ```

3. ✅ **Result**:
   - Transaction marked as completed
   - Contractor receives funds in bank account
   - Platform fee collected
   - Audit trail complete

---

### **Phase 2B: Payout Fails** 💥 → ✅ **Rollback**

**Trigger**: Stripe webhook event `payout.failed`

```typescript
// Stripe webhook handler calls:
await escrowService.failEscrowTransaction(transactionId, failureReason)
```

**What Happens** (Atomic Rollback):

1. ✅ **Validation**:
   - Transaction exists
   - Status is `PROCESSING`

2. ✅ **Atomic Rollback**:
   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Mark transaction as FAILED
     await tx.escrowTransaction.update({
       where: { id: transactionId },
       data: {
         status: 'FAILED',
         metadata: {
           ...existingMetadata,
           failureReason: 'insufficient_funds',
           failedAt: '2026-01-22T10:30:00Z',
         }
       }
     })
     
     // 2. RESTORE escrow balances
     await tx.escrowAgreement.update({
       where: { id: escrowId },
       data: {
         currentBalance: currentBalance + 5000,  // Add back
         availableBalance: availableBalance + 5000,  // Make available again
       }
     })
     
     // 3. VOID the journal entry (create reversing entry)
     await journalEntryService.voidJournalEntry({
       entryId: originalJournalEntryId,
       voidedBy: 'SYSTEM',
       voidReason: 'Payment failed: insufficient_funds',
     })
     // This creates:
     // Debit: Contractor Payouts 4855 (reversal)
     // Debit: Platform Fees 145 (reversal)
     // Credit: Escrow Liability 5000 (restore liability)
   })
   ```

3. ✅ **Result**:
   - Transaction status: `FAILED`
   - Escrow balance **fully restored**
   - Accounting **perfectly reversed**
   - Books remain balanced
   - Funds available for retry or alternative use
   - Complete audit trail of failure

---

## 🔌 **New API Endpoints**

### **1. Complete Transaction** (Internal)
```http
POST /api/escrow/transactions/:id/complete
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "payoutId": "po_stripe123456789"
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "tx_abc123",
    "type": "RELEASE",
    "status": "COMPLETED",
    "amount": "5000.00",
    "scheduledDate": "2026-01-22T10:00:00Z",
    "processedDate": "2026-01-22T10:30:00Z",
    "metadata": {
      "payoutId": "po_stripe123456789",
      "platformFee": 145,
      "netAmount": 4855
    }
  },
  "message": "Escrow transaction completed successfully"
}
```

---

### **2. Fail Transaction & Rollback** (Internal)
```http
POST /api/escrow/transactions/:id/fail
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "insufficient_funds"
}
```

**Response**:
```json
{
  "success": true,
  "transaction": {
    "id": "tx_abc123",
    "type": "RELEASE",
    "status": "FAILED",
    "amount": "5000.00",
    "scheduledDate": "2026-01-22T10:00:00Z",
    "processedDate": null,
    "metadata": {
      "failureReason": "insufficient_funds",
      "failedAt": "2026-01-22T10:30:00Z"
    }
  },
  "message": "Escrow transaction failed and rolled back"
}
```

---

## 🔄 **Integration with Stripe Webhooks**

### **Webhook Handler Pattern**

```typescript
// In Stripe webhook handler
fastify.post('/webhooks/stripe', async (request, reply) => {
  const event = stripe.webhooks.constructEvent(
    request.rawBody,
    request.headers['stripe-signature'],
    process.env.STRIPE_WEBHOOK_SECRET
  )

  switch (event.type) {
    case 'payout.paid': {
      const payout = event.data.object
      
      // Find associated escrow transaction
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          metadata: {
            path: ['recipientAccountId'],
            equals: payout.destination
          },
          status: 'PROCESSING'
        }
      })
      
      if (transaction) {
        // Complete the escrow transaction
        await escrowService.completeEscrowTransaction(
          transaction.id,
          payout.id
        )
      }
      break
    }
    
    case 'payout.failed': {
      const payout = event.data.object
      
      // Find associated escrow transaction
      const transaction = await prisma.escrowTransaction.findFirst({
        where: {
          metadata: {
            path: ['recipientAccountId'],
            equals: payout.destination
          },
          status: 'PROCESSING'
        }
      })
      
      if (transaction) {
        // Fail and rollback the escrow transaction
        await escrowService.failEscrowTransaction(
          transaction.id,
          payout.failure_message || 'Payout failed'
        )
        
        // Notify contractor
        await notificationService.send({
          userId: transaction.initiatedBy,
          type: 'PAYOUT_FAILED',
          message: `Payment of $${transaction.amount} failed. Please update your bank account.`
        })
      }
      break
    }
  }
  
  return reply.send({ received: true })
})
```

---

## 📊 **Transaction State Machine**

```
┌─────────────┐
│   DEPOSIT   │
│  COMPLETED  │
└─────────────┘
      
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   RELEASE    │────▶│   RELEASE    │────▶│   RELEASE    │
│  PROCESSING  │     │  COMPLETED   │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
      │                                    
      │ (Payout fails)                     
      ▼                                    
┌──────────────┐
│   RELEASE    │
│    FAILED    │
│  (Rollback)  │
└──────────────┘
```

**Valid Transitions**:
- `PROCESSING` → `COMPLETED` (success)
- `PROCESSING` → `FAILED` (failure + rollback)

**Invalid Transitions** (prevented):
- `COMPLETED` → `FAILED` (immutable)
- `FAILED` → `COMPLETED` (must create new transaction)

---

## ✅ **Benefits**

### **1. Accuracy**
- ✅ Transaction status reflects **actual** payment state
- ✅ No false "completed" transactions
- ✅ Real-time visibility into pending payouts

### **2. Reliability**
- ✅ Automatic rollback on payout failure
- ✅ Funds immediately available for retry
- ✅ No manual reconciliation needed
- ✅ Accounting always balanced

### **3. Auditability**
- ✅ Complete lifecycle tracking
- ✅ Scheduled vs. processed timestamps
- ✅ Failure reasons recorded
- ✅ Rollback journal entries linked

### **4. User Experience**
- ✅ Accurate balance displays
- ✅ Clear "pending" indicators
- ✅ Proactive failure notifications
- ✅ Transparent payout timeline

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Successful Payout**
```
1. Release $5,000 → Status: PROCESSING
2. Escrow balance: $5,000 reduced immediately
3. Stripe processes payout → SUCCESS
4. Webhook calls completeEscrowTransaction()
5. Status: COMPLETED
6. Contractor receives funds in 1-2 business days
```

### **Scenario 2: Failed Payout (Insufficient Funds)**
```
1. Release $5,000 → Status: PROCESSING
2. Escrow balance: $5,000 reduced immediately
3. Stripe attempts payout → FAILS (bank account closed)
4. Webhook calls failEscrowTransaction()
5. Status: FAILED
6. Escrow balance: $5,000 RESTORED automatically
7. Journal entry: VOIDED automatically
8. Contractor notified to update bank account
9. Ready for retry with corrected account
```

### **Scenario 3: Multiple Simultaneous Releases**
```
Release A: $5,000 → PROCESSING
Release B: $3,000 → PROCESSING
Release C: $2,000 → PROCESSING

Stripe Results:
- Release A: SUCCESS → COMPLETED
- Release B: FAILED → FAILED (rollback $3,000)
- Release C: SUCCESS → COMPLETED

Final State:
- $7,000 successfully paid out
- $3,000 restored to escrow (available for retry)
- All accounting entries balanced
```

---

## 📈 **Impact on API Endpoints**

### **Updated Count**
- **Before**: 13 escrow endpoints
- **After**: 15 escrow endpoints (+2)

### **New Endpoints**:
1. `POST /api/escrow/transactions/:id/complete`
2. `POST /api/escrow/transactions/:id/fail`

### **Total Stage 5 Progress**:
```
✅ 85/106 API endpoints (80%)
```

**Breakdown**:
- Accounting: 16 ✅
- Stripe Connect: 15 ✅
- Escrow: **15 ✅** (was 13)
- Disputes: 11 ✅
- Lien Waivers: 11 ✅
- Financial Reporting: 9 ✅
- Statements: 8 ✅
- Analytics: 0 ⏳ (10 needed)
- Compliance: 0 ⏳ (10 needed)
- Audit: 0 ⏳ (8 needed)

**Remaining**: 21 endpoints

---

## 🎯 **Key Principles Enforced**

1. **Never mark payment releases as COMPLETED until money is actually sent**
2. **Always support rollback for failed async operations**
3. **Maintain perfect data integrity through atomic transactions**
4. **Provide complete audit trail of all state changes**
5. **Enable retry after failure without manual intervention**

---

## 🏆 **Conclusion**

The escrow system now properly handles **asynchronous payment processing** with full support for:
- ✅ Accurate status tracking
- ✅ Automatic failure recovery
- ✅ Perfect accounting reconciliation
- ✅ Complete audit trail
- ✅ User-friendly retry capability

This is **production-ready** for handling real-world payment scenarios where Stripe payouts can fail for various reasons (closed accounts, insufficient funds, compliance blocks, etc.).

---

**Committed**: January 22, 2026  
**Commit Hash**: `2d99147`  
**Branch**: `main`  
**Status**: ✅ **Deployed and Active**

