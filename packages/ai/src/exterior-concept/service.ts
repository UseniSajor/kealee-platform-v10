import { buildMissingInfoPrompt } from "./prompts";
import { runExteriorConceptGraph } from "./graph";
import { detectMissingFields } from "./state";
import type { ExteriorConceptState } from "./types";

export async function executeExteriorConceptWorkflow(
  input: Partial<ExteriorConceptState>,
) {
  const missingFields = detectMissingFields(input.intakeData ?? {});
  if (missingFields.length > 0) {
    return {
      ok: true,
      status: "COLLECTING_INFO" as const,
      missingFields,
      assistantText: buildMissingInfoPrompt(missingFields),
      state: {
        ...input,
        missingFields,
        status: "COLLECTING_INFO" as const,
      },
    };
  }

  const result = await runExteriorConceptGraph(input);

  return {
    ok: true,
    status: result.status,
    intakeId: result.intakeId,
    missingFields: result.missingFields,
    assistantText:
      result.status === "READY_FOR_PM_REVIEW"
        ? "Your concept package draft is ready for PM review."
        : result.status === "APPROVED_FOR_DELIVERY"
          ? "Your concept package is approved for delivery."
          : `Workflow status: ${result.status}`,
    state: result,
  };
}
