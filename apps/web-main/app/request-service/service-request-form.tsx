'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import type { ProjectClarityReport } from '@/lib/project-clarity-report'

export function ServiceRequestForm({ serviceKey, serviceName, showPaidNextSteps = false }: { serviceKey: string; serviceName: string; showPaidNextSteps?: boolean }) {
  const [state, setState] = useState<'idle' | 'saving' | 'complete' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [clarityResult, setClarityResult] = useState<{ report: ProjectClarityReport; portalDownloadUrl: string } | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('saving')
    const form = new FormData(event.currentTarget)
    const response = await fetch('/api/service-requests', { method: 'POST', body: form })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(result.error ?? 'We could not save your request. Please try again.')
      setState('error')
      return
    }
    if (showPaidNextSteps && result.report && result.portalDownloadUrl) {
      setClarityResult({ report: result.report, portalDownloadUrl: result.portalDownloadUrl })
    }
    setState('complete')
  }

  if (state === 'complete') return <div className="mt-8 space-y-5"><div className="rounded-2xl border-2 border-teal-200 bg-[#ddf5ed] p-6"><CheckCircle2 className="h-8 w-8 text-[#17815d]" /><h3 className="mt-4 text-xl font-black text-[#10233e]">Your free Project Clarity Report is ready.</h3><p className="mt-2 text-sm leading-6 text-[#526477]">View it immediately below. Sign in to the owner portal when you want to download and retain a copy.</p></div>{clarityResult ? <article className="rounded-2xl border-2 border-yellow-300 bg-gradient-to-br from-white to-yellow-50 p-6 text-[#10233e]"><p className="text-xs font-black uppercase tracking-[.16em] text-[#7a563d]">Immediate report</p><h3 className="mt-2 text-2xl font-black">{clarityResult.report.title}</h3><p className="mt-1 text-xs text-slate-500">{clarityResult.report.projectAddress}</p><div className="mt-5 rounded-xl bg-teal-50 p-4"><p className="text-xs font-bold uppercase tracking-wide text-teal-800">Readiness status</p><p className="mt-1 text-sm font-bold">{clarityResult.report.readinessStatus}</p></div><h4 className="mt-6 text-sm font-black">What we found</h4><ul className="mt-2 space-y-2">{clarityResult.report.observations.map(item => <li key={item} className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-teal-700" />{item}</li>)}</ul><h4 className="mt-6 text-sm font-black">Recommended Kealee services</h4><div className="mt-3 grid gap-3 sm:grid-cols-2">{clarityResult.report.recommendedServices.map(service => <Link key={service.name} href={service.href} className="rounded-xl border border-teal-200 bg-white p-4 hover:border-teal-500"><span className="text-sm font-black text-teal-800">{service.name}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{service.reason}</span></Link>)}</div><a href={clarityResult.portalDownloadUrl} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10233e] px-5 py-3.5 text-sm font-black text-white">Sign in to portal to download <ArrowRight className="h-4 w-4" /></a><p className="mt-2 text-center text-xs text-slate-500">Portal access is required only for the download. This on-screen report remains visible now.</p></article> : null}</div>

  const fieldClass = 'mt-2 w-full rounded-xl border border-[#10233e]/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#147d92] focus:ring-4 focus:ring-[#147d92]/10'
  return <form onSubmit={submit} className="mt-8 space-y-5">
    <input type="hidden" name="serviceKey" value={serviceKey} /><input type="hidden" name="serviceName" value={serviceName} />
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-[#10233e]">Name<input required name="name" autoComplete="name" className={fieldClass} /></label><label className="text-sm font-bold text-[#10233e]">Email<input required type="email" name="email" autoComplete="email" className={fieldClass} /></label></div>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-[#10233e]">Phone<input name="phone" autoComplete="tel" className={fieldClass} /></label><label className="text-sm font-bold text-[#10233e]">Preferred contact<select name="contactPreference" className={fieldClass}><option>Email</option><option>Phone</option><option>Text message</option></select></label></div>
    <label className="block text-sm font-bold text-[#10233e]">Property address<input required name="address" autoComplete="street-address" className={fieldClass} /></label>
    <label className="block text-sm font-bold text-[#10233e]">What are you hoping to build or change?<textarea required name="projectDescription" rows={5} className={fieldClass} placeholder="Describe the property, desired result, important constraints, and the decision you need help making." /></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-[#10233e]">Budget range<select name="budgetRange" className={fieldClass}><option>Not sure yet</option><option>Under $50,000</option><option>$50,000–$100,000</option><option>$100,000–$250,000</option><option>$250,000–$500,000</option><option>Over $500,000</option></select></label><label className="text-sm font-bold text-[#10233e]">Desired timing<select name="timeline" className={fieldClass}><option>Exploring</option><option>Within 3 months</option><option>3–6 months</option><option>6–12 months</option><option>More than 12 months</option></select></label></div>
    <label className="flex items-start gap-3 text-xs leading-5 text-[#66758a]"><input required type="checkbox" name="consent" value="yes" className="mt-1" />I agree that Kealee may contact me about this project. This request is not a purchase or acceptance of the project.</label>
    {state === 'error' && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>}
    <button disabled={state === 'saving'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f36b2b] px-6 py-4 text-sm font-extrabold text-white hover:bg-[#df581f] disabled:opacity-60">{state === 'saving' ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving request…</> : <>Request project review <ArrowRight className="h-4 w-4" /></>}</button>
  </form>
}
