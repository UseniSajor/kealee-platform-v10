import { z } from 'zod'

export const contractTemplateVariableSchema = z.object({
  key: z.string().min(1), // e.g., "project.name", "owner.name"
  label: z.string().min(1), // e.g., "Project name", "Owner name"
  description: z.string().optional(),
  defaultValue: z.string().optional(),
})

export const contractTemplateCreateSchema = z.object({
  orgId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  body: z.string().min(1), // HTML/markdown content
  variables: z.array(contractTemplateVariableSchema).optional(),
  isActive: z.boolean().optional(),
})

export const contractTemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  variables: z.array(contractTemplateVariableSchema).optional(),
  isActive: z.boolean().optional(),
})

export const contractTemplatePreviewSchema = z.object({
  templateId: z.string().uuid(),
  projectId: z.string().uuid().optional(), // For variable substitution
  variables: z.record(z.string()).optional(), // Override variables
})

export const listContractTemplatesQuerySchema = z.object({
  orgId: z.string().uuid().optional(),
  activeOnly: z.string().optional(),
  name: z.string().optional(), // Search by name
})
