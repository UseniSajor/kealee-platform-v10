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
  { id: 'package-overview', label: 'Decision brief', pdfPage: 1, shortLabel: 'Overview' },
  { id: 'project-brief', label: 'Project & alternatives', pdfPage: 2 },
  { id: 'floor-plan', label: 'Recommendation & plan', pdfPage: 3, shortLabel: 'Plan' },
  { id: 'visuals', label: 'Visual direction', pdfPage: 4, shortLabel: 'Visuals' },
  { id: 'scope-bom', label: 'Materials, scope & cost', pdfPage: 5, shortLabel: 'Scope' },
  { id: 'permit', label: 'Zoning, permits & next steps', pdfPage: 6, shortLabel: 'Approvals' },
  { id: 'design-concept', label: 'Style direction', pdfPage: null },
  { id: 'mep', label: 'MEP systems', pdfPage: null },
  { id: 'v30-landscape', label: 'Site & landscape', pdfPage: null },
  { id: 'next-steps', label: 'Next steps', pdfPage: 6 },
]

export const CONCEPT_PACKAGE_PDF_PAGE_COUNT = 6

export function pdfSectionsForToc(): ConceptPackageSection[] {
  return CONCEPT_PACKAGE_SECTIONS.filter((s) => s.pdfPage != null)
}
