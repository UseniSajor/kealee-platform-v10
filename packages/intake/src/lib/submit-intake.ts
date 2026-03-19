import { IntakeSchema, type IntakeInput } from "../schemas/intake-schemas";
import { normalizeIntake } from "./normalize-intake";
import { scoreIntakeLead } from "./score-lead";
import { evaluatePaymentGate, type PaymentGateResult } from "./payment-gate";
import { saveIntake } from "./save-intake";
import { routeToCommandCenter, type CommandCenterRoute } from "./command-center-route";
import { createCommandCenterTask } from "./create-command-center-task";
import { validatePathRules } from "./validate-path-rules";
import type { ProjectPath } from "../config/project-path-config";

export interface SubmitIntakeOptions {
  apiBase?: string;
}

export interface SubmitIntakeResult {
  ok: boolean;
  intakeId?: string;
  requiresPayment: boolean;
  paymentAmount?: number;
  nextUrl?: string;
  gate?: PaymentGateResult;
  route?: CommandCenterRoute;
  errors?: string[];
}

export async function submitIntake(
  rawFormData: Record<string, unknown>,
  options: SubmitIntakeOptions = {},
): Promise<SubmitIntakeResult> {
  // 1. Validate path-specific required fields first (early fail)
  const projectPath = rawFormData["projectPath"] as string;
  const pathValidation = validatePathRules(projectPath as ProjectPath, rawFormData);
  if (!pathValidation.valid) {
    return { ok: false, requiresPayment: false, errors: pathValidation.errors };
  }

  // 2. Zod parse (discriminated union)
  const parsed = IntakeSchema.safeParse(rawFormData);
  if (!parsed.success) {
    const errors = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return { ok: false, requiresPayment: false, errors };
  }

  const input: IntakeInput = parsed.data;

  // 3. Normalize
  const normalized = normalizeIntake(input);

  // 4. Score lead
  const score = scoreIntakeLead(normalized);

  // 5. Evaluate payment gate
  const gate = evaluatePaymentGate(input.projectPath as ProjectPath, score);

  // 6. Save intake to backend
  const saved = await saveIntake(normalized, score, {
    apiBase: options.apiBase,
    source: input.source ?? "public_intake",
  });

  if (!saved.ok) {
    return { ok: false, requiresPayment: gate.requiresPayment, errors: [saved.error ?? "Failed to save intake"] };
  }

  // 7. Route to command center
  const route = routeToCommandCenter(input.projectPath, score, saved.intakeId ?? "");

  // 8. Create command-center task (non-fatal)
  createCommandCenterTask(
    saved.intakeId ?? "",
    input.projectPath,
    route.tags,
    { apiBase: options.apiBase },
  ).catch(() => {});

  const nextUrl = gate.requiresPayment
    ? `/${input.projectPath}/payment?intakeId=${saved.intakeId}`
    : `/${input.projectPath}/success?intakeId=${saved.intakeId}`;

  return {
    ok: true,
    intakeId: saved.intakeId,
    requiresPayment: gate.requiresPayment,
    paymentAmount: gate.amount,
    nextUrl,
    gate,
    route,
  };
}
