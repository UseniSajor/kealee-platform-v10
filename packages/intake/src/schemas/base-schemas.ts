/**
 * Base Schemas
 * Shared base schemas used across intake schema definitions
 */

import { z } from 'zod'

/**
 * Base contact information schema
 * Used across all intake types
 */
export const BaseContactSchema = z.object({
  name: z.string().min(2).describe('Full name of the contact'),
  email: z.string().email().describe('Contact email address'),
  phone: z.string().optional().describe('Contact phone number'),
  company: z.string().optional().describe('Company or organization name'),
})

/**
 * Base project details schema
 * Common project fields shared across estimation and concept intakes
 */
export const ProjectDetailsSchema = z.object({
  projectType: z
    .string()
    .describe('Type of project (e.g. interior_remodel, addition, new_construction)'),
  projectAddress: z.string().optional().describe('Project site address'),
  city: z.string().optional().describe('Project city'),
  state: z.string().optional().describe('Project state'),
  zipCode: z.string().optional().describe('Project zip code'),
  squareFootage: z.number().optional().describe('Approximate square footage'),
  description: z.string().optional().describe('Project description or scope summary'),
})
