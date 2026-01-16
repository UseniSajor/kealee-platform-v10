import { prisma } from '@kealee/database'
import { NotFoundError, ValidationError } from '../../errors/app.error'

// State-specific compliance requirements
type StateCompliance = {
  state: string
  requiredDisclosures: string[]
  statutoryLanguage: string
  minContractAmount?: number
  maxContractAmount?: number
  requiresWitness: boolean
  requiredSigners: string[] // e.g., ["owner", "contractor"]
  retentionYears: number
}

// Simplified compliance rules (in production, these would come from a database or external service)
const STATE_COMPLIANCE_RULES: Record<string, StateCompliance> = {
  CA: {
    state: 'CA',
    requiredDisclosures: [
      'Right to cancel within 3 business days',
      'Contractor license information',
      'Mechanics lien warning',
      'Bond information',
    ],
    statutoryLanguage: `
      California Law: This contract is subject to the Home Improvement Contractors Act. 
      You have the right to cancel this contract within three (3) business days. 
      Contractor's license number must be displayed.
    `,
    minContractAmount: 0,
    requiresWitness: false,
    requiredSigners: ['owner', 'contractor'],
    retentionYears: 7,
  },
  TX: {
    state: 'TX',
    requiredDisclosures: [
      'Mechanics lien warning',
      'Contractor registration information',
      'Payment schedule disclosure',
    ],
    statutoryLanguage: `
      Texas Law: This contract is subject to Texas Property Code. 
      A mechanics lien may be placed on your property if payment is not made.
      Contractor registration number: [REQUIRED].
    `,
    minContractAmount: 0,
    requiresWitness: false,
    requiredSigners: ['owner', 'contractor'],
    retentionYears: 4,
  },
  FL: {
    state: 'FL',
    requiredDisclosures: [
      'Right to cancel within 7 calendar days',
      'Contractor license information',
      'Insurance information',
      'Workers compensation disclosure',
    ],
    statutoryLanguage: `
      Florida Law: This contract is subject to Chapter 489, Florida Statutes. 
      You have the right to cancel this contract within seven (7) calendar days. 
      Contractor license number and insurance information must be provided.
    `,
    minContractAmount: 0,
    requiresWitness: false,
    requiredSigners: ['owner', 'contractor'],
    retentionYears: 5,
  },
  NY: {
    state: 'NY',
    requiredDisclosures: [
      'Right to cancel within 3 business days',
      'Contractor license information',
      'Insurance and bonding information',
      'Mechanics lien warning',
    ],
    statutoryLanguage: `
      New York Law: This contract is subject to New York State Home Improvement Contract Law. 
      You have the right to cancel this contract within three (3) business days.
      Contractor must provide proof of insurance and bonding.
    `,
    minContractAmount: 500,
    requiresWitness: false,
    requiredSigners: ['owner', 'contractor'],
    retentionYears: 6,
  },
  MD: {
    state: 'MD',
    requiredDisclosures: [
      'Right to cancel within 3 business days',
      'Contractor license information',
      'Mechanics lien warning',
    ],
    statutoryLanguage: `
      Maryland Law: This contract is subject to the Maryland Home Improvement Law. 
      You have the right to cancel this contract within three (3) business days.
      Contractor's license number must be displayed.
    `,
    minContractAmount: 0,
    requiresWitness: false,
    requiredSigners: ['owner', 'contractor'],
    retentionYears: 5,
  },
}

// Default compliance (used when state is not in our rules)
const DEFAULT_COMPLIANCE: StateCompliance = {
  state: 'US',
  requiredDisclosures: [
    'Contractor license information',
    'Payment terms',
  ],
  statutoryLanguage: `
    General Terms: This contract is subject to local and state laws. 
    Please consult with legal counsel if you have questions.
  `,
  minContractAmount: 0,
  requiresWitness: false,
  requiredSigners: ['owner', 'contractor'],
  retentionYears: 7, // Default to longest retention period
}

export const contractComplianceService = {
  async validateContract(contractId: string): Promise<{
    isValid: boolean
    errors: string[]
    warnings: string[]
    requiredDisclosures: string[]
    suggestedLanguage: string
    complianceInfo: StateCompliance
  }> {
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            property: {
              select: { state: true },
            },
          },
        },
        owner: { select: { id: true } },
        contractor: { select: { id: true } },
        milestones: { select: { amount: true } },
      },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)

    const state = contract.project.property?.state || 'US'
    const complianceRules = STATE_COMPLIANCE_RULES[state] || DEFAULT_COMPLIANCE

    const errors: string[] = []
    const warnings: string[] = []

    // Test 1: Contract amount validation (Prompt 2.7)
    const totalAmount = contract.totalAmount ? Number(contract.totalAmount) : 0
    if (complianceRules.minContractAmount !== undefined && totalAmount < complianceRules.minContractAmount) {
      errors.push(`Contract amount ($${totalAmount}) is below the minimum required for ${state} ($${complianceRules.minContractAmount})`)
    }
    if (complianceRules.maxContractAmount !== undefined && totalAmount > complianceRules.maxContractAmount) {
      warnings.push(`Contract amount exceeds typical maximum for ${state}. Additional disclosures may be required.`)
    }

    // Test 2: Signature requirement validation (Prompt 2.7)
    if (complianceRules.requiredSigners.includes('contractor') && !contract.contractorId) {
      errors.push(`Contractor signature is required for contracts in ${state}`)
    }
    if (complianceRules.requiredSigners.includes('owner') && !contract.ownerId) {
      errors.push(`Owner signature is required for contracts in ${state}`)
    }
    if (complianceRules.requiresWitness) {
      warnings.push(`Witness signature may be required for contracts in ${state}`)
    }

    // Test 3: Required disclosures validation (Prompt 2.7)
    const missingDisclosures: string[] = []
    const contractTerms = (contract.terms || '').toLowerCase()
    for (const disclosure of complianceRules.requiredDisclosures) {
      const disclosureKeywords = disclosure.toLowerCase().split(' ')
      const found = disclosureKeywords.some((keyword) => contractTerms.includes(keyword))
      if (!found) {
        missingDisclosures.push(disclosure)
        warnings.push(`Required disclosure missing: "${disclosure}"`)
      }
    }

    // Test 4: Check if statutory language is included (Prompt 2.7)
    const hasStatutoryLanguage = contractTerms.includes(complianceRules.statutoryLanguage.toLowerCase().split('\n')[1].trim())
    if (!hasStatutoryLanguage) {
      warnings.push(`Statutory language for ${state} should be included in contract terms`)
    }

    // Suggested language (automatic inclusion)
    let suggestedLanguage = complianceRules.statutoryLanguage
    if (!contract.terms?.includes(complianceRules.statutoryLanguage)) {
      suggestedLanguage = `${contract.terms || ''}\n\n${complianceRules.statutoryLanguage}`
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredDisclosures: complianceRules.requiredDisclosures,
      suggestedLanguage,
      complianceInfo: complianceRules,
    }
  },

  async addStatutoryLanguage(contractId: string, autoAppend: boolean = false): Promise<{ terms: string }> {
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            property: {
              select: { state: true },
            },
          },
        },
      },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)

    const state = contract.project.property?.state || 'US'
    const complianceRules = STATE_COMPLIANCE_RULES[state] || DEFAULT_COMPLIANCE

    let updatedTerms = contract.terms || ''
    
    // Check if statutory language already exists
    const hasStatutoryLanguage = updatedTerms.includes(complianceRules.statutoryLanguage.trim())
    
    if (!hasStatutoryLanguage) {
      if (autoAppend) {
        updatedTerms = `${updatedTerms}\n\n<!-- State-Specific Statutory Language for ${state} -->\n${complianceRules.statutoryLanguage}`
      } else {
        // Return suggested language without updating
        updatedTerms = `${updatedTerms}\n\n${complianceRules.statutoryLanguage}`
      }
    }

    if (autoAppend) {
      await prisma.contractAgreement.update({
        where: { id: contractId },
        data: { terms: updatedTerms },
      })
    }

    return { terms: updatedTerms }
  },

  async getStateCompliance(state: string): Promise<StateCompliance> {
    return STATE_COMPLIANCE_RULES[state] || DEFAULT_COMPLIANCE
  },

  async checkDocumentRetention(contractId: string): Promise<{
    retentionYears: number
    expiresAt: Date | null
    shouldRetain: boolean
  }> {
    const contract = await prisma.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        project: {
          include: {
            property: {
              select: { state: true },
            },
          },
        },
      },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)

    const state = contract.project.property?.state || 'US'
    const complianceRules = STATE_COMPLIANCE_RULES[state] || DEFAULT_COMPLIANCE

    const retentionYears = complianceRules.retentionYears
    const signedDate = contract.status === 'SIGNED' || contract.status === 'ACTIVE' ? contract.updatedAt : null
    const expiresAt = signedDate
      ? new Date(signedDate.getTime() + retentionYears * 365 * 24 * 60 * 60 * 1000)
      : null

    const shouldRetain = expiresAt ? expiresAt > new Date() : true

    return {
      retentionYears,
      expiresAt,
      shouldRetain,
    }
  },
}
