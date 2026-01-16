const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
}

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  
  // Try to get token from Supabase session or cookie
  const cookies = document.cookie.split(';')
  const tokenCookie = cookies.find(c => c.trim().startsWith('sb-access-token='))
  return tokenCookie ? tokenCookie.split('=')[1] : null
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const token = await getAuthToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

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

export type DesignProjectType = 'RESIDENTIAL' | 'COMMERCIAL' | 'INSTITUTIONAL' | 'MIXED_USE'
export type DesignPhase = 'PRE_DESIGN' | 'SCHEMATIC_DESIGN' | 'DESIGN_DEVELOPMENT' | 'CONSTRUCTION_DOCUMENTS'
export type DesignTeamRole = 'PRINCIPAL' | 'PROJECT_ARCHITECT' | 'DESIGNER' | 'DRAFTER'
export type DesignProjectStatus = 'DRAFT' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'

export type ProjectSummary = {
  id: string
  name: string
  description: string | null
  category: string
  owner: {
    id: string
    name: string
    email: string
  }
  org: {
    id: string
    name: string
  } | null
}

export type DesignProject = {
  id: string
  projectId: string
  name: string
  description: string | null
  projectType: DesignProjectType
  status: DesignProjectStatus
  budgetTotal: string | null
  startDate: string | null
  endDate: string | null
  clientAccessEnabled: boolean
  clientAccessUrl: string | null
  project: ProjectSummary
  phases: Array<{
    id: string
    phase: DesignPhase
    name: string
    description: string | null
    status: string
    plannedStartDate: string | null
    plannedEndDate: string | null
    actualStartDate: string | null
    actualEndDate: string | null
    requiresApproval: boolean
    approvedAt: string | null
  }>
  teamMembers: Array<{
    id: string
    userId: string
    role: DesignTeamRole
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export const api = {
  // Get available Project Owner projects
  getAvailableProjects: () => apiRequest<{ projects: ProjectSummary[] }>('/architect/design-projects/available-projects'),

  // Create design project
  createDesignProject: (data: {
    projectId: string
    name: string
    description?: string
    projectType: DesignProjectType
  }) => apiRequest<{ designProject: DesignProject }>('/architect/design-projects', {
    method: 'POST',
    body: data,
  }),

  // List design projects
  listDesignProjects: (filters?: { projectType?: string; status?: string }) => {
    const params = new URLSearchParams()
    if (filters?.projectType) params.append('projectType', filters.projectType)
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiRequest<{ designProjects: DesignProject[] }>(`/architect/design-projects${query ? `?${query}` : ''}`)
  },

  // Get design project
  getDesignProject: (id: string) => apiRequest<{ designProject: DesignProject }>(`/architect/design-projects/${id}`),

  // Update design project
  updateDesignProject: (id: string, data: {
    name?: string
    description?: string
    projectType?: DesignProjectType
    status?: DesignProjectStatus
    clientAccessEnabled?: boolean
  }) => apiRequest<{ designProject: DesignProject }>(`/architect/design-projects/${id}`, {
    method: 'PATCH',
    body: data,
  }),

  // Add team member
  addTeamMember: (designProjectId: string, data: {
    userId: string
    role: DesignTeamRole
  }) => apiRequest<{ teamMember: any }>(`/architect/design-projects/${designProjectId}/team-members`, {
    method: 'POST',
    body: data,
  }),

  // Phase management
  startPhase: (phaseId: string) => apiRequest<{ phase: any }>(`/architect/phases/${phaseId}/start`, {
    method: 'POST',
  }),

  approvePhase: (phaseId: string, notes?: string) => apiRequest<{ phase: any }>(`/architect/phases/${phaseId}/approve`, {
    method: 'POST',
    body: { notes },
  }),

  completePhase: (phaseId: string, data: {
    completionNotes?: string
    signOffDocumentUrl?: string
  }) => apiRequest<{ phase: any }>(`/architect/phases/${phaseId}/complete`, {
    method: 'POST',
    body: data,
  }),

  updatePhaseDeliverables: (phaseId: string, deliverables: Array<{
    id: string
    name: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
    completedAt?: string
  }>) => apiRequest<{ phase: any }>(`/architect/phases/${phaseId}/deliverables`, {
    method: 'PATCH',
    body: { deliverables },
  }),

  updatePhaseTimeline: (phaseId: string, data: {
    plannedStartDate?: string
    plannedEndDate?: string
    estimatedDurationDays?: number
  }) => apiRequest<{ phase: any }>(`/architect/phases/${phaseId}/timeline`, {
    method: 'PATCH',
    body: data,
  }),

  getPhaseTimeline: (projectId: string) => apiRequest<{ timeline: any[] }>(`/architect/design-projects/${projectId}/phases/timeline`),

  checkPhaseDelays: (projectId: string) => apiRequest<{ delays: any[] }>(`/architect/design-projects/${projectId}/phases/delays`),

  // File management
  initializeAIAFolders: (projectId: string) => apiRequest<{ folders: any[] }>(`/architect/design-projects/${projectId}/files/initialize-folders`, {
    method: 'POST',
  }),

  createFolder: (projectId: string, data: {
    name: string
    parentFolderId?: string
    folderType?: string
  }) => apiRequest<{ folder: any }>(`/architect/design-projects/${projectId}/folders`, {
    method: 'POST',
    body: data,
  }),

  listFolders: (projectId: string, parentFolderId?: string) => {
    const params = new URLSearchParams()
    if (parentFolderId) params.append('parentFolderId', parentFolderId)
    const query = params.toString()
    return apiRequest<{ folders: any[] }>(`/architect/design-projects/${projectId}/folders${query ? `?${query}` : ''}`)
  },

  uploadFile: (projectId: string, data: {
    folderId?: string
    fileName: string
    fileSize: number
    mimeType?: string
    fileUrl: string
    thumbnailUrl?: string
    description?: string
    tags?: string[]
  }) => apiRequest<{ file: any }>(`/architect/design-projects/${projectId}/files`, {
    method: 'POST',
    body: data,
  }),

  bulkUploadFiles: (projectId: string, data: {
    folderId?: string
    files: Array<{
      fileName: string
      fileSize: number
      mimeType?: string
      fileUrl: string
      thumbnailUrl?: string
    }>
  }) => apiRequest<{ files: any[] }>(`/architect/design-projects/${projectId}/files/bulk`, {
    method: 'POST',
    body: data,
  }),

  listFiles: (projectId: string, folderId?: string) => {
    const params = new URLSearchParams()
    if (folderId) params.append('folderId', folderId)
    const query = params.toString()
    return apiRequest<{ files: any[] }>(`/architect/design-projects/${projectId}/files${query ? `?${query}` : ''}`)
  },

  getFile: (fileId: string) => apiRequest<{ file: any }>(`/architect/files/${fileId}`),

  checkOutFile: (fileId: string, comment?: string) => apiRequest<{ file: any }>(`/architect/files/${fileId}/check-out`, {
    method: 'POST',
    body: { comment },
  }),

  checkInFile: (fileId: string, newFileUrl?: string) => apiRequest<{ file: any }>(`/architect/files/${fileId}/check-in`, {
    method: 'POST',
    body: { newFileUrl },
  }),

  lockFile: (fileId: string, reason?: string) => apiRequest<{ file: any }>(`/architect/files/${fileId}/lock`, {
    method: 'POST',
    body: { reason },
  }),

  unlockFile: (fileId: string) => apiRequest<{ file: any }>(`/architect/files/${fileId}/unlock`, {
    method: 'POST',
  }),

  // Deliverable management
  createDeliverable: (projectId: string, data: {
    phaseId?: string
    name: string
    description?: string
    deliverableType: string
    dueDate?: string
    dependsOnId?: string
    milestoneId?: string
    associatedFileIds?: string[]
  }) => apiRequest<{ deliverable: any }>(`/architect/design-projects/${projectId}/deliverables`, {
    method: 'POST',
    body: data,
  }),

  listDeliverables: (projectId: string, filters?: {
    phaseId?: string
    status?: string
    deliverableType?: string
    packageId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.phaseId) params.append('phaseId', filters.phaseId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.deliverableType) params.append('deliverableType', filters.deliverableType)
    if (filters?.packageId) params.append('packageId', filters.packageId)
    const query = params.toString()
    return apiRequest<{ deliverables: any[] }>(`/architect/design-projects/${projectId}/deliverables${query ? `?${query}` : ''}`)
  },

  getDeliverable: (deliverableId: string) => apiRequest<{ deliverable: any }>(`/architect/deliverables/${deliverableId}`),

  updateDeliverable: (deliverableId: string, data: {
    name?: string
    description?: string
    deliverableType?: string
    status?: string
    dueDate?: string
    dependsOnId?: string
    milestoneId?: string
    associatedFileIds?: string[]
  }) => apiRequest<{ deliverable: any }>(`/architect/deliverables/${deliverableId}`, {
    method: 'PATCH',
    body: data,
  }),

  approveDeliverable: (deliverableId: string, approvalNotes?: string) => apiRequest<{ deliverable: any }>(`/architect/deliverables/${deliverableId}/approve`, {
    method: 'POST',
    body: { approvalNotes },
  }),

  issueDeliverable: (deliverableId: string, issuedTo?: string) => apiRequest<{ deliverable: any }>(`/architect/deliverables/${deliverableId}/issue`, {
    method: 'POST',
    body: { issuedTo },
  }),

  getOverdueDeliverables: (projectId: string) => apiRequest<{ deliverables: any[] }>(`/architect/design-projects/${projectId}/deliverables/overdue`),

  getDeliverablesDueSoon: (projectId: string, days?: number) => {
    const params = new URLSearchParams()
    if (days) params.append('days', days.toString())
    const query = params.toString()
    return apiRequest<{ deliverables: any[] }>(`/architect/design-projects/${projectId}/deliverables/due-soon${query ? `?${query}` : ''}`)
  },

  createPackage: (projectId: string, data: {
    name: string
    description?: string
    submissionDate?: string
    submittedTo?: string
    submissionMethod?: string
    deliverableIds: string[]
  }) => apiRequest<{ package: any }>(`/architect/design-projects/${projectId}/packages`, {
    method: 'POST',
    body: data,
  }),

  listPackages: (projectId: string) => apiRequest<{ packages: any[] }>(`/architect/design-projects/${projectId}/packages`),

  getPackage: (packageId: string) => apiRequest<{ package: any }>(`/architect/packages/${packageId}`),

  // Drawing set management
  createSheet: (projectId: string, data: {
    deliverableId?: string
    sheetTitle: string
    discipline: string
    sequenceNumber?: number
    drawingFileId?: string
  }) => apiRequest<{ sheet: any }>(`/architect/design-projects/${projectId}/sheets`, {
    method: 'POST',
    body: data,
  }),

  listSheets: (projectId: string, filters?: {
    discipline?: string
    status?: string
    deliverableId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.discipline) params.append('discipline', filters.discipline)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.deliverableId) params.append('deliverableId', filters.deliverableId)
    const query = params.toString()
    return apiRequest<{ sheets: any[] }>(`/architect/design-projects/${projectId}/sheets${query ? `?${query}` : ''}`)
  },

  getSheet: (sheetId: string) => apiRequest<{ sheet: any }>(`/architect/sheets/${sheetId}`),

  updateSheet: (sheetId: string, data: {
    sheetTitle?: string
    status?: string
    drawingFileId?: string
    pdfFileId?: string
  }) => apiRequest<{ sheet: any }>(`/architect/sheets/${sheetId}`, {
    method: 'PATCH',
    body: data,
  }),

  addRevision: (sheetId: string, data: {
    revision: string
    description: string
    type: string
    cloudAreas?: any[]
  }) => apiRequest<{ sheet: any }>(`/architect/sheets/${sheetId}/revisions`, {
    method: 'POST',
    body: data,
  }),

  updateTitleBlock: (sheetId: string, data: {
    drawnById?: string
    checkedById?: string
    approvedById?: string
    customFields?: Record<string, any>
  }) => apiRequest<{ sheet: any }>(`/architect/sheets/${sheetId}/title-block`, {
    method: 'PATCH',
    body: data,
  }),

  createDrawingSet: (projectId: string, data: {
    deliverableId?: string
    name: string
    description?: string
    setType?: string
    sheetIds: string[]
  }) => apiRequest<{ set: any }>(`/architect/design-projects/${projectId}/drawing-sets`, {
    method: 'POST',
    body: data,
  }),

  listDrawingSets: (projectId: string) => apiRequest<{ sets: any[] }>(`/architect/design-projects/${projectId}/drawing-sets`),

  getDrawingSet: (setId: string) => apiRequest<{ set: any }>(`/architect/drawing-sets/${setId}`),

  generateSetPdf: (setId: string) => apiRequest<{ set: any }>(`/architect/drawing-sets/${setId}/generate-pdf`, {
    method: 'POST',
  }),

  // BIM Model management
  createBIMModel: (projectId: string, data: {
    deliverableId?: string
    name: string
    description?: string
    modelFormat: string
    modelFileId: string
    thumbnailUrl?: string
  }) => apiRequest<{ model: any }>(`/architect/design-projects/${projectId}/bim-models`, {
    method: 'POST',
    body: data,
  }),

  listBIMModels: (projectId: string, filters?: {
    modelFormat?: string
    deliverableId?: string
    isLatestVersion?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.modelFormat) params.append('modelFormat', filters.modelFormat)
    if (filters?.deliverableId) params.append('deliverableId', filters.deliverableId)
    if (filters?.isLatestVersion !== undefined) params.append('isLatestVersion', filters.isLatestVersion.toString())
    const query = params.toString()
    return apiRequest<{ models: any[] }>(`/architect/design-projects/${projectId}/bim-models${query ? `?${query}` : ''}`)
  },

  getBIMModel: (modelId: string) => apiRequest<{ model: any }>(`/architect/bim-models/${modelId}`),

  createModelView: (modelId: string, data: {
    name: string
    description?: string
    viewType: string
    cameraPosition: any
    viewSettings?: any
    slicePlane?: any
    sliceType?: string
    screenshotUrl?: string
  }) => apiRequest<{ view: any }>(`/architect/bim-models/${modelId}/views`, {
    method: 'POST',
    body: data,
  }),

  createAnnotation: (modelId: string, data: {
    annotationType: string
    title: string
    description?: string
    position: any
    elementId?: string
    elementType?: string
    markupData?: any
  }) => apiRequest<{ annotation: any }>(`/architect/bim-models/${modelId}/annotations`, {
    method: 'POST',
    body: data,
  }),

  listAnnotations: (modelId: string, filters?: {
    annotationType?: string
    status?: string
    elementId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.annotationType) params.append('annotationType', filters.annotationType)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.elementId) params.append('elementId', filters.elementId)
    const query = params.toString()
    return apiRequest<{ annotations: any[] }>(`/architect/bim-models/${modelId}/annotations${query ? `?${query}` : ''}`)
  },

  resolveAnnotation: (annotationId: string) => apiRequest<{ annotation: any }>(`/architect/annotations/${annotationId}/resolve`, {
    method: 'POST',
  }),

  runClashDetection: (modelId: string) => apiRequest<{ clashes: any[] }>(`/architect/bim-models/${modelId}/clash-detection`, {
    method: 'POST',
  }),

  getClashDetections: (modelId: string, filters?: {
    status?: string
    severity?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.severity) params.append('severity', filters.severity)
    const query = params.toString()
    return apiRequest<{ clashes: any[] }>(`/architect/bim-models/${modelId}/clashes${query ? `?${query}` : ''}`)
  },

  updateClashStatus: (clashId: string, data: {
    status: string
    resolutionNotes?: string
  }) => apiRequest<{ clash: any }>(`/architect/clashes/${clashId}`, {
    method: 'PATCH',
    body: data,
  }),

  getComponentProperties: (modelId: string, elementId?: string) => {
    const params = new URLSearchParams()
    if (elementId) params.append('elementId', elementId)
    const query = params.toString()
    return apiRequest<{ properties: any[] }>(`/architect/bim-models/${modelId}/components${query ? `?${query}` : ''}`)
  },

  updateComponentProperties: (modelId: string, elementId: string, data: {
    properties?: Record<string, any>
    customProperties?: Record<string, any>
  }) => apiRequest<{ property: any }>(`/architect/bim-models/${modelId}/components/${elementId}`, {
    method: 'PATCH',
    body: data,
  }),

  compareModels: (modelId1: string, modelId2: string) => apiRequest<{ comparison: any }>(`/architect/bim-models/${modelId1}/compare/${modelId2}`),

  startViewingSession: (modelId: string, isClientReview?: boolean) => apiRequest<{ session: any }>(`/architect/bim-models/${modelId}/viewing-sessions`, {
    method: 'POST',
    body: { isClientReview },
  }),

  endViewingSession: (sessionId: string, data: {
    viewsAccessed?: string[]
    annotationsCreated?: number
    annotationsViewed?: string[]
    reviewCompleted?: boolean
  }) => apiRequest<{ session: any }>(`/architect/viewing-sessions/${sessionId}`, {
    method: 'PATCH',
    body: data,
  }),

  // Review workflow
  createReviewRequest: (projectId: string, data: {
    title: string
    description?: string
    reviewType?: string
    priority?: string
    deliverableIds?: string[]
    fileIds?: string[]
    sheetIds?: string[]
    modelIds?: string[]
    reviewerIds: string[]
    reviewerTypes?: Record<string, string>
    reviewDeadline?: string
    reminderDaysBefore?: number
  }) => apiRequest<{ reviewRequest: any }>(`/architect/design-projects/${projectId}/review-requests`, {
    method: 'POST',
    body: data,
  }),

  listReviewRequests: (projectId: string, filters?: {
    status?: string
    reviewerId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.reviewerId) params.append('reviewerId', filters.reviewerId)
    const query = params.toString()
    return apiRequest<{ reviewRequests: any[] }>(`/architect/design-projects/${projectId}/review-requests${query ? `?${query}` : ''}`)
  },

  getReviewRequest: (reviewRequestId: string) => apiRequest<{ reviewRequest: any }>(`/architect/review-requests/${reviewRequestId}`),

  submitReviewRequest: (reviewRequestId: string) => apiRequest<{ reviewRequest: any }>(`/architect/review-requests/${reviewRequestId}/submit`, {
    method: 'POST',
  }),

  startReview: (reviewRequestId: string) => apiRequest<{ reviewRequest: any }>(`/architect/review-requests/${reviewRequestId}/start`, {
    method: 'POST',
  }),

  completeReviewRequest: (reviewRequestId: string, completionNotes?: string) => apiRequest<{ reviewRequest: any }>(`/architect/review-requests/${reviewRequestId}/complete`, {
    method: 'POST',
    body: { completionNotes },
  }),

  approveReviewRequest: (reviewRequestId: string, approvalNotes?: string) => apiRequest<{ reviewRequest: any }>(`/architect/review-requests/${reviewRequestId}/approve`, {
    method: 'POST',
    body: { approvalNotes },
  }),

  createReviewComment: (reviewRequestId: string, data: {
    commentText: string
    commentType?: string
    targetType?: string
    targetId?: string
    pageNumber?: number
    coordinates?: any
    markupData?: any
    parentCommentId?: string
    mentionedUserIds?: string[]
  }) => apiRequest<{ comment: any }>(`/architect/review-requests/${reviewRequestId}/comments`, {
    method: 'POST',
    body: data,
  }),

  updateCommentStatus: (commentId: string, data: {
    status: string
    addressedNotes?: string
  }) => apiRequest<{ comment: any }>(`/architect/comments/${commentId}/status`, {
    method: 'PATCH',
    body: data,
  }),

  getOverdueReviewRequests: (projectId: string) => apiRequest<{ reviewRequests: any[] }>(`/architect/design-projects/${projectId}/review-requests/overdue`),

  getReviewRequestsDueSoon: (projectId: string, days?: number) => {
    const params = new URLSearchParams()
    if (days) params.append('days', days.toString())
    const query = params.toString()
    return apiRequest<{ reviewRequests: any[] }>(`/architect/design-projects/${projectId}/review-requests/due-soon${query ? `?${query}` : ''}`)
  },

  getReviewSummary: (projectId: string) => apiRequest<{ summary: any }>(`/architect/design-projects/${projectId}/review-summary`),

  // Real-time collaboration
  updatePresence: (projectId: string, data: {
    targetType: string
    targetId: string
    status?: string
    viewportPosition?: any
    cursorPosition?: any
  }) => apiRequest<{ presence: any }>(`/architect/design-projects/${projectId}/presence`, {
    method: 'POST',
    body: data,
  }),

  getPresence: (projectId: string, targetType: string, targetId: string) => {
    const params = new URLSearchParams()
    params.append('targetType', targetType)
    params.append('targetId', targetId)
    return apiRequest<{ presence: any[] }>(`/architect/design-projects/${projectId}/presence?${params.toString()}`)
  },

  removePresence: (targetType: string, targetId: string) => {
    const params = new URLSearchParams()
    params.append('targetType', targetType)
    params.append('targetId', targetId)
    return apiRequest(`/architect/presence?${params.toString()}`, {
      method: 'DELETE',
    })
  },

  recordChange: (projectId: string, data: {
    targetType: string
    targetId: string
    changeType: string
    changeDescription?: string
    oldValue?: any
    newValue?: any
    diffData?: any
    pageNumber?: number
    sectionPath?: string
    coordinates?: any
    versionBefore?: string
    versionAfter?: string
  }) => apiRequest<{ change: any }>(`/architect/design-projects/${projectId}/changes`, {
    method: 'POST',
    body: data,
  }),

  getChanges: (projectId: string, targetType: string, targetId: string, filters?: {
    changeType?: string
    fromDate?: string
    toDate?: string
  }) => {
    const params = new URLSearchParams()
    params.append('targetType', targetType)
    params.append('targetId', targetId)
    if (filters?.changeType) params.append('changeType', filters.changeType)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)
    return apiRequest<{ changes: any[] }>(`/architect/design-projects/${projectId}/changes?${params.toString()}`)
  },

  createSignatureRequest: (projectId: string, data: {
    targetType: string
    targetId: string
    signerId: string
    expiresAt?: string
    approvalNotes?: string
  }) => apiRequest<{ signature: any }>(`/architect/design-projects/${projectId}/signatures`, {
    method: 'POST',
    body: data,
  }),

  signDocument: (signatureId: string, data: {
    signatureData?: any
    signatureImageUrl?: string
    ipAddress?: string
    userAgent?: string
  }) => apiRequest<{ signature: any }>(`/architect/signatures/${signatureId}/sign`, {
    method: 'POST',
    body: data,
  }),

  getSignatures: (projectId: string, targetType: string, targetId: string) => {
    const params = new URLSearchParams()
    params.append('targetType', targetType)
    params.append('targetId', targetId)
    return apiRequest<{ signatures: any[] }>(`/architect/design-projects/${projectId}/signatures?${params.toString()}`)
  },

  createMeetingMinute: (projectId: string, data: {
    title: string
    meetingDate: string
    meetingDurationMinutes?: number
    location?: string
    meetingType?: string
    attendeeIds: string[]
    organizerId: string
    agenda?: string
    discussionNotes?: string
    decisionsMade?: any
    attachments?: string[]
    nextMeetingDate?: string
  }) => apiRequest<{ meeting: any }>(`/architect/design-projects/${projectId}/meetings`, {
    method: 'POST',
    body: data,
  }),

  getMeetingMinute: (meetingId: string) => apiRequest<{ meeting: any }>(`/architect/meetings/${meetingId}`),

  listMeetingMinutes: (projectId: string, filters?: {
    fromDate?: string
    toDate?: string
    meetingType?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)
    if (filters?.meetingType) params.append('meetingType', filters.meetingType)
    const query = params.toString()
    return apiRequest<{ meetings: any[] }>(`/architect/design-projects/${projectId}/meetings${query ? `?${query}` : ''}`)
  },

  createActionItem: (projectId: string, data: {
    sourceType: string
    sourceId?: string
    meetingMinuteId?: string
    title: string
    description?: string
    priority?: string
    assignedToId?: string
    assignedById: string
    dueDate?: string
    relatedDeliverableIds?: string[]
    relatedFileIds?: string[]
  }) => apiRequest<{ actionItem: any }>(`/architect/design-projects/${projectId}/action-items`, {
    method: 'POST',
    body: data,
  }),

  updateActionItemStatus: (actionItemId: string, data: {
    status: string
    completionNotes?: string
  }) => apiRequest<{ actionItem: any }>(`/architect/action-items/${actionItemId}/status`, {
    method: 'PATCH',
    body: data,
  }),

  listActionItems: (projectId: string, filters?: {
    status?: string
    assignedToId?: string
    sourceType?: string
    sourceId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.assignedToId) params.append('assignedToId', filters.assignedToId)
    if (filters?.sourceType) params.append('sourceType', filters.sourceType)
    if (filters?.sourceId) params.append('sourceId', filters.sourceId)
    const query = params.toString()
    return apiRequest<{ actionItems: any[] }>(`/architect/design-projects/${projectId}/action-items${query ? `?${query}` : ''}`)
  },

  createDesignDecision: (projectId: string, data: {
    title: string
    description?: string
    decisionText: string
    rationale?: string
    alternativesConsidered?: string
    impactScope?: string
    affectedDeliverableIds?: string[]
    affectedFileIds?: string[]
    supportingDocumentIds?: string[]
    referenceLinks?: string[]
    relatedPhaseId?: string
    relatedReviewRequestId?: string
    proposedById: string
  }) => apiRequest<{ decision: any }>(`/architect/design-projects/${projectId}/decisions`, {
    method: 'POST',
    body: data,
  }),

  updateDecisionStatus: (decisionId: string, data: {
    status: string
  }) => apiRequest<{ decision: any }>(`/architect/decisions/${decisionId}/status`, {
    method: 'PATCH',
    body: data,
  }),

  getDesignDecision: (decisionId: string) => apiRequest<{ decision: any }>(`/architect/decisions/${decisionId}`),

  listDesignDecisions: (projectId: string, filters?: {
    status?: string
    relatedPhaseId?: string
    relatedReviewRequestId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.relatedPhaseId) params.append('relatedPhaseId', filters.relatedPhaseId)
    if (filters?.relatedReviewRequestId) params.append('relatedReviewRequestId', filters.relatedReviewRequestId)
    const query = params.toString()
    return apiRequest<{ decisions: any[] }>(`/architect/design-projects/${projectId}/decisions${query ? `?${query}` : ''}`)
  },

  // Version control
  createBranch: (projectId: string, data: {
    name: string
    description?: string
    baseBranchId?: string
    baseVersionId?: string
  }) => apiRequest<{ branch: any }>(`/architect/design-projects/${projectId}/branches`, {
    method: 'POST',
    body: data,
  }),

  listBranches: (projectId: string, filters?: {
    status?: string
    includeMerged?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.includeMerged) params.append('includeMerged', filters.includeMerged.toString())
    const query = params.toString()
    return apiRequest<{ branches: any[] }>(`/architect/design-projects/${projectId}/branches${query ? `?${query}` : ''}`)
  },

  getBranch: (branchId: string) => apiRequest<{ branch: any }>(`/architect/branches/${branchId}`),

  getDefaultBranch: (projectId: string) => apiRequest<{ branch: any }>(`/architect/design-projects/${projectId}/branches/default`),

  createVersion: (projectId: string, data: {
    branchId: string
    versionNumber: string
    versionName?: string
    description?: string
    versionTag?: string
    customTagName?: string
    fileSnapshots?: any
    sheetSnapshots?: any
    modelSnapshots?: any
  }) => apiRequest<{ version: any }>(`/architect/design-projects/${projectId}/versions`, {
    method: 'POST',
    body: data,
  }),

  getVersion: (versionId: string) => apiRequest<{ version: any }>(`/architect/versions/${versionId}`),

  listVersions: (projectId: string, filters?: {
    branchId?: string
    versionTag?: string
    isTagged?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.branchId) params.append('branchId', filters.branchId)
    if (filters?.versionTag) params.append('versionTag', filters.versionTag)
    if (filters?.isTagged !== undefined) params.append('isTagged', filters.isTagged.toString())
    const query = params.toString()
    return apiRequest<{ versions: any[] }>(`/architect/design-projects/${projectId}/versions${query ? `?${query}` : ''}`)
  },

  compareVersions: (projectId: string, data: {
    fromVersionId: string
    toVersionId: string
  }) => apiRequest<{ comparison: any }>(`/architect/design-projects/${projectId}/versions/compare`, {
    method: 'POST',
    body: data,
  }),

  getComparison: (comparisonId: string) => apiRequest<{ comparison: any }>(`/architect/comparisons/${comparisonId}`),

  mergeBranch: (projectId: string, data: {
    sourceBranchId: string
    targetBranchId: string
    mergeDescription?: string
    conflictResolution?: string
    resolvedConflicts?: any
  }) => apiRequest<{ merge: any }>(`/architect/design-projects/${projectId}/branches/merge`, {
    method: 'POST',
    body: data,
  }),

  resolveMergeConflicts: (mergeId: string, data: {
    conflictResolution: string
    resolvedConflicts: any
  }) => apiRequest<{ merge: any }>(`/architect/merges/${mergeId}/resolve`, {
    method: 'POST',
    body: data,
  }),

  rollbackToVersion: (projectId: string, data: {
    fromVersionId: string
    toVersionId: string
    rollbackReason?: string
    rollbackNotes?: string
    createBackup?: boolean
  }) => apiRequest<{ rollback: any }>(`/architect/design-projects/${projectId}/versions/rollback`, {
    method: 'POST',
    body: data,
  }),

  getRollbackHistory: (projectId: string) => apiRequest<{ rollbacks: any[] }>(`/architect/design-projects/${projectId}/rollbacks`),

  // Revision management
  createRevision: (projectId: string, data: {
    revisionLetter: string
    revisionDate: string
    description: string
    revisionType: string
    issuanceType?: string
    affectedDisciplines?: string[]
    impactLevel?: string
    requiresCoordination?: boolean
    relatedChangeOrderId?: string
    relatedAddendumId?: string
  }) => apiRequest<{ revision: any }>(`/architect/design-projects/${projectId}/revisions`, {
    method: 'POST',
    body: data,
  }),

  getRevision: (revisionId: string) => apiRequest<{ revision: any }>(`/architect/revisions/${revisionId}`),

  listRevisions: (projectId: string, filters?: {
    status?: string
    issuanceType?: string
    fromDate?: string
    toDate?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.issuanceType) params.append('issuanceType', filters.issuanceType)
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)
    const query = params.toString()
    return apiRequest<{ revisions: any[] }>(`/architect/design-projects/${projectId}/revisions${query ? `?${query}` : ''}`)
  },

  addSheetToRevision: (revisionId: string, data: {
    sheetId: string
    cloudAreas?: any[]
    revisionDescription?: string
    affectedAreas?: string[]
    changeType: string
  }) => apiRequest<{ sheetRevision: any }>(`/architect/revisions/${revisionId}/sheets`, {
    method: 'POST',
    body: data,
  }),

  approveRevision: (revisionId: string, approvalNotes?: string) => apiRequest<{ revision: any }>(`/architect/revisions/${revisionId}/approve`, {
    method: 'POST',
    body: { approvalNotes },
  }),

  issueRevision: (revisionId: string, issuedTo?: string) => apiRequest<{ revision: any }>(`/architect/revisions/${revisionId}/issue`, {
    method: 'POST',
    body: { issuedTo },
  }),

  generateRevisionSchedule: (projectId: string, data: {
    revisionId?: string
    scheduleType: string
    format?: string
    templateId?: string
  }) => apiRequest<{ schedule: any }>(`/architect/design-projects/${projectId}/revision-schedules`, {
    method: 'POST',
    body: data,
  }),

  getRevisionSchedule: (scheduleId: string) => apiRequest<{ schedule: any }>(`/architect/revision-schedules/${scheduleId}`),

  analyzeRevisionImpact: (revisionId: string) => apiRequest<{ result: any }>(`/architect/revisions/${revisionId}/analyze-impact`, {
    method: 'POST',
  }),

  markImpactCoordinated: (impactId: string, coordinationNotes?: string) => apiRequest<{ impact: any }>(`/architect/revision-impacts/${impactId}/coordinate`, {
    method: 'POST',
    body: { coordinationNotes },
  }),

  archiveRevision: (revisionId: string, data: {
    archiveReason?: string
    searchKeywords?: string[]
    tags?: string[]
    relatedDocuments?: string[]
  }) => apiRequest<{ archive: any }>(`/architect/revisions/${revisionId}/archive`, {
    method: 'POST',
    body: data,
  }),

  searchRevisionArchive: (projectId: string, filters?: {
    keywords?: string[]
    tags?: string[]
    fromDate?: string
    toDate?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.keywords) params.append('keywords', filters.keywords.join(','))
    if (filters?.tags) params.append('tags', filters.tags.join(','))
    if (filters?.fromDate) params.append('fromDate', filters.fromDate)
    if (filters?.toDate) params.append('toDate', filters.toDate)
    const query = params.toString()
    return apiRequest<{ archives: any[] }>(`/architect/design-projects/${projectId}/revision-archive/search${query ? `?${query}` : ''}`)
  },

  // Design validation
  createValidationRule: (data: {
    name: string
    description?: string
    category: string
    codeStandard?: string
    codeReference?: string
    ruleType: string
    ruleLogic?: any
    validationScript?: string
    appliesTo?: string[]
    requiredFor?: string[]
    phaseApplicability?: string[]
    isRequired?: boolean
  }) => apiRequest<{ rule: any }>(`/architect/validation-rules`, {
    method: 'POST',
    body: data,
  }),

  listValidationRules: (filters?: {
    category?: string
    codeStandard?: string
    isActive?: boolean
    isRequired?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.codeStandard) params.append('codeStandard', filters.codeStandard)
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    if (filters?.isRequired !== undefined) params.append('isRequired', filters.isRequired.toString())
    const query = params.toString()
    return apiRequest<{ rules: any[] }>(`/architect/validation-rules${query ? `?${query}` : ''}`)
  },

  runValidation: (projectId: string, data: {
    targetType: string
    targetId: string
    ruleId?: string
    ruleIds?: string[]
    validationMethod?: string
  }) => apiRequest<{ validations: any[] }>(`/architect/design-projects/${projectId}/validations`, {
    method: 'POST',
    body: data,
  }),

  getValidation: (validationId: string) => apiRequest<{ validation: any }>(`/architect/validations/${validationId}`),

  listValidations: (projectId: string, filters?: {
    targetType?: string
    targetId?: string
    validationStatus?: string
    category?: string
    codeStandard?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.targetType) params.append('targetType', filters.targetType)
    if (filters?.targetId) params.append('targetId', filters.targetId)
    if (filters?.validationStatus) params.append('validationStatus', filters.validationStatus)
    if (filters?.category) params.append('category', filters.category)
    if (filters?.codeStandard) params.append('codeStandard', filters.codeStandard)
    const query = params.toString()
    return apiRequest<{ validations: any[] }>(`/architect/design-projects/${projectId}/validations${query ? `?${query}` : ''}`)
  },

  updateValidation: (validationId: string, data: {
    validationStatus: string
    severity?: string
    validationMessage?: string
    validationDetails?: any
    issuesFound?: string[]
    recommendations?: string[]
    complianceStatus?: string
  }) => apiRequest<{ validation: any }>(`/architect/validations/${validationId}`, {
    method: 'PATCH',
    body: data,
  }),

  approveValidation: (validationId: string, data: {
    approvalNotes?: string
    exemptionGranted?: boolean
    exemptionReason?: string
  }) => apiRequest<{ validation: any }>(`/architect/validations/${validationId}/approve`, {
    method: 'POST',
    body: data,
  }),

  generateValidationReport: (projectId: string, data: {
    reportName: string
    reportType: string
    targetType?: string
    targetId?: string
    ruleIds?: string[]
    format?: string
  }) => apiRequest<{ report: any }>(`/architect/design-projects/${projectId}/validation-reports`, {
    method: 'POST',
    body: data,
  }),

  getValidationReport: (reportId: string) => apiRequest<{ report: any }>(`/architect/validation-reports/${reportId}`),

  createDrawingChecklist: (projectId: string, data: {
    sheetId?: string
    items: Array<{
      itemName: string
      itemCategory?: string
      isRequired?: boolean
      locationOnSheet?: string
      expectedValue?: string
    }>
  }) => apiRequest<{ items: any[] }>(`/architect/design-projects/${projectId}/drawing-checklist`, {
    method: 'POST',
    body: data,
  }),

  getDrawingChecklist: (projectId: string, sheetId?: string) => {
    const params = new URLSearchParams()
    if (sheetId) params.append('sheetId', sheetId)
    const query = params.toString()
    return apiRequest<{ items: any[] }>(`/architect/design-projects/${projectId}/drawing-checklist${query ? `?${query}` : ''}`)
  },

  validateChecklistItem: (itemId: string, data: {
    isPresent: boolean
    isValid?: boolean
    validationNotes?: string
  }) => apiRequest<{ item: any }>(`/architect/drawing-checklist/${itemId}`, {
    method: 'PATCH',
    body: data,
  }),

  createCodeComplianceRecord: (projectId: string, data: {
    codeStandard: string
    codeSection: string
    codeDescription?: string
    complianceStatus: string
    complianceNotes?: string
    evidenceFileIds?: string[]
    relatedSheetIds?: string[]
    relatedDeliverableIds?: string[]
  }) => apiRequest<{ record: any }>(`/architect/design-projects/${projectId}/code-compliance`, {
    method: 'POST',
    body: data,
  }),

  validateCodeCompliance: (recordId: string, data: {
    complianceStatus: string
    complianceNotes?: string
    validationMethod?: string
  }) => apiRequest<{ record: any }>(`/architect/code-compliance/${recordId}/validate`, {
    method: 'PATCH',
    body: data,
  }),

  listCodeComplianceRecords: (projectId: string, filters?: {
    codeStandard?: string
    complianceStatus?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.codeStandard) params.append('codeStandard', filters.codeStandard)
    if (filters?.complianceStatus) params.append('complianceStatus', filters.complianceStatus)
    const query = params.toString()
    return apiRequest<{ records: any[] }>(`/architect/design-projects/${projectId}/code-compliance${query ? `?${query}` : ''}`)
  },

  // Approval workflows
  createApprovalWorkflow: (data: {
    name: string
    description?: string
    workflowType: string
    appliesToEntityType: string[]
    appliesToProjectTypes?: string[]
    appliesToPhases?: string[]
    steps: any[]
    conditionalLogic?: any
    isDefault?: boolean
  }) => apiRequest<{ workflow: any }>(`/architect/approval-workflows`, {
    method: 'POST',
    body: data,
  }),

  listApprovalWorkflows: (filters?: {
    workflowType?: string
    entityType?: string
    isActive?: boolean
    isDefault?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.workflowType) params.append('workflowType', filters.workflowType)
    if (filters?.entityType) params.append('entityType', filters.entityType)
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString())
    if (filters?.isDefault !== undefined) params.append('isDefault', filters.isDefault.toString())
    const query = params.toString()
    return apiRequest<{ workflows: any[] }>(`/architect/approval-workflows${query ? `?${query}` : ''}`)
  },

  getApprovalWorkflow: (workflowId: string) => apiRequest<{ workflow: any }>(`/architect/approval-workflows/${workflowId}`),

  // Approval requests
  createApprovalRequest: (projectId: string, data: {
    entityType: string
    entityId: string
    workflowId?: string
    requestTitle: string
    requestDescription?: string
    requestNotes?: string
    priority?: string
    deadline?: string
  }) => apiRequest<{ approvalRequest: any }>(`/architect/design-projects/${projectId}/approval-requests`, {
    method: 'POST',
    body: data,
  }),

  getApprovalRequest: (requestId: string) => apiRequest<{ approvalRequest: any }>(`/architect/approval-requests/${requestId}`),

  listApprovalRequests: (projectId: string, filters?: {
    entityType?: string
    entityId?: string
    approvalStatus?: string
    requestedById?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.entityType) params.append('entityType', filters.entityType)
    if (filters?.entityId) params.append('entityId', filters.entityId)
    if (filters?.approvalStatus) params.append('approvalStatus', filters.approvalStatus)
    if (filters?.requestedById) params.append('requestedById', filters.requestedById)
    const query = params.toString()
    return apiRequest<{ requests: any[] }>(`/architect/design-projects/${projectId}/approval-requests${query ? `?${query}` : ''}`)
  },

  approveStep: (stepId: string, data: {
    approvalNotes?: string
    signatureData?: any
    signatureImageUrl?: string
    ipAddress?: string
    userAgent?: string
    location?: string
  }) => apiRequest<{ step: any }>(`/architect/approval-steps/${stepId}/approve`, {
    method: 'POST',
    body: data,
  }),

  rejectStep: (stepId: string, data: {
    rejectionReason: string
    ipAddress?: string
    userAgent?: string
    location?: string
  }) => apiRequest<{ step: any }>(`/architect/approval-steps/${stepId}/reject`, {
    method: 'POST',
    body: data,
  }),

  delegateApproval: (requestId: string, data: {
    toUserId: string
    delegationReason?: string
    ipAddress?: string
    userAgent?: string
  }) => apiRequest<{ delegation: any }>(`/architect/approval-requests/${requestId}/delegate`, {
    method: 'POST',
    body: data,
  }),

  revokeDelegation: (delegationId: string, data: {
    revokedReason?: string
  }) => apiRequest<{ delegation: any }>(`/architect/approval-delegations/${delegationId}/revoke`, {
    method: 'POST',
    body: data,
  }),

  generateApprovalCertificate: (requestId: string, data: {
    certificateTitle: string
    certificateDescription?: string
    certificateData?: any
    certificateFormat?: string
    issuedTo?: string
    issuedBy?: string
  }) => apiRequest<{ certificate: any }>(`/architect/approval-requests/${requestId}/certificate`, {
    method: 'POST',
    body: data,
  }),

  getApprovalHistory: (requestId: string) => apiRequest<{ history: any[] }>(`/architect/approval-requests/${requestId}/history`),

  // Architect Stamps
  createStampTemplate: (data: {
    stampType: string
    stampName: string
    licenseNumber: string
    licenseState: string
    licenseExpirationDate?: string
    sealImageUrl?: string
    sealImageData?: any
    metadata?: any
  }) => apiRequest<{ template: any }>(`/architect/stamp-templates`, {
    method: 'POST',
    body: data,
  }),

  getStampTemplate: (templateId: string) => apiRequest<{ template: any }>(`/architect/stamp-templates/${templateId}`),

  listStampTemplates: (filters?: {
    stampType?: string
    licenseState?: string
    status?: string
    isVerified?: boolean
  }) => {
    const params = new URLSearchParams()
    if (filters?.stampType) params.append('stampType', filters.stampType)
    if (filters?.licenseState) params.append('licenseState', filters.licenseState)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.isVerified !== undefined) params.append('isVerified', filters.isVerified.toString())
    const query = params.toString()
    return apiRequest<{ templates: any[] }>(`/architect/stamp-templates${query ? `?${query}` : ''}`)
  },

  verifyStampTemplate: (templateId: string, data: {
    isVerified: boolean
    verificationNotes?: string
  }) => apiRequest<{ template: any }>(`/architect/stamp-templates/${templateId}/verify`, {
    method: 'POST',
    body: data,
  }),

  applyStamp: (projectId: string, data: {
    stampTemplateId: string
    targetType: string
    targetId: string
    positionX?: number
    positionY?: number
    positionData?: any
    scale?: number
    rotation?: number
  }) => apiRequest<{ application: any }>(`/architect/design-projects/${projectId}/stamp-applications`, {
    method: 'POST',
    body: data,
  }),

  getStampApplication: (applicationId: string) => apiRequest<{ application: any }>(`/architect/stamp-applications/${applicationId}`),

  listStampApplications: (projectId: string, filters?: {
    targetType?: string
    targetId?: string
    applicationStatus?: string
    stampTemplateId?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.targetType) params.append('targetType', filters.targetType)
    if (filters?.targetId) params.append('targetId', filters.targetId)
    if (filters?.applicationStatus) params.append('applicationStatus', filters.applicationStatus)
    if (filters?.stampTemplateId) params.append('stampTemplateId', filters.stampTemplateId)
    const query = params.toString()
    return apiRequest<{ applications: any[] }>(`/architect/design-projects/${projectId}/stamp-applications${query ? `?${query}` : ''}`)
  },

  verifyStampApplication: (applicationId: string, data: {
    isVerified: boolean
    verificationNotes?: string
  }) => apiRequest<{ application: any }>(`/architect/stamp-applications/${applicationId}/verify`, {
    method: 'POST',
    body: data,
  }),

  checkTampering: (applicationId: string, data: {
    currentDocumentHash: string
  }) => apiRequest<{ result: any }>(`/architect/stamp-applications/${applicationId}/check-tampering`, {
    method: 'POST',
    body: data,
  }),

  getStampLog: (applicationId: string) => apiRequest<{ logEntries: any[] }>(`/architect/stamp-applications/${applicationId}/log`),

  validateLicense: (data: {
    licenseNumber: string
    licenseState: string
    licenseType: string
    licenseeName: string
  }) => apiRequest<{ validation: any }>(`/architect/license-validations`, {
    method: 'POST',
    body: data,
  }),

  getLicenseValidation: (validationId: string) => apiRequest<{ validation: any }>(`/architect/license-validations/${validationId}`),

  listLicenseValidations: (filters?: {
    licenseState?: string
    licenseType?: string
    isValid?: boolean
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.licenseState) params.append('licenseState', filters.licenseState)
    if (filters?.licenseType) params.append('licenseType', filters.licenseType)
    if (filters?.isValid !== undefined) params.append('isValid', filters.isValid.toString())
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiRequest<{ validations: any[] }>(`/architect/license-validations${query ? `?${query}` : ''}`)
  },

  // Quality Control
  createQCChecklistTemplate: (data: {
    name: string
    description?: string
    phase?: string
    projectType?: string
    items: any[]
    isDefault?: boolean
  }) => apiRequest<{ template: any }>(`/architect/qc-checklist-templates`, {
    method: 'POST',
    body: data,
  }),

  createQCChecklist: (projectId: string, data: {
    phaseId?: string
    templateId?: string
    checklistName: string
    phase?: string
    items?: any[]
  }) => apiRequest<{ checklist: any }>(`/architect/design-projects/${projectId}/qc-checklists`, {
    method: 'POST',
    body: data,
  }),

  getQCChecklist: (checklistId: string) => apiRequest<{ checklist: any }>(`/architect/qc-checklists/${checklistId}`),

  listQCChecklists: (projectId: string, filters?: {
    phaseId?: string
    phase?: string
    status?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.phaseId) params.append('phaseId', filters.phaseId)
    if (filters?.phase) params.append('phase', filters.phase)
    if (filters?.status) params.append('status', filters.status)
    const query = params.toString()
    return apiRequest<{ checklists: any[] }>(`/architect/design-projects/${projectId}/qc-checklists${query ? `?${query}` : ''}`)
  },

  updateChecklistItemStatus: (itemId: string, data: {
    itemStatus: string
    checkNotes?: string
    result?: string
    evidenceFileIds?: string[]
  }) => apiRequest<{ item: any }>(`/architect/qc-checklist-items/${itemId}/status`, {
    method: 'PATCH',
    body: data,
  }),

  createRandomSampleCheck: (checklistId: string, data: {
    checkName: string
    checkDescription?: string
    targetType: string
    targetId?: string
    sampleSize: number
    sampleMethod?: string
  }) => apiRequest<{ check: any }>(`/architect/qc-checklists/${checklistId}/random-sample-check`, {
    method: 'POST',
    body: data,
  }),

  reportQCError: (checklistId: string, data: {
    checklistItemId?: string
    checkId?: string
    errorCategory: string
    errorSeverity: string
    errorDescription: string
    errorLocation?: string
    errorDetails?: any
    affectedItems?: string[]
    evidenceFileIds?: string[]
  }) => apiRequest<{ error: any }>(`/architect/qc-checklists/${checklistId}/errors`, {
    method: 'POST',
    body: data,
  }),

  resolveQCError: (errorId: string, data: {
    resolutionNotes?: string
  }) => apiRequest<{ error: any }>(`/architect/qc-errors/${errorId}/resolve`, {
    method: 'POST',
    body: data,
  }),

  createCorrectiveAction: (errorId: string, data: {
    actionDescription: string
    actionType?: string
    assignedToId?: string
    dueDate?: string
  }) => apiRequest<{ action: any }>(`/architect/qc-errors/${errorId}/corrective-actions`, {
    method: 'POST',
    body: data,
  }),

  updateCorrectiveActionStatus: (actionId: string, data: {
    actionStatus: string
    completionNotes?: string
    evidenceFileIds?: string[]
  }) => apiRequest<{ action: any }>(`/architect/corrective-actions/${actionId}/status`, {
    method: 'PATCH',
    body: data,
  }),

  verifyCorrectiveAction: (actionId: string, data: {
    verificationNotes?: string
  }) => apiRequest<{ action: any }>(`/architect/corrective-actions/${actionId}/verify`, {
    method: 'POST',
    body: data,
  }),

  getQCMetrics: (checklistId: string) => apiRequest<{ metrics: any }>(`/architect/qc-checklists/${checklistId}/metrics`),

  createImprovementFeedback: (projectId: string, data: {
    feedbackType: string
    title: string
    description: string
    category?: string
    relatedChecklistId?: string
    relatedErrorId?: string
    relatedPhase?: string
    impactLevel?: string
    estimatedBenefit?: string
  }) => apiRequest<{ feedback: any }>(`/architect/design-projects/${projectId}/qc-improvement-feedback`, {
    method: 'POST',
    body: data,
  }),

  listImprovementFeedback: (projectId: string, filters?: {
    feedbackType?: string
    isImplemented?: boolean
    category?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.feedbackType) params.append('feedbackType', filters.feedbackType)
    if (filters?.isImplemented !== undefined) params.append('isImplemented', filters.isImplemented.toString())
    if (filters?.category) params.append('category', filters.category)
    const query = params.toString()
    return apiRequest<{ feedback: any[] }>(`/architect/design-projects/${projectId}/qc-improvement-feedback${query ? `?${query}` : ''}`)
  },

  implementImprovementFeedback: (feedbackId: string) => apiRequest<{ feedback: any }>(`/architect/qc-improvement-feedback/${feedbackId}/implement`, {
    method: 'POST',
  }),

  // Permit Packages
  createPermitPackage: (projectId: string, data: {
    jurisdictionId?: string
    packageName: string
    packageType: string
    permitType?: string
    description?: string
  }) => apiRequest<{ package: any }>(`/architect/design-projects/${projectId}/permit-packages`, {
    method: 'POST',
    body: data,
  }),

  autoGeneratePermitPackage: (projectId: string, data: {
    jurisdictionId?: string
    packageName: string
    packageType: string
    permitType?: string
    drawingSheetIds?: string[]
    includeAllDrawings?: boolean
  }) => apiRequest<{ package: any }>(`/architect/design-projects/${projectId}/permit-packages/auto-generate`, {
    method: 'POST',
    body: data,
  }),

  getPermitPackage: (packageId: string) => apiRequest<{ package: any }>(`/architect/permit-packages/${packageId}`),

  listPermitPackages: (projectId: string, filters?: {
    status?: string
    packageType?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.packageType) params.append('packageType', filters.packageType)
    const query = params.toString()
    return apiRequest<{ packages: any[] }>(`/architect/design-projects/${projectId}/permit-packages${query ? `?${query}` : ''}`)
  },

  addDocumentToPackage: (packageId: string, data: {
    documentType: string
    documentName: string
    documentDescription?: string
    sheetNumber?: string
    discipline?: string
    sourceType: string
    sourceId?: string
    sourceFileUrl?: string
    fileUrl: string
    fileName: string
    fileSize?: number
    fileType?: string
    pageCount?: number
    isRequired?: boolean
    metadata?: any
  }) => apiRequest<{ document: any }>(`/architect/permit-packages/${packageId}/documents`, {
    method: 'POST',
    body: data,
  }),

  updateApplicationForm: (formId: string, data: {
    formData: any
    isComplete?: boolean
  }) => apiRequest<{ form: any }>(`/architect/permit-application-forms/${formId}`, {
    method: 'PATCH',
    body: data,
  }),

  verifyApplicationForm: (formId: string) => apiRequest<{ form: any }>(`/architect/permit-application-forms/${formId}/verify`, {
    method: 'POST',
  }),

  submitPermitPackage: (packageId: string, data: {
    submissionMethod: string
    submissionNotes?: string
  }) => apiRequest<{ package: any; submission: any }>(`/architect/permit-packages/${packageId}/submit`, {
    method: 'POST',
    body: data,
  }),

  syncPermitPackageStatus: (packageId: string) => apiRequest<{ status: any }>(`/architect/permit-packages/${packageId}/sync`, {
    method: 'POST',
  }),

  addReviewComment: (packageId: string, data: {
    commentType: string
    commentText: string
    commentCategory?: string
    severity?: string
    sheetNumber?: string
    pageNumber?: number
    coordinates?: any
    markupImageUrl?: string
    source: string
    reviewerName?: string
    reviewerEmail?: string
  }) => apiRequest<{ comment: any }>(`/architect/permit-packages/${packageId}/review-comments`, {
    method: 'POST',
    body: data,
  }),

  resolveReviewComment: (commentId: string, data: {
    resolutionNotes?: string
  }) => apiRequest<{ comment: any }>(`/architect/permit-package-review-comments/${commentId}/resolve`, {
    method: 'POST',
    body: data,
  }),

  // Construction Handoff
  generateIFCPackage: (projectId: string, data: {
    packageName: string
    description?: string
    drawingSheetIds?: string[]
    includeAllDrawings?: boolean
    includeSpecifications?: boolean
  }) => apiRequest<{ package: any }>(`/architect/design-projects/${projectId}/ifc-packages/generate`, {
    method: 'POST',
    body: data,
  }),

  issueIFCPackage: (packageId: string, data: {
    issueDate?: string
  }) => apiRequest<{ package: any }>(`/architect/ifc-packages/${packageId}/issue`, {
    method: 'POST',
    body: data,
  }),

  generateBidPackage: (projectId: string, data: {
    packageName: string
    bidDueDate?: string
    description?: string
    ifcPackageId?: string
    includesIFCPackage?: boolean
    includesSpecifications?: boolean
  }) => apiRequest<{ package: any }>(`/architect/design-projects/${projectId}/bid-packages/generate`, {
    method: 'POST',
    body: data,
  }),

  createContractorQuestion: (data: {
    bidPackageId?: string
    questionText: string
    questionCategory?: string
    relatedDocumentId?: string
    relatedSheetNumber?: string
    relatedSpecificationSection?: string
    isPublic?: boolean
  }) => apiRequest<{ question: any }>(`/architect/contractor-questions`, {
    method: 'POST',
    body: data,
  }),

  answerContractorQuestion: (questionId: string, data: {
    answerText: string
  }) => apiRequest<{ question: any }>(`/architect/contractor-questions/${questionId}/answer`, {
    method: 'POST',
    body: data,
  }),

  createRFI: (projectId: string, data: {
    subject: string
    questionText: string
    questionCategory?: string
    priority?: string
    relatedDrawingId?: string
    relatedSheetNumber?: string
    relatedSpecificationSection?: string
    relatedRFIId?: string
    dueDate?: string
  }) => apiRequest<{ rfi: any }>(`/architect/design-projects/${projectId}/rfis`, {
    method: 'POST',
    body: data,
  }),

  answerRFI: (rfiId: string, data: {
    answerText: string
  }) => apiRequest<{ rfi: any }>(`/architect/rfis/${rfiId}/answer`, {
    method: 'POST',
    body: data,
  }),

  createSubmittal: (projectId: string, data: {
    submittalName: string
    submittalType: string
    specificationSection?: string
    relatedDrawingId?: string
    relatedSheetNumber?: string
    manufacturer?: string
    productName?: string
    modelNumber?: string
    description?: string
  }) => apiRequest<{ submittal: any }>(`/architect/design-projects/${projectId}/submittals`, {
    method: 'POST',
    body: data,
  }),

  reviewSubmittal: (submittalId: string, data: {
    reviewAction: string
    reviewComments?: string
    requiredResubmission?: boolean
  }) => apiRequest<{ submittal: any }>(`/architect/submittals/${submittalId}/review`, {
    method: 'POST',
    body: data,
  }),

  createAsBuiltDocumentation: (projectId: string, data: {
    documentationName: string
    documentationType: string
    description?: string
  }) => apiRequest<{ documentation: any }>(`/architect/design-projects/${projectId}/as-built`, {
    method: 'POST',
    body: data,
  }),

  reviewAsBuiltDocumentation: (documentationId: string, data: {
    reviewComments?: string
    requiredRevisions?: boolean
  }) => apiRequest<{ documentation: any }>(`/architect/as-built/${documentationId}/review`, {
    method: 'POST',
    body: data,
  }),

  approveAsBuiltDocumentation: (documentationId: string) => apiRequest<{ documentation: any }>(`/architect/as-built/${documentationId}/approve`, {
    method: 'POST',
  }),

  // Onboarding
  getOnboarding: () => apiRequest<{ onboarding: any }>(`/architect/onboarding`),

  completeOnboardingStep: (data: { stepId: number }) => apiRequest<{ onboarding: any }>(`/architect/onboarding/steps/complete`, {
    method: 'POST',
    body: data,
  }),

  skipOnboardingStep: (data: { stepId: number }) => apiRequest<{ onboarding: any }>(`/architect/onboarding/steps/skip`, {
    method: 'POST',
    body: data,
  }),

  // Template Library
  createTemplate: (data: {
    templateName: string
    templateCategory: string
    description?: string
    tags?: string[]
    templateContent: any
    templateFileUrl?: string
    thumbnailUrl?: string
    organizationId?: string
    isPublic?: boolean
    isStandard?: boolean
  }) => apiRequest<{ template: any }>(`/architect/templates`, {
    method: 'POST',
    body: data,
  }),

  publishTemplate: (templateId: string) => apiRequest<{ template: any }>(`/architect/templates/${templateId}/publish`, {
    method: 'POST',
  }),

  useTemplate: (templateId: string, data: {
    designProjectId?: string
    instanceName: string
    customizations?: any
  }) => apiRequest<{ instance: any }>(`/architect/templates/${templateId}/use`, {
    method: 'POST',
    body: data,
  }),

  listTemplates: (filters?: {
    category?: string
    isPublic?: boolean
    isStandard?: boolean
    organizationId?: string
    status?: string
    search?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.isPublic !== undefined) params.append('isPublic', filters.isPublic.toString())
    if (filters?.isStandard !== undefined) params.append('isStandard', filters.isStandard.toString())
    if (filters?.organizationId) params.append('organizationId', filters.organizationId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.search) params.append('search', filters.search)
    const query = params.toString()
    return apiRequest<{ templates: any[] }>(`/architect/templates${query ? `?${query}` : ''}`)
  },

  createStandardDetail: (data: {
    detailNumber: string
    detailName: string
    detailCategory: string
    description?: string
    detailFileUrl: string
    thumbnailUrl?: string
    applicableCodes?: string[]
    applicableProjectTypes?: string[]
    sourceOrganization?: string
    isPublic?: boolean
  }) => apiRequest<{ detail: any }>(`/architect/standard-details`, {
    method: 'POST',
    body: data,
  }),

  placeStandardDetail: (standardDetailId: string, data: {
    designProjectId: string
    drawingSheetId?: string
    sheetReference?: string
    customizations?: any
  }) => apiRequest<{ instance: any }>(`/architect/standard-details/${standardDetailId}/place`, {
    method: 'POST',
    body: data,
  }),

  listStandardDetails: (filters?: {
    category?: string
    applicableCode?: string
    applicableProjectType?: string
    search?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.category) params.append('category', filters.category)
    if (filters?.applicableCode) params.append('applicableCode', filters.applicableCode)
    if (filters?.applicableProjectType) params.append('applicableProjectType', filters.applicableProjectType)
    if (filters?.search) params.append('search', filters.search)
    const query = params.toString()
    return apiRequest<{ details: any[] }>(`/architect/standard-details${query ? `?${query}` : ''}`)
  },

  // Performance Benchmarking
  recordBenchmark: (data: {
    designProjectId?: string
    benchmarkType: string
    operationName: string
    operationDuration: number
    fileSize?: number
    fileType?: string
    recordCount?: number
    concurrentUsers?: number
    success?: boolean
    errorMessage?: string
  }) => apiRequest<{ benchmark: any }>(`/architect/performance-benchmarks`, {
    method: 'POST',
    body: data,
  }),

  getBenchmarkStats: (filters?: {
    benchmarkType?: string
    operationName?: string
    startDate?: string
    endDate?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.benchmarkType) params.append('benchmarkType', filters.benchmarkType)
    if (filters?.operationName) params.append('operationName', filters.operationName)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    const query = params.toString()
    return apiRequest<{ stats: any }>(`/architect/performance-benchmarks/stats${query ? `?${query}` : ''}`)
  },
}
