// Re-export all schemas for convenient subpath imports
// Allows: import { Schema } from '@kealee/intake/schemas'

export {
  IntakeSchema,
  ExteriorConceptIntakeSchema,
  InteriorRenovationIntakeSchema,
  WholeHomeRemodelIntakeSchema,
  AdditionExpansionIntakeSchema,
  DesignBuildIntakeSchema,
  PermitPathOnlyIntakeSchema,
  PartialIntakeSchema,
} from "./intake-schemas";
export type {
  IntakeInput,
  ExteriorConceptIntake,
  InteriorRenovationIntake,
  WholeHomeRemodelIntake,
  AdditionExpansionIntake,
  DesignBuildIntake,
  PermitPathOnlyIntake,
  PartialIntake,
} from "./intake-schemas";

export {
  CreateCaptureSessionSchema,
  SendCaptureLinkSchema,
  StartCaptureSessionSchema,
  CaptureAssetUploadSchema,
  CaptureVoiceNoteSchema,
  CompleteCaptureSessionSchema,
  CaptureZoneEnum,
  SystemCategoryEnum,
  CaptureModeEnum,
  SiteVisitStatusEnum,
} from "./capture-schemas";
export type {
  CaptureZone,
  CaptureMode,
  SiteVisitStatus,
  SystemCategory,
  CaptureSessionRecord,
  CaptureAssetRecord,
  CaptureCompletenessReport,
} from "./capture-schemas";

export {
  CreateDigitalTwinSchema,
  UpdateTwinFromCaptureSchema,
  DigitalTwinCreationPathEnum,
} from "./twin-schemas";
export type {
  DigitalTwinCreationPath,
  DigitalTwinRecord,
  SpatialNodeRecord,
  SystemNodeRecord,
  ObservationRecord,
  DigitalTwinDetail,
} from "./twin-schemas";

export {
  HomeownerProjectPathSchema,
  HomeownerIntakeSchema,
  DeveloperProjectTypeSchema,
  DeveloperIntakeSchema,
  UserIntakeSchema,
} from "./user-type-schemas";
export type {
  HomeownerProjectPath,
  HomeownerIntake,
  DeveloperProjectType,
  DeveloperIntake,
  UserIntake,
} from "./user-type-schemas";

export { PermitSchema } from "./permit-schemas";
export type { Permit } from "./permit-schemas";
