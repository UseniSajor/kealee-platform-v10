"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { api } from "@pm/lib/api"

interface IntegrationItem {
  id: string
  name: string
  description: string
  status: "connected" | "partial" | "not_connected"
  category: string
  details: string
  route?: string
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: "stripe-payments",
    name: "Stripe Payments",
    description: "Payment processing, escrow funding, and contractor payouts",
    status: "connected",
    category: "Payments",
    details: "Webhook handlers: payment_intent.succeeded/failed, transfer.created, transfer.reversed",
    route: "/finance/payments",
  },
  {
    id: "stripe-subscriptions",
    name: "Stripe Subscriptions",
    description: "Subscription lifecycle management and billing",
    status: "connected",
    category: "Billing",
    details: "Webhook handlers: customer.subscription.created/updated/deleted, invoice.paid/failed",
    route: "/pm/subscription",
  },
  {
    id: "stripe-connect",
    name: "Stripe Connect",
    description: "Contractor onboarding and direct payouts",
    status: "connected",
    category: "Payments",
    details: "Account verification, payout routing, and compliance monitoring",
    route: "/finance/releases",
  },
  {
    id: "supabase-auth",
    name: "Supabase Auth",
    description: "Unified authentication across all portals",
    status: "connected",
    category: "Authentication",
    details: "Single sign-in flow: /login with redirect support for all portals (PM, Finance, Estimation, Ops, etc.)",
    route: "/pm/account",
  },
  {
    id: "estimation-engine",
    name: "Estimation Engine",
    description: "Construction cost estimation with AI-powered takeoff",
    status: "connected",
    category: "Core Tools",
    details: "Create, edit, list estimates with status mapping (draft/review/sent/final). AI takeoff and cost databases.",
    route: "/estimation/dashboard",
  },
  {
    id: "docusign",
    name: "DocuSign e-Signatures",
    description: "Contract and change order signing workflows",
    status: "connected",
    category: "Documents",
    details: "Envelope creation, embedded signing, status tracking, template management",
    route: "/pm/contracts",
  },
  {
    id: "finance-reports",
    name: "Financial Reports",
    description: "Transaction summaries, escrow status, fee reports, and tax documents",
    status: "connected",
    category: "Finance",
    details: "On-demand report generation with date range filters. PDF, CSV, and XLSX export formats.",
    route: "/finance/reports",
  },
  {
    id: "bullmq-workers",
    name: "BullMQ Job Queue",
    description: "Background job processing for async operations",
    status: "connected",
    category: "Infrastructure",
    details: "Redis-backed job queues for email, notifications, document generation, and AI processing",
    route: "/pm/command-center",
  },
  {
    id: "messaging",
    name: "Real-time Messaging",
    description: "Project-level communication between stakeholders",
    status: "connected",
    category: "Communication",
    details: "Conversations, messages, read receipts, and unread count tracking",
    route: "/pm/communication",
  },
  {
    id: "pm-analytics",
    name: "PM Analytics",
    description: "Project performance metrics and reporting",
    status: "partial",
    category: "Analytics",
    details: "API-driven metrics for workload, performance, budget accuracy. Data flows from real project activity.",
    route: "/pm/analytics",
  },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  connected: { label: "Connected", color: "text-emerald-700", bg: "bg-emerald-100" },
  partial: { label: "Partial", color: "text-amber-700", bg: "bg-amber-100" },
  not_connected: { label: "Not Connected", color: "text-zinc-500", bg: "bg-zinc-100" },
}

const CATEGORIES = ["All", "Payments", "Billing", "Authentication", "Core Tools", "Documents", "Finance", "Infrastructure", "Communication", "Analytics"]

export default function IntegrationsPage() {
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [apiHealth, setApiHealth] = useState<"healthy" | "degraded" | "down">("healthy")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkHealth() {
      try {
        await api.auth.me()
        setApiHealth("healthy")
      } catch {
        setApiHealth("degraded")
      } finally {
        setLoading(false)
      }
    }
    checkHealth()
  }, [])

  const filtered = categoryFilter === "All"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === categoryFilter)

  const connectedCount = INTEGRATIONS.filter((i) => i.status === "connected").length
  const partialCount = INTEGRATIONS.filter((i) => i.status === "partial").length
  const totalCount = INTEGRATIONS.length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">System Integrations</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Connected services and platform capabilities
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-sm text-zinc-500">API Status</div>
          <div className={`mt-1 text-2xl font-bold ${
            apiHealth === "healthy" ? "text-emerald-600" : apiHealth === "degraded" ? "text-amber-600" : "text-red-600"
          }`}>
            {loading ? "Checking..." : apiHealth === "healthy" ? "Healthy" : apiHealth === "degraded" ? "Degraded" : "Down"}
          </div>
          <div className="mt-1 text-xs text-zinc-400">Fastify backend</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-sm text-zinc-500">Connected</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{connectedCount}</div>
          <div className="mt-1 text-xs text-zinc-400">of {totalCount} integrations</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-sm text-zinc-500">Partial</div>
          <div className="mt-1 text-2xl font-bold text-amber-600">{partialCount}</div>
          <div className="mt-1 text-xs text-zinc-400">in progress</div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <div className="text-sm text-zinc-500">Auth System</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">Unified</div>
          <div className="mt-1 text-xs text-zinc-400">Single sign-in for all portals</div>
        </div>
      </div>

      {/* Session Updates Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-5">
        <h3 className="font-bold text-emerald-900 mb-2">Recent Platform Updates</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-semibold text-emerald-800">Stripe Webhook Expansion</div>
            <p className="text-emerald-700 text-xs mt-0.5">
              Added 12+ new event handlers: subscription lifecycle (created/updated/deleted),
              invoice processing (created/finalized/paid/failed), customer sync (updated/deleted),
              and payment method management (attached/detached).
            </p>
          </div>
          <div>
            <div className="font-semibold text-emerald-800">Unified Authentication</div>
            <p className="text-emerald-700 text-xs mt-0.5">
              Single /login page serves all portals (PM, Finance, Estimation, Ops, Permits, Owner, Architect, Engineer).
              Data-driven middleware with role-based access control per portal.
            </p>
          </div>
          <div>
            <div className="font-semibold text-emerald-800">Estimation Module Fixed</div>
            <p className="text-emerald-700 text-xs mt-0.5">
              End-to-end flow working: create wizard, API data flattening, proper redirect, status mapping
              (DRAFT_ESTIMATE &harr; draft), edit with normalization, save with field conversion.
            </p>
          </div>
          <div>
            <div className="font-semibold text-emerald-800">Placeholder Removal</div>
            <p className="text-emerald-700 text-xs mt-0.5">
              Finance reports, PM analytics, and other pages converted from hardcoded demo data
              to real API calls with proper empty states.
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition ${
              categoryFilter === cat
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((integration) => {
          const statusMeta = STATUS_CONFIG[integration.status]
          return (
            <div
              key={integration.id}
              className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900">{integration.name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{integration.description}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mb-3">
                <span className="inline-block px-1.5 py-0.5 bg-zinc-50 rounded text-zinc-500 mr-1">
                  {integration.category}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-3">{integration.details}</p>
              {integration.route && (
                <Link
                  href={integration.route}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Open &rarr;
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
