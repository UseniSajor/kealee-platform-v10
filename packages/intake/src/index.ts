// Config
export { PROJECT_PATHS, PROJECT_PATH_META, isValidProjectPath } from "./config/project-path-config";
export type { ProjectPath, ProjectPathMeta } from "./config/project-path-config";
export { INTAKE_OPTION_CARDS } from "./config/intake-option-cards";
export type { IntakeOptionCard } from "./config/intake-option-cards";
export { FORM_FIELDS_BY_PATH } from "./config/form-fields-by-path";
export type { IntakeField, IntakeFormStep, FieldOption, FieldType } from "./config/form-fields-by-path";
// Aliases for convenience
export type { IntakeField as FormField, IntakeFormStep as FormStep } from "./config/form-fields-by-path";

// Schemas
export {
  IntakeSchema,
  ExteriorConceptIntakeSchema,
  InteriorRenovationIntakeSchema,
  WholeHomeRemodelIntakeSchema,
  AdditionExpansionIntakeSchema,
  DesignBuildIntakeSchema,
  PermitPathOnlyIntakeSchema,
  PartialIntakeSchema,
} from "./schemas/intake-schemas";
export type {
  IntakeInput,
  ExteriorConceptIntake,
  InteriorRenovationIntake,
  WholeHomeRemodelIntake,
  AdditionExpansionIntake,
  DesignBuildIntake,
  PermitPathOnlyIntake,
  PartialIntake,
} from "./schemas/intake-schemas";

// Lib
export { normalizeIntake } from "./lib/normalize-intake";
export type { NormalizedIntake } from "./lib/normalize-intake";

export { scoreIntakeLead } from "./lib/score-lead";
export type { LeadScore } from "./lib/score-lead";

export { evaluatePaymentGate } from "./lib/payment-gate";
export type { PaymentGateResult } from "./lib/payment-gate";

export { routeToCommandCenter } from "./lib/command-center-route";
export type { CommandCenterRoute } from "./lib/command-center-route";

export { validatePathRules } from "./lib/validate-path-rules";
export type { ValidationResult } from "./lib/validate-path-rules";

export { saveIntake } from "./lib/save-intake";
export type { SaveIntakeResult, SaveIntakeOptions } from "./lib/save-intake";

export { createCommandCenterTask } from "./lib/create-command-center-task";
export type { CreateTaskResult, CreateTaskOptions } from "./lib/create-command-center-task";

export { submitIntake } from "./lib/submit-intake";
export type { SubmitIntakeResult, SubmitIntakeOptions } from "./lib/submit-intake";
