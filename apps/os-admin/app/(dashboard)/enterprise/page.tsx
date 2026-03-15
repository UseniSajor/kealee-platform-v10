'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, Flag, Shield, Puzzle, Plus, ChevronRight } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface PortfolioOrg {
  id: string
  name: string
  domain: string | null
  memberCount: number
  projectCount: number
  planId: string | null
}

interface FeatureFlag {
  flagKey: string
  enabled: boolean
  scope: string
  rolloutPercent: number | null
}

interface Partner {
  id: string
  name: string
  partnerType: string
  active: boolean
  markets: string[]
}

type Tab = 'orgs' | 'flags' | 'partners'

export default function EnterpriseDashboard() {
  const [tab, setTab] = useState<Tab>('orgs')
  const [orgs, setOrgs] = useState<PortfolioOrg[]>([])
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    if (tab === 'orgs') {
      // Admin list — in production would be behind admin middleware
      apiFetch<{ orgs: PortfolioOrg[] }>('/enterprise/orgs')
        .then(r => setOrgs(r.orgs ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else if (tab === 'flags') {
      apiFetch<{ flags: FeatureFlag[] }>('/enterprise/flags')
        .then(r => setFlags(r.flags ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      apiFetch<{ partners: Partner[] }>('/enterprise/partners')
        .then(r => setPartners(r.partners ?? []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [tab])

  const TABS = [
    { id: 'orgs' as Tab,     label: 'Portfolio Orgs',  icon: Building2 },
    { id: 'flags' as Tab,    label: 'Feature Flags',   icon: Flag },
    { id: 'partners' as Tab, label: 'Partners',         icon: Puzzle },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: '#1A2B4A' }}>
            Enterprise Platform
          </h1>
          <p className="mt-1 text-sm text-gray-500">Organizations, feature flags, and partner integrations</p>
        </div>
        <button
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: '#2ABFBF' }}
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-b-2 text-teal-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={tab === t.id ? { borderBottomColor: '#2ABFBF' } : {}}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : tab === 'orgs' ? (
        <div className="space-y-3">
          {orgs.length === 0 ? (
            <EmptyState icon={Building2} label="No portfolio organizations yet" />
          ) : orgs.map(org => (
            <div key={org.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                  <Building2 className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{org.name}</p>
                  <p className="text-xs text-gray-400">
                    {org.domain ?? 'No domain'} · {org.memberCount} members · {org.projectCount} projects
                  </p>
                </div>
              </div>
              <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : tab === 'flags' ? (
        <div className="space-y-3">
          {flags.length === 0 ? (
            <EmptyState icon={Flag} label="No feature flags configured" />
          ) : flags.map(flag => (
            <div key={`${flag.flagKey}-${flag.scope}`} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                  style={flag.enabled ? { backgroundColor: '#38A16915', color: '#38A169' } : { backgroundColor: '#6B728015', color: '#6B7280' }}
                >
                  {flag.enabled ? 'ON' : 'OFF'}
                </div>
                <div>
                  <p className="font-mono text-sm font-medium" style={{ color: '#1A2B4A' }}>{flag.flagKey}</p>
                  <p className="text-xs text-gray-400">
                    {flag.scope} scope
                    {flag.rolloutPercent != null && ` · ${flag.rolloutPercent}% rollout`}
                  </p>
                </div>
              </div>
              <button className="rounded-lg px-3 py-1 text-xs border border-gray-200 text-gray-500 hover:bg-gray-50">
                Edit
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {partners.length === 0 ? (
            <EmptyState icon={Puzzle} label="No partner integrations registered" />
          ) : partners.map(partner => (
            <div key={partner.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                  <Puzzle className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: '#1A2B4A' }}>{partner.name}</p>
                  <p className="text-xs text-gray-400">
                    {partner.partnerType.replace(/_/g, ' ')} · {partner.markets.join(', ') || 'All markets'}
                  </p>
                </div>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: '#38A16915', color: '#38A169' }}
              >
                Active
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
      <Icon className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}
