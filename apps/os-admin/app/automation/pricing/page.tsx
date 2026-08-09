'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2, Save, Calculator } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function PricingFormulaPage() {
  const [json, setJson] = useState('')
  const [version, setVersion] = useState<number | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadPricing() {
      try {
        const data = await api.getV30Pricing()
        setJson(JSON.stringify(data.formula ?? data, null, 2))
        setVersion(data.version ?? null)
        setUpdatedAt(data.updatedAt ?? null)
      } catch (err: any) {
        toast.error(err.message ?? 'Failed to load pricing formula')
      } finally {
        setLoading(false)
      }
    }
    loadPricing()
  }, [])

  async function handleSave() {
    let parsed: any = null
    try {
      parsed = JSON.parse(json)
    } catch {
      toast.error('Invalid JSON syntax. Please check for trailing commas or unclosed braces.')
      return
    }

    setSaving(true)
    try {
      const result = await api.updateV30Pricing(parsed)
      toast.success(`Pricing formula updated successfully to v${result.version ?? 1}. Changes apply in real time.`)
      setVersion(result.version ?? null)
      if (result.formula) {
        setJson(JSON.stringify(result.formula, null, 2))
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update pricing formula')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/automation" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Automation
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <Calculator className="h-7 w-7 text-indigo-500" />
                Pricing Formula Editor
              </h1>
              <p className="text-gray-500 mt-1.5 text-sm">
                Live pricing algorithm overrides. Adjust base rates, sqft multipliers, and floorplan add-ons.
              </p>
            </div>
            {version !== null && (
              <div className="shrink-0 flex items-center gap-3 text-xs text-gray-500">
                <span>Active Version: <strong className="text-gray-900 font-bold">v{version}</strong></span>
                {updatedAt && (
                  <span>Last Updated: <strong className="text-gray-900 font-bold">{new Date(updatedAt).toLocaleDateString()}</strong></span>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-sm font-semibold text-gray-400">Loading pricing formula…</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* JSON Editor */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle>Pricing Formula Configuration (JSON)</CardTitle>
                    <CardDescription>
                      Edit formula variables directly. Make sure the JSON syntax is valid before saving.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col space-y-3">
                    <Textarea
                      value={json}
                      onChange={(e) => setJson(e.target.value)}
                      placeholder="{}"
                      className="flex-1 min-h-[460px] font-mono text-[12px] leading-relaxed p-4 bg-slate-950 text-slate-100 border-slate-800 focus-visible:ring-indigo-500"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Property Documentation & Save Action */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Formula Fields Reference</CardTitle>
                    <CardDescription>Description of key pricing properties.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-gray-600 leading-relaxed max-h-[360px] overflow-y-auto">
                    <div>
                      <strong className="text-gray-900 font-semibold">baseAmount</strong>
                      <p className="text-[11px] text-gray-400">Fixed entry cost for the design concept service tier.</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 font-semibold">sqftMultiplier</strong>
                      <p className="text-[11px] text-gray-400">Scaling price per square foot (added to base).</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 font-semibold">complexityFees</strong>
                      <p className="text-[11px] text-gray-400">Flat multipliers or additions depending on scope complexity rating.</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 font-semibold">floorplanScopeCosts</strong>
                      <p className="text-[11px] text-gray-400">Costs applied to generating architectural drawings by project size.</p>
                    </div>
                    <div>
                      <strong className="text-gray-900 font-semibold">minPrice / maxPrice</strong>
                      <p className="text-[11px] text-gray-400">Enforced floor and ceiling constraints for standard quotes.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving Formula…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save to Database
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
