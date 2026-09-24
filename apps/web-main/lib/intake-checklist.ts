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
 * Customer uploads can help Kealee, but checkout never presents records that
 * Kealee can research or prepare as missing customer work.
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
      label: 'Photos of your space',
      state: hasPhoto ? 'provided' : 'optional',
      detail: hasPhoto
        ? 'We’ll use these as a visual reference.'
        : 'Photos can help, and you can add them later if you have them.',
    },
  ]

  if (category === 'development' || productKey === 'permit_site_plan') {
    items.push({
      key: 'survey',
      label: 'Survey or property plan',
      state: hasDocument ? 'provided' : 'optional',
      detail: hasDocument
        ? 'Kealee will use the file you sent.'
        : productKey === 'permit_site_plan'
          ? 'Kealee will check available property records first and contact you if a new survey is needed for filing.'
          : 'This can help with property details, and it is optional for early planning.',
    })
    items.push({
      key: 'parcel_confirmed',
      label: 'Property record check',
      state: formData.parcelConfirmed === true ? 'provided' : 'optional',
      detail: formData.parcelConfirmed === true
        ? 'The property record is matched to your address.'
        : 'Kealee will confirm the property record for you.',
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
      label: 'Local property check',
      state: 'optional',
      detail: 'Kealee is confirming the local property details. You do not need to send anything now.',
    })
  }

  return items
}

