'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Clock3, DollarSign, ShieldCheck } from 'lucide-react'
import {
  calculateUpgradePlanningRange,
  formatUpgradeRange,
  type HomeUpgradeProduct,
  type HomeUpgradeScopeBand,
} from '@kealee/core-rules'
import { trackEvent } from '@/lib/analytics'

export function UpgradeConfigurator({ product }: { product: HomeUpgradeProduct }) {
  const [scope, setScope] = useState<HomeUpgradeScopeBand['id']>('transformative')
  const [options, setOptions] = useState<string[]>([])
  const [financing, setFinancing] = useState(false)
  const result = useMemo(() => calculateUpgradePlanningRange(product, scope, options), [product, scope, options])
  const illustrativeMonthly = Math.round((result.minCents / 100) * 0.01377)
  const isHomeCare = product.slug === 'homecare'

  const query = new URLSearchParams({
    upgrade: product.slug,
    upgradeName: product.name,
    upgradeScope: scope,
    upgradeOptions: options.join(','),
    budgetRange: formatUpgradeRange(result),
    financingInterest: financing ? 'yes' : 'no',
    siteGoal: `${product.name}: ${product.promise}`,
  })
  const selectedScope = product.scopeBands.find(band => band.id === scope)
  const selectedOptionLabels = product.options.filter(option => options.includes(option.id)).map(option => option.label)
  const homeCareQuery = new URLSearchParams({
    service: 'homecare',
    name: product.name,
    description: [
      `${product.name} — ${selectedScope?.label ?? 'Annual care plan'}.`,
      selectedOptionLabels.length > 0 ? `Requested options: ${selectedOptionLabels.join(', ')}.` : '',
      `Illustrative service range: ${formatUpgradeRange(result)}.`,
    ].filter(Boolean).join(' '),
  })
  const destination = isHomeCare
    ? `/request-service?${homeCareQuery.toString()}`
    : `/intake/${product.conceptIntakePath}?${query.toString()}`

  function toggleOption(id: string) {
    setOptions(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[#c65331]">{isHomeCare ? 'Plan my property care' : 'Design my upgrade'}</p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{isHomeCare ? 'Configure the service plan' : 'Configure the planning scope'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">These choices narrow the planning range. {isHomeCare ? 'Kealee confirms availability and service terms after review.' : 'They do not create a construction quote.'}</p>

      <fieldset className="mt-7">
        <legend className="text-sm font-bold text-slate-900">{isHomeCare ? 'How much support do you want?' : 'How much do you want to change?'}</legend>
        <div className="mt-3 grid gap-3">
          {product.scopeBands.map(band => (
            <label key={band.id} className={`cursor-pointer rounded-xl border p-4 transition ${scope === band.id ? 'border-[#e8724b] bg-orange-50 ring-2 ring-orange-100' : 'border-slate-200 hover:border-slate-300'}`}>
              <input type="radio" name="scope" value={band.id} checked={scope === band.id} onChange={() => setScope(band.id)} className="sr-only" />
              <span className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${scope === band.id ? 'border-[#e8724b] bg-[#e8724b] text-white' : 'border-slate-300'}`}>{scope === band.id && <Check className="h-3 w-3" />}</span><span><b className="block text-sm text-slate-900">{band.label}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{band.description}</span></span></span>
            </label>
          ))}
        </div>
      </fieldset>

      {product.options.length > 0 && <fieldset className="mt-7">
        <legend className="text-sm font-bold text-slate-900">Optional features</legend>
        <div className="mt-3 space-y-2">{product.options.map(option => <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><input type="checkbox" checked={options.includes(option.id)} onChange={() => toggleOption(option.id)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#e8724b]" /><span><b className="block text-sm text-slate-900">{option.label}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span></span></label>)}</div>
      </fieldset>}

      {!isHomeCare && <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" checked={financing} onChange={event => setFinancing(event.target.checked)} className="mt-1 h-4 w-4 rounded accent-[#e8724b]" /><span><b className="block text-sm text-slate-900">I am interested in financing options</b><span className="mt-1 block text-xs text-slate-500">Kealee will record your interest; financing is subject to lender approval and separate terms.</span></span></label>}

      <div className="mt-7 rounded-2xl bg-[#10233e] p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Illustrative {isHomeCare ? 'service' : 'project'} range</p>
        <p className="mt-1 text-3xl font-black">{formatUpgradeRange(result)}</p>
        <div className={`mt-4 grid gap-3 text-xs ${isHomeCare ? 'grid-cols-2' : 'grid-cols-3'}`}><div><Clock3 className="mb-1 h-4 w-4 text-orange-300" /><span className="text-slate-300">Start in {result.weeks.min}–{result.weeks.max} weeks</span></div><div><ShieldCheck className="mb-1 h-4 w-4 text-orange-300" /><span className="capitalize text-slate-300">{isHomeCare ? 'Routine care is permit-exempt' : `Permit ${result.permitLikelihood}`}</span></div>{!isHomeCare && <div><DollarSign className="mb-1 h-4 w-4 text-orange-300" /><span className="text-slate-300">From ~${illustrativeMonthly.toLocaleString()}/mo*</span></div>}</div>
      </div>

      <Link
        href={destination}
        onClick={() => trackEvent('home_upgrade_configured', { product_slug: product.slug, scope, option_count: options.length, financing_interest: financing, planning_min: result.minCents / 100, planning_max: result.maxCents / 100 })}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e8724b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#d9603c]"
      >{isHomeCare ? 'Request a HomeCare review' : 'Start the concept and planning package'} <ArrowRight className="h-4 w-4" /></Link>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">Range is for early planning only and changes with size, access, selections, labor, jurisdiction, and field conditions. {!isHomeCare && '*Illustrative payment uses the low end over 120 months at 10.99% APR; it is not a financing offer.'}</p>
    </div>
  )
}
