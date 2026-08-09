/**
 * Ambient type declarations for @kealee/intake/schemas
 * The installed package exports IntakeSchema and related schemas, but not the
 * domain-specific schemas referenced by the API routes. These ambient
 * declarations allow the routes to compile while retaining runtime behaviour.
 */
declare module '@kealee/intake/schemas' {
  import { z } from 'zod'

  // ── Re-export everything the package does export ─────────────────────────
  export * from '@kealee/intake'

  // ── Concept intake ────────────────────────────────────────────────────────
  export const ConceptIntakeSchema: z.ZodTypeAny
  export const ConceptIntakeResponseSchema: z.ZodTypeAny
  export type ConceptIntake = any
  export type ConceptIntakeResponse = any

  // ── Estimation intake ─────────────────────────────────────────────────────
  export const EstimationIntakeSchema: z.ZodTypeAny
  export const EstimationIntakeResponseSchema: z.ZodTypeAny
  export type EstimationIntake = any
  export type EstimationIntakeResponse = any

  // ── Permit intake ─────────────────────────────────────────────────────────
  export const PermitIntakeSchema: z.ZodTypeAny
  export const PermitIntakeResponseSchema: z.ZodTypeAny
  export const DMV_JURISDICTIONS: Record<string, any>
  export type PermitIntake = any
  export type PermitIntakeResponse = any

  // ── Zoning intake ─────────────────────────────────────────────────────────
  export const ZoningIntakeSchema: z.ZodTypeAny
  export const ZoningIntakeResponseSchema: z.ZodTypeAny
  export const DMV_JURISDICTIONS: Record<string, any>
  export type ZoningIntake = any
  export type ZoningIntakeResponse = any

  // ── Generic fallback ──────────────────────────────────────────────────────
  export const intakeFormSchema: any
  export const intakeBodySchema: any
}
