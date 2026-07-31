export type ImmediateDeliveryStatus = 'READY' | 'SOURCE_LIMITED'

export interface ImmediateIntakeDeliverables {
  status: ImmediateDeliveryStatus
  generatedAt: string
  deliveryWindow: 'WITHIN_1_HOUR'
  classification: 'PRELIMINARY'
  sourceBasis: 'CUSTOMER_INTAKE_AND_SEEDED_RULES'
  verificationRequired: true
  projectSummary: {
    projectPath: string
    address: string
    goal: string
    sourceStatus: string
  }
  zoningRequirements: {
    status: 'PRELIMINARY_SOURCE_REVIEW'
    knownInputs: string[]
    requirements: string[]
    verificationItems: string[]
  }
  permitRequirements: {
    status: 'PRELIMINARY_PATH_REVIEW'
    requirements: string[]
    documentsNeeded: string[]
    verificationItems: string[]
  }
  readinessChecklist: Array<{
    key: string
    label: string
    status: 'READY' | 'PENDING_SOURCE' | 'REQUIRES_PROFESSIONAL_REVIEW'
  }>
  limitations: string[]
}

type IntakeValues = Record<string, unknown>

function text(values: IntakeValues, ...keys: string[]) {
  for (const key of keys) {
    const value = values[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function listKnownInputs(values: IntakeValues) {
  return [
    text(values, 'propertyDetails', 'siteDetails'),
    text(values, 'stylePreferences', 'knownConstraints'),
    text(values, 'sourceStatus'),
  ].filter(Boolean)
}

/**
 * Builds the portion of an intake that can be published without human
 * interaction. It is deliberately preliminary: no agency determination,
 * survey validation, professional seal, or permit submission is implied.
 */
export function buildImmediateIntakeDeliverables(input: {
  projectPath: string
  projectAddress: string
  formData?: IntakeValues
  generatedAt?: string
}): ImmediateIntakeDeliverables {
  const values = input.formData ?? {}
  const goal = text(values, 'siteGoal', 'projectDescription', 'primaryScope', 'projectDetails') || 'Project goal supplied during intake.'
  const sourceStatus = text(values, 'sourceStatus') || (Array.isArray(values.uploadedFiles) && values.uploadedFiles.length > 0 ? 'Uploaded source provided' : 'Address and intake data only')
  const knownInputs = listKnownInputs(values)
  const hasSource = Array.isArray(values.uploadedFiles) && values.uploadedFiles.length > 0
  const hasZoningInput = knownInputs.length > 0

  return {
    status: hasSource || hasZoningInput ? 'READY' : 'SOURCE_LIMITED',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    deliveryWindow: 'WITHIN_1_HOUR',
    classification: 'PRELIMINARY',
    sourceBasis: 'CUSTOMER_INTAKE_AND_SEEDED_RULES',
    verificationRequired: true,
    projectSummary: {
      projectPath: input.projectPath,
      address: input.projectAddress,
      goal,
      sourceStatus,
    },
    zoningRequirements: {
      status: 'PRELIMINARY_SOURCE_REVIEW',
      knownInputs,
      requirements: [
        'Confirm jurisdiction and parcel identity against an authoritative source.',
        'Check applicable zoning district, overlays, setbacks, lot coverage, and use limitations.',
        'Compare the proposed scope against the seeded jurisdiction rules and flag likely constraints.',
      ],
      verificationItems: [
        'Current parcel boundary and survey/topographic conditions',
        'Effective zoning text, map, overlays, and exceptions',
        'Agency or HOA requirements not represented in supplied sources',
      ],
    },
    permitRequirements: {
      status: 'PRELIMINARY_PATH_REVIEW',
      requirements: [
        'Identify likely permit types from the stated project scope and jurisdiction.',
        'List likely drawings, forms, surveys, and professional disciplines required before filing.',
        'Flag whether zoning, historic, environmental, utility, or site-plan review may be triggered.',
      ],
      documentsNeeded: [
        'Project scope and dimensions',
        'Available survey, plat, parcel, or existing-plan source',
        'Jurisdiction-specific application and professional-review requirements',
      ],
      verificationItems: [
        'Current agency checklist, fees, and filing route',
        'Whether the jurisdiction accepts the proposed scope without additional review',
        'Licensed professional scope, stamp, or seal requirements',
      ],
    },
    readinessChecklist: [
      { key: 'project-summary', label: 'Project summary generated', status: 'READY' },
      { key: 'source-status', label: 'Source-status record generated', status: hasSource ? 'READY' : 'PENDING_SOURCE' },
      { key: 'zoning-screen', label: 'Preliminary zoning screen generated', status: 'READY' },
      { key: 'permit-path', label: 'Preliminary permit-path checklist generated', status: 'READY' },
      { key: 'professional-review', label: 'Professional verification and release', status: 'REQUIRES_PROFESSIONAL_REVIEW' },
    ],
    limitations: [
      'Preliminary source-based guidance is not a boundary survey, code opinion, permit approval, seal, or permit submission.',
      'The full site-plan drawing package, concept images, video, CAD, and professional review remain on their published timeline.',
    ],
  }
}
