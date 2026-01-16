const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

export type ProjectCategory =
  | 'KITCHEN'
  | 'BATHROOM'
  | 'ADDITION'
  | 'NEW_CONSTRUCTION'
  | 'RENOVATION'
  | 'OTHER'

export type ProjectMemberRole = 'OWNER' | 'CONTRACTOR' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER'

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  category: ProjectCategory
  propertyId: string | null
}

export type PropertySummary = {
  id: string
  address: string
  address2?: string | null
  city: string
  state: string
  zip: string
}

export type ReadinessItem = {
  id: string
  title: string
  description: string | null
  required: boolean
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED'
  type: 'DOCUMENT_UPLOAD' | 'QUESTION_ANSWER' | 'DATE_CONFIRMATION' | 'EXTERNAL_VERIFICATION' | 'CUSTOM'
  dueDate: string | null
  evidence?: Array<{ id: string; url: string; fileName: string | null }>
}

export type ContractTemplate = {
  id: string
  name: string
  version: number
  body: string
  variables: Array<{ key: string; label: string; description?: string }> | null
}

export type Milestone = {
  id: string
  name: string
  description: string | null
  amount: number
  status: 'PENDING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID' | 'REJECTED'
}

export type Contract = {
  id: string
  projectId: string
  templateId: string | null
  contractorId: string | null
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'CANCELLED' | 'ARCHIVED'
  terms: string | null
  totalAmount: number | null
  milestones?: Milestone[]
  template?: ContractTemplate
}

export type CreateProjectInput = {
  orgId?: string
  name: string
  description?: string
  category: ProjectCategory
  categoryMetadata?: Record<string, unknown>
}

export type UpdateProjectInput = Partial<{
  orgId: string | null
  name: string
  description: string | null
  category: ProjectCategory
  categoryMetadata: Record<string, unknown> | null
  propertyId: string | null
  budgetTotal: number | null
  startDate: string | null
  endDate: string | null
  status: 'DRAFT' | 'READINESS' | 'CONTRACTING' | 'ACTIVE' | 'CLOSEOUT' | 'COMPLETED' | 'CANCELLED'
}>

export type CreatePropertyInput = {
  orgId?: string | null
  address: string
  address2?: string | null
  city: string
  state: string
  zip: string
  country?: string
  latitude?: number | null
  longitude?: number | null
  lotNumber?: string | null
  parcelNumber?: string | null
  lotSizeSqFt?: number | null
  yearBuilt?: number | null
}

async function getAuthToken(): Promise<string | null> {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find((c) => c.trim().startsWith('sb-access-token='))
  return tokenCookie ? tokenCookie.split('=')[1] : null
}

export async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Projects
  createProject: (data: CreateProjectInput) =>
    apiRequest<{ project: ProjectSummary }>('/projects', { method: 'POST', body: data }),
  updateProject: (id: string, data: UpdateProjectInput) =>
    apiRequest<{ project: ProjectSummary }>(`/projects/${id}`, { method: 'PATCH', body: data }),
  getProject: (id: string) => apiRequest<{ project: Record<string, unknown> }>(`/projects/${id}`),
  listMyProjects: () => apiRequest<{ projects: ProjectSummary[] }>('/projects'),
  addProjectMember: (id: string, data: { userId: string; role: ProjectMemberRole }) =>
    apiRequest<{ member: Record<string, unknown> }>(`/projects/${id}/members`, { method: 'POST', body: data }),

  // Properties
  createProperty: (data: CreatePropertyInput) =>
    apiRequest<{ property: PropertySummary; created: boolean }>('/properties', { method: 'POST', body: data }),
  searchProperties: (q: string, orgId?: string, limit?: number) => {
    const params = new URLSearchParams({ q })
    if (orgId) params.set('orgId', orgId)
    if (limit) params.set('limit', String(limit))
    return apiRequest<{ properties: PropertySummary[] }>(`/properties/search?${params.toString()}`)
  },
  validateAddress: (data: { address: string; city: string; state: string; zip: string }) => {
    const params = new URLSearchParams(data)
    return apiRequest<{ propertyId: string | null; existingProjects: number }>(
      `/properties/validate-address?${params.toString()}`
    )
  },

  // Readiness
  generateReadiness: (projectId: string) =>
    apiRequest<{ items: ReadinessItem[] }>(`/readiness/projects/${projectId}/generate`, { method: 'POST' }),
  listReadiness: (projectId: string) =>
    apiRequest<{ items: ReadinessItem[] }>(`/readiness/projects/${projectId}/items`),
  getReadinessCompletion: (projectId: string) =>
    apiRequest<{
      completion: {
        total: number
        required: number
        completed: number
        requiredCompleted: number
        percentage: number
        requiredPercentage: number
        allRequiredComplete: boolean
      }
    }>(`/readiness/projects/${projectId}/completion`),
  updateReadinessItem: (itemId: string, data: { status?: string; response?: unknown }) =>
    apiRequest<{ item: ReadinessItem }>(`/readiness/items/${itemId}`, { method: 'PATCH', body: data }),
  bulkCompleteReadinessItems: (projectId: string, itemIds: string[], reason?: string) =>
    apiRequest<{ items: ReadinessItem[] }>(`/readiness/projects/${projectId}/bulk-complete`, {
      method: 'POST',
      body: { itemIds, reason },
    }),

  // Contract templates (Prompt 2.1)
  getContractTemplates: (params?: { orgId?: string; activeOnly?: boolean }) => {
    const query = new URLSearchParams()
    if (params?.orgId) query.append('orgId', params.orgId)
    if (params?.activeOnly !== undefined) query.append('activeOnly', String(params.activeOnly))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{ templates: ContractTemplate[] }>(`/contracts/templates${suffix}`)
  },
  previewContractTemplate: (templateId: string, projectId?: string, variables?: Record<string, string>) =>
    apiRequest<{
      preview: {
        preview: string
        variables: Record<string, string>
        availableVariables: Array<{ key: string; label: string; description?: string }>
      }
    }>(`/contracts/templates/${templateId}/preview`, { method: 'POST', body: { projectId, variables } }),

  // Contracts (Prompt 2.2)
  createContract: (data: {
    projectId: string
    templateId?: string | null
    contractorId?: string | null
    terms?: string | null
    milestones?: Array<{ name: string; description?: string | null; amount: number }>
  }) => apiRequest<{ contract: Contract }>(`/contracts`, { method: 'POST', body: data }),
  getContract: (id: string) => apiRequest<{ contract: Contract }>(`/contracts/${id}`),
  listProjectContracts: (projectId: string) => apiRequest<{ contracts: Contract[] }>(`/contracts/projects/${projectId}`),
  updateContract: (id: string, data: { contractorId?: string | null; terms?: string | null; status?: string }) =>
    apiRequest<{ contract: Contract }>(`/contracts/${id}`, { method: 'PATCH', body: data }),
  addMilestone: (contractId: string, data: { name: string; description?: string | null; amount: number }) =>
    apiRequest<{ milestone: Milestone }>(`/contracts/${contractId}/milestones`, { method: 'POST', body: data }),
  updateMilestone: (milestoneId: string, data: { name?: string; description?: string | null; amount?: number }) =>
    apiRequest<{ milestone: Milestone }>(`/contracts/milestones/${milestoneId}`, { method: 'PATCH', body: data }),
  deleteMilestone: (milestoneId: string) =>
    apiRequest<{ success: boolean }>(`/contracts/milestones/${milestoneId}`, { method: 'DELETE' }),

  // Marketplace / Contractors (Prompt 2.3)
  searchContractors: (params?: {
    specialty?: string
    search?: string
    verifiedOnly?: boolean
    minRating?: number
    limit?: number
    offset?: number
  }) => {
    const query = new URLSearchParams()
    if (params?.specialty) query.append('specialty', params.specialty)
    if (params?.search) query.append('search', params.search)
    if (params?.verifiedOnly !== undefined) query.append('verifiedOnly', String(params.verifiedOnly))
    if (params?.minRating !== undefined) query.append('minRating', String(params.minRating))
    if (params?.limit !== undefined) query.append('limit', String(params.limit))
    if (params?.offset !== undefined) query.append('offset', String(params.offset))
    const suffix = query.toString() ? `?${query.toString()}` : ''
    return apiRequest<{
      profiles: Array<{
        id: string
        userId: string
        businessName: string
        user: { id: string; name: string; email: string; phone: string | null; avatar: string | null }
        rating: number | null
        reviewCount: number
        projectsCompleted: number
        performanceScore: number | null
        verified: boolean
        specialties: string[]
      }>
      total: number
      limit: number
      offset: number
    }>(`/marketplace/contractors${suffix}`)
  },
  getContractorProfile: (profileId: string) =>
    apiRequest<{
      profile: {
        id: string
        userId: string
        businessName: string
        user: { id: string; name: string; email: string; phone: string | null; avatar: string | null }
        rating: number | null
        reviewCount: number
        projectsCompleted: number
        performanceScore: number | null
        verified: boolean
        specialties: string[]
        availableCapacity: string
        activeContractsCount: number
      }
    }>(`/marketplace/contractors/${profileId}`),
  sendContractorInvitation: (contractorId: string, projectId: string) =>
    apiRequest<{
      success: boolean
      message: string
      contractor: { id: string; userId: string; businessName: string; email: string }
    }>(`/marketplace/contractors/${contractorId}/invite?projectId=${projectId}`, { method: 'POST' }),

  // DocuSign (Prompt 2.4)
  sendContractForSignature: (contractId: string) =>
    apiRequest<{ envelopeId: string; recipientViewUrl?: string }>(`/docusign/contracts/${contractId}/send-for-signature`, {
      method: 'POST',
    }),
  getContractSignatureStatus: (contractId: string) =>
    apiRequest<{
      status?: {
        status: string
        statusChangedDateTime?: string
        completedDateTime?: string
        recipients?: {
          signers?: Array<{ name: string; email: string; status?: string }>
        }
      }
      message?: string
    }>(`/docusign/contracts/${contractId}/signature-status`),
  downloadSignedContract: (contractId: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/docusign/contracts/${contractId}/signed-document`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to download document')
      return res.blob()
    }),

  // Contracts Dashboard (Prompt 2.5 & 2.6)
  getContractsDashboard: () => apiRequest<{ contracts: Contract[] }>(`/contracts/dashboard`),
  getPendingSignatures: () => apiRequest<{ pending: Array<{ id: string; projectName: string; daysPending: number }> }>(`/contracts/pending-signatures`),
  getContractAuditTrail: (contractId: string) =>
    apiRequest<{
      auditLogs: Array<{ id: string; action: string; details: unknown; user: { id: string; name: string }; createdAt: string }>
      events: Array<{ id: string; type: string; metadata: unknown; createdAt: string }>
    }>(`/contracts/${contractId}/audit-trail`),
  cancelContract: (contractId: string, reason: string) =>
    apiRequest<{ contract: Contract }>(`/contracts/${contractId}/cancel`, { method: 'POST', body: { reason } }),
  archiveContract: (contractId: string) =>
    apiRequest<{ contract: Contract }>(`/contracts/${contractId}/archive`, { method: 'POST' }),

  // Contract Compliance (Prompt 2.7)
  validateContractCompliance: (contractId: string) =>
    apiRequest<{
      isValid: boolean
      errors: string[]
      warnings: string[]
      requiredDisclosures: string[]
      suggestedLanguage: string
      complianceInfo: {
        state: string
        requiredDisclosures: string[]
        statutoryLanguage: string
        minContractAmount?: number
        maxContractAmount?: number
        requiresWitness: boolean
        requiredSigners: string[]
        retentionYears: number
      }
    }>(`/contracts/${contractId}/compliance`),
  getStateCompliance: (state: string) =>
    apiRequest<{
      compliance: {
        state: string
        requiredDisclosures: string[]
        statutoryLanguage: string
        minContractAmount?: number
        maxContractAmount?: number
        requiresWitness: boolean
        requiredSigners: string[]
        retentionYears: number
      }
    }>(`/contracts/compliance/state/${state}`),
  addStatutoryLanguage: (contractId: string, autoAppend?: boolean) =>
    apiRequest<{ terms: string }>(
      `/contracts/${contractId}/add-statutory-language${autoAppend ? '?autoAppend=true' : ''}`,
      { method: 'POST' }
    ),
  checkDocumentRetention: (contractId: string) =>
    apiRequest<{ retentionYears: number; expiresAt: string | null; shouldRetain: boolean }>(
      `/contracts/${contractId}/retention`
    ),

  // Contract Security Testing (Prompt 2.8)
  testDocumentAccess: (contractId: string) =>
    apiRequest<{
      hasAccess: boolean
      reason: string
      isOwner: boolean
      isContractor: boolean
    }>(`/contracts/${contractId}/security/access`),
  testSignatureFraudPrevention: (contractId: string) =>
    apiRequest<{
      isValid: boolean
      checks: Array<{ name: string; passed: boolean; reason: string }>
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    }>(`/contracts/${contractId}/security/signature`),
  testAuditLogCompleteness: (contractId: string) =>
    apiRequest<{
      isComplete: boolean
      missingActions: string[]
      totalLogs: number
      criticalActions: Array<{ action: string; logged: boolean; timestamp?: string }>
    }>(`/contracts/${contractId}/security/audit`),
  testDataEncryption: (contractId: string) =>
    apiRequest<{
      encryptionAtRest: boolean
      encryptionInTransit: boolean
      recommendations: string[]
    }>(`/contracts/${contractId}/security/encryption`),
  testGDPRCompliance: (contractId: string) =>
    apiRequest<{
      isCompliant: boolean
      gdprChecks: Array<{ requirement: string; compliant: boolean; details: string }>
      recommendations: string[]
    }>(`/contracts/${contractId}/security/gdpr`),

  // Milestones (Prompt 3.1)
  getContractMilestones: (contractId: string) =>
    apiRequest<{
      milestones: Milestone[]
      statistics: {
        total: number
        completed: number
        submitted: number
        underReview: number
        pending: number
        totalAmount: number
        paidAmount: number
        progressPercentage: number
        paymentProgress: number
        upcomingMilestones: Array<{ id: string; name: string; dueDate: string; daysUntilDue: number | null }>
      }
    }>(`/milestones/contracts/${contractId}/milestones`),
  getMilestone: (milestoneId: string) =>
    apiRequest<{
      milestone: Milestone & {
        evidence: Array<{
          id: string
          type: string
          url: string
          fileName: string | null
          caption: string | null
          createdAt: string
          createdBy?: { id: string; name: string; email: string } | null
        }>
      }
    }>(`/milestones/${milestoneId}`),
  submitMilestone: (milestoneId: string, evidence: Array<{ type: string; fileUrl?: string; url?: string; caption?: string }>) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/submit`, {
      method: 'POST',
      body: { evidence },
    }),
  approveMilestone: (milestoneId: string, notes?: string) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/approve`, {
      method: 'POST',
      body: { notes },
    }),
  rejectMilestone: (milestoneId: string, reason: string) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  // Milestone Review (Prompt 3.3)
  getMilestoneRequirements: (milestoneId: string) =>
    apiRequest<{
      requirements: {
        requiredEvidenceTypes: string[]
        description: string | null
        dependencies: Array<{ id: string; name: string; status: string }>
      }
    }>(`/milestones/${milestoneId}/requirements`),
  getMilestoneComments: (milestoneId: string) =>
    apiRequest<{
      comments: Array<{
        id: string
        milestoneId: string
        evidenceId?: string | null
        comment: string
        mentions?: string[]
        createdBy: { id: string; name: string; email: string }
        createdAt: string
        resolved: boolean
      }>
    }>(`/milestones/${milestoneId}/comments`),
  addMilestoneComment: (milestoneId: string, data: { comment: string; evidenceId?: string | null; mentions?: string[] }) =>
    apiRequest<{
      comment: {
        id: string
        milestoneId: string
        evidenceId?: string | null
        comment: string
        mentions?: string[]
        createdBy: { id: string; name: string; email: string }
        createdAt: string
        resolved: boolean
      }
    }>(`/milestones/${milestoneId}/comments`, {
      method: 'POST',
      body: data,
    }),
  getMilestoneVersionHistory: (milestoneId: string) =>
    apiRequest<{
      versions: Array<{
        version: number
        status: string
        submittedAt: string | null
        evidenceCount: number
        commentsCount: number
        rejectedReason?: string | null
      }>
    }>(`/milestones/${milestoneId}/versions`),
  approveMilestoneWithReason: (milestoneId: string, reason: string, notes?: string) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/approve`, {
      method: 'POST',
      body: { reason, notes },
    }),
  rejectMilestoneWithReason: (milestoneId: string, reason: string) =>
    apiRequest<{ milestone: Milestone }>(`/milestones/${milestoneId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  // Payments (Prompt 3.4)
  getEscrowAgreement: (projectId: string) =>
    apiRequest<{
      escrow: {
        id: string
        projectId: string
        contractId: string | null
        currentBalance: number
        status: string
        holdbackPercentage: number
        createdAt: string
        updatedAt: string
        transactions?: Array<{
          id: string
          type: string
          amount: number
          status: string
          createdAt: string
        }>
      }
    }>(`/payments/projects/${projectId}/escrow`),
  canReleasePayment: (milestoneId: string) =>
    apiRequest<{
      canRelease: boolean
      reasons: string[]
    }>(`/payments/milestones/${milestoneId}/can-release`),
  releasePayment: (milestoneId: string, options?: { skipHoldback?: boolean; notes?: string }) =>
    apiRequest<{
      success: boolean
      transaction: {
        id: string
        amount: number
        status: string
      }
      releaseAmount: number
      holdbackAmount: number
      balanceAfter: number
    }>(`/payments/milestones/${milestoneId}/release-payment`, {
      method: 'POST',
      body: options || {},
    }),
  getPaymentHistory: (projectId: string) =>
    apiRequest<{
      transactions: Array<{
        id: string
        type: string
        amount: number
        status: string
        createdAt: string
        milestone?: {
          id: string
          name: string
          amount: number
        }
      }>
      escrow: {
        id: string
        currentBalance: number
        status: string
      } | null
    }>(`/payments/projects/${projectId}/payments`),

  // Disputes (Prompt 3.5)
  initiateDispute: (data: {
    projectId: string
    milestoneId?: string
    reason: string
    description: string
    evidenceIds?: string[]
    priority?: 'low' | 'normal' | 'high' | 'urgent'
  }) =>
    apiRequest<{
      dispute: {
        id: string
        projectId: string
        milestoneId: string | null
        reason: string
        description: string
        status: string
        priority: string
        createdAt: string
      }
    }>(`/disputes`, {
      method: 'POST',
      body: data,
    }),
  getDispute: (disputeId: string) =>
    apiRequest<{
      dispute: {
        id: string
        projectId: string
        milestoneId: string | null
        reason: string
        description: string
        status: string
        resolution: string | null
        resolutionNotes: string | null
        mediationRequested: boolean
        evidence: Array<{
          id: string
          url: string | null
          fileName: string | null
          description: string | null
        }>
        comments: Array<{
          id: string
          comment: string
          createdBy: string
          createdAt: string
          isInternal: boolean
        }>
        initiator: { id: string; name: string; email: string }
      }
    }>(`/disputes/${disputeId}`),
  listProjectDisputes: (projectId: string) =>
    apiRequest<{
      disputes: Array<{
        id: string
        reason: string
        status: string
        priority: string
        createdAt: string
        milestone?: { id: string; name: string }
      }>
    }>(`/disputes/projects/${projectId}`),
  requestMediation: (disputeId: string, notes?: string) =>
    apiRequest<{
      dispute: {
        id: string
        status: string
        mediationRequested: boolean
      }
    }>(`/disputes/${disputeId}/mediation`, {
      method: 'POST',
      body: { notes },
    }),
  addDisputeComment: (disputeId: string, comment: string, isInternal?: boolean) =>
    apiRequest<{
      comment: {
        id: string
        comment: string
        createdAt: string
      }
    }>(`/disputes/${disputeId}/comments`, {
      method: 'POST',
      body: { comment, isInternal },
    }),
  resolveDispute: (disputeId: string, data: {
    resolution: 'OWNER_WINS' | 'CONTRACTOR_WINS' | 'PARTIAL_OWNER' | 'PARTIAL_CONTRACTOR' | 'MEDIATED_SETTLEMENT' | 'WITHDRAWN'
    resolutionNotes: string
    mediatorId?: string
  }) =>
    apiRequest<{
      dispute: {
        id: string
        status: string
        resolution: string
      }
    }>(`/disputes/${disputeId}/resolve`, {
      method: 'POST',
      body: data,
    }),
  addDisputeEvidence: (disputeId: string, data: {
    evidenceId?: string
    url?: string
    fileName?: string
    description?: string
  }) =>
    apiRequest<{
      evidence: {
        id: string
        url: string | null
        fileName: string | null
      }
    }>(`/disputes/${disputeId}/evidence`, {
      method: 'POST',
      body: data,
    }),

  // Permit Compliance (Prompt 3.6)
  checkPermitCompliance: (projectId: string, milestoneId?: string) =>
    apiRequest<{
      compliant: boolean
      reasons: string[]
      permits: Array<{
        id: string
        permitNumber: string
        status: string
        expiresAt: string | null
        type: string
        description: string
      }>
      expiredPermits: Array<{
        id: string
        permitNumber: string
        status: string
        expiresAt: string | null
      }>
      invalidPermits: Array<{
        id: string
        permitNumber: string
        status: string
      }>
    }>(`/permits/projects/${projectId}/compliance${milestoneId ? `?milestoneId=${milestoneId}` : ''}`),
  getPermitStatusSummary: (projectId: string) =>
    apiRequest<{
      totalPermits: number
      activePermits: number
      expiredPermits: number
      invalidPermits: number
      permits: Array<{
        id: string
        permitNumber: string
        type: string
        status: string
        expiresAt: string | null
        isExpired: boolean
        isValid: boolean
      }>
    }>(`/permits/projects/${projectId}/status`),

  // Closeout (Prompt 3.7)
  getCloseoutChecklist: (projectId: string) =>
    apiRequest<{
      checklist: {
        id: string
        projectId: string
        status: string
        completedAt: string | null
        items: Array<{
          id: string
          type: string
          title: string
          description: string | null
          required: boolean
          status: string
          order: number
          completedAt: string | null
          notes: string | null
          attachments: Array<{
            id: string
            url: string
            fileName: string | null
            description: string | null
          }>
          completedByUser?: { id: string; name: string; email: string } | null
        }>
      }
    }>(`/closeout/projects/${projectId}/checklist`),
  updateCloseoutItem: (itemId: string, data: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED'
    notes?: string
    completed?: boolean
  }) =>
    apiRequest<{
      item: {
        id: string
        status: string
        notes: string | null
        completedAt: string | null
      }
    }>(`/closeout/items/${itemId}`, {
      method: 'PATCH',
      body: data,
    }),
  addCloseoutAttachment: (itemId: string, data: {
    url: string
    fileName?: string
    mimeType?: string
    sizeBytes?: number
    description?: string
  }) =>
    apiRequest<{
      attachment: {
        id: string
        url: string
        fileName: string | null
      }
    }>(`/closeout/items/${itemId}/attachments`, {
      method: 'POST',
      body: data,
    }),
  completeCloseout: (projectId: string) =>
    apiRequest<{
      checklist: {
        id: string
        status: string
      }
      project: {
        id: string
        status: string
      }
    }>(`/closeout/projects/${projectId}/complete`, {
      method: 'POST',
    }),
  getPunchListItems: (projectId: string) =>
    apiRequest<{
      items: Array<{
        id: string
        title: string
        description: string | null
        category: string | null
        priority: string
        status: string
        location: string | null
        dueDate: string | null
        completedAt: string | null
        completionNotes: string | null
        photos: string[]
      }>
    }>(`/closeout/projects/${projectId}/punch-list`),
  createPunchListItem: (projectId: string, data: {
    title: string
    description?: string
    category?: string
    priority?: 'low' | 'normal' | 'high' | 'critical'
    location?: string
    dueDate?: string
    checklistItemId?: string
  }) =>
    apiRequest<{
      item: {
        id: string
        title: string
        status: string
      }
    }>(`/closeout/projects/${projectId}/punch-list`, {
      method: 'POST',
      body: data,
    }),
  updatePunchListItem: (itemId: string, data: {
    status?: 'open' | 'in_progress' | 'completed' | 'cancelled'
    completionNotes?: string
    photos?: string[]
    assignedTo?: string
  }) =>
    apiRequest<{
      item: {
        id: string
        status: string
        completedAt: string | null
      }
    }>(`/closeout/punch-list/${itemId}`, {
      method: 'PATCH',
      body: data,
    }),

  // Handoff (Prompt 3.8)
  generateHandoffPackage: (projectId: string) =>
    apiRequest<{
      package: {
        id: string
        projectId: string
        status: string
        version: number
        generatedAt: string | null
        documentBundles: Array<{
          id: string
          type: string
          title: string
          description: string | null
          fileCount: number
          documents: Array<{
            id: string
            documentType: string
            title: string
            url: string
            fileName: string | null
          }>
        }>
      }
    }>(`/handoff/projects/${projectId}/generate`, {
      method: 'POST',
    }),
  getHandoffPackage: (projectId: string) =>
    apiRequest<{
      package: {
        id: string
        projectId: string
        status: string
        version: number
        generatedAt: string | null
        deliveredAt: string | null
        downloadedAt: string | null
        downloadCount: number
        downloadUrl: string | null
        documentBundles: Array<{
          id: string
          type: string
          title: string
          description: string | null
          fileCount: number
          documents: Array<{
            id: string
            documentType: string
            title: string
            url: string
            fileName: string | null
            mimeType: string | null
            sizeBytes: number | null
          }>
        }>
        satisfactionSurvey?: {
          id: string
          status: string
          overallRating: number | null
          completedAt: string | null
        } | null
      }
    }>(`/handoff/projects/${projectId}`),
  deliverHandoffPackage: (projectId: string) =>
    apiRequest<{
      package: {
        id: string
        status: string
        deliveredAt: string | null
      }
    }>(`/handoff/projects/${projectId}/deliver`, {
      method: 'POST',
    }),
  recordHandoffDownload: (projectId: string) =>
    apiRequest<{
      package: {
        id: string
        status: string
        downloadedAt: string | null
        downloadCount: number
      }
    }>(`/handoff/projects/${projectId}/download`, {
      method: 'POST',
    }),
  getSatisfactionSurvey: (packageId: string) =>
    apiRequest<{
      survey: {
        id: string
        packageId: string
        status: string
        overallRating: number | null
        communicationRating: number | null
        qualityRating: number | null
        timelinessRating: number | null
        valueRating: number | null
        whatWentWell: string | null
        whatCouldImprove: string | null
        additionalComments: string | null
        wouldRecommend: boolean | null
        completedAt: string | null
      }
    }>(`/handoff/packages/${packageId}/survey`),
  startSatisfactionSurvey: (packageId: string) =>
    apiRequest<{
      survey: {
        id: string
        status: string
        startedAt: string | null
      }
    }>(`/handoff/packages/${packageId}/survey/start`, {
      method: 'POST',
    }),
  submitSatisfactionSurvey: (packageId: string, data: {
    overallRating: number
    communicationRating?: number
    qualityRating?: number
    timelinessRating?: number
    valueRating?: number
    whatWentWell?: string
    whatCouldImprove?: string
    additionalComments?: string
    wouldRecommend?: boolean
    recommendationReason?: string
  }) =>
    apiRequest<{
      survey: {
        id: string
        status: string
        completedAt: string | null
      }
    }>(`/handoff/packages/${packageId}/survey/submit`, {
      method: 'POST',
      body: data,
    }),
}

