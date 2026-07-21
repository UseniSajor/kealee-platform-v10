import { prisma } from '@kealee/database'
import { Prisma } from '@prisma/client'
import type { CreateOpportunityBid, UpdateOpportunityBid, ListBidsQuery } from './bids.types'

export class BidsService {
  // List opportunity bids with filtering
  async list(query: ListBidsQuery) {
    const { page, limit, status, source, state, assignedTo, search, sortBy, sortOrder } = query
    const skip = (page - 1) * limit

    const where: Prisma.OpportunityBidWhereInput = {}

    if (status) where.status = status as any
    if (source) where.source = source as any
    if (state) where.state = state
    if (assignedTo) where.assignedTo = assignedTo

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
        { gcName: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      prisma.opportunityBid.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              documents: true,
              checklist: true,
              subQuotes: true,
            },
          },
        },
      }),
      prisma.opportunityBid.count({ where }),
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // Get single bid by ID
  async getById(id: string) {
    const bid = await prisma.opportunityBid.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { uploadedAt: 'desc' } },
        checklist: { orderBy: { order: 'asc' } },
        subQuotes: { orderBy: { receivedAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })

    if (!bid) throw new Error('Opportunity bid not found')
    return bid
  }

  // Create new opportunity bid
  async create(data: CreateOpportunityBid, userId?: string) {
    const bid = await prisma.opportunityBid.create({
      data: {
        ...data,
        bidDeadline: new Date(data.bidDeadline),
        prebidDate: data.prebidDate ? new Date(data.prebidDate) : undefined,
        projectStart: data.projectStart ? new Date(data.projectStart) : undefined,
        projectEnd: data.projectEnd ? new Date(data.projectEnd) : undefined,
        assignedTo: userId,
      },
    })

    // Create default checklist items
    await this.createDefaultChecklist(bid.id)

    // Log activity
    await prisma.opportunityBidActivity.create({
      data: {
        bidId: bid.id,
        type: 'created',
        description: `Bid opportunity discovered from ${data.source}`,
        createdBy: userId,
      },
    })

    return bid
  }

  // Update opportunity bid
  async update(id: string, data: UpdateOpportunityBid, userId?: string) {
    const existing = await prisma.opportunityBid.findUnique({ where: { id } })
    if (!existing) throw new Error('Opportunity bid not found')

    const bid = await prisma.opportunityBid.update({
      where: { id },
      data,
    })

    // Log status changes
    if (data.status && data.status !== existing.status) {
      await prisma.opportunityBidActivity.create({
        data: {
          bidId: id,
          type: 'status_change',
          description: `Status changed from ${existing.status} to ${data.status}`,
          createdBy: userId,
        },
      })
    }

    return bid
  }

  // Get pipeline view (Kanban columns)
  async getPipeline() {
    const statuses = ['DISCOVERED', 'REVIEWING', 'PREPARING', 'READY', 'SUBMITTED']

    const pipeline = await Promise.all(
      statuses.map(async (status) => ({
        status,
        bids: await prisma.opportunityBid.findMany({
          where: { status: status as any },
          orderBy: { bidDeadline: 'asc' },
          include: {
            _count: { select: { documents: true, checklist: true, subQuotes: true } },
          },
        }),
      }))
    )

    return pipeline
  }

  // Generate proposal (stub for Phase 2)
  async generateProposal(id: string, userId?: string) {
    const bid = await this.getById(id)

    // TODO: Implement AI proposal generation in Phase 2
    const proposalText = `Proposal for ${bid.projectName}\n\nThis is a placeholder. Phase 2 will implement AI-powered proposal generation.`

    await prisma.opportunityBidActivity.create({
      data: {
        bidId: id,
        type: 'proposal_generated',
        description: 'Proposal generated',
        createdBy: userId,
      },
    })

    return { proposalText, bid }
  }

  // Scan for new bids (stub for Phase 2)
  async scanForBids(_userId?: string) {
    // TODO: Implement in Phase 2 with n8n integration
    return { message: 'Scan triggered. Phase 2 will implement automated email monitoring.' }
  }

  // Create default checklist for new bid
  private async createDefaultChecklist(bidId: string) {
    const items = [
      { category: 'prebid', item: 'Attend pre-bid meeting (if required)', order: 1 },
      { category: 'documents', item: 'Download all bid documents', order: 2 },
      { category: 'documents', item: 'Review specifications', order: 3 },
      { category: 'documents', item: 'Review drawings/plans', order: 4 },
      { category: 'estimates', item: 'Complete quantity takeoff', order: 5 },
      { category: 'estimates', item: 'Price materials', order: 6 },
      { category: 'estimates', item: 'Price labor', order: 7 },
      { category: 'subs', item: 'Request subcontractor quotes', order: 8 },
      { category: 'subs', item: 'Receive and review sub quotes', order: 9 },
      { category: 'review', item: 'Review scope for gaps', order: 10 },
      { category: 'review', item: 'Calculate overhead & profit', order: 11 },
      { category: 'review', item: 'Final review with team', order: 12 },
      { category: 'submit', item: 'Complete bid form', order: 13 },
      { category: 'submit', item: 'Prepare bid bond (if required)', order: 14 },
      { category: 'submit', item: 'Submit bid', order: 15 },
    ]

    await prisma.opportunityBidChecklist.createMany({
      data: items.map(item => ({ ...item, bidId })),
    })
  }

  // Add document
  async addDocument(bidId: string, doc: { name: string; fileUrl: string; category?: string }, userId?: string) {
    const document = await prisma.opportunityBidDocument.create({
      data: {
        bidId,
        ...doc,
      },
    })

    await prisma.opportunityBidActivity.create({
      data: {
        bidId,
        type: 'document_added',
        description: `Document added: ${doc.name}`,
        createdBy: userId,
      },
    })

    return document
  }

  // Add subcontractor quote
  async addSubQuote(bidId: string, quote: { subName: string; trade: string; quoteAmount: number; notes?: string }, userId?: string) {
    const subQuote = await prisma.subcontractorQuote.create({
      data: {
        bidId,
        ...quote,
      },
    })

    await prisma.opportunityBidActivity.create({
      data: {
        bidId,
        type: 'sub_quote_added',
        description: `Quote received from ${quote.subName} for ${quote.trade}`,
        createdBy: userId,
      },
    })

    return subQuote
  }

  // Update checklist item
  async updateChecklistItem(itemId: string, completed: boolean, userId?: string) {
    return prisma.opportunityBidChecklist.update({
      where: { id: itemId },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        completedBy: completed ? userId : null,
      },
    })
  }
}

export const bidsService = new BidsService()
