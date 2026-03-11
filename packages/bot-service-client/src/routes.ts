/**
 * Centralized route definitions mapping KeaBot domains to OS API endpoints.
 * This is the single source of truth for bot → service routing.
 */

export const SERVICE_ROUTES = {
  // ──────────────────── Command / Orchestration ────────────────────
  command: {
    projectStatus: (projectId: string) => `/api/v1/twins/project/${projectId}`,
    twinHealth: (projectId: string) => `/api/v1/twins/project/${projectId}`,
    listBots: () => `/health`,
  },

  // ──────────────────── Owner ────────────────────
  projects: {
    list: () => `/projects`,
    detail: (projectId: string) => `/projects/${projectId}`,
    milestones: (projectId: string) => `/api/v1/payments/projects/${projectId}/milestones`,
    budget: (projectId: string) => `/api/v1/payments/projects/${projectId}/summary`,
    timeline: (projectId: string) => `/pm/schedule`,
  },

  // ──────────────────── GC / Bids ────────────────────
  bids: {
    list: () => `/bids`,
    detail: (bidId: string) => `/bids/${bidId}`,
    create: () => `/bids`,
    evaluate: (bidId: string) => `/bids/${bidId}/evaluate`,
    analyze: (bidId: string) => `/bids/${bidId}/analyze`,
    pipeline: () => `/bids/pipeline`,
  },

  compliance: {
    status: (userId: string) => `/compliance/monitoring/status/${userId}`,
    preContract: () => `/compliance/monitoring/pre-contract`,
    prePayment: () => `/compliance/monitoring/pre-payment`,
    alerts: () => `/compliance/monitoring/alerts`,
  },

  // ──────────────────── Construction ────────────────────
  pm: {
    stats: () => `/pm/stats`,
    tasks: () => `/pm/tasks`,
    taskDetail: (taskId: string) => `/pm/tasks/${taskId}`,
    schedule: () => `/pm/schedule`,
    dailyLogs: () => `/pm/daily-logs`,
    inspections: () => `/pm/inspections`,
    budget: () => `/pm/budget`,
  },

  // ──────────────────── Land ────────────────────
  land: {
    parcels: () => `/api/v1/land/parcels`,
    parcelDetail: (parcelId: string) => `/api/v1/land/parcels/${parcelId}`,
    addZoning: (parcelId: string) => `/api/v1/land/parcels/${parcelId}/zoning`,
    createAssessment: (parcelId: string) => `/api/v1/land/parcels/${parcelId}/assessments`,
  },

  // ──────────────────── Feasibility ────────────────────
  feasibility: {
    studies: () => `/api/v1/feasibility/studies`,
    studyDetail: (studyId: string) => `/api/v1/feasibility/studies/${studyId}`,
    addScenario: (studyId: string) => `/api/v1/feasibility/studies/${studyId}/scenarios`,
    generateProforma: (scenarioId: string) => `/api/v1/feasibility/studies/scenarios/${scenarioId}/proforma`,
    addCosts: (studyId: string) => `/api/v1/feasibility/studies/${studyId}/costs`,
    addRevenue: (studyId: string) => `/api/v1/feasibility/studies/${studyId}/revenue`,
    decide: (studyId: string) => `/api/v1/feasibility/studies/${studyId}/decide`,
  },

  // ──────────────────── Finance / Development ────────────────────
  dev: {
    capitalStack: (projectId: string) => `/api/v1/dev/capital-stacks/${projectId}`,
    createCapitalStack: () => `/api/v1/dev/capital-stacks`,
    draws: (stackId: string) => `/api/v1/dev/capital-stacks/${stackId}/draws`,
    submitDraw: (drawId: string) => `/api/v1/dev/draws/${drawId}/submit`,
    investorReports: (projectId: string) => `/api/v1/dev/investor-reports/${projectId}`,
    createInvestorReport: () => `/api/v1/dev/investor-reports`,
    entitlements: (projectId: string) => `/api/v1/dev/entitlements/${projectId}`,
    createEntitlement: () => `/api/v1/dev/entitlements`,
  },

  // ──────────────────── Permit ────────────────────
  permits: {
    list: () => `/permits`,
    detail: (permitId: string) => `/permits/${permitId}`,
    dashboard: () => `/permits/dashboard`,
    inspections: (permitId: string) => `/permits/${permitId}/inspections`,
    scheduleInspection: (permitId: string) => `/permits/${permitId}/inspections`,
    submit: (permitId: string) => `/permits/${permitId}/submit`,
  },

  // ──────────────────── Estimate ────────────────────
  estimation: {
    estimate: () => `/estimation/estimate`,
    labor: () => `/estimation/labor`,
    materials: () => `/estimation/materials`,
    timeline: () => `/estimation/timeline`,
    projectEstimate: (projectId: string) => `/estimation/project/${projectId}`,
  },

  // ──────────────────── Payments ────────────────────
  payments: {
    milestones: (projectId: string) => `/api/v1/payments/projects/${projectId}/milestones`,
    payMilestone: (projectId: string, milestoneId: string) =>
      `/api/v1/payments/projects/${projectId}/milestones/${milestoneId}/pay`,
    escrow: (projectId: string) => `/api/v1/payments/projects/${projectId}/escrow`,
    deposit: (projectId: string) => `/api/v1/payments/projects/${projectId}/escrow/deposit`,
    draws: (projectId: string) => `/api/v1/payments/projects/${projectId}/draws`,
    lienWaivers: (projectId: string) => `/api/v1/payments/projects/${projectId}/lien-waivers`,
    summary: (projectId: string) => `/api/v1/payments/projects/${projectId}/summary`,
    reconciliation: () => `/api/v1/payments/reconciliation`,
  },

  // ──────────────────── Marketplace ────────────────────
  marketplace: {
    contractors: () => `/api/v1/marketplace/contractors`,
    contractorDetail: (contractorId: string) => `/api/v1/marketplace/contractors/${contractorId}`,
    invite: (contractorId: string) => `/api/v1/marketplace/contractors/${contractorId}/invite`,
  },

  // ──────────────────── Operations ────────────────────
  ops: {
    checklists: () => `/api/v1/ops/checklists`,
    checklistDetail: (checklistId: string) => `/api/v1/ops/checklists/${checklistId}`,
    addChecklistItem: (checklistId: string) => `/api/v1/ops/checklists/${checklistId}/items`,
    workOrders: () => `/api/v1/ops/work-orders`,
    maintenanceSchedules: () => `/api/v1/ops/maintenance/schedules`,
    escrowReconciliations: () => `/api/v1/ops/escrow-reconciliations`,
  },

  // ──────────────────── Digital Twin ────────────────────
  twins: {
    detail: (twinId: string) => `/api/v1/twins/${twinId}`,
    byProject: (projectId: string) => `/api/v1/twins/project/${projectId}`,
    list: () => `/api/v1/twins`,
    kpis: (twinId: string) => `/api/v1/twins/${twinId}/kpis`,
    timeline: (twinId: string) => `/api/v1/twins/${twinId}/timeline`,
  },
} as const;
