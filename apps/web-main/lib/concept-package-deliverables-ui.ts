/** Presentation adapter for the single canonical Design Concept Package. */
import {
  getConceptPackageDeliverablesForSlug,
  type ConceptPackageDeliverable,
  type DeliverableCategory,
} from '@kealee/core-rules'
import {
  Shield, FileText, Image as ImageIcon, Table2, Layers, Zap,
  LayoutTemplate, MapPin, type LucideIcon,
} from 'lucide-react'

export interface PackageDeliverableUiItem {
  icon: LucideIcon
  label: string
  color: string
}

const style: Record<DeliverableCategory, string> = {
  permit: 'bg-amber-100 text-amber-600', zoning: 'bg-teal-100 text-teal-700',
  design: 'bg-purple-100 text-purple-600', visual: 'bg-purple-100 text-purple-600',
  video: 'bg-orange-100 text-orange-600', cost: 'bg-green-100 text-green-600',
  plan: 'bg-blue-100 text-blue-600', mep: 'bg-sky-100 text-sky-600',
  portal: 'bg-sky-100 text-sky-600', support: 'bg-slate-100 text-slate-600',
  upsell: 'bg-slate-100 text-slate-500',
}
const icon: Record<DeliverableCategory, LucideIcon> = {
  permit: Shield, zoning: MapPin, design: FileText, visual: ImageIcon,
  video: ImageIcon, cost: Table2, plan: Layers, mep: Zap,
  portal: LayoutTemplate, support: Zap, upsell: FileText,
}
function toUi(item: ConceptPackageDeliverable): PackageDeliverableUiItem {
  return { icon: icon[item.category] ?? FileText, label: item.label, color: style[item.category] }
}

export function getServicePackageItemsForUi(serviceSlug: string): PackageDeliverableUiItem[] {
  return getConceptPackageDeliverablesForSlug(serviceSlug).map(toUi)
}
