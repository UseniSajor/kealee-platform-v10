'use client'

/**
 * /marketing — Kealee Marketing Command Center
 *
 * Tabs:
 *  1. Content Generator — run marketing-bot / pitch-bot, copy generated content
 *  2. Lead Pipeline     — all marketing-sourced leads with source + conversion status
 *  3. Sequences         — drip email queue status per lead
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Megaphone, Sparkles, Users, Mail, Copy, Check, RefreshCw,
  Loader2, ChevronDown, ExternalLink, Send, Instagram, Facebook,
  MessageSquare, AtSign,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MarketingContent {
  instagramPost?: string
  facebookPost?:  string
  emailSubject?:  string
  emailBody?:     string
  dmScript?:      string[]
  redditPost?:    string
  redditTitle?:   string
  keyBenefits?:   string[]
}

interface Lead {
  id:              string
  contact_email:   string
  client_name:     string
  project_path:    string
  status:          string
  created_at:      string
  form_data:       { source?: string; tier?: number; message?: string } | null
  budget_range:    string | null
  project_address: string | null
}

interface SequenceEntry {
  id:             string
  email:          string
  sequence_step:  number
  send_at:        string
  status:         string
  service_label:  string
}

interface MarketingStats {
  totalLeads:      number
  bySource:        Record<string, number>
  byService:       Record<string, number>
  converted:       number
  conversionRate:  string
  sequencesPending: number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SERVICE_OPTIONS = [
  { value: 'kitchen_remodel',    label: 'Kitchen Remodel' },
  { value: 'bathroom_remodel',   label: 'Bathroom Remodel' },
  { value: 'exterior_concept',   label: 'Exterior Concept' },
  { value: 'interior_renovation', label: 'Interior Renovation' },
  { value: 'whole_home_remodel', label: 'Whole-Home Remodel' },
  { value: 'addition_expansion', label: 'Addition / Expansion' },
  { value: 'garden_concept',     label: 'Garden Concept' },
  { value: 'design_build',       label: 'Design + Build' },
]

const AUDIENCE_OPTIONS = [
  'Austin TX homeowners aged 35–55',
  'Dallas-Fort Worth homeowners',
  'Houston TX homeowners',
  'San Antonio TX homeowners',
  'First-time renovation buyers',
  'Luxury homeowners ($500K+ budget)',
  'Real estate investors',
  'New construction buyers',
]

const SOURCE_COLORS: Record<string, string> = {
  marketing_bot:  'bg-purple-900/40 text-purple-300',
  facebook_bot:   'bg-blue-900/40 text-blue-300',
  instagram_dm:   'bg-pink-900/40 text-pink-300',
  email_bot:      'bg-teal-900/40 text-teal-300',
  chatbot:        'bg-amber-900/40 text-amber-300',
  reddit:         'bg-orange-900/40 text-orange-300',
}

const SEQ_STATUS_COLORS: Record<string, string> = {
  pending:       'text-amber-400',
  sent:          'text-emerald-400',
  failed:        'text-rose-400',
  unsubscribed:  'text-gray-500',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }
  return { copied, copy }
}

function CopyBtn({ text, id }: { text: string; id: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      onClick={() => copy(text, id)}
      className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-xs text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
    >
      {copied === id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
      {copied === id ? 'Copied' : 'Copy'}
    </button>
  )
}

function ContentCard({ title, icon: Icon, content, id }: {
  title: string
  icon:  React.ElementType
  content: string
  id: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-xl border" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
      <div
        className="flex cursor-pointer items-center gap-2 px-4 py-3"
        onClick={() => setOpen(o => !o)}
      >
        <Icon className="h-4 w-4" style={{ color: '#2ABFBF' }} />
        <span className="text-sm font-medium text-white">{title}</span>
        <CopyBtn text={content} id={id} />
        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${open ? '' : '-rotate-90'}`} />
      </div>
      {open && (
        <div className="border-t px-4 py-3" style={{ borderColor: '#2A3D5F' }}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {content}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Tab 1: Content Generator ──────────────────────────────────────────────────

function ContentGenerator() {
  const [serviceType,     setServiceType]     = useState('kitchen_remodel')
  const [targetAudience,  setTargetAudience]  = useState(AUDIENCE_OPTIONS[0])
  const [customAudience,  setCustomAudience]  = useState('')
  const [tone,            setTone]            = useState('friendly and professional')
  const [loading,         setLoading]         = useState(false)
  const [content,         setContent]         = useState<MarketingContent | null>(null)
  const [error,           setError]           = useState<string | null>(null)

  const audience = customAudience.trim() || targetAudience

  async function generate() {
    setLoading(true)
    setError(null)
    setContent(null)
    try {
      const res = await fetch('/api/bots/marketing-bot/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { serviceType, targetAudience: audience, tone } }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Bot failed')
      setContent(json.result as MarketingContent)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Service Type</label>
          <select
            value={serviceType}
            onChange={e => setServiceType(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
          >
            {SERVICE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Target Audience</label>
          <select
            value={targetAudience}
            onChange={e => { setTargetAudience(e.target.value); setCustomAudience('') }}
            className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
          >
            {AUDIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Custom Audience (override)</label>
          <input
            value={customAudience}
            onChange={e => setCustomAudience(e.target.value)}
            placeholder="e.g. Reddit r/HomeImprovement users"
            className="w-full rounded-lg border px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Tone</label>
          <input
            value={tone}
            onChange={e => setTone(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none"
            style={{ borderColor: '#2A3D5F', backgroundColor: '#0F1A2E' }}
          />
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#E8793A' }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? 'Generating…' : 'Generate Content'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#FCA5A5' }}>
          {error}
        </div>
      )}

      {/* Output */}
      {content && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Generated Content — {SERVICE_OPTIONS.find(s => s.value === serviceType)?.label} · {audience}
          </h3>

          {content.instagramPost && (
            <ContentCard title="Instagram Caption" icon={Instagram} content={content.instagramPost} id="ig" />
          )}
          {content.facebookPost && (
            <ContentCard title="Facebook Post" icon={Facebook} content={content.facebookPost} id="fb" />
          )}
          {content.redditTitle && content.redditPost && (
            <ContentCard
              title="Reddit Post"
              icon={AtSign}
              content={`Title: ${content.redditTitle}\n\n${content.redditPost}`}
              id="reddit"
            />
          )}
          {content.emailSubject && content.emailBody && (
            <ContentCard
              title="Email Campaign"
              icon={Mail}
              content={`Subject: ${content.emailSubject}\n\n${content.emailBody}`}
              id="email"
            />
          )}
          {content.dmScript && content.dmScript.length > 0 && (
            <ContentCard
              title="DM Script (3-message sequence)"
              icon={MessageSquare}
              content={content.dmScript.map((m, i) => `Message ${i + 1}:\n${m}`).join('\n\n')}
              id="dm"
            />
          )}
          {content.keyBenefits && content.keyBenefits.length > 0 && (
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <p className="mb-2 text-sm font-medium text-white">Key Benefits (for ads / landing pages)</p>
              <ul className="space-y-1">
                {content.keyBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: '#2ABFBF' }}>•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab 2: Lead Pipeline ──────────────────────────────────────────────────────

function LeadPipeline({ stats }: { stats: MarketingStats | null }) {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/command-center/marketing')
      const json = await res.json()
      setLeads(json.leads ?? [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#2ABFBF' }} />
    </div>
  )
  if (error) return <p className="text-rose-400 text-sm">{error}</p>

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Marketing Leads', value: stats.totalLeads },
            { label: 'Converted',       value: stats.converted },
            { label: 'Conversion Rate', value: stats.conversionRate },
            { label: 'Drip Pending',    value: stats.sequencesPending },
          ].map(s => (
            <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leads table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2A3D5F' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#1A2B4A' }}>
            <tr>
              {['Name / Email', 'Service', 'Source', 'Budget', 'Status', 'Date'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No marketing leads yet. Generate content and capture leads via the bot channels.
                </td>
              </tr>
            ) : leads.map(lead => (
              <tr key={lead.id} className="border-t hover:bg-white/5 transition-colors" style={{ borderColor: '#2A3D5F' }}>
                <td className="px-4 py-3">
                  <p className="font-medium text-white">{lead.client_name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{lead.contact_email}</p>
                </td>
                <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {lead.project_path.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_COLORS[lead.form_data?.source ?? ''] ?? 'bg-gray-700 text-gray-300'}`}>
                    {lead.form_data?.source ?? 'unknown'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {lead.budget_range ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    lead.status === 'paid' || lead.status === 'concept_ready'
                      ? 'bg-emerald-900/40 text-emerald-400'
                      : lead.status === 'processing'
                        ? 'bg-blue-900/40 text-blue-300'
                        : 'bg-gray-700 text-gray-400'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab 3: Drip Sequences ─────────────────────────────────────────────────────

function DripSequences() {
  const [sequences, setSequences] = useState<SequenceEntry[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/command-center/marketing/sequences')
      .then(r => r.json())
      .then(j => setSequences(j.sequences ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#2ABFBF' }} />
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4 text-sm" style={{ borderColor: '#2A3D5F', backgroundColor: 'rgba(42,191,191,0.05)' }}>
        <p className="font-medium" style={{ color: '#2ABFBF' }}>3-Email Drip Sequence</p>
        <p className="mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Every marketing lead automatically receives: Day 1 — concept package details · Day 3 — social proof + examples · Day 7 — final offer
        </p>
      </div>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2A3D5F' }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: '#1A2B4A' }}>
            <tr>
              {['Email', 'Service', 'Step', 'Send At', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sequences.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  No drip sequences yet. Note: run the Supabase SQL to create the marketing_drip_queue table first.
                </td>
              </tr>
            ) : sequences.map(s => (
              <tr key={s.id} className="border-t hover:bg-white/5" style={{ borderColor: '#2A3D5F' }}>
                <td className="px-4 py-3 text-white">{s.email}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.service_label}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full px-2 py-0.5 text-xs" style={{ backgroundColor: 'rgba(42,191,191,0.15)', color: '#2ABFBF' }}>
                    Step {s.sequence_step}/3
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(s.send_at).toLocaleString()}
                </td>
                <td className={`px-4 py-3 text-xs font-medium ${SEQ_STATUS_COLORS[s.status] ?? 'text-gray-400'}`}>
                  {s.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'content' | 'leads' | 'sequences'

export default function MarketingPage() {
  const [tab,   setTab]   = useState<Tab>('content')
  const [stats, setStats] = useState<MarketingStats | null>(null)

  useEffect(() => {
    fetch('/api/command-center/marketing')
      .then(r => r.json())
      .then(j => setStats(j.stats ?? null))
      .catch(() => null)
  }, [])

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'content',   label: 'Content Generator', icon: Sparkles },
    { id: 'leads',     label: 'Lead Pipeline',      icon: Users },
    { id: 'sequences', label: 'Drip Sequences',     icon: Send },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6" style={{ color: '#E8793A' }} />
            Marketing
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI-generated content · Lead capture · Drip automation
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span className="font-semibold text-white">{stats.totalLeads}</span> marketing leads ·
            <span className="font-semibold" style={{ color: '#2ABFBF' }}>{stats.conversionRate}</span> conversion
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: '#2A3D5F' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id ? 'border-current' : 'border-transparent text-white/40 hover:text-white/70'
            }`}
            style={tab === t.id ? { color: '#2ABFBF', borderColor: '#2ABFBF' } : undefined}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'content'   && <ContentGenerator />}
      {tab === 'leads'     && <LeadPipeline stats={stats} />}
      {tab === 'sequences' && <DripSequences />}
    </div>
  )
}
