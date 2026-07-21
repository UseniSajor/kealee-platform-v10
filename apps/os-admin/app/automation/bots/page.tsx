'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

interface BotRegistryItem {
  botType: string
  displayName: string
  defaultModel: string
  timeoutSeconds: number
  parallel: boolean
  dbOverride: {
    systemPrompt: string
    modelPrimary: string
    enabled: boolean
    version: number
  } | null
}

export default function BotRegistryPage() {
  const [bots, setBots] = useState<BotRegistryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBots() {
      try {
        const res = await api.getV30Bots()
        setBots(res.bots ?? [])
      } catch (err: any) {
        setError(err.message ?? 'Failed to load bot registry')
      } finally {
        setLoading(false)
      }
    }
    loadBots()
  }, [])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/automation" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Automation
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-indigo-500" />
                AI Bot Registry
              </h1>
              <p className="text-gray-500 mt-1.5 text-sm">
                Manage system prompt overrides and default models for v30 design, zoning, estimation, and coordination bots.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-sm font-semibold text-gray-400">Loading AI bots registry…</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700 font-medium">
              Error: {error}
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Registered KeaBots</CardTitle>
                <CardDescription>
                  Wired system defaults are read from the agent-stack. Database overrides take immediate effect on new customer concept generations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bot Name</TableHead>
                      <TableHead>Identifier</TableHead>
                      <TableHead>Execution Type</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Override Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bots.map((bot) => {
                      const isCustom = !!bot.dbOverride && bot.dbOverride.enabled
                      return (
                        <TableRow key={bot.botType} className="hover:bg-slate-50/50">
                          <TableCell className="font-bold text-gray-900">{bot.displayName}</TableCell>
                          <TableCell className="font-mono text-xs text-gray-500">{bot.botType}</TableCell>
                          <TableCell>
                            <Badge variant={bot.parallel ? 'default' : 'secondary'}>
                              {bot.parallel ? 'Parallel' : 'Sequential'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-gray-600">
                            {bot.dbOverride?.modelPrimary ?? bot.defaultModel}
                          </TableCell>
                          <TableCell>
                            {isCustom ? (
                              <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 font-bold">
                                Customized (v{bot.dbOverride?.version})
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-200 text-gray-400 font-medium">
                                Code Default
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/automation/bots/${bot.botType}`}>
                              <Button variant="outline" size="sm" className="gap-1.5">
                                Edit Prompt <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
