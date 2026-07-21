import { z } from "zod";
import { BaseContactSchema } from "./base-schemas";

export const ExteriorConceptIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("exterior_concept"),
  exteriorProjectType: z.string().default("facade_redesign"),
  propertyUse: z.string().default("primary_residence"),
  stylePreferences: z.array(z.string()).default([]),
  goals: z.string().optional(),
  knownConstraints: z.string().optional(),
});

export const InteriorRenovationIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("interior_renovation"),
  roomScope: z.array(z.string()).default([]),
  currentCondition: z.string().optional(),
  designStyle: z.array(z.string()).default([]),
  renovationGoals: z.string().optional(),
  knownConstraints: z.string().optional(),
});

export const WholeHomeRemodelIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("whole_home_remodel"),
  squareFootage: z.coerce.number().optional(),
  bedroomCount: z.string().optional(),
  propertyUse: z.string().default("primary_residence"),
  remodelingScope: z.array(z.string()).default([]),
  designStyle: z.array(z.string()).default([]),
  priorities: z.string().optional(),
  financingStatus: z.string().optional(),
  knownConstraints: z.string().optional(),
});

export const AdditionExpansionIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("addition_expansion"),
  additionType: z.string().default("rear_addition"),
  existingSquareFootage: z.coerce.number().optional(),
  targetAdditionalSqft: z.coerce.number().optional(),
  additionUseCase: z.string().optional(),
  hasArchitect: z.boolean().default(false),
  neighborhoodConstraints: z.string().optional(),
  goals: z.string().optional(),
});

export const DesignBuildIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("design_build"),
  projectScale: z.string().default("medium"),
  currentStage: z.string().optional(),
  designBuildScope: z.array(z.string()).default([]),
  hasExistingDesigns: z.boolean().default(false),
  deliverables: z.string().optional(),
  knownConstraints: z.string().optional(),
});

export const PermitPathOnlyIntakeSchema = BaseContactSchema.extend({
  projectPath: z.literal("permit_path_only"),
  permitType: z.string().default("residential_renovation"),
  permitJurisdiction: z.string().default(""),
  currentApprovalStatus: z.string().optional(),
  projectDescription: z.string().default(""),
  knownConstraints: z.string().optional(),
});

export const IntakeSchema = z.discriminatedUnion("projectPath", [
  ExteriorConceptIntakeSchema,
  InteriorRenovationIntakeSchema,
  WholeHomeRemodelIntakeSchema,
  AdditionExpansionIntakeSchema,
  DesignBuildIntakeSchema,
  PermitPathOnlyIntakeSchema,
]);

export type IntakeInput = z.infer<typeof IntakeSchema>;
export type ExteriorConceptIntake = z.infer<typeof ExteriorConceptIntakeSchema>;
export type InteriorRenovationIntake = z.infer<typeof InteriorRenovationIntakeSchema>;
export type WholeHomeRemodelIntake = z.infer<typeof WholeHomeRemodelIntakeSchema>;
export type AdditionExpansionIntake = z.infer<typeof AdditionExpansionIntakeSchema>;
export type DesignBuildIntake = z.infer<typeof DesignBuildIntakeSchema>;
export type PermitPathOnlyIntake = z.infer<typeof PermitPathOnlyIntakeSchema>;

export const PartialIntakeSchema = z.object({
  projectPath: z.string(),
  clientName: z.string().optional(),
  contactEmail: z.string().optional(),
  projectAddress: z.string().optional(),
}).passthrough();

export type PartialIntake = z.infer<typeof PartialIntakeSchema>;
