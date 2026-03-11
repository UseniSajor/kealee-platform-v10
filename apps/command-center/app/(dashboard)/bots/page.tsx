'use client'

import { Bot, MessageSquare, Users, TrendingUp, Clock, CheckCircle, XCircle, Zap, Box, Cpu } from 'lucide-react'

// ── All 13 KeaBots mapped to OS Modules from v20 Seed ──────
const BOTS = [
  {
    id: '1', name: 'KeaBot (Lead Gen)', domain: 'marketplace',
    description: 'Lead generation chatbot with scoring and GHL sync',
    moduleMapping: ['marketplace'],
    status: 'active', uptime: '99.8%', totalConversations: 1247, todayConversations: 12,
    avgResponseTime: '1.2s', leadsCaptured: 89, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'jennifer.a@email.com', topic: 'Kitchen Remodel Quote', score: 82, time: '14 min ago' },
      { user: 'visitor_28471', topic: 'ADU Construction Info', score: 45, time: '1 hour ago' },
      { user: 'mark.j@gmail.com', topic: 'Commercial TI Inquiry', score: 71, time: '3 hours ago' },
    ],
  },
  {
    id: '2', name: 'PM Assistant', domain: 'os-pm',
    description: 'Project management AI for schedule and cost queries',
    moduleMapping: ['os-pm'],
    status: 'active', uptime: '99.9%', totalConversations: 834, todayConversations: 5,
    avgResponseTime: '2.1s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'mike.r@summitgc.com', topic: 'Schedule variance analysis - Riverside MF', score: 0, time: '32 min ago' },
      { user: 'sarah.c@architect.com', topic: 'RFI status check - Oak Hill', score: 0, time: '2 hours ago' },
    ],
  },
  {
    id: '3', name: 'Estimation Bot', domain: 'os-feas',
    description: 'AI-powered cost estimation using CSI divisions and cost library',
    moduleMapping: ['os-feas', 'marketplace'],
    status: 'active', uptime: '99.7%', totalConversations: 421, todayConversations: 3,
    avgResponseTime: '3.8s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'dev_team@kealee.com', topic: 'Oak Hill Mixed-Use CSI breakdown', score: 0, time: '1 hour ago' },
    ],
  },
  {
    id: '4', name: 'Land Scout', domain: 'os-land',
    description: 'Parcel analysis, zoning verification, and comparable sales research',
    moduleMapping: ['os-land'],
    status: 'active', uptime: '99.5%', totalConversations: 312, todayConversations: 2,
    avgResponseTime: '2.8s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'tim@kealee.com', topic: 'Domain Heights Tower zoning check', score: 0, time: '45 min ago' },
    ],
  },
  {
    id: '5', name: 'Design Assistant', domain: 'os-dev',
    description: 'Architect coordination, drawing review, and AI concept generation',
    moduleMapping: ['os-dev'],
    status: 'active', uptime: '99.6%', totalConversations: 567, todayConversations: 4,
    avgResponseTime: '4.2s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'sarah.c@architect.com', topic: 'Oak Hill elevation review', score: 0, time: '20 min ago' },
      { user: 'eng_team@kealee.com', topic: 'Structural calcs validation', score: 0, time: '3 hours ago' },
    ],
  },
  {
    id: '6', name: 'Payments Bot', domain: 'os-pay',
    description: 'Draw request processing, milestone payment tracking, and escrow management',
    moduleMapping: ['os-pay'],
    status: 'active', uptime: '99.9%', totalConversations: 289, todayConversations: 2,
    avgResponseTime: '1.5s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'finance@kealee.com', topic: 'Riverside MF Draw #7 status', score: 0, time: '1 hour ago' },
    ],
  },
  {
    id: '7', name: 'Ops Manager', domain: 'os-ops',
    description: 'Warranty tracking, maintenance scheduling, and service request routing',
    moduleMapping: ['os-ops'],
    status: 'active', uptime: '99.4%', totalConversations: 178, todayConversations: 1,
    avgResponseTime: '2.0s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'ops@kealee.com', topic: 'Slaughter Lane HVAC warranty claim', score: 0, time: '2 hours ago' },
    ],
  },
  {
    id: '8', name: 'Inspector AI', domain: 'os-pm',
    description: 'Photo analysis, inspection scheduling, and code compliance checks',
    moduleMapping: ['os-pm', 'os-dev'],
    status: 'active', uptime: '99.3%', totalConversations: 445, todayConversations: 6,
    avgResponseTime: '5.1s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'inspector@cityofaustin.gov', topic: 'Riverside MF framing inspection photos', score: 0, time: '15 min ago' },
      { user: 'mike.r@summitgc.com', topic: 'East Austin punch list AI review', score: 0, time: '4 hours ago' },
    ],
  },
  {
    id: '9', name: 'Risk Analyzer', domain: 'os-pm',
    description: 'AI-powered risk scoring, weather impact analysis, and proactive alerts',
    moduleMapping: ['os-pm', 'os-feas'],
    status: 'active', uptime: '99.8%', totalConversations: 156, todayConversations: 1,
    avgResponseTime: '3.2s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'pm_team@kealee.com', topic: 'Cedar Park ADU risk assessment', score: 0, time: '5 hours ago' },
    ],
  },
  {
    id: '10', name: 'Report Generator', domain: 'os-pm',
    description: 'Automated investor reports, phase gate reports, and twin KPI dashboards',
    moduleMapping: ['os-pm', 'os-pay'],
    status: 'active', uptime: '99.9%', totalConversations: 98, todayConversations: 0,
    avgResponseTime: '8.5s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [],
  },
  {
    id: '11', name: 'Bid Evaluator', domain: 'marketplace',
    description: 'Automated bid comparison, contractor scoring, and value engineering suggestions',
    moduleMapping: ['marketplace', 'os-feas'],
    status: 'active', uptime: '99.6%', totalConversations: 234, todayConversations: 2,
    avgResponseTime: '4.0s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [
      { user: 'dev_team@kealee.com', topic: 'East Austin bid comparison (4 GCs)', score: 0, time: '6 hours ago' },
    ],
  },
  {
    id: '12', name: 'Permit Navigator', domain: 'os-dev',
    description: 'Permit application assistance, jurisdiction rules, and required document checklists',
    moduleMapping: ['os-dev', 'os-pm'],
    status: 'idle', uptime: '100%', totalConversations: 189, todayConversations: 0,
    avgResponseTime: '2.4s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [],
  },
  {
    id: '13', name: 'Compliance Checker', domain: 'os-pm',
    description: 'Building code validation, energy compliance (Title 24/IECC), and safety regulation checks',
    moduleMapping: ['os-pm', 'os-dev'],
    status: 'idle', uptime: '100%', totalConversations: 112, todayConversations: 0,
    avgResponseTime: '3.6s', leadsCaptured: 0, model: 'claude-sonnet-4-20250514',
    recentConversations: [],
  },
]

// Module display names
const MODULE_NAMES: Record<string, string> = {
  'os-land': 'OS Land',
  'os-feas': 'OS Feasibility',
  'os-dev': 'OS Development',
  'os-pm': 'OS Project Management',
  'os-pay': 'OS Payments',
  'os-ops': 'OS Operations',
  'marketplace': 'Marketplace',
}

const activeBots = BOTS.filter(b => b.status === 'active').length
const idleBots = BOTS.filter(b => b.status === 'idle').length
const totalConvToday = BOTS.reduce((s, b) => s + b.todayConversations, 0)
const totalLeads = BOTS.reduce((s, b) => s + b.leadsCaptured, 0)

export default function BotsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Bot Management</h1>
        <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {BOTS.length} KeaBots | {activeBots} active | {idleBots} idle | mapped to 7 OS modules
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <Bot className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          <p className="mt-2 text-2xl font-bold text-white">{BOTS.length}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Total KeaBots</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <MessageSquare className="h-5 w-5" style={{ color: '#38A169' }} />
          <p className="mt-2 text-2xl font-bold text-white">{totalConvToday}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Today's Conversations</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <Users className="h-5 w-5" style={{ color: '#E8793A' }} />
          <p className="mt-2 text-2xl font-bold text-white">{totalLeads}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Leads Captured (MTD)</p>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
          <Zap className="h-5 w-5" style={{ color: '#D69E2E' }} />
          <p className="mt-2 text-2xl font-bold text-white">{(BOTS.reduce((s, b) => s + parseFloat(b.avgResponseTime), 0) / BOTS.length).toFixed(1)}s</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Avg Response Time</p>
        </div>
      </div>

      {/* Module Domain Summary */}
      <div className="mb-6 rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
        <h2 className="font-display mb-3 text-sm font-semibold text-white">Bot-to-Module Mapping</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Object.entries(MODULE_NAMES).map(([key, name]) => {
            const botCount = BOTS.filter(b => b.moduleMapping.includes(key)).length
            return (
              <div key={key} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <Box className="mx-auto h-4 w-4" style={{ color: '#2ABFBF' }} />
                <p className="mt-1 text-sm font-bold text-white">{botCount}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{name}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bot Cards */}
      <div className="space-y-4">
        {BOTS.map((bot) => (
          <div key={bot.id} className="rounded-xl border p-5" style={{ borderColor: '#2A3D5F', backgroundColor: '#1A2B4A' }}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-3" style={{ backgroundColor: bot.status === 'active' ? 'rgba(56, 161, 105, 0.1)' : 'rgba(255,255,255,0.05)' }}>
                  <Bot className="h-6 w-6" style={{ color: bot.status === 'active' ? '#38A169' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-white">{bot.name}</h3>
                    {bot.moduleMapping.map((mod) => (
                      <span key={mod} className="rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: 'rgba(42, 191, 191, 0.1)', color: '#2ABFBF' }}>
                        {MODULE_NAMES[mod]}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{bot.description}</p>
                  <p className="mt-1 text-xs font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>Model: {bot.model}</p>
                </div>
              </div>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{
                backgroundColor: bot.status === 'active' ? 'rgba(56, 161, 105, 0.15)' : 'rgba(255,255,255,0.05)',
                color: bot.status === 'active' ? '#38A169' : 'rgba(255,255,255,0.3)'
              }}>{bot.status}</span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Total Conversations</p>
                <p className="text-lg font-bold text-white">{bot.totalConversations.toLocaleString()}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Today</p>
                <p className="text-lg font-bold text-white">{bot.todayConversations}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Avg Response</p>
                <p className="text-lg font-bold text-white">{bot.avgResponseTime}</p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Uptime</p>
                <p className="text-lg font-bold" style={{ color: '#38A169' }}>{bot.uptime}</p>
              </div>
              {bot.leadsCaptured > 0 && (
                <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(15, 26, 46, 0.5)' }}>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Leads (MTD)</p>
                  <p className="text-lg font-bold" style={{ color: '#E8793A' }}>{bot.leadsCaptured}</p>
                </div>
              )}
            </div>

            {bot.recentConversations.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Recent Conversations</h4>
                <div className="space-y-2">
                  {bot.recentConversations.map((conv, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(15, 26, 46, 0.3)' }}>
                      <div>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{conv.user}</span>
                        <span className="mx-2" style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
                        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{conv.topic}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {conv.score > 0 && (
                          <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(42, 191, 191, 0.15)', color: '#2ABFBF' }}>Score: {conv.score}</span>
                        )}
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>{conv.time}</span>
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
