/**
 * Canonical concept package structure — portal section order matches PDF page order
 * (`packages/concept-engine/src/pdf/render-concept-pdf.ts`).
 */

export interface ConceptPackageSection {
  id: string
  label: string
  /** PDF page number (1-based), null = portal-only section */
  pdfPage: number | null
  shortLabel?: string
}

/** Sections shown in owner portal TOC (top → bottom). */
export const CONCEPT_PACKAGE_SECTIONS: ConceptPackageSection[] = [
  { id: 'package-overview', label: 'Your package', pdfPage: 1, shortLabel: 'Cover' },
  { id: 'floor-plan', label: 'Floor plan', pdfPage: 2 },
  { id: 'narrative', label: 'Design narrative', pdfPage: 3 },
  { id: 'scope-bom', label: 'Scope & materials', pdfPage: 4, shortLabel: 'Scope' },
  { id: 'permit', label: 'Permit path', pdfPage: 5 },
  { id: 'visuals', label: 'Renderings & video', pdfPage: 6, shortLabel: 'Visuals' },
  { id: 'design-concept', label: 'Style direction', pdfPage: null },
  { id: 'mep', label: 'MEP systems', pdfPage: null },
  { id: 'v30-landscape', label: 'Site & landscape', pdfPage: null },
  { id: 'v30-marketing', label: 'Marketing kit', pdfPage: null },
  { id: 'next-steps', label: 'Next steps', pdfPage: 7 },
]

export const CONCEPT_PACKAGE_PDF_PAGE_COUNT = 7

export function pdfSectionsForToc(): ConceptPackageSection[] {
  return CONCEPT_PACKAGE_SECTIONS.filter((s) => s.pdfPage != null)
}
