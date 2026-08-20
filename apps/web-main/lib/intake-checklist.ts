/**
 * The missing-information checklist.
 *
 * One implementation, used before payment (intake review step) and after
 * payment (order tracking page), so a customer is never told one thing at
 * checkout and another once they have paid.
 *
 * Kept free of server-only imports so the intake client component can use it.
 */

import { SERVICE_DELIVERABLES } from '@/lib/service-deliverables'

export interface ChecklistContact {
  project_address: string | null
  contact_email: string | null
  contact_phone: string | null
}

export interface OrderChecklistItem {
  key: string
  label: string
  /** 'provided' | 'missing' | 'optional' */
  state: 'provided' | 'missing' | 'optional'
  detail?: string
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

/**
 * Inputs are per-product: a Site Plan order genuinely needs a survey, an
 * estimate needs scope, a permit needs drawings. Optional items are shown so
 * the customer can improve accuracy voluntarily.
 */
export function buildOrderChecklist(
  productKey: string,
  formData: Record<string, unknown>,
  order: ChecklistContact,
): OrderChecklistItem[] {
  const uploads = Array.isArray(formData.uploadedFileMeta)
    ? (formData.uploadedFileMeta as Record<string, unknown>[])
    : []
  const hasDocument = uploads.some(file => file.type === 'document')
  const hasPhoto = uploads.some(file => file.type === 'photo' || file.type === 'image')
  const siteIntelligence = asRecord(formData.siteIntelligence)
  const category = SERVICE_DELIVERABLES[productKey]?.category

  const items: OrderChecklistItem[] = [
    {
      key: 'contact',
      label: 'Contact details',
      state: order.contact_email ? 'provided' : 'missing',
    },
    {
      key: 'phone',
      label: 'Phone number (so we can reach you about agency questions)',
      state: order.contact_phone ? 'provided' : 'optional',
    },
    {
      key: 'address',
      label: 'Property address',
      state: order.project_address ? 'provided' : 'missing',
    },
    {
      key: 'scope',
      label: 'Project description and scope',
      state: typeof formData.description === 'string' && formData.description.trim().length > 20
        ? 'provided'
        : 'missing',
      detail:
        'A short paragraph on what you want built or changed. Scope drives every number in your deliverable.',
    },
    {
      key: 'size',
      label: 'Approximate project size',
      state: formData.squareFootage ? 'provided' : 'optional',
    },
    {
      key: 'photos',
      label: 'Photos of the existing conditions',
      state: hasPhoto ? 'provided' : category === 'design' ? 'missing' : 'optional',
    },
  ]

  if (category === 'development' || productKey === 'permit_site_plan') {
    items.push({
      key: 'survey',
      label: 'Boundary survey or recorded plat',
      state: hasDocument ? 'provided' : productKey === 'permit_site_plan' ? 'missing' : 'optional',
      detail:
        'Required for a permit site plan. For preliminary work we use published parcel data and label it as such.',
    })
    items.push({
      key: 'parcel_confirmed',
      label: 'Parcel confirmed as the project parcel',
      state: formData.parcelConfirmed === true ? 'provided' : 'missing',
    })
  }

  if (category === 'permit') {
    items.push({
      key: 'drawings',
      label: 'Drawings or plan set for submission',
      state: hasDocument ? 'provided' : 'missing',
      detail:
        'If you do not have a plan set, we will scope plan preparation before anything can be filed.',
    })
  }

  if (category === 'estimate') {
    items.push({
      key: 'estimate_purpose',
      label: 'What the estimate will be used for',
      state: formData.estimatePurpose ? 'provided' : 'missing',
    })
    items.push({
      key: 'plans',
      label: 'Plans, specs, or a solicitation package',
      state: hasDocument ? 'provided' : 'optional',
      detail: 'Uploads raise estimate confidence and narrow the assumption list.',
    })
  }

  if (siteIntelligence.status && siteIntelligence.status !== 'resolved') {
    items.push({
      key: 'jurisdiction',
      label: 'Jurisdiction confirmation',
      state: 'missing',
      detail:
        'Automated lookup could not confirm the parcel. A Kealee reviewer will confirm it manually — you can speed this up by sending a survey or tax record.',
    })
  }

  return items
}

