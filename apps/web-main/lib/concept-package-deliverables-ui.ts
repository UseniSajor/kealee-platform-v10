/**
 * UI adapter for @kealee/core-rules concept package deliverables.
 * Icons are presentation-only; labels come from core-rules.
 */

import type { ConceptTier } from '@kealee/core-rules'
import {
  getConceptPackageDeliverablesForSlug,
  type ConceptPackageDeliverable,
  type DeliverableCategory,
} from '@kealee/core-rules'
import {
  Shield,
  FileText,
  Image as ImageIcon,
  Table2,
  Layers,
  Video,
  Zap,
  Phone,
  Lock,
  LayoutTemplate,
  MapPin,
  type LucideIcon,
} from 'lucide-react'

export interface TierDeliverableUiItem {
  icon: LucideIcon
  label: string
  color: string
}

const CATEGORY_STYLE: Record<DeliverableCategory, string> = {
  permit: 'bg-amber-100 text-amber-600',
  zoning: 'bg-teal-100 text-teal-700',
  design: 'bg-purple-100 text-purple-600',
  visual: 'bg-purple-100 text-purple-600',
  video: 'bg-orange-100 text-orange-600',
  cost: 'bg-green-100 text-green-600',
  plan: 'bg-blue-100 text-blue-600',
  mep: 'bg-sky-100 text-sky-600',
  portal: 'bg-sky-100 text-sky-600',
  support: 'bg-slate-100 text-slate-500',
  upsell: 'bg-slate-100 text-slate-500',
}

const CATEGORY_ICON: Record<DeliverableCategory, LucideIcon> = {
  permit: Shield,
  zoning: MapPin,
  design: FileText,
  visual: ImageIcon,
  video: Video,
  cost: Table2,
  plan: Layers,
  mep: Zap,
  portal: LayoutTemplate,
  support: Zap,
  upsell: Lock,
}

function toUiItem(d: ConceptPackageDeliverable): TierDeliverableUiItem {
  const muted = d.id === 'video-upgrade'
  return {
    icon: CATEGORY_ICON[d.category] ?? FileText,
    label: d.label,
    color: muted ? 'bg-slate-100 text-slate-500' : (CATEGORY_STYLE[d.category] ?? 'bg-slate-100 text-slate-600'),
  }
}

/** Checkout + service detail tier columns. */
export function getServiceTierItemsForUi(
  serviceSlug: string,
): Record<ConceptTier, TierDeliverableUiItem[]> {
  return {
    1: getConceptPackageDeliverablesForSlug(serviceSlug, 1).map(toUiItem),
    2: getConceptPackageDeliverablesForSlug(serviceSlug, 2).map(toUiItem),
    3: getConceptPackageDeliverablesForSlug(serviceSlug, 3).map(toUiItem),
  }
}

export const TIER_META: Record<ConceptTier, { tagline: string; accent: string; badge?: string }> = {
  1: {
    tagline:
      'Permit scope, zoning snapshot, renders, and estimates in every Basic package — upgrade for AI video and deeper plan sheets.',
    accent: 'from-slate-700 to-slate-900',
  },
  2: {
    tagline:
      'Adds 60s AI video, permit-ready documentation, and expanded zoning notes for HOA and lenders.',
    accent: 'from-[#E8724B] to-[#c75c35]',
    badge: 'Most Popular',
  },
  3: {
    tagline:
      'Full video suite, 4K renders, CAD export, permit package credit, and expert consultation.',
    accent: 'from-[#1A2B4A] to-[#0f1c30]',
    badge: 'Best Value',
  },
}

/** Premium+ consultation uses Phone icon when present */
export function withConsultationIcon(items: TierDeliverableUiItem[]): TierDeliverableUiItem[] {
  return items.map((item) =>
    item.label.includes('consultation') ? { ...item, icon: Phone } : item,
  )
}
