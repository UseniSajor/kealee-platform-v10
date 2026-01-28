'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AdminApiClient } from '@/lib/api/admin-client'
import { Save, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'

interface Settings {
  featureFlags: Record<string, boolean>
  integrations: {
    stripe: { enabled: boolean; webhookSecret?: string }
    supabase: { enabled: boolean; url?: string }
    resend: { enabled: boolean; apiKey?: string }
    anthropic: { enabled: boolean; apiKey?: string }
  }
  security: {
    requireMfa: boolean
    sessionTimeout: number
    maxLoginAttempts: number
  }
  notifications: {
    emailEnabled: boolean
    slackEnabled: boolean
    slackWebhook?: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      setError(null)
      const data = await AdminApiClient.getSettings() as any
      setSettings(data?.settings || getDefaultSettings())
    } catch (err: any) {
      console.error('Settings fetch error:', err)
      setError(err.message || 'Failed to load settings')
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  function getDefaultSettings(): Settings {
    return {
      featureFlags: {
        aiReview: true,
        videoInspections: true,
        marketplace: true,
        architectHub: true,
        permits: true,
      },
      integrations: {
        stripe: { enabled: true },
        supabase: { enabled: true },
        resend: { enabled: true },
        anthropic: { enabled: true },
      },
      security: {
        requireMfa: false,
        sessionTimeout: 3600,
        maxLoginAttempts: 5,
      },
      notifications: {
        emailEnabled: true,
        slackEnabled: false,
      },
    }
  }

  async function handleSave() {
    if (!settings) return

    try {
      setSaving(true)
      await AdminApiClient.updateSettings(settings)
      toast.success('Settings saved successfully')
    } catch (err: any) {
      console.error('Settings save error:', err)
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const updateFeatureFlag = (key: string, value: boolean) => {
    if (!settings) return
    setSettings({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [key]: value,
      },
    })
  }

  const updateIntegration = (service: string, field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      integrations: {
        ...settings.integrations,
        [service]: {
          ...settings.integrations[service as keyof typeof settings.integrations],
          [field]: value,
        },
      },
    })
  }

  const updateSecurity = (field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      security: {
        ...settings.security,
        [field]: value,
      },
    })
  }

  const updateNotifications = (field: string, value: any) => {
    if (!settings) return
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [field]: value,
      },
    })
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading settings...</p>
              </div>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Settings</h1>
              <p className="text-gray-600 mt-2">Platform configuration (feature flags, integrations, policies)</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchSettings}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {settings && (
            <div className="space-y-6">
              {/* Feature Flags */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>Enable or disable platform features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(settings.featureFlags).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <Label className="font-medium">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                        <p className="text-sm text-gray-600">Enable {key} feature</p>
                      </div>
                      <button
                        onClick={() => updateFeatureFlag(key, !value)}
                        className="flex items-center gap-2"
                      >
                        {value ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                        <Badge variant={value ? 'default' : 'outline'}>
                          {value ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Integrations */}
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Third-party service configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stripe */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Stripe</Label>
                      <button
                        onClick={() => updateIntegration('stripe', 'enabled', !settings.integrations.stripe.enabled)}
                        className="flex items-center gap-2"
                      >
                        {settings.integrations.stripe.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {settings.integrations.stripe.enabled && (
                      <div>
                        <Label className="text-sm">Webhook Secret</Label>
                        <Input
                          type="password"
                          value={settings.integrations.stripe.webhookSecret || ''}
                          onChange={(e) => updateIntegration('stripe', 'webhookSecret', e.target.value)}
                          placeholder="whsec_..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Supabase */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Supabase</Label>
                      <button
                        onClick={() => updateIntegration('supabase', 'enabled', !settings.integrations.supabase.enabled)}
                        className="flex items-center gap-2"
                      >
                        {settings.integrations.supabase.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {settings.integrations.supabase.enabled && (
                      <div>
                        <Label className="text-sm">URL</Label>
                        <Input
                          value={settings.integrations.supabase.url || ''}
                          onChange={(e) => updateIntegration('supabase', 'url', e.target.value)}
                          placeholder="https://xxx.supabase.co"
                        />
                      </div>
                    )}
                  </div>

                  {/* Resend */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Resend (Email)</Label>
                      <button
                        onClick={() => updateIntegration('resend', 'enabled', !settings.integrations.resend.enabled)}
                        className="flex items-center gap-2"
                      >
                        {settings.integrations.resend.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {settings.integrations.resend.enabled && (
                      <div>
                        <Label className="text-sm">API Key</Label>
                        <Input
                          type="password"
                          value={settings.integrations.resend.apiKey || ''}
                          onChange={(e) => updateIntegration('resend', 'apiKey', e.target.value)}
                          placeholder="re_..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Anthropic */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Anthropic (AI)</Label>
                      <button
                        onClick={() => updateIntegration('anthropic', 'enabled', !settings.integrations.anthropic.enabled)}
                        className="flex items-center gap-2"
                      >
                        {settings.integrations.anthropic.enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {settings.integrations.anthropic.enabled && (
                      <div>
                        <Label className="text-sm">API Key</Label>
                        <Input
                          type="password"
                          value={settings.integrations.anthropic.apiKey || ''}
                          onChange={(e) => updateIntegration('anthropic', 'apiKey', e.target.value)}
                          placeholder="sk-ant-..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Security policies and configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <Label className="font-medium">Require MFA</Label>
                      <p className="text-sm text-gray-600">Force multi-factor authentication for all users</p>
                    </div>
                    <button
                      onClick={() => updateSecurity('requireMfa', !settings.security.requireMfa)}
                      className="flex items-center gap-2"
                    >
                      {settings.security.requireMfa ? (
                        <ToggleRight className="h-6 w-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div>
                    <Label className="font-medium">Session Timeout (seconds)</Label>
                    <Input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSecurity('sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="font-medium">Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSecurity('maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Notification channel configurations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div>
                      <Label className="font-medium">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Enable email notifications</p>
                    </div>
                    <button
                      onClick={() => updateNotifications('emailEnabled', !settings.notifications.emailEnabled)}
                      className="flex items-center gap-2"
                    >
                      {settings.notifications.emailEnabled ? (
                        <ToggleRight className="h-6 w-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">Slack Notifications</Label>
                      <button
                        onClick={() => updateNotifications('slackEnabled', !settings.notifications.slackEnabled)}
                        className="flex items-center gap-2"
                      >
                        {settings.notifications.slackEnabled ? (
                          <ToggleRight className="h-6 w-6 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {settings.notifications.slackEnabled && (
                      <div>
                        <Label className="text-sm">Slack Webhook URL</Label>
                        <Input
                          type="url"
                          value={settings.notifications.slackWebhook || ''}
                          onChange={(e) => updateNotifications('slackWebhook', e.target.value)}
                          placeholder="https://hooks.slack.com/services/..."
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
