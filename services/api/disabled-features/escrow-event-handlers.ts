/**
 * Escrow Event Handlers
 * Responds to business events from other services and orchestrates escrow operations
 */

import { prisma, Decimal } from '@kealee/database'
import { eventBus } from './event-bus'
import { escrowService } from '../modules/escrow/escrow.service'
import { eventService } from '../modules/events/event.service'

export class EscrowEventHandlers {
  private isRegistered = false

  /**
   * Register all event handlers
   * Should be called once during application startup
   */
  registerHandlers() {
    if (this.isRegistered) {
      console.warn('Escrow event handlers already registered')
      return
    }

    this.registerContractHandlers()
    this.registerMilestoneHandlers()
    this.registerDisputeHandlers()
    this.registerPayoutHandlers()

    this.isRegistered = true
    console.log('✅ Escrow event handlers registered')
  }

  /**
   * Contract event handlers
   */
  private registerContractHandlers() {
    // When contract is signed → Create escrow automatically
    eventBus.on('contract.signed', async (data) => {
      try {
        console.log(`[Escrow] Contract signed: ${data.contractNumber}, creating escrow...`)

        // Create escrow agreement
        const escrow = await escrowService.createEscrowAgreement({
          contractId: data.contractId,
          totalContractAmount: new Decimal(data.totalAmount),
          initialDepositPercentage: 10, // 10% deposit required
          holdbackPercentage: 10, // 10% holdback until completion
          createdBy: data.userId,
        })

        console.log(`[Escrow] ✅ Escrow created: ${escrow.escrowAccountNumber}`)

        // Emit success event
        eventBus.emit('escrow.created', {
          escrowId: escrow.id,
          escrowAccountNumber: escrow.escrowAccountNumber,
          contractId: data.contractId,
          initialDepositAmount: escrow.initialDepositAmount.toNumber(),
        })

        // Log to event audit trail
        await eventService.recordEvent({
          type: 'ESCROW_CREATED',
          entityType: 'ESCROW',
          entityId: escrow.id,
          userId: data.userId,
          payload: {
            contractId: data.contractId,
            contractNumber: data.contractNumber,
            escrowAccountNumber: escrow.escrowAccountNumber,
            initialDepositAmount: escrow.initialDepositAmount.toNumber(),
          },
        })
      } catch (error: any) {
        console.error('[Escrow] ❌ Failed to create escrow:', error)

        // Emit failure event for monitoring
        eventBus.emit('escrow.creation.failed', {
          contractId: data.contractId,
          error,
        })

        // Log error
        await eventService.recordEvent({
          type: 'ESCROW_CREATION_FAILED',
          entityType: 'CONTRACT',
          entityId: data.contractId,
          userId: data.userId,
          payload: {
            error: error.message,
            contractNumber: data.contractNumber,
          },
        })

        // Note: We don't throw here to prevent breaking the contract signing flow
        // The contract is signed; escrow can be created manually if needed
      }
    })

    // When contract is cancelled → Process refund and close escrow
    eventBus.on('contract.cancelled', async (data) => {
      try {
        console.log(`[Escrow] Contract cancelled: ${data.contractNumber}, processing refund...`)

        // Get escrow for contract
        const escrow = await escrowService.getEscrowByContract(data.contractId)

        // If escrow has balance, process refund
        if (escrow.currentBalance.greaterThan(0)) {
          const contract = await prisma.contract.findUnique({ where: { id: escrow.contractId } })
          await escrowService.processRefund({
            escrowId: escrow.id,
            amount: escrow.currentBalance,
            reason: `Contract cancelled: ${data.reason}`,
            recipientAccountId: contract?.ownerId!, // Refund to owner
            initiatedBy: data.userId,
          })

          console.log(`[Escrow] ✅ Refund processed: $${escrow.currentBalance}`)
        }

        // Close escrow
        await escrowService.closeEscrow(escrow.id, data.userId)

        console.log(`[Escrow] ✅ Escrow closed: ${escrow.escrowAccountNumber}`)

        eventBus.emit('escrow.closed', {
          escrowId: escrow.id,
          contractId: data.contractId,
          closedAt: new Date(),
        })
      } catch (error: any) {
        console.error('[Escrow] ❌ Failed to process contract cancellation:', error)
        // Don't emit failure event here as cancellation should still proceed
      }
    })
  }

  /**
   * Milestone event handlers
   */
  private registerMilestoneHandlers() {
    // When milestone is approved → Release payment
    eventBus.on('milestone.approved', async (data) => {
      try {
        console.log(`[Escrow] Milestone approved: ${data.milestoneId}, releasing payment...`)

        // Get escrow for contract
        const escrow = await escrowService.getEscrowByContract(data.contractId)

        // Get contractor's connected account
        const contract = await prisma.contract.findUnique({ 
          where: { id: escrow.contractId },
          include: { contractor: true }
        })
        const contractor = contract?.contractor
        if (!contractor || !contractor.connectedAccountId) {
          throw new Error('Contractor does not have a connected account for payouts')
        }

        // Release payment from escrow
        const transaction = await escrowService.releasePayment({
          escrowId: escrow.id,
          milestoneId: data.milestoneId,
          amount: new Decimal(data.amount),
          recipientAccountId: contractor.connectedAccountId,
          initiatedBy: data.approvedBy,
          approvedBy: data.approvedBy,
        })

        console.log(`[Escrow] ✅ Payment released: $${data.amount} (status: ${transaction.status})`)

        eventBus.emit('escrow.payment.released', {
          escrowId: escrow.id,
          transactionId: transaction.id,
          milestoneId: data.milestoneId,
          amount: data.amount,
          recipientId: contractor.id,
        })

        await eventService.recordEvent({
          type: 'ESCROW_PAYMENT_RELEASED',
          entityType: 'ESCROW_TRANSACTION',
          entityId: transaction.id,
          userId: data.approvedBy,
          payload: {
            escrowId: escrow.id,
            milestoneId: data.milestoneId,
            amount: data.amount,
            contractId: data.contractId,
          },
        })
      } catch (error: any) {
        console.error('[Escrow] ❌ Failed to release payment:', error)

        eventBus.emit('escrow.payment.failed', {
          escrowId: '', // Don't have ID if lookup failed
          transactionId: '',
          milestoneId: data.milestoneId,
          amount: data.amount,
          reason: error.message,
          error,
        })

        await eventService.recordEvent({
          type: 'ESCROW_PAYMENT_FAILED',
          entityType: 'MILESTONE',
          entityId: data.milestoneId,
          userId: data.approvedBy,
          payload: {
            error: error.message,
            amount: data.amount,
            contractId: data.contractId,
          },
        })
      }
    })

    // When milestone is rejected → No action needed, just log
    eventBus.on('milestone.rejected', async (data) => {
      console.log(`[Escrow] Milestone rejected: ${data.milestoneId}, no payment released`)

      await eventService.recordEvent({
        type: 'MILESTONE_REJECTED_NO_PAYMENT',
        entityType: 'MILESTONE',
        entityId: data.milestoneId,
        userId: data.rejectedBy,
        payload: {
          reason: data.reason,
          contractId: data.contractId,
        },
      })
    })
  }

  /**
   * Dispute event handlers
   */
  private registerDisputeHandlers() {
    // When dispute is created → Place hold on escrow
    eventBus.on('dispute.created', async (data) => {
      try {
        console.log(`[Escrow] Dispute created: ${data.disputeNumber}, placing hold...`)

        // Get escrow for contract
        const escrow = await escrowService.getEscrowByContract(data.contractId)

        // Place hold for disputed amount
        const hold = await escrowService.placeHold({
          escrowId: escrow.id,
          amount: new Decimal(data.amount),
          reason: 'DISPUTE',
          notes: `Dispute ${data.disputeNumber} (ID: ${data.disputeId})`,
          placedBy: data.initiatedBy,
        })

        console.log(`[Escrow] ✅ Hold placed: $${data.amount} (escrow frozen: ${escrow.status === 'FROZEN'})`)

        eventBus.emit('escrow.hold.placed', {
          escrowId: escrow.id,
          holdId: hold.id,
          amount: data.amount,
          reason: 'DISPUTE',
          reference: data.disputeId,
        })

        if (escrow.status === 'FROZEN') {
          eventBus.emit('escrow.frozen', {
            escrowId: escrow.id,
            reason: `Dispute ${data.disputeNumber}`,
          })
        }

        await eventService.recordEvent({
          type: 'ESCROW_HOLD_PLACED',
          entityType: 'ESCROW_HOLD',
          entityId: hold.id,
          userId: data.initiatedBy,
          payload: {
            escrowId: escrow.id,
            disputeId: data.disputeId,
            disputeNumber: data.disputeNumber,
            amount: data.amount,
            reason: 'DISPUTE',
          },
        })
      } catch (error: any) {
        console.error('[Escrow] ❌ Failed to place hold:', error)

        eventBus.emit('escrow.hold.failed', {
          escrowId: data.escrowId || '',
          disputeId: data.disputeId,
          error,
        })

        await eventService.recordEvent({
          type: 'ESCROW_HOLD_FAILED',
          entityType: 'DISPUTE',
          entityId: data.disputeId,
          userId: data.initiatedBy,
          payload: {
            error: error.message,
            amount: data.amount,
            contractId: data.contractId,
          },
        })
      }
    })

    // When dispute is resolved → Release hold and process resolution
    eventBus.on('dispute.resolved', async (data) => {
      try {
        console.log(`[Escrow] Dispute resolved: ${data.disputeId}, resolution: ${data.resolution}`)

        // Get escrow for contract
        const escrow = await escrowService.getEscrowByContract(data.contractId)

        // Find the hold associated with this dispute
        const hold = await escrowService.getHoldByReference(escrow.id, data.disputeId)

        // Handle different resolution types
        switch (data.resolution) {
          case 'FULL_RELEASE':
          case 'PARTIAL_RELEASE':
            // Release the hold
            await escrowService.releaseHold({
              holdId: hold.id,
              releasedBy: data.resolvedBy,
              notes: `Dispute resolved: ${data.resolution}`,
            })

            console.log(`[Escrow] ✅ Hold released: $${hold.amount}`)

            eventBus.emit('escrow.hold.released', {
              escrowId: escrow.id,
              holdId: hold.id,
              amount: hold.amount.toNumber(),
            })

            // Check if escrow should be unfrozen
            const remainingHolds = await prisma.escrowHold.count({
              where: {
                escrowId: escrow.id,
                status: 'ACTIVE',
              },
            })

            if (remainingHolds === 0 && escrow.status === 'FROZEN') {
              await prisma.escrowAgreement.update({
                where: { id: escrow.id },
                data: { status: 'ACTIVE' },
              })

              eventBus.emit('escrow.unfrozen', {
                escrowId: escrow.id,
              })
            }
            break

          case 'NO_RELEASE':
            // Keep the hold in place
            console.log(`[Escrow] ⏸️  Hold maintained (no release)`)
            break

          case 'REFUND':
            // Release hold and process refund
            await escrowService.releaseHold({
              holdId: hold.id,
              releasedBy: data.resolvedBy,
              notes: `Dispute resolved: ${data.resolution} (refund initiated)`,
            })

            if (data.ownerAmount && data.ownerAmount > 0) {
              await escrowService.processRefund({
                escrowId: escrow.id,
                amount: new Decimal(data.ownerAmount),
                reason: `Dispute resolution refund`,
                recipientAccountId: escrow.contract.ownerId,
                initiatedBy: data.resolvedBy,
                approvedBy: data.resolvedBy,
              })
            }

            console.log(`[Escrow] ✅ Refund processed: $${data.ownerAmount || 0}`)
            break
        }

        await eventService.recordEvent({
          type: 'DISPUTE_RESOLVED_ESCROW_UPDATED',
          entityType: 'ESCROW_HOLD',
          entityId: hold.id,
          userId: data.resolvedBy,
          payload: {
            escrowId: escrow.id,
            disputeId: data.disputeId,
            resolution: data.resolution,
            holdAmount: hold.amount.toNumber(),
            ownerAmount: data.ownerAmount,
            contractorAmount: data.contractorAmount,
          },
        })
      } catch (error: any) {
        console.error('[Escrow] ❌ Failed to process dispute resolution:', error)

        await eventService.recordEvent({
          type: 'DISPUTE_RESOLUTION_FAILED',
          entityType: 'DISPUTE',
          entityId: data.disputeId,
          userId: data.resolvedBy,
          payload: {
            error: error.message,
            resolution: data.resolution,
            contractId: data.contractId,
          },
        })
      }
    })
  }

  /**
   * Payout event handlers (from Stripe webhooks)
   */
  private registerPayoutHandlers() {
    // When payout is completed → Update milestone status
    eventBus.on('escrow.payment.completed', async (data) => {
      console.log(`[Escrow] Payment completed: ${data.transactionId} for milestone ${data.milestoneId}`)

      await eventService.recordEvent({
        type: 'ESCROW_PAYMENT_COMPLETED',
        entityType: 'ESCROW_TRANSACTION',
        entityId: data.transactionId,
        payload: {
          escrowId: data.escrowId,
          milestoneId: data.milestoneId,
          amount: data.amount,
          completedAt: data.completedAt,
        },
      })

      // Emit event for milestone service to mark milestone as PAID
      eventBus.emit('milestone.paid', {
        milestoneId: data.milestoneId,
        contractId: '', // TODO: Get from escrow
        amount: data.amount,
        paidAt: data.completedAt,
      })
    })

    // When payout fails → Alert and prepare for retry
    eventBus.on('escrow.payment.failed', async (data) => {
      console.error(`[Escrow] Payment failed: ${data.transactionId} for milestone ${data.milestoneId}`)

      await eventService.recordEvent({
        type: 'ESCROW_PAYMENT_FAILED',
        entityType: 'ESCROW_TRANSACTION',
        entityId: data.transactionId,
        payload: {
          escrowId: data.escrowId,
          milestoneId: data.milestoneId,
          amount: data.amount,
          reason: data.reason,
          error: data.error.message,
        },
      })

      // TODO: Send notification to contractor to update bank account
      // TODO: Create task for manual review
    })
  }
}

// Export singleton instance
export const escrowEventHandlers = new EscrowEventHandlers()

