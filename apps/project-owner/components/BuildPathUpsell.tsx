'use client'

import {
  getBuildPathUpsells,
  type BuildPathUpsellResult,
  type LifecycleBundleOffer,
  type LifecycleUpsellOffer,
} from '@kealee/core-rules'
import { Lock, ArrowRight, Package, CheckCircle2 } from 'lucide-react'

export type OwnedUpsellProduct =
  | 'cost_estimate'
  | 'permit_path_only'
  | 'professional_drawings'
  | 'certified_estimate'
  | 'contractor_match'
  | 'design_estimate_permit_bundle'
  | 'estimate_permit_bundle'

export interface BuildPathUpsellProps {
  sourceProjectPath: string
  fromIntakeId: string
  contractorMatchingUnlocked?: boolean
  ownedProducts?: OwnedUpsellProduct[]
  constructionCostMin?: number
  constructionCostMax?: number
  conceptServicePrice?: number
  /** compact = list-card strip; full = deliverable detail section */
  variant?: 'full' | 'compact'
}

function BundleHero({ bundle }: { bundle: LifecycleBundleOffer }) {
  return (
    <a
      href={bundle.href}
      className="mb-4 block rounded-2xl p-5 text-white transition-opacity hover:opacity-95"
      style={{ background: 'linear-gradient(135deg, #1A2B4A 0%, #2d4a7a 50%, #E8793A 100%)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[200px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Package className="h-3 w-3" /> {bundle.badge}
          </span>
          <h3 className="text-lg font-bold mb-1">{bundle.label}</h3>
          <p className="text-sm text-white/85 leading-relaxed mb-3">{bundle.description}</p>
          <ul className="space-y-1">
            {bundle.includes.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-white/90">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black">{bundle.priceLabel}</p>
          <p className="text-xs text-white/70 line-through mt-0.5">
            {formatRetail(bundle.retailCents)}
          </p>
          <p className="text-xs font-semibold text-[#FFD4A8] mt-1">{bundle.savingsLabel}</p>
          <p className="text-[10px] text-white/60 mt-2">{bundle.deliveryDays}</p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold">
            Get package <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </a>
  )
}

function formatRetail(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function UpsellCard({ offer }: { offer: LifecycleUpsellOffer }) {
  const isPrimary = offer.tier === 'primary'
  const isLocked = offer.tier === 'locked'

  if (isLocked) {
    return (
      <div
        className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-4 opacity-70 cursor-not-allowed"
        title={offer.description}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Lock className="h-3 w-3 text-gray-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Locked</span>
        </div>
        <span className="text-sm font-semibold text-gray-500 mb-auto">{offer.label}</span>
        <span className="text-xs text-gray-400 mt-3">{offer.description}</span>
      </div>
    )
  }

  return (
    <a
      href={offer.href}
      className={`flex flex-col rounded-xl p-4 transition-all hover:opacity-95 ${
        isPrimary ? 'text-white' : 'border border-gray-200 hover:shadow-sm'
      }`}
      style={isPrimary ? { background: 'linear-gradient(135deg, #E8793A, #c75c35)' } : undefined}
    >
      {offer.badge && (
        <span className={`text-xs font-bold uppercase tracking-wider mb-2 ${isPrimary ? 'opacity-80' : 'text-gray-400'}`}>
          {offer.badge}
        </span>
      )}
      <span className={`text-sm font-semibold mb-1 ${isPrimary ? '' : 'text-gray-900'}`}>{offer.label}</span>
      <span className={`text-xs mb-auto leading-relaxed ${isPrimary ? 'opacity-90' : 'text-gray-500'}`}>
        {offer.description}
      </span>
      <span className={`text-xs mt-3 font-semibold flex items-center gap-1 ${isPrimary ? '' : 'text-[#E8793A]'}`}>
        {offer.cents === 0 ? 'Free' : `${offer.priceLabel} · ${offer.deliveryDays}`}
        <ArrowRight className="h-3 w-3" />
      </span>
    </a>
  )
}

function UpsellContent({
  result,
  variant,
  constructionCostMin,
  constructionCostMax,
  conceptServicePrice,
}: {
  result: BuildPathUpsellResult
  variant: 'full' | 'compact'
  constructionCostMin?: number
  constructionCostMax?: number
  conceptServicePrice?: number
}) {
  if (!result.bundle && result.offers.length === 0) return null

  if (variant === 'compact') {
    return (
      <div className="mt-3 rounded-lg border border-orange-100 bg-orange-50/50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Next steps</p>
        {result.bundle ? (
          <a href={result.bundle.href} className="block group">
            <p className="text-sm font-semibold text-[#1A2B4A] group-hover:text-[#E8793A]">
              {result.bundle.label} — {result.bundle.priceLabel}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{result.bundle.savingsLabel}</p>
          </a>
        ) : (
          <p className="text-xs text-gray-600">
            {result.offers.slice(0, 2).map((o) => `${o.label} (${o.priceLabel})`).join(' · ')}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      {result.bundle && <BundleHero bundle={result.bundle} />}

      {(constructionCostMin || constructionCostMax || conceptServicePrice) && (
        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
          {constructionCostMin && constructionCostMax && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Est. Construction Cost</p>
              <p className="text-base font-bold" style={{ color: '#1A2B4A' }}>
                ${Math.round(constructionCostMin / 1000)}K–${Math.round(constructionCostMax / 1000)}K
              </p>
            </div>
          )}
          {conceptServicePrice && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Design Concept</p>
              <p className="text-base font-bold" style={{ color: '#E8793A' }}>${conceptServicePrice.toLocaleString()}</p>
            </div>
          )}
          <p className="ml-auto text-xs text-gray-400 max-w-[200px] text-right leading-relaxed">{result.creditNote}</p>
        </div>
      )}

      {result.offers.length > 0 && (
        <>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            {result.bundle ? 'Or add individually' : 'Add services'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.offers.map((offer) => (
              <UpsellCard key={offer.productKey} offer={offer} />
            ))}
          </div>
        </>
      )}

      {result.nextSteps.length > 0 && (
        <ol className="mt-4 list-decimal list-inside space-y-1 text-xs text-gray-500 border-t border-gray-100 pt-4">
          {result.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </>
  )
}

export function BuildPathUpsell(props: BuildPathUpsellProps) {
  const { variant = 'full', ...rest } = props
  const result = getBuildPathUpsells({
    sourceProjectPath: rest.sourceProjectPath,
    fromIntakeId: rest.fromIntakeId,
    ownedProducts: rest.ownedProducts,
    contractorMatchingUnlocked: rest.contractorMatchingUnlocked,
  })

  if (!result.bundle && result.offers.length === 0) return null

  if (variant === 'compact') {
    return (
      <UpsellContent
        result={result}
        variant="compact"
        constructionCostMin={rest.constructionCostMin}
        constructionCostMax={rest.constructionCostMax}
        conceptServicePrice={rest.conceptServicePrice}
      />
    )
  }

  return (
    <section
      id="next-steps"
      className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-6"
      style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.06)' }}
    >
      <h2 className="text-base font-bold mb-1" style={{ color: '#1A2B4A' }}>
        Next steps — concept to build
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        {result.needsProfessionalDesign
          ? 'Addition and whole-home projects need estimate, permit filing, and stamped plans. Bundle pricing is based on your project type.'
          : 'Validated estimate + permit package pricing is tailored to your concept scope.'}
      </p>
      <UpsellContent
        result={result}
        variant="full"
        constructionCostMin={rest.constructionCostMin}
        constructionCostMax={rest.constructionCostMax}
        conceptServicePrice={rest.conceptServicePrice}
      />
    </section>
  )
}
