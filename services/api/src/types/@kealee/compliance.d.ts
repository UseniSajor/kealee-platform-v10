declare module '@kealee/compliance' {
  export interface ComplianceGate {
    id: string
    name: string
    description?: string
    phase: string
    required: boolean
  }

  export interface GateCheckParams {
    projectId: string
    milestoneId?: string
    paymentId?: string
  }

  export interface GateCheckResult {
    passed: boolean
    errors?: string[]
    warnings?: string[]
    metadata?: Record<string, any>
  }

  export class ComplianceError extends Error {
    constructor(message: string, public gateId: string, public details?: any)
  }

  export const COMPLIANCE_GATES: ComplianceGate[]

  export function getAvailableGates(): ComplianceGate[]
  export function checkGate(gateId: string, params: GateCheckParams): Promise<GateCheckResult>
  export function checkAllGates(phase: string, params: GateCheckParams): Promise<GateCheckResult[]>
}

