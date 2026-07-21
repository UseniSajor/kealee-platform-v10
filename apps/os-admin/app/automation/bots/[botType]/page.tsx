'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Save, Undo, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const ALLOWED_TYPES = new Set([
  'intake', 'design', 'estimate', 'zoning', 'floorplan', 'permit', 'video', 'contractor', 'sales', 'marketing', 'support', 'project',
])

export default function BotPromptEditorPage() {
  const router = useRouter()
  const params = useParams()
  const botType = params.botType as string

  const [displayName, setDisplayName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [codeDefault, setCodeDefault] = useState('')
  const [model, setModel] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!botType || !ALLOWED_TYPES.has(botType)) return

    async function loadBotData() {
      try {
        const data = await api.getV30Bot(botType)
        setDisplayName(data.displayName)
        setPrompt(data.activePrompt)
        setCodeDefault(data.codeDefaultPrompt)
        setModel(data.dbOverride?.modelPrimary ?? '')
        setEnabled(data.dbOverride?.enabled ?? true)
        setNotes(data.dbOverride?.notes ?? '')
      } catch (err: any) {
        toast.error(err.message ?? 'Failed to load bot prompt configuration')
      } finally {
        setLoading(false)
      }
    }

    loadBotData()
  }, [botType])

  if (!botType || !ALLOWED_TYPES.has(botType)) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700 font-medium">
              Error: Unknown bot type &ldquo;{botType}&rdquo;
            </div>
            <Link href="/automation/bots" className="mt-4 inline-block text-indigo-500 hover:underline">
              Return to Bot Registry
            </Link>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  async function handleSave() {
    if (!prompt.trim() || prompt.length < 100) {
      toast.error('System prompt must be at least 100 characters long.')
      return
    }

    setSaving(true)
    try {
      await api.updateV30Bot(botType, {
        systemPrompt: prompt,
        modelPrimary: model || undefined,
        enabled,
        notes: notes || undefined,
      })
      toast.success('AI system prompt saved successfully. Changes are live immediately.')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save prompt configuration')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setPrompt(codeDefault)
    toast.info('Restored text to default code prompt. Click Save to persist.')
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center gap-2">
            <Link href="/automation/bots" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> AI Bot Registry
            </Link>
          </div>

          <div className="border-b border-gray-100 pb-5">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-indigo-500" />
              {loading ? 'Loading Bot…' : `${displayName} Prompt Editor`}
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              Live prompt engineering override for <code>{botType}</code>. Changes apply immediately to new concept pipeline requests.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-sm font-semibold text-gray-400">Loading prompt settings…</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Textarea editor */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle>System Prompt Template</CardTitle>
                    <CardDescription>
                      This prompt defines the persona, instruction set, output structure, and constraints for the bot.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col space-y-3">
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter system prompt instructions..."
                      className="flex-1 min-h-[460px] font-mono text-[12px] leading-relaxed p-4 bg-slate-950 text-slate-100 border-slate-800 focus-visible:ring-indigo-500"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Bot settings and actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Model &amp; Config</CardTitle>
                    <CardDescription>Override execution parameters for this bot instance.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Primary Model Name</Label>
                      <Input
                        id="model"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. claude-sonnet-4-6"
                        className="font-mono text-xs"
                      />
                      <p className="text-[10px] text-gray-400">Leave blank to use code registry default.</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="enabled">Override Status</Label>
                        <p className="text-[11px] text-gray-400">Toggle whether this DB prompt override is active.</p>
                      </div>
                      <input
                        id="enabled"
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-4">
                      <Label htmlFor="notes">Change Log / Notes</Label>
                      <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Reason for prompt update..."
                        className="text-xs"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Save and Reset Actions */}
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" /> Save to Database
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={saving}
                      className="w-full gap-2 border-slate-200 hover:bg-slate-50 text-gray-700"
                    >
                      <Undo className="h-4 w-4" /> Reset to Code Default
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
