import type { CaptureSessionRecord, CaptureAssetRecord, CaptureCompletenessReport } from "../schemas/capture-schemas";
import { buildCompletenessReport } from "./normalize-capture";

export function reviewCaptureCompleteness(
  session: CaptureSessionRecord,
  assets: CaptureAssetRecord[],
  voiceNotesCount: number,
): CaptureCompletenessReport {
  return buildCompletenessReport(session, assets, voiceNotesCount);
}

export function getNextRequiredZone(report: CaptureCompletenessReport): string | null {
  return report.missingRequired[0] ?? null;
}

export function summarizeCapture(report: CaptureCompletenessReport): string {
  const { progressPercent, completedZones, missingRequired, totalAssets, voiceNotesCount } = report;
  const parts: string[] = [];
  parts.push(`${progressPercent}% complete`);
  parts.push(`${completedZones.length} zones captured`);
  if (missingRequired.length > 0) {
    parts.push(`${missingRequired.length} required zones missing`);
  }
  parts.push(`${totalAssets} total assets`);
  if (voiceNotesCount > 0) parts.push(`${voiceNotesCount} voice notes`);
  return parts.join(" · ");
}
