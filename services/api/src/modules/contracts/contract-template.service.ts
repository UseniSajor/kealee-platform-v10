import { prisma } from '@kealee/database'
import { AuthorizationError, NotFoundError, ValidationError } from '../../errors/app.error'

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') return v === 'true' || v === '1'
  return false
}

async function requireOrgAdmin(orgId: string, userId: string) {
  const membership = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { roleKey: true },
  })
  if (!membership || membership.roleKey !== 'ADMIN') {
    throw new AuthorizationError('Admin access required for contract template management')
  }
}

/**
 * Extract template variables from body (e.g., ${project.name}, ${owner.name})
 */
function extractVariables(body: string): Array<{ key: string; label: string; description?: string }> {
  const variableRegex = /\$\{([^}]+)\}/g
  const matches = Array.from(body.matchAll(variableRegex))
  const uniqueVars = new Set<string>()

  const variables: Array<{ key: string; label: string; description?: string }> = []

  for (const match of matches) {
    const key = match[1].trim()
    if (!uniqueVars.has(key)) {
      uniqueVars.add(key)
      // Convert key to label (e.g., "project.name" -> "Project Name")
      const label = key
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
      variables.push({ key, label })
    }
  }

  return variables
}

/**
 * Substitute template variables with actual values
 */
function substituteVariables(
  body: string,
  variables: Record<string, string>
): string {
  let result = body
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\$\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}`, 'g')
    result = result.replace(regex, value || '')
  }
  return result
}

/**
 * Get variable values from project data
 */
async function getProjectVariables(projectId: string): Promise<Record<string, string>> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      property: { select: { address: true, city: true, state: true, zip: true } },
    },
  })

  if (!project) {
    throw new NotFoundError('Project', projectId)
  }

  return {
    'project.id': project.id,
    'project.name': project.name,
    'project.description': project.description || '',
    'project.category': project.category,
    'project.status': project.status,
    'owner.id': project.owner.id,
    'owner.name': project.owner.name,
    'owner.email': project.owner.email,
    'property.address': project.property?.address || '',
    'property.city': project.property?.city || '',
    'property.state': project.property?.state || '',
    'property.zip': project.property?.zip || '',
  }
}

export const contractTemplateService = {
  async listTemplates(params: { orgId?: string; activeOnly?: unknown; name?: string }) {
    const activeOnly = toBool(params.activeOnly)
    return prisma.contractTemplate.findMany({
      where: {
        ...(params.orgId ? { orgId: params.orgId } : { orgId: null }), // List global templates if no orgId
        ...(activeOnly ? { isActive: true } : {}),
        ...(params.name ? { name: { contains: params.name, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ orgId: 'asc' }, { name: 'asc' }, { version: 'desc' }],
    })
  },

  async getTemplate(templateId: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new NotFoundError('ContractTemplate', templateId)
    return template
  },

  async createTemplate(
    input: {
      orgId?: string | null
      name: string
      body: string
      variables?: Array<{ key: string; label: string; description?: string; defaultValue?: string }>
      isActive?: boolean
    },
    actorUserId: string
  ) {
    if (input.orgId) await requireOrgAdmin(input.orgId, actorUserId)

    // Extract variables from body if not provided
    const extractedVars = extractVariables(input.body)
    const variables = input.variables || extractedVars

    // Check for existing template with same name (for versioning)
    const existing = await prisma.contractTemplate.findFirst({
      where: {
        orgId: input.orgId ?? null,
        name: input.name,
        isActive: true,
      },
      orderBy: { version: 'desc' },
      select: { version: true },
    })

    const version = existing ? existing.version + 1 : 1

    return prisma.contractTemplate.create({
      data: {
        orgId: input.orgId ?? null,
        name: input.name,
        body: input.body,
        variables: variables as any,
        version,
        isActive: input.isActive ?? true,
      },
    })
  },

  async updateTemplate(
    templateId: string,
    input: {
      name?: string
      body?: string
      variables?: Array<{ key: string; label: string; description?: string; defaultValue?: string }>
      isActive?: boolean
    },
    actorUserId: string
  ) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new NotFoundError('ContractTemplate', templateId)
    if (template.orgId) await requireOrgAdmin(template.orgId, actorUserId)

    // If body changes, extract new variables
    let variables = input.variables
    if (input.body && !input.variables) {
      variables = extractVariables(input.body)
    }

    // If body or variables change, create new version
    const needsNewVersion = input.body !== undefined || input.variables !== undefined

    if (needsNewVersion) {
      // Deactivate old version
      await prisma.contractTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      })

      // Create new version
      return prisma.contractTemplate.create({
        data: {
          orgId: template.orgId,
          name: input.name ?? template.name,
          body: input.body ?? template.body,
          variables: (variables as any) ?? template.variables,
          version: template.version + 1,
          isActive: input.isActive ?? true,
        },
      })
    }

    // Otherwise, just update in place
    return prisma.contractTemplate.update({
      where: { id: templateId },
      data: {
        name: input.name,
        body: input.body,
        variables: variables ? (variables as any) : undefined,
        isActive: input.isActive,
      },
    })
  },

  async deleteTemplate(templateId: string, actorUserId: string) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new NotFoundError('ContractTemplate', templateId)
    if (template.orgId) await requireOrgAdmin(template.orgId, actorUserId)

    // Check if template is used by any agreements
    const usageCount = await prisma.contractAgreement.count({
      where: { templateId },
    })

    if (usageCount > 0) {
      // Soft delete: just deactivate
      return prisma.contractTemplate.update({
        where: { id: templateId },
        data: { isActive: false },
      })
    }

    // Hard delete if not used
    return prisma.contractTemplate.delete({
      where: { id: templateId },
    })
  },

  async previewTemplate(
    templateId: string,
    projectId?: string,
    variableOverrides?: Record<string, string>
  ) {
    const template = await prisma.contractTemplate.findUnique({
      where: { id: templateId },
    })
    if (!template) throw new NotFoundError('ContractTemplate', templateId)

    let variables: Record<string, string> = {}

    // Get project variables if projectId provided
    if (projectId) {
      variables = await getProjectVariables(projectId)
    }

    // Apply overrides
    if (variableOverrides) {
      variables = { ...variables, ...variableOverrides }
    }

    // Substitute variables in body
    const preview = substituteVariables(template.body, variables)

    return {
      preview,
      template: {
        id: template.id,
        name: template.name,
        version: template.version,
      },
      variables,
      availableVariables: (template.variables as any) || extractVariables(template.body),
    }
  },
}
