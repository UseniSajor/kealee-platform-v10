'use client'

import { useState } from 'react'
import { Database, Search, Layers, Table2, Link2, ChevronRight } from 'lucide-react'

const SCHEMA_DOMAINS = [
  {
    name: 'Core',
    color: '#1A2B4A',
    models: [
      { name: 'User', fields: 24, relations: 8, records: '1,247' },
      { name: 'Org', fields: 18, relations: 6, records: '89' },
      { name: 'OrgMember', fields: 8, relations: 3, records: '342' },
      { name: 'Project', fields: 32, relations: 14, records: '312' },
    ],
  },
  {
    name: 'Financial',
    color: '#38A169',
    models: [
      { name: 'EscrowAgreement', fields: 16, relations: 5, records: '145' },
      { name: 'EscrowTransaction', fields: 12, relations: 3, records: '892' },
      { name: 'Invoice', fields: 14, relations: 4, records: '1,634' },
      { name: 'Payment', fields: 10, relations: 3, records: '2,108' },
      { name: 'Subscription', fields: 12, relations: 3, records: '67' },
    ],
  },
  {
    name: 'Construction',
    color: '#E8793A',
    models: [
      { name: 'Milestone', fields: 14, relations: 4, records: '1,872' },
      { name: 'Estimate', fields: 20, relations: 6, records: '456' },
      { name: 'EstimateLineItem', fields: 18, relations: 3, records: '64,230' },
      { name: 'ChangeOrder', fields: 12, relations: 4, records: '234' },
      { name: 'Inspection', fields: 16, relations: 5, records: '789' },
    ],
  },
  {
    name: 'Digital Twin',
    color: '#2ABFBF',
    models: [
      { name: 'DigitalTwin', fields: 22, relations: 6, records: '32' },
      { name: 'TwinSensor', fields: 10, relations: 2, records: '128' },
      { name: 'TwinEvent', fields: 8, relations: 2, records: '45,672' },
      { name: 'DashboardWidget', fields: 10, relations: 2, records: '96' },
    ],
  },
  {
    name: 'AI & Bots',
    color: '#A78BFA',
    models: [
      { name: 'AIConversation', fields: 12, relations: 3, records: '2,502' },
      { name: 'LeadScore', fields: 8, relations: 2, records: '847' },
      { name: 'JobQueue', fields: 14, relations: 2, records: '12,341' },
      { name: 'JobSchedule', fields: 8, relations: 1, records: '24' },
    ],
  },
  {
    name: 'Integrations',
    color: '#D69E2E',
    models: [
      { name: 'IntegrationCredential', fields: 10, relations: 2, records: '12' },
      { name: 'SystemConfig', fields: 6, relations: 0, records: '48' },
      { name: 'WebhookEvent', fields: 12, relations: 2, records: '8,934' },
      { name: 'AuditLog', fields: 10, relations: 2, records: '127,450' },
    ],
  },
]

export default function SchemaPage() {
  const [search, setSearch] = useState('')
  const [expandedDomain, setExpandedDomain] = useState<string | null>('Core')

  const totalModels = SCHEMA_DOMAINS.reduce((s, d) => s + d.models.length, 0)

  const filteredDomains = search
    ? SCHEMA_DOMAINS.map(d => ({
        ...d,
        models: d.models.filter(m => m.name.toLowerCase().includes(search.toLowerCase())),
      })).filter(d => d.models.length > 0)
    : SCHEMA_DOMAINS

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Schema Domain Map</h1>
        <p className="mt-1 text-sm text-gray-600">{totalModels} Prisma models across {SCHEMA_DOMAINS.length} domains</p>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search models..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal" />
      </div>

      {/* Domain overview cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
        {SCHEMA_DOMAINS.map((d) => (
          <button
            key={d.name}
            onClick={() => setExpandedDomain(expandedDomain === d.name ? null : d.name)}
            className="rounded-xl border p-4 text-center transition-colors"
            style={{
              borderColor: expandedDomain === d.name ? '#1A2B4A' : '#E5E7EB',
              backgroundColor: expandedDomain === d.name ? '#F7FAFC' : 'white'
            }}
          >
            <div className="mx-auto mb-2 h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>{d.name}</p>
            <p className="text-xs text-gray-500">{d.models.length} models</p>
          </button>
        ))}
      </div>

      {/* Model details */}
      <div className="space-y-4">
        {filteredDomains.map((domain) => (
          <div key={domain.name} className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
              onClick={() => setExpandedDomain(expandedDomain === domain.name ? null : domain.name)}
              className="flex w-full items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: domain.color }} />
                <h2 className="font-display text-lg font-semibold" style={{ color: '#1A2B4A' }}>{domain.name}</h2>
                <span className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: '#F7FAFC', color: '#6B7280' }}>{domain.models.length} models</span>
              </div>
              <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expandedDomain === domain.name ? 'rotate-90' : ''}`} />
            </button>

            {expandedDomain === domain.name && (
              <div className="border-t border-gray-100 px-5 pb-5">
                <div className="grid gap-3 pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  {domain.models.map((model) => (
                    <div key={model.name} className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Table2 className="h-4 w-4 text-gray-400" />
                        <h3 className="font-mono text-sm font-semibold" style={{ color: '#1A2B4A' }}>{model.name}</h3>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                        <div><p className="font-medium" style={{ color: '#1A2B4A' }}>{model.fields}</p>fields</div>
                        <div><p className="font-medium" style={{ color: '#1A2B4A' }}>{model.relations}</p>relations</div>
                        <div><p className="font-medium" style={{ color: '#1A2B4A' }}>{model.records}</p>rows</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
