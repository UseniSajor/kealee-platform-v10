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

  /**
   * Create document template
   */
  async createDocumentTemplate(data: {
    name: string
    description?: string
    templateContent: string
    signerRoles: string[]
    fields?: Array<{
      role: string
      fieldType: 'signature' | 'date' | 'text' | 'checkbox'
      x: number
      y: number
      page: number
      width?: number
      height?: number
      required?: boolean
    }>
    metadata?: Record<string, any>
  }) {
    // Store template in database (using ContractTemplate or create new DocuSignTemplate model)
    const template = await prismaAny.contractTemplate.create({
      data: {
        name: data.name,
        description: data.description || null,
        content: data.templateContent,
        signerRoles: data.signerRoles,
        templateFields: data.fields || [],
        metadata: data.metadata || {},
        status: 'ACTIVE',
      },
    })

    return template
  },

  /**
   * Get document template
   */
  async getDocumentTemplate(templateId: string) {
    const template = await prismaAny.contractTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      throw new NotFoundError('ContractTemplate', templateId)
    }

    return template
  },

  /**
   * List document templates
   */
  async listDocumentTemplates(filters?: {
    status?: string
    limit?: number
    offset?: number
  }) {
    const where: any = {}
    if (filters?.status) {
      where.status = filters.status
    }

    const templates = await prismaAny.contractTemplate.findMany({
      where,
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
      orderBy: { createdAt: 'desc' },
    })

    const total = await prismaAny.contractTemplate.count({ where })

    return {
      templates,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  },

  /**
   * Get detailed envelope status with recipient information
   */
  async getDetailedEnvelopeStatus(envelopeId: string) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)
    
    // Get envelope
    const envelope = await envelopesApi.getEnvelope(DOCUSIGN_ACCOUNT_ID, envelopeId)
    
    // Get recipients
    const recipients = await envelopesApi.listRecipients(DOCUSIGN_ACCOUNT_ID, envelopeId)
    
    // Get documents
    const documents = await envelopesApi.listDocuments(DOCUSIGN_ACCOUNT_ID, envelopeId)

    return {
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      statusChangedDateTime: envelope.statusChangedDateTime,
      completedDateTime: envelope.completedDateTime,
      sentDateTime: envelope.sentDateTime,
      recipients: recipients.signers?.map((signer: any) => ({
        recipientId: signer.recipientId,
        email: signer.email,
        name: signer.name,
        status: signer.status,
        signedDateTime: signer.signedDateTime,
        deliveredDateTime: signer.deliveredDateTime,
      })) || [],
      documents: documents.envelopeDocuments?.map((doc: any) => ({
        documentId: doc.documentId,
        name: doc.name,
        uri: doc.uri,
      })) || [],
    }
  },

  /**
   * Track document status changes
   */
  async trackDocumentStatus(envelopeId: string) {
    // Get contract by envelope ID
    const contract = await prismaAny.contractAgreement.findFirst({
      where: { docusignEnvelopeId: envelopeId },
      include: {
        project: { select: { id: true, name: true } },
      },
    })

    if (!contract) {
      throw new NotFoundError('ContractAgreement', envelopeId)
    }

    // Get detailed status
    const status = await this.getDetailedEnvelopeStatus(envelopeId)

    // Update contract status based on envelope status
    let contractStatus = contract.status
    if (status.status === 'completed') {
      contractStatus = 'ACTIVE'
    } else if (status.status === 'sent' || status.status === 'delivered') {
      contractStatus = 'SENT'
    }

    // Update contract record
    await prismaAny.contractAgreement.update({
      where: { id: contract.id },
      data: {
        status: contractStatus,
        ...(status.status === 'completed' && status.completedDateTime ? {
          signedAt: new Date(status.completedDateTime),
        } : {}),
        metadata: {
          ...(contract.metadata as any || {}),
          docusignStatus: status.status,
          lastStatusCheck: new Date().toISOString(),
          recipients: status.recipients,
        },
      },
    })

    // Create status tracking event
    await prismaAny.event.create({
      data: {
        entityType: 'ContractAgreement',
        entityId: contract.id,
        type: `DOCUSIGN_STATUS_${status.status.toUpperCase()}`,
        payload: {
          envelopeId,
          status: status.status,
          recipients: status.recipients,
        },
        userId: contract.ownerId,
      },
    })

    return {
      contractId: contract.id,
      envelopeId,
      status: status.status,
      contractStatus,
      recipients: status.recipients,
    }
  },

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthUrl(redirectUri: string) {
    const apiClient = new ApiClient()
    apiClient.setBasePath(DOCUSIGN_BASE_PATH)
    apiClient.setOAuthBasePath(DOCUSIGN_OAUTH_BASE_PATH)

    const scopes = ['signature', 'impersonation']
    const authUrl = apiClient.getJWTUri(
      DOCUSIGN_INTEGRATION_KEY,
      redirectUri,
      DOCUSIGN_BASE_PATH,
      scopes
    )

    return { authUrl }
  },

  /**
   * Create envelope from template (general purpose, not contract-specific)
   */
  async createEnvelopeFromTemplate(data: {
    templateId: string
    recipientEmail: string
    recipientName: string
    documentName?: string
    customFields?: Record<string, any>
    userId: string
    userEmail?: string
    embeddedSigning?: boolean
    returnUrl?: string
  }) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    // Create envelope definition
    const envelopeDefinition = new EnvelopeDefinition()
    envelopeDefinition.templateId = data.templateId
    envelopeDefinition.emailSubject = data.documentName || `Document to sign from ${process.env.APP_NAME || 'Kealee'}`
    envelopeDefinition.emailBlurb = `Please sign this document. Sent via ${process.env.APP_NAME || 'Kealee'}`

    // Add template role
    const signer = new Signer()
    signer.email = data.recipientEmail
    signer.name = data.recipientName
    signer.roleName = 'Signer'
    
    if (data.embeddedSigning) {
      signer.clientUserId = data.userId
    }

    // Add custom fields if provided
    if (data.customFields && Object.keys(data.customFields).length > 0) {
      const textCustomFields = Object.entries(data.customFields).map(([key, value]) => ({
        name: key,
        value: String(value),
        required: 'false',
        show: 'true',
      }))

      envelopeDefinition.customFields = {
        textCustomFields,
      } as any
    }

    envelopeDefinition.templateRoles = [signer as any]
    envelopeDefinition.status = 'sent'

    // Create the envelope
    const envelope = await envelopesApi.createEnvelope(DOCUSIGN_ACCOUNT_ID, { envelopeDefinition })

    let signingUrl: string | undefined
    let expiresAt: string | undefined

    // Create signing URL for embedded signing if requested
    if (data.embeddedSigning) {
      const recipientViewRequest = {
        authenticationMethod: 'none' as const,
        returnUrl: data.returnUrl || `${process.env.APP_BASE_URL || 'http://localhost:3000'}/documents/signed`,
        email: data.recipientEmail,
        userName: data.recipientName,
        clientUserId: data.userId,
      }

      const viewUrl = await envelopesApi.createRecipientView(DOCUSIGN_ACCOUNT_ID, envelope.envelopeId || '', { recipientViewRequest })
      signingUrl = viewUrl.url
      expiresAt = viewUrl.expiredDateTime
    }

    // Save to database (if Document model exists)
    try {
      await prismaAny.document.create({
        data: {
          envelopeId: envelope.envelopeId || '',
          userId: data.userId,
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          templateId: data.templateId,
          status: envelope.status || 'sent',
          signingUrl: signingUrl || null,
          metadata: {
            customFields: data.customFields || {},
            documentName: data.documentName,
          },
        },
      })
    } catch (error: any) {
      // If Document model doesn't exist, just log
      if (error.message?.includes('model')) {
        console.warn('Document model not found, skipping database save')
      } else {
        throw error
      }
    }

    return {
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      signingUrl,
      expiresAt,
    }
  },

  /**
   * List envelopes for user
   */
  async listEnvelopes(filters?: {
    fromDate?: Date
    status?: string
    limit?: number
  }) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    const fromDate = filters?.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
    const status = filters?.status || 'completed,sent,delivered,signed'

    const envelopes = await envelopesApi.listStatusChanges(DOCUSIGN_ACCOUNT_ID, {
      fromDate: fromDate.toISOString(),
      status,
      count: filters?.limit || 100,
    })

    const formattedEnvelopes = (envelopes.envelopes || []).map((envelope: any) => ({
      envelopeId: envelope.envelopeId,
      status: envelope.status,
      createdDateTime: envelope.createdDateTime,
      sentDateTime: envelope.sentDateTime,
      completedDateTime: envelope.completedDateTime,
      subject: envelope.emailSubject,
      recipients: envelope.recipients,
    }))

    return { envelopes: formattedEnvelopes }
  },

  /**
   * Get document download URL/info
   */
  async getDocumentInfo(envelopeId: string, documentId: string = 'combined') {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    const document = await envelopesApi.getDocument(DOCUSIGN_ACCOUNT_ID, envelopeId, documentId)

    return {
      documentId,
      name: (document as any).name || `document_${documentId}`,
      type: (document as any).type || 'pdf',
      uri: (document as any).uri || `${DOCUSIGN_BASE_PATH}/accounts/${DOCUSIGN_ACCOUNT_ID}/envelopes/${envelopeId}/documents/${documentId}`,
    }
  },

  /**
   * Void envelope
   */
  async voidEnvelope(envelopeId: string, reason: string = 'Voided by user request', userId: string) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    const voidRequest = new EnvelopeDefinition()
    voidRequest.status = 'voided'
    ;(voidRequest as any).voidedReason = reason

    const result = await envelopesApi.update(DOCUSIGN_ACCOUNT_ID, envelopeId, { envelope: voidRequest as any })

    // Update database
    try {
      await prismaAny.document.updateMany({
        where: { envelopeId },
        data: {
          status: 'voided',
          metadata: {
            voidedReason: reason,
            voidedAt: new Date().toISOString(),
            voidedBy: userId,
          },
        },
      })
    } catch (error: any) {
      if (!error.message?.includes('model')) {
        throw error
      }
    }

    return result
  },

  /**
   * Send reminder for envelope
   */
  async remindEnvelope(envelopeId: string, reminderDelay: string = '1', reminderFrequency: string = '2') {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    const reminderRequest = {
      reminderEnabled: 'true',
      reminderDelay,
      reminderFrequency,
    }

    const result = await envelopesApi.updateReminders(DOCUSIGN_ACCOUNT_ID, envelopeId, { reminders: reminderRequest as any })

    return result
  },

  /**
   * Resend envelope
   */
  async resendEnvelope(envelopeId: string) {
    const apiClient = await getDocuSignApiClient()
    const envelopesApi = new EnvelopesApi(apiClient)

    const result = await envelopesApi.updateRecipients(DOCUSIGN_ACCOUNT_ID, envelopeId, { resendEnvelope: 'true' })

    // Update database
    try {
      await prismaAny.document.updateMany({
        where: { envelopeId },
        data: {
          status: 'resent',
          metadata: {
            resentAt: new Date().toISOString(),
          },
        },
      })
    } catch (error: any) {
      if (!error.message?.includes('model')) {
        throw error
      }
    }

    return result
  },

  /**
   * Handle DocuSign callback (OAuth redirect or signing completion)
   */
  async handleCallback(data: {
    envelopeId?: string
    event?: string
    state?: string
    userId: string
  }) {
    // If envelopeId and event are provided, this is a signing completion callback
    if (data.envelopeId && data.event === 'signing_complete') {
      // Check if this is a contract envelope
      const contract = await prismaAny.contractAgreement.findFirst({
        where: { docusignEnvelopeId: data.envelopeId },
        include: {
          project: { select: { id: true, name: true } },
        },
      })

      if (contract) {
        // Get project with orgId
        const project = await prismaAny.project.findUnique({
          where: { id: contract.projectId },
          select: { id: true, orgId: true },
        })

        // Update contract status
        await prismaAny.contractAgreement.update({
          where: { id: contract.id },
          data: {
            status: 'ACTIVE',
            signedAt: new Date(),
          },
        })

        // Update project status to ACTIVE if contract is signed
        await prismaAny.project.update({
          where: { id: contract.projectId },
          data: {
            status: 'ACTIVE',
          },
        })

        // Create contract signed event
        await prismaAny.event.create({
          data: {
            entityType: 'ContractAgreement',
            entityId: contract.id,
            type: 'CONTRACT_SIGNED',
            payload: {
              envelopeId: data.envelopeId,
              contractId: contract.id,
              projectId: contract.projectId,
              event: data.event,
            },
            userId: data.userId,
            orgId: project?.orgId || undefined,
          },
        })

        // Create audit log
        await prismaAny.auditLog.create({
          data: {
            entityType: 'ContractAgreement',
            entityId: contract.id,
            action: 'CONTRACT_SIGNED',
            details: {
              envelopeId: data.envelopeId,
              signedAt: new Date().toISOString(),
              event: data.event,
            },
            userId: data.userId,
            reason: 'Contract signed via DocuSign callback',
          },
        })
      } else {
        // If not a contract, create a general document signing event
        // (for non-contract documents if Document model exists in future)
        try {
          await prismaAny.event.create({
            data: {
              entityType: 'Document',
              entityId: data.envelopeId,
              type: 'DOCUMENT_SIGNING_COMPLETED',
              payload: {
                envelopeId: data.envelopeId,
                event: data.event,
              },
              userId: data.userId,
            },
          })
        } catch (error: any) {
          // If event creation fails, just log
          console.warn('Failed to create document signing event:', error)
        }
      }
    }

    // Return redirect URL
    const redirectUrl = data.state || `${process.env.APP_BASE_URL || 'http://localhost:3000'}/documents`

    return { redirectUrl, success: true }
  },
}
