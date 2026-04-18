/**
 * Base Schemas
 * Shared base schemas used across multiple intake types
 */

import { z } from 'zod'

/**
 * Base contact information schema
 * Used as foundation for all intake schemas
 */
export const BaseContactSchema = z.object({
  clientName: z.string().min(2, 'Name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().optional(),
  projectAddress: z.string().min(5, 'Project address is required'),
  budgetRange: z.string().min(1, 'Budget range is required'),
  timelineGoal: z.string().optional(),
  uploadedPhotos: z.array(z.string()).default([]),
  source: z.string().default('public_intake'),
  funnelSessionId: z.string().optional(),
})

/**
 * Base project details schema
 * Extends contact schema with basic project information
 */
export const ProjectDetailsSchema = BaseContactSchema.extend({
  projectName: z.string().min(2, 'Project name is required').optional(),
  projectDescription: z.string().optional(),
  squareFootage: z.number().positive().optional(),
  yearBuilt: z.number().int().optional(),
})
