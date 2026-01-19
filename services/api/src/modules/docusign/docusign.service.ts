// @ts-ignore - docusign-esign doesn't have TypeScript definitions
import { ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients } from 'docusign-esign'
import { prismaAny } from '../../utils/prisma-helper'
import { NotFoundError } from '../../errors/app.error'

// DocuSign configuration
const DOCUSIGN_INTEGRATION_KEY = process.env.DOCUSIGN_INTEGRATION_KEY || ''
const DOCUSIGN_USER_ID = process.env.DOCUSIGN_USER_ID || ''
const DOCUSIGN_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID || ''
const DOCUSIGN_RSA_PRIVATE_KEY = process.env.DOCUSIGN_RSA_PRIVATE_KEY || ''
const DOCUSIGN_BASE_PATH = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi'
const DOCUSIGN_OAUTH_BASE_PATH = process.env.DOCUSIGN_OAUTH_BASE_PATH || 'account-d.docusign.com'

async function getDocuSignApiClient(): Promise<ApiClient> {
  const apiClient = new ApiClient()
  apiClient.setBasePath(DOCUSIGN_BASE_PATH)
  apiClient.setOAuthBasePath(DOCUSIGN_OAUTH_BASE_PATH)

  // JWT authentication (recommended for server-to-server)
  if (DOCUSIGN_INTEGRATION_KEY && DOCUSIGN_USER_ID && DOCUSIGN_RSA_PRIVATE_KEY) {
    const jwtLifeSec = 3600 // Token lifetime: 1 hour
    const results = await apiClient.requestJWTUserToken(
      DOCUSIGN_INTEGRATION_KEY,
      DOCUSIGN_USER_ID,
      'signature impersonation',
      Buffer.from(DOCUSIGN_RSA_PRIVATE_KEY.replace(/\\n/g, '\n')),
      jwtLifeSec
    )

    const accessToken = results.body.access_token
    apiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)
  }

  return apiClient
}

export const docusignService = {
  async createEnvelope(
    contractId: string,
    userId: string
  ): Promise<{ envelopeId: string; recipientViewUrl?: string }> {
    // Get contract with related data
    const contract = await prismaAny.contractAgreement.findUnique({
      where: { id: contractId },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contractor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (!contract) throw new NotFoundError('ContractAgreement', contractId)
    if (contract.ownerId !== userId) {
      throw new Error('Only the contract owner can send for signature')
    }

    if (!contract.terms) {
      throw new Error('Contract terms are required')
    }

    // Convert HTML terms to PDF (in production, use a proper HTML-to-PDF converter)
    // For now, we'll create a simple text document
    const documentContent = this.convertTermsToDocument(contract.terms)

    // Create envelope definition
    const envelope = new EnvelopeDefinition()
    envelope.emailSubject = `Contract for ${contract.project.name} - Please Sign`

    // Add document
    const document = new Document()
    document.documentBase64 = Buffer.from(documentContent).toString('base64')
    document.name = `Contract_${contractId}.txt`
    document.fileExtension = 'txt'
    document.documentId = '1'
    envelope.documents = [document]

    // Add signers
    const recipients = new Recipients()
    const signers: Signer[] = []

    // Owner signs first
    const ownerSigner = new Signer()
    ownerSigner.email = contract.owner.email
    ownerSigner.name = contract.owner.name
    ownerSigner.recipientId = '1'
    ownerSigner.routingOrder = '1'

    const ownerSignHere = new SignHere()
    ownerSignHere.documentId = '1'
    ownerSignHere.pageNumber = '1'
    ownerSignHere.recipientId = '1'
    ownerSignHere.xPosition = '100'
    ownerSignHere.yPosition = '100'
    ownerSigner.tabs = new Tabs()
    ownerSigner.tabs.signHereTabs = [ownerSignHere]

    signers.push(ownerSigner)

    // Contractor signs second (if assigned)
    if (contract.contractor) {
      const contractorSigner = new Signer()
      contractorSigner.email = contract.contractor.email
      contractorSigner.name = contract.contractor.name
      contractorSigner.recipientId = '2'
      contractorSigner.routingOrder = '2'

      const contractorSignHere = new SignHere()
      contractorSignHere.documentId = '1'
      contractorSignHere.pageNumber = '1'
      contractorSignHere.recipientId = '2'
      contractorSignHere.xPosition = '100'
      contractorSignHere.yPosition = '200'

      contractorSigner.tabs = new Tabs()
      contractorSigner.tabs.signHereTabs = [contractorSignHere]

      signers.push(contractorSigner)
    }

    recipients.signers = signers
    envelope.recipients = recipients

    envelope.status = 'sent'

    // Create envelope via DocuSign API
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)
    const results = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, { envelopeDefinition: envelope })

    const envelopeId = results.envelopeId || ''

    // Update contract with envelope ID
    await prismaAny.contractAgreement.update({
      where: { id: contractId },
      data: {
        docusignEnvelopeId: envelopeId,
        status: 'SENT',
      },
    })

    // Get recipient view URL for embedded signing (optional)
    let recipientViewUrl: string | undefined
    try {
      const viewRequest = {
        authenticationMethod: 'none' as const,
        email: contract.owner.email,
        userName: contract.owner.name,
        recipientId: '1',
        clientUserId: contract.owner.id,
        returnUrl: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/contracts/${contractId}/signed`,
      }

      const viewResults = await envelopesApi.createRecipientView(DOCUSIGN_ACCOUNT_ID, envelopeId, { recipientViewRequest: viewRequest })
      recipientViewUrl = viewResults.url
    } catch (error) {
      // If embedded signing fails, continue without it
      console.error('Failed to create recipient view:', error)
    }

    return { envelopeId, recipientViewUrl }
  },

  async getEnvelopeStatus(envelopeId: string) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)
    const envelope = await envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId)

    return {
      status: envelope.status,
      statusChangedDateTime: envelope.statusChangedDateTime,
      completedDateTime: envelope.completedDateTime,
      recipients: envelope.recipients,
    }
  },

  async getSignedDocument(envelopeId: string, documentId: string = 'combined') {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)
    const pdfBytes = await envelopesApi.getDocument(DOCUSIGN_ACCOUNT_ID, envelopeId, documentId)

    return Buffer.from(pdfBytes as any)
  },

  async handleWebhook(payload: any) {
    // DocuSign webhook payload structure
    const envelopeId = payload.data?.envelopeId
    if (!envelopeId) return

    // Find contract by envelope ID
    const contract = await prismaAny.contractAgreement.findFirst({
      where: { docusignEnvelopeId: envelopeId },
    })

    if (!contract) return

    // Map DocuSign status to our contract status
    let contractStatus: string = 'SENT'

    const event = payload.event
    if (event === 'envelope-completed') {
      contractStatus = 'SIGNED'
      // Get signed document URL
      const documentUrl = `${process.env.DOCUSIGN_BASE_PATH}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/documents/combined`
      
      // Update contract status
      await prismaAny.contractAgreement.update({
        where: { id: contract.id },
        data: {
          status: 'ACTIVE',
          signedAt: new Date(),
          signedDocumentUrl: documentUrl,
        },
      })

      // Update project status to ACTIVE
      await prismaAny.project.update({
        where: { id: contract.projectId },
        data: {
          status: 'ACTIVE',
        },
      })

      // Create audit log
      await prismaAny.auditLog.create({
        data: {
          entityType: 'ContractAgreement',
          entityId: contract.id,
          action: 'CONTRACT_SIGNED',
          details: {
            envelopeId,
            signedAt: new Date(),
          },
          userId: contract.ownerId,
          reason: 'Contract signed via DocuSign',
        },
      })

      // Create event
      await prismaAny.event.create({
        data: {
          entityType: 'ContractAgreement',
          entityId: contract.id,
          type: 'CONTRACT_SIGNED',
          payload: {
            envelopeId,
            projectId: contract.projectId,
          },
          userId: contract.ownerId,
        },
      })
    } else if (event === 'recipient-signed') {
      // Keep as SENT until all parties sign
      contractStatus = 'SENT'
      await prismaAny.contractAgreement.update({
        where: { id: contract.id },
        data: { status: contractStatus },
      })
    } else if (event === 'envelope-sent') {
      contractStatus = 'SENT'
      await prismaAny.contractAgreement.update({
        where: { id: contract.id },
        data: { status: contractStatus },
      })
    }
  },

  convertTermsToDocument(terms: string): string {
    // Simple HTML to plain text conversion
    // In production, use a proper HTML-to-PDF converter like Puppeteer or pdfkit
    const textContent = terms
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')

    return `CONTRACT AGREEMENT

${textContent}

_________________________________
Signature
`
  },
}
