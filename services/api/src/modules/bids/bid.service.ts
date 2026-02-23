import { prismaAny } from '../../utils/prisma-helper'

// ── Default Checklist Steps ──────────────────────────────────────────────────

const DEFAULT_CHECKLIST = [
  { step: 1, title: 'Review Bid Documents', description: 'Download and review all specs, drawings, and addenda' },
  { step: 2, title: 'Attend Pre-Bid Meeting', description: 'Attend mandatory/optional pre-bid meeting and site visit' },
  { step: 3, title: 'Scope Analysis', description: 'Identify scope of work, divisions, and Kealee self-perform items' },
  { step: 4, title: 'Request Sub Quotes', description: 'Send sub-requests to electrical, plumbing, and specialty trades' },
  { step: 5, title: 'Material Pricing', description: 'Get supplier quotes for major materials and equipment' },
  { step: 6, title: 'Estimate Preparation', description: 'Build detailed estimate with labor, material, equipment, and overhead' },
  { step: 7, title: 'MBE/DBE Compliance', description: 'Verify MBE/DBE participation goals and certifications' },
  { step: 8, title: 'Bid Bond & Insurance', description: 'Obtain bid bond and verify insurance requirements' },
  { step: 9, title: 'Final Review & Submission', description: 'Review bid package, get approval, and submit before deadline' },
  { step: 10, title: 'Post-Submission Follow-Up', description: 'Track award decision and follow up with owner/GC' },
]

// ── Company Profile ─────────────────────────────────────────────────────────

const COMPANY_PROFILE = {
  name: 'Kealee Construction LLC',
  address: 'Maryland',
  phone: '',
  email: '',
  website: '',
  certifications: ['MBE Certified', 'DBE Certified'],
  capabilities: [
    'HVAC Installation & Service',
    'Mechanical Contracting',
    'Plumbing',
    'General Construction',
    'Tenant Fit-Out',
    'Government Contracting',
  ],
  bonding: 'Bonding capacity available upon request',
  insurance: 'Fully insured — General Liability, Workers Comp, Auto',
}

const KEY_PERSONNEL = [
  { name: 'Tim Chamberlain', title: 'President / Project Executive', role: 'Overall project oversight and client relations' },
]

function generateCoverLetter(bid: any): string {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  return `
${date}

${bid.ownerName || 'Project Owner'}
RE: ${bid.projectName}${bid.projectNumber ? ` — Project #${bid.projectNumber}` : ''}

Dear Selection Committee,

${COMPANY_PROFILE.name} is pleased to submit our proposal for the above-referenced project${bid.scope ? ` for the ${bid.scope} scope of work` : ''}${bid.location ? ` located in ${bid.location}` : ''}.

As a Maryland-based ${COMPANY_PROFILE.certifications.join(' and ')} firm, we bring extensive experience in ${COMPANY_PROFILE.capabilities.slice(0, 3).join(', ')} to deliver quality results on schedule and within budget.

Our team is committed to safety, quality workmanship, and collaborative project delivery. We look forward to the opportunity to serve on this project.

Respectfully submitted,

${KEY_PERSONNEL[0].name}
${KEY_PERSONNEL[0].title}
${COMPANY_PROFILE.name}
`.trim()
}

// ── Bid Service ──────────────────────────────────────────────────────────────

export class BidService {

  // ── List Bids ──────────────────────────────────────────────────────────────

  async listBids(filters: {
    status?: string
    priority?: string
    source?: string
    search?: string
    dueBefore?: string
    dueAfter?: string
    sortBy?: string
    sortOrder?: string
    page?: number
    limit?: number
  }) {
    const where: any = {}

    if (filters.status) where.status = filters.status
    if (filters.priority) where.priority = filters.priority
    if (filters.source) where.source = filters.source
    if (filters.search) {
      where.OR = [
        { projectName: { contains: filters.search, mode: 'insensitive' } },
        { ownerName: { contains: filters.search, mode: 'insensitive' } },
        { gcName: { contains: filters.search, mode: 'insensitive' } },
        { scope: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.dueBefore || filters.dueAfter) {
      where.dueDate = {}
      if (filters.dueBefore) where.dueDate.lte = new Date(filters.dueBefore)
      if (filters.dueAfter) where.dueDate.gte = new Date(filters.dueAfter)
    }

    const page = Math.max(1, filters.page ?? 1)
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 100)
    const skip = (page - 1) * limit

    const sortBy = filters.sortBy || 'dueDate'
    const sortOrder = filters.sortOrder || 'asc'

    const [bids, total] = await Promise.all([
      prismaAny.bidOpportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          checklist: { orderBy: { step: 'asc' } },
          _count: { select: { documents: true, activities: true, subRequests: true } },
        },
      }),
      prismaAny.bidOpportunity.count({ where }),
    ])

    return {
      bids,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  // ── Pipeline Dashboard ─────────────────────────────────────────────────────

  async getPipeline() {
    const now = new Date()
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      all,
      active,
      dueSoon,
      submitted,
      awarded,
      lost,
      byStatus,
      bySource,
    ] = await Promise.all([
      prismaAny.bidOpportunity.count(),
      prismaAny.bidOpportunity.count({
        where: { status: { in: ['NEW', 'REVIEWING', 'PREPARING'] } },
      }),
      prismaAny.bidOpportunity.count({
        where: {
          status: { in: ['NEW', 'REVIEWING', 'PREPARING'] },
          dueDate: { lte: sevenDays, gte: now },
        },
      }),
      prismaAny.bidOpportunity.count({ where: { status: 'SUBMITTED' } }),
      prismaAny.bidOpportunity.count({ where: { status: 'AWARDED' } }),
      prismaAny.bidOpportunity.count({ where: { status: 'LOST' } }),
      prismaAny.bidOpportunity.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { estimatedValue: true },
      }),
      prismaAny.bidOpportunity.groupBy({
        by: ['source'],
        _count: { id: true },
      }),
    ])

    const winRate = (submitted + awarded + lost) > 0
      ? Math.round((awarded / (awarded + lost)) * 100)
      : 0

    const pipelineValue = byStatus.reduce((sum: number, s: any) => {
      if (['NEW', 'REVIEWING', 'PREPARING', 'SUBMITTED'].includes(s.status)) {
        return sum + (Number(s._sum?.estimatedValue) || 0)
      }
      return sum
    }, 0)

    return {
      summary: { total: all, active, dueSoon, submitted, awarded, lost, winRate, pipelineValue },
      byStatus: byStatus.map((s: any) => ({
        status: s.status,
        count: s._count.id,
        value: Number(s._sum?.estimatedValue) || 0,
      })),
      bySource: bySource.map((s: any) => ({
        source: s.source,
        count: s._count.id,
      })),
    }
  }

  // ── Get Single Bid ─────────────────────────────────────────────────────────

  async getBid(id: string) {
    const bid = await prismaAny.bidOpportunity.findUnique({
      where: { id },
      include: {
        checklist: { orderBy: { step: 'asc' } },
        documents: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' }, take: 50 },
        subRequests: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!bid) throw new Error('Bid not found')
    return bid
  }

  // ── Create Bid ─────────────────────────────────────────────────────────────

  async createBid(data: {
    projectName: string
    source?: string
    sourceId?: string
    sourceUrl?: string
    projectNumber?: string
    description?: string
    scope?: string
    location?: string
    county?: string
    state?: string
    ownerName?: string
    gcName?: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    estimatedValue?: number
    dueDate?: string
    prebidDate?: string
    prebidLocation?: string
    prebidMandatory?: boolean
    awardDate?: string
    startDate?: string
    isGovernment?: boolean
    isFederal?: boolean
    requiresMBE?: boolean
    requiresDBE?: boolean
    mbeGoalPercent?: number
    dbeGoalPercent?: number
    prevailingWage?: boolean
    bondRequired?: boolean
    notes?: string
    assignedTo?: string
    organizationId?: string
  }) {
    // Auto-set priority based on due date
    let priority = 'MEDIUM'
    if (data.dueDate) {
      const due = new Date(data.dueDate)
      const now = new Date()
      const daysUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysUntilDue <= 3) priority = 'CRITICAL'
      else if (daysUntilDue <= 7) priority = 'HIGH'
      else if (daysUntilDue <= 21) priority = 'MEDIUM'
      else priority = 'LOW'
    }

    // Auto-detect government flags from source
    const isGovernment = data.isGovernment ??
      ['EMMA', 'OPENGOV', 'SHA_MDOT'].includes(data.source || '')
    const isStateLocal = isGovernment && !(data.isFederal ?? false)

    const bid = await prismaAny.bidOpportunity.create({
      data: {
        projectName: data.projectName,
        source: data.source || 'MANUAL',
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        projectNumber: data.projectNumber,
        description: data.description,
        scope: data.scope,
        location: data.location,
        county: data.county,
        state: data.state || 'MD',
        ownerName: data.ownerName,
        gcName: data.gcName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        estimatedValue: data.estimatedValue,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        prebidDate: data.prebidDate ? new Date(data.prebidDate) : null,
        prebidLocation: data.prebidLocation,
        prebidMandatory: data.prebidMandatory ?? false,
        awardDate: data.awardDate ? new Date(data.awardDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        status: 'NEW',
        priority,
        assignedTo: data.assignedTo,
        isGovernment,
        isFederal: data.isFederal ?? false,
        isStateLocal,
        requiresMBE: data.requiresMBE ?? false,
        requiresDBE: data.requiresDBE ?? false,
        mbeGoalPercent: data.mbeGoalPercent,
        dbeGoalPercent: data.dbeGoalPercent,
        prevailingWage: data.prevailingWage ?? false,
        bondRequired: data.bondRequired ?? false,
        notes: data.notes,
        organizationId: data.organizationId,
        // Create default checklist
        checklist: {
          create: DEFAULT_CHECKLIST.map((item) => ({
            step: item.step,
            title: item.title,
            description: item.description,
          })),
        },
        // Create initial activity
        activities: {
          create: {
            action: 'CREATED',
            actor: 'system',
            details: {
              source: data.source || 'MANUAL',
              projectName: data.projectName,
            },
          },
        },
      },
      include: {
        checklist: { orderBy: { step: 'asc' } },
        activities: true,
      },
    })

    return bid
  }

  // ── Update Bid ─────────────────────────────────────────────────────────────

  async updateBid(id: string, data: Record<string, any>) {
    const existing = await prismaAny.bidOpportunity.findUnique({ where: { id } })
    if (!existing) throw new Error('Bid not found')

    // Track what changed for activity log
    const changes: Record<string, { from: any; to: any }> = {}
    for (const [key, value] of Object.entries(data)) {
      if (existing[key] !== value && value !== undefined) {
        changes[key] = { from: existing[key], to: value }
      }
    }

    // Convert date strings to Date objects
    const updateData = { ...data }
    for (const field of ['dueDate', 'prebidDate', 'awardDate', 'startDate']) {
      if (updateData[field] && typeof updateData[field] === 'string') {
        updateData[field] = new Date(updateData[field])
      }
    }

    const bid = await prismaAny.bidOpportunity.update({
      where: { id },
      data: updateData,
    })

    // Log activity if there were meaningful changes
    if (Object.keys(changes).length > 0) {
      await this.logActivity(id, 'UPDATED', 'system', changes)
    }

    return bid
  }

  // ── Log Activity ───────────────────────────────────────────────────────────

  async logActivity(bidId: string, action: string, actor?: string, details?: any) {
    return prismaAny.bidActivity.create({
      data: {
        bidId,
        action,
        actor: actor || 'system',
        details: details || {},
      },
    })
  }

  // ── Update Checklist Item ──────────────────────────────────────────────────

  async updateChecklistItem(bidId: string, step: number, status: string, notes?: string) {
    const item = await prismaAny.bidChecklistItem.findUnique({
      where: { bidId_step: { bidId, step } },
    })
    if (!item) throw new Error(`Checklist step ${step} not found for this bid`)

    const updateData: any = { status }
    if (notes !== undefined) updateData.notes = notes
    if (status === 'COMPLETE') {
      updateData.completedAt = new Date()
    }

    const updated = await prismaAny.bidChecklistItem.update({
      where: { bidId_step: { bidId, step } },
      data: updateData,
    })

    await this.logActivity(bidId, 'CHECKLIST_UPDATED', 'system', {
      step,
      title: item.title,
      status,
    })

    return updated
  }

  // ── Alerts ─────────────────────────────────────────────────────────────────

  async getAlerts() {
    const now = new Date()
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const activeStatuses = ['NEW', 'REVIEWING', 'PREPARING']

    const [urgent, thisWeek, needsFollowUp, newLeads] = await Promise.all([
      // Due within 3 days
      prismaAny.bidOpportunity.findMany({
        where: {
          status: { in: activeStatuses },
          dueDate: { lte: threeDays, gte: now },
        },
        orderBy: { dueDate: 'asc' },
        select: { id: true, projectName: true, dueDate: true, status: true, priority: true, scope: true },
      }),
      // Due within 7 days
      prismaAny.bidOpportunity.findMany({
        where: {
          status: { in: activeStatuses },
          dueDate: { lte: sevenDays, gte: threeDays },
        },
        orderBy: { dueDate: 'asc' },
        select: { id: true, projectName: true, dueDate: true, status: true, priority: true, scope: true },
      }),
      // Submitted but no update in 14+ days
      prismaAny.bidOpportunity.findMany({
        where: {
          status: 'SUBMITTED',
          updatedAt: { lte: fourteenDaysAgo },
        },
        orderBy: { updatedAt: 'asc' },
        select: { id: true, projectName: true, dueDate: true, status: true, updatedAt: true },
      }),
      // New bids not yet reviewed
      prismaAny.bidOpportunity.findMany({
        where: { status: 'NEW' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, projectName: true, source: true, dueDate: true, createdAt: true },
      }),
    ])

    return {
      urgent: { count: urgent.length, bids: urgent },
      thisWeek: { count: thisWeek.length, bids: thisWeek },
      needsFollowUp: { count: needsFollowUp.length, bids: needsFollowUp },
      newLeads: { count: newLeads.length, bids: newLeads },
      totalAlerts: urgent.length + thisWeek.length + needsFollowUp.length + newLeads.length,
    }
  }

  // ── Evaluate Bid ───────────────────────────────────────────────────────────

  async evaluateBid(id: string) {
    const bid = await prismaAny.bidOpportunity.findUnique({ where: { id } })
    if (!bid) throw new Error('Bid not found')

    // Scope score — Kealee core capabilities
    const kealeeTrades = ['hvac', 'mechanical', 'plumbing', 'general', 'tenant fit-out', 'renovation']
    const scopeLower = (bid.scope || '').toLowerCase()
    const scopeScore = kealeeTrades.some((t) => scopeLower.includes(t)) ? 90 : 50

    // Location score — Maryland-centric
    const stateLower = (bid.state || '').toLowerCase()
    const locationScore = ['md', 'maryland'].includes(stateLower)
      ? 95
      : ['dc', 'va', 'virginia', 'delaware', 'de'].includes(stateLower)
        ? 75
        : 40

    // MBE advantage score
    const mbeScore = bid.requiresMBE || bid.requiresDBE ? 95 : 50

    // Value score — sweet spot $100K–$5M
    const value = Number(bid.estimatedValue) || 0
    let valueScore = 50
    if (value >= 100000 && value <= 5000000) valueScore = 90
    else if (value > 5000000 && value <= 15000000) valueScore = 70
    else if (value > 0 && value < 100000) valueScore = 40
    else if (value > 15000000) valueScore = 30

    // Overall weighted score
    const overallScore = Math.round(
      scopeScore * 0.35 +
      locationScore * 0.25 +
      mbeScore * 0.25 +
      valueScore * 0.15
    )

    const updated = await prismaAny.bidOpportunity.update({
      where: { id },
      data: { scopeScore, locationScore, mbeScore, valueScore, overallScore },
    })

    await this.logActivity(id, 'EVALUATED', 'system', {
      scopeScore,
      locationScore,
      mbeScore,
      valueScore,
      overallScore,
    })

    return {
      bid: updated,
      scores: { scopeScore, locationScore, mbeScore, valueScore, overallScore },
      recommendation: overallScore >= 80 ? 'STRONG_BID' : overallScore >= 60 ? 'CONSIDER' : 'LOW_FIT',
    }
  }

  // ── Generate Proposal ──────────────────────────────────────────────────────

  async generateProposal(id: string) {
    const bid = await prismaAny.bidOpportunity.findUnique({ where: { id } })
    if (!bid) throw new Error('Bid not found')

    const coverLetter = generateCoverLetter(bid)

    await this.logActivity(id, 'PROPOSAL_GENERATED', 'system', {
      type: 'cover_letter',
    })

    return {
      coverLetter,
      companyProfile: COMPANY_PROFILE,
      keyPersonnel: KEY_PERSONNEL,
      projectName: bid.projectName,
      scope: bid.scope,
    }
  }

  // ── Create Sub Request ─────────────────────────────────────────────────────

  async createSubRequest(bidId: string, data: {
    subName: string
    trade: string
    contactName?: string
    contactEmail?: string
    contactPhone?: string
    requestedAmount?: number
    dueDate?: string
    notes?: string
  }) {
    const bid = await prismaAny.bidOpportunity.findUnique({ where: { id: bidId } })
    if (!bid) throw new Error('Bid not found')

    const subRequest = await prismaAny.bidSubRequest.create({
      data: {
        bidId,
        subName: data.subName,
        trade: data.trade,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        requestedAmount: data.requestedAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        status: 'PENDING',
      },
    })

    await this.logActivity(bidId, 'SUB_REQUEST_CREATED', 'system', {
      subName: data.subName,
      trade: data.trade,
    })

    return subRequest
  }

  // ── Scan Commands (for n8n / KeaBot) ───────────────────────────────────────

  getScanCommands() {
    return {
      sources: [
        {
          name: 'BuildingConnected',
          type: 'EMAIL_SCAN',
          trigger: 'New email from @buildingconnected.com',
          fields: ['projectName', 'dueDate', 'gcName', 'scope', 'location'],
        },
        {
          name: 'eMMA',
          type: 'WEB_SCRAPE',
          url: 'https://emma.maryland.gov',
          trigger: 'Daily scan for new HVAC/Mechanical solicitations',
          fields: ['projectName', 'projectNumber', 'dueDate', 'ownerName', 'scope', 'estimatedValue'],
        },
        {
          name: 'OpenGov',
          type: 'WEB_SCRAPE',
          url: 'https://procurement.opengov.com',
          trigger: 'Daily scan for Maryland construction bids',
          fields: ['projectName', 'dueDate', 'ownerName', 'scope', 'location'],
        },
        {
          name: 'SHA/MDOT',
          type: 'WEB_SCRAPE',
          url: 'https://www.roads.maryland.gov',
          trigger: 'Weekly scan for mechanical/HVAC-related DOT projects',
          fields: ['projectName', 'projectNumber', 'dueDate', 'location', 'estimatedValue'],
        },
      ],
      apiEndpoint: '/bids',
      createMethod: 'POST',
      requiredFields: ['projectName', 'source'],
    }
  }
}

export const bidService = new BidService()
