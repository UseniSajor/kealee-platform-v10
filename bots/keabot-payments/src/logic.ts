/**
 * bots/keabot-payments/src/logic.ts
 *
 * Real payment logic for KeaBot Payments.
 *
 * Rules:
 * - Milestone must be APPROVED before payout
 * - No payout if an existing PENDING/PROCESSING/COMPLETED payout exists for the milestone
 * - Contractor must have a ConnectedAccount with payoutsEnabled
 * - Stripe transfer uses idempotency key to prevent double-charge
 * - All payouts are logged to the Payout table with status tracking
 */

import { PrismaClient } from '@kealee/database'
import Stripe from 'stripe'

const prisma = new PrismaClient()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2023-10-16' as any,
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MilestoneStatus {
  id: string
  name: string
  amount: number
  status: string
  approvedAt: Date | null
  paidAt: Date | null
  completedAt: Date | null
  evidenceCount: number
  approvalCount: number
  readyForPayout: boolean
  existingPayoutId: string | null
  blockers: string[]
}

export interface PayoutResult {
  success: boolean
  payoutId?: string
  stripeTransferId?: string
  amount?: number
  error?: string
}

export interface EscrowSummary {
  projectId: string
  totalMilestones: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
  eligibleAmount: number
  milestones: MilestoneStatus[]
}

// ─── Milestone Status ─────────────────────────────────────────────────────────

export async function checkMilestoneStatus(
  projectId: string,
  milestoneId?: string,
): Promise<MilestoneStatus[]> {
  // Find contract(s) belonging to this project
  const contracts = await prisma.contractAgreement.findMany({
    where: { projectId },
    select: { id: true },
  })
  const contractIds = contracts.map((c) => c.id)
  if (contractIds.length === 0) return []

  const where = milestoneId
    ? { id: milestoneId, contractId: { in: contractIds } }
    : { contractId: { in: contractIds } }

  const milestones = await prisma.milestone.findMany({
    where,
    include: {
      evidence:  { select: { id: true } },
      approvals: { select: { id: true, approved: true } },
      payouts:   {
        where: { status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return milestones.map((m) => {
    const existingPayout = m.payouts[0] ?? null
    const blockers: string[] = []

    if (m.status !== 'APPROVED') blockers.push(`Milestone is ${m.status}, not APPROVED`)
    if (!m.approvedAt) blockers.push('Milestone has not been formally approved')
    if (existingPayout) blockers.push(`Payout already exists (${existingPayout.status})`)

    return {
      id:               m.id,
      name:             m.name,
      amount:           Number(m.amount),
      status:           m.status,
      approvedAt:       m.approvedAt,
      paidAt:           m.paidAt,
      completedAt:      m.completedAt,
      evidenceCount:    m.evidence.length,
      approvalCount:    m.approvals.filter((a) => (a as any).approved).length,
      readyForPayout:   blockers.length === 0,
      existingPayoutId: existingPayout?.id ?? null,
      blockers,
    }
  })
}

// ─── Payout ───────────────────────────────────────────────────────────────────

export async function processMilestonePayout(
  milestoneId: string,
  initiatedByUserId: string,
): Promise<PayoutResult> {
  // 1. Load milestone with full relations
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      contract: {
        include: {
          project: {
            include: {
              contractor: {
                include: {
                  user: {
                    include: { connectedAccount: true },
                  },
                },
              },
            },
          },
        },
      },
      payouts: {
        where: { status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
      },
    },
  })

  if (!milestone) {
    return { success: false, error: 'Milestone not found' }
  }

  // 2. Status check
  if (milestone.status !== 'APPROVED') {
    return {
      success: false,
      error: `Milestone must be APPROVED before payout. Current status: ${milestone.status}`,
    }
  }
  if (!milestone.approvedAt) {
    return { success: false, error: 'Milestone has no approvedAt date — approval may be incomplete' }
  }

  // 3. Double-payout guard
  if (milestone.payouts.length > 0) {
    const existing = milestone.payouts[0]
    return {
      success: false,
      error: `Payout already exists for this milestone (ID: ${existing.id}, status: ${existing.status})`,
    }
  }

  // 4. Contractor and connected account
  const contractor = milestone.contract?.project?.contractor
  if (!contractor) {
    return { success: false, error: 'No contractor assigned to this project' }
  }

  const connectedAccount = (contractor.user as any)?.connectedAccount
  if (!connectedAccount) {
    return {
      success: false,
      error: `Contractor ${contractor.id} has no connected Stripe account. They must complete Stripe onboarding first.`,
    }
  }
  if (!connectedAccount.payoutsEnabled) {
    return {
      success: false,
      error: `Contractor's Stripe account does not have payouts enabled. Requirements may be outstanding.`,
    }
  }

  // 5. Amount (convert to cents)
  const amountDollars = Number(milestone.amount)
  if (amountDollars <= 0) {
    return { success: false, error: 'Milestone amount must be greater than zero' }
  }
  const amountCents = Math.round(amountDollars * 100)

  // 6. Stripe transfer with idempotency key
  const idempotencyKey = `milestone-payout-${milestoneId}`
  let transfer: Stripe.Transfer

  try {
    transfer = await stripe.transfers.create(
      {
        amount:      amountCents,
        currency:    'usd',
        destination: connectedAccount.stripeAccountId,
        metadata: {
          milestoneId,
          projectId:   milestone.contract?.project?.id ?? '',
          initiatedBy: initiatedByUserId,
        },
      },
      { idempotencyKey },
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: `Stripe transfer failed: ${msg}` }
  }

  // 7. Persist payout record + update milestone (in one transaction)
  try {
    const [payout] = await prisma.$transaction([
      prisma.payout.create({
        data: {
          connectedAccountId: connectedAccount.id,
          milestoneId,
          amount:          milestone.amount,
          currency:        'USD',
          stripeTransferId: transfer.id,
          status:          'PROCESSING',
          initiatedBy:     initiatedByUserId,
          metadata: {
            stripeTransferId: transfer.id,
            amountCents,
          },
        },
      }),
      prisma.milestone.update({
        where: { id: milestoneId },
        data:  { paidAt: new Date(), status: 'PAID' },
      }),
    ])

    return {
      success:         true,
      payoutId:        payout.id,
      stripeTransferId: transfer.id,
      amount:          amountDollars,
    }
  } catch (err: unknown) {
    // Transfer went through but DB write failed — critical to log this
    const msg = err instanceof Error ? err.message : String(err)
    console.error(
      `[keabot-payments] CRITICAL: Stripe transfer ${transfer.id} succeeded but DB write failed: ${msg}`,
    )
    return {
      success: false,
      error: `Payment transferred (Stripe ID: ${transfer.id}) but record creation failed. Contact support immediately.`,
    }
  }
}

// ─── Escrow Summary ───────────────────────────────────────────────────────────

export async function getEscrowSummary(projectId: string): Promise<EscrowSummary> {
  const milestones = await checkMilestoneStatus(projectId)

  const totalAmount    = milestones.reduce((s, m) => s + m.amount, 0)
  const paidAmount     = milestones.filter((m) => m.status === 'PAID').reduce((s, m) => s + m.amount, 0)
  const eligibleAmount = milestones.filter((m) => m.readyForPayout).reduce((s, m) => s + m.amount, 0)
  const pendingAmount  = totalAmount - paidAmount

  return {
    projectId,
    totalMilestones: milestones.length,
    totalAmount,
    paidAmount,
    pendingAmount,
    eligibleAmount,
    milestones,
  }
}

// ─── Lien Waiver ─────────────────────────────────────────────────────────────

export async function generateLienWaiverData(
  milestoneId: string,
): Promise<{ conditional: boolean; amount: number; milestoneId: string; projectId: string } | null> {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: { contract: { select: { projectId: true } } },
  })
  if (!milestone) return null

  return {
    conditional: milestone.status !== 'PAID', // conditional until paid, unconditional after
    amount:      Number(milestone.amount),
    milestoneId: milestone.id,
    projectId:   milestone.contract?.projectId ?? '',
  }
}
