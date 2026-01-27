import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'
import { auditService } from '../audit/audit.service'
import { eventService } from '../events/event.service'

export interface SubmitQuoteInput {
    leadId: string
    profileId: string
    amount: number
    timeline?: string
    details?: string
    userId?: string
}

export const quotesService = {
    /**
     * Submit a quote for a lead, enforcing the 3% bid-up maximum over SRP
     */
    async submitQuote(input: SubmitQuoteInput) {
        const { leadId, profileId, amount, timeline, details, userId } = input

        // Fetch lead to get SRP
        const lead = await prismaAny.lead.findUnique({
            where: { id: leadId },
        })

        if (!lead) {
            throw new NotFoundError('Lead', leadId)
        }

        // Check if lead is still open for bidding
        if (lead.stage !== 'OPEN' && lead.stage !== 'INTAKE') {
            throw new Error(`Bidding is closed for lead ${leadId} (current stage: ${lead.stage})`)
        }

        // Enforce 3% bid-up maximum over SRP (if SRP exists)
        // SRP is stored in the 'srp' or 'estimatedValue' field
        const srp = lead.srp ? Number(lead.srp) : (lead.estimatedValue ? Number(lead.estimatedValue) : null)

        if (srp !== null) {
            const maxBid = srp * 1.03
            if (amount > maxBid) {
                throw new Error(`Bid amount $${amount} exceeds the maximum allowed bid of $${maxBid.toFixed(2)} (3% over SRP of $${srp})`)
            }
        }

        // Check if contractor is allowed to bid (has received the lead)
        const isDistributed = lead.distributedTo.includes(profileId)
        if (!isDistributed) {
            throw new Error(`Contractor ${profileId} is not authorized to bid on this lead`)
        }

        // Create the quote
        const quote = await prismaAny.quote.create({
            data: {
                leadId,
                profileId,
                amount: amount as any,
                timeline,
                details,
                status: 'SUBMITTED',
            },
            include: {
                profile: true,
            },
        })

        // Update lead stage to QUOTED
        await prismaAny.lead.update({
            where: { id: leadId },
            data: {
                stage: 'QUOTED',
                quotedAt: new Date(),
                stageChangedAt: new Date(),
            },
        })

        // Log audit and event
        await Promise.all([
            auditService.recordAudit({
                action: 'QUOTE_SUBMITTED',
                entityType: 'Quote',
                entityId: quote.id,
                userId: userId || 'system',
                after: {
                    leadId,
                    profileId,
                    amount,
                },
            }),
            eventService.recordEvent({
                type: 'QUOTE_SUBMITTED',
                entityType: 'Quote',
                entityId: quote.id,
                userId: userId,
                payload: {
                    leadId,
                    profileId,
                    amount,
                    contractorName: quote.profile.businessName,
                },
            }),
        ])

        return quote
    },

    /**
     * List quotes for a lead
     */
    async listQuotes(leadId: string) {
        return prismaAny.quote.findMany({
            where: { leadId },
            include: {
                profile: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: { amount: 'asc' },
        })
    },
}
