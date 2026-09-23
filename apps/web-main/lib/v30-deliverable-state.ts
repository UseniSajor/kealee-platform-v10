function nonEmptyStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []
}

export function conceptOutputFromFormData(
  formData: Record<string, unknown>,
): Record<string, unknown> {
  const value = formData.conceptOutput ?? formData.v30ConceptOutput
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

/**
 * A timestamp alone is not proof that a paid package exists. Older runs could
 * write the finalization marker after image or PDF generation silently failed.
 */
export function conceptDeliverablesAreComplete(formData: Record<string, unknown>): boolean {
  if (!formData.v30ConceptDeliverablesFinalizedAt) return false
  const output = conceptOutputFromFormData(formData)
  return nonEmptyStrings(output.renderUrls).length > 0
    && typeof output.pdfUrl === 'string'
    && output.pdfUrl.trim().length > 0
}

export function conceptHasRenders(formData: Record<string, unknown>): boolean {
  return nonEmptyStrings(conceptOutputFromFormData(formData).renderUrls).length > 0
}
