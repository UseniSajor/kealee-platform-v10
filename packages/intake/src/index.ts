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

// Capture
export { CAPTURE_ZONE_META, REQUIRED_CAPTURE_ZONES_BY_PROJECT_PATH, HVAC_CAPTURE_ZONES, CAPTURE_REQUIRED_PROJECT_PATHS, getRequiredZones, isCaptureRequired, getZoneMeta } from "./config/capture-zones";
export type { CaptureZoneMeta } from "./config/capture-zones";

export { CreateCaptureSessionSchema, SendCaptureLinkSchema, StartCaptureSessionSchema, CaptureAssetUploadSchema, CaptureVoiceNoteSchema, CompleteCaptureSessionSchema, CaptureZoneEnum, SystemCategoryEnum, CaptureModeEnum } from "./schemas/capture-schemas";
export type { CaptureZone, CaptureMode, SystemCategory, CaptureSessionRecord, CaptureAssetRecord, CaptureCompletenessReport } from "./schemas/capture-schemas";

export { CreateDigitalTwinSchema, UpdateTwinFromCaptureSchema, DigitalTwinCreationPathEnum } from "./schemas/twin-schemas";
export type { DigitalTwinCreationPath, DigitalTwinRecord, SpatialNodeRecord, SystemNodeRecord, ObservationRecord, DigitalTwinDetail } from "./schemas/twin-schemas";

export { normalizeCaptureSession, normalizeAsset, buildCompletenessReport } from "./lib/normalize-capture";
export { buildDigitalTwinRecord, deriveSpatialNodes, deriveSystemNodes, deriveObservations } from "./lib/create-digital-twin";
export { buildTwinUpdateFromCapture } from "./lib/update-digital-twin-from-capture";
export { buildCaptureUrl, buildCaptureSmsBody, sendMobileCaptureLinkViaTwilio } from "./lib/send-mobile-capture-link";
export type { SendMobileCaptureLinkInput, SendMobileCaptureLinkResult } from "./lib/send-mobile-capture-link";
export { generateCaptureToken, generateCaptureId, generateAssetId, generateVoiceNoteId, computeProgressPercent, getTokenExpiresAt, isTokenExpired } from "./lib/submit-capture-session";
export { reviewCaptureCompleteness, getNextRequiredZone, summarizeCapture } from "./lib/review-capture-completeness";
export { CAPTURE_EVENTS, buildChannelName, buildProgressPayload, subscribeToCaptureChannel } from "./lib/realtime-capture-channel";
export type { CaptureEventType, CaptureRealtimeEvent, CaptureProgressPayload, RealtimeClient } from "./lib/realtime-capture-channel";
