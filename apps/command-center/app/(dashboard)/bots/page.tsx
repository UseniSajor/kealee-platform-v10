'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Bot, Zap, Clock, DollarSign, ChevronRight, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Play, Cpu, Activity,
} from 'lucide-react'
import { listBots, listExecutions, executeBot } from '@/lib/api/bots'
import type { BotMeta, BotExecutionTrace } from '@/lib/api/bots'

// ── Helpers ───────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`} />
}

function ms(n: number): string {
  if (n < 1000) return `${n}ms`
  return `${(n / 1000).toFixed(1)}s`
}

function usd(n?: number): string {
  if (!n) return '—'
  return n < 0.001 ? '<$0.001' : `$${n.toFixed(4)}`
}

const COST_COLORS: Record<string, string> = {
  free:   '#38A169',
  low:    '#3182CE',
  medium: '#E8793A',
  high:   '#E53E3E',
}

// ── Bot card ──────────────────────────────────────────────────────────────────

function BotCard({ bot, onRun }: { bot: BotMeta; onRun: (botId: string) => void }) {
  const costColor = COST_COLORS[bot.costProfile] ?? '#9CA3AF'
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(42,191,191,0.1)' }}
          >
            <Bot className="h-5 w-5" style={{ color: '#2ABFBF' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#1A2B4A' }}>{bot.name}</h3>
            <p className="text-xs text-gray-400">v{bot.version}</p>
          </div>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${costColor}15`, color: costColor }}
        >
          {bot.costProfile}
        </span>
      </div>
      <p className="mb-4 text-xs text-gray-500 leading-relaxed">{bot.description}</p>
      <div className="flex items-center justify-between">
        <span
          className="flex items-center gap-1 text-xs"
          style={{ color: bot.requiresLLM ? '#805AD5' : '#38A169' }}
        >
          {bot.requiresLLM ? <Cpu className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
          {bot.requiresLLM ? 'LLM' : 'Deterministic'}
        </span>
        <button
          onClick={() => onRun(bot.id)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#E8793A' }}
        >
          <Play className="h-3 w-3" />Run
        </button>
      </div>
    </div>
  )
}

// ── Trace row ─────────────────────────────────────────────────────────────────

function TraceRow({ trace }: { trace: BotExecutionTrace }) {
  const [expanded, setExpanded] = useState(false)
  const hasError = trace.steps.some(s => s.error)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
        onClick={() => setExpanded(v => !v)}
      >
        {hasError
          ? <XCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          : <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-400" />}
        <span className="flex-1 min-w-0">
          <span className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{trace.botId}</span>
          <span className="ml-2 text-xs text-gray-400">{trace.requestId.slice(0, 8)}…</span>
        </span>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ms(trace.durationMs)}</span>
          {trace.cost && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{usd(trace.cost.estimatedUSD)}</span>}
          {trace.modelUsed && <span className="hidden sm:block truncate max-w-[120px]">{trace.modelUsed}</span>}
        </div>
        <ChevronRight className="h-3 w-3 flex-shrink-0 text-gray-300 transition-transform" style={{ transform: expanded ? 'rotate(90deg)' : undefined }} />
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
          <div className="mb-2 flex flex-wrap gap-3 text-xs text-gray-500">
            {trace.inputTokens  !== undefined && <span>In: {trace.inputTokens} tok</span>}
            {trace.outputTokens !== undefined && <span>Out: {trace.outputTokens} tok</span>}
            <span>{trace.deterministic ? 'Deterministic' : 'LLM-assisted'}</span>
            <span>{new Date(trace.startedAt).toLocaleTimeString()}</span>
          </div>
          <div className="space-y-1.5">
            {trace.steps.map(step => (
              <div key={step.stepId} className="flex items-start gap-2 rounded-lg bg-white p-2 text-xs border border-gray-100">
                <span
                  className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                  style={{
                    backgroundColor: step.type === 'llm' ? 'rgba(128,90,213,0.1)' : 'rgba(42,191,191,0.1)',
                    color: step.type === 'llm' ? '#805AD5' : '#2ABFBF',
                  }}
                >
                  {step.type}
                </span>
                <span className="font-medium text-gray-700">{step.name}</span>
                {step.outputSummary && <span className="ml-auto text-gray-400 truncate max-w-[200px]">{step.outputSummary}</span>}
                <span className="shrink-0 text-gray-400">{ms(step.durationMs)}</span>
                {step.error && <span className="ml-1 text-red-500 truncate max-w-[160px]">⚠ {step.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Run modal ─────────────────────────────────────────────────────────────────

const BOT_SAMPLE_INPUTS: Record<string, { label: string; input: Record<string, unknown> }> = {
  'lead-bot':            { label: 'High-quality lead in DC', input: { sessionId: 'demo', message: 'I want to renovate my kitchen in Bethesda MD. Budget around $120K, ready to start this summer.' } },
  'estimate-bot':        { label: 'Kitchen + bath renovation', input: { projectType: 'residential renovation', location: 'Bethesda, MD', scopeOfWork: 'Full kitchen and two bathrooms', squareFootage: 1400, qualityLevel: 'premium' } },
  'permit-bot':          { label: 'Two-story addition Arlington VA', input: { projectType: 'addition', jurisdiction: 'Arlington, VA', scope: 'Two-story rear addition, 600 sqft', structuralChanges: true, electricalChanges: true } },
  'contractor-match-bot':{ label: 'Match contractors for renovation', input: { leadId: 'lead-demo', projectType: 'residential renovation', location: 'Bethesda, MD', budget: 150000 } },
  'project-monitor-bot': { label: 'Project health (replace ID)', input: { projectId: 'REPLACE_WITH_REAL_PROJECT_ID', includeRiskAnalysis: true } },
  'support-bot':         { label: 'Owner navigation question', input: { sessionId: 'support-demo', message: 'How do I check the readiness status of my project?', userRole: 'owner' } },
}

function RunModal({ botId, onClose, onResult }: { botId: string; onClose: () => void; onResult: (r: Record<string, unknown>) => void }) {
  const sample  = BOT_SAMPLE_INPUTS[botId]
  const [json, setJson] = useState(JSON.stringify(sample?.input ?? {}, null, 2))
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState<string | null>(null)

  const run = async () => {
    setBusy(true); setErr(null)
    try {
      const data   = JSON.parse(json)
      const result = await executeBot(botId, data)
      onResult(result as any)
      onClose()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-base font-bold" style={{ color: '#1A2B4A' }}>Run {botId}</h3>
        {sample && <p className="mb-3 text-xs text-gray-400">Sample: {sample.label}</p>}
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs focus:outline-none"
          onFocus={e => { e.target.style.borderColor = '#2ABFBF'; e.target.style.boxShadow = '0 0 0 1px #2ABFBF' }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
        />
        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
        <div className="mt-4 flex gap-3">
          <button onClick={onClose} disabled={busy} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={run} disabled={busy} className="flex-1 rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#E8793A' }}>
            {busy ? 'Running…' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BotsPage() {
  const [bots,        setBots]        = useState<BotMeta[]>([])
  const [traces,      setTraces]      = useState<BotExecutionTrace[]>([])
  const [loadingBots, setLoadingBots] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [runBotId,    setRunBotId]    = useState<string | null>(null)
  const [lastResult,  setLastResult]  = useState<Record<string, unknown> | null>(null)

  const loadBots = useCallback(async () => {
    try { setBots(await listBots()) } catch (e: any) { setError(e.message) } finally { setLoadingBots(false) }
  }, [])

  const loadTraces = useCallback(async () => {
    setLoadingLogs(true)
    try { setTraces(await listExecutions({ limit: 30 })) } catch { /* optional */ } finally { setLoadingLogs(false) }
  }, [])

  useEffect(() => { loadBots(); loadTraces() }, [loadBots, loadTraces])

  const handleResult = (result: Record<string, unknown>) => { setLastResult(result); loadTraces() }

  const totalCost  = traces.reduce((s, t) => s + (t.cost?.estimatedUSD ?? 0), 0)
  const avgDur     = traces.length > 0 ? Math.round(traces.reduce((s, t) => s + t.durationMs, 0) / traces.length) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>KeaBots</h1>
        <p className="mt-1 text-sm text-gray-500">AI automation layer — execute, monitor, and trace bot runs</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Registered Bots', value: loadingBots ? null : bots.length,  color: '#2ABFBF' },
          { label: 'LLM-backed',      value: bots.filter(b => b.requiresLLM).length,  color: '#805AD5' },
          { label: 'Cost (session)',  value: loadingLogs ? null : usd(totalCost), color: '#1A2B4A' },
          { label: 'Avg Duration',    value: loadingLogs ? null : ms(avgDur),     color: '#E8793A' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{label}</p>
            {value === null
              ? <Skeleton className="mt-1 h-8 w-16" />
              : <p className="mt-1 text-2xl font-bold font-display" style={{ color }}>{value}</p>}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Last result */}
      {lastResult && (
        <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Last execution result</p>
            <button onClick={() => setLastResult(null)} className="text-xs text-gray-400 hover:text-gray-600">dismiss</button>
          </div>
          <pre className="max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bot registry */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Bot Registry</h2>
            <span className="text-xs text-gray-400">{bots.length} bots</span>
          </div>
          {loadingBots ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bots.map(bot => <BotCard key={bot.id} bot={bot} onRun={setRunBotId} />)}
            </div>
          )}
        </div>

        {/* Execution log */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: '#1A2B4A' }}>Execution Log</h2>
            <button onClick={loadTraces} className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2ABFBF' }}>
              <RefreshCw className="h-3 w-3" />Refresh
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {loadingLogs ? (
              <div className="p-4 space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full rounded" />)}</div>
            ) : traces.length === 0 ? (
              <div className="py-12 text-center">
                <Activity className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">No executions yet</p>
                <p className="text-xs text-gray-400">Run a bot to see traces here</p>
              </div>
            ) : (
              <div>{traces.map(t => <TraceRow key={t.requestId} trace={t} />)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Run modal */}
      {runBotId && (
        <RunModal botId={runBotId} onClose={() => setRunBotId(null)} onResult={handleResult} />
      )}
    </div>
  )
}
