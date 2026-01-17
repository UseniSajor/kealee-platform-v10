'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface ModuleEntitlement {
  id: string
  moduleKey: string
  enabled: boolean
  enabledAt?: string
  disabledAt?: string
  expiresAt?: string
}

interface ModuleInfo {
  key: string
  name: string
  description: string
  revenue?: string
}

// Available modules in the system
const AVAILABLE_MODULES: ModuleInfo[] = [
  {
    key: 'm-ops-services',
    name: 'Ops Services',
    description: 'PM staffing and operations services',
    revenue: '$1.9M-$2.2M',
  },
  {
    key: 'm-project-owner',
    name: 'Project Owner',
    description: 'Project management for homeowners',
    revenue: '$200K-$400K',
  },
  {
    key: 'm-finance-trust',
    name: 'Finance & Trust',
    description: 'Escrow and payment management',
    revenue: '$50K-$100K',
  },
  {
    key: 'm-marketplace',
    name: 'Marketplace',
    description: 'Contractor directory and lead management',
    revenue: '$400K-$1.1M',
  },
  {
    key: 'm-architect',
    name: 'Architect',
    description: 'Design deliverables and review workflows',
    revenue: '$50K-$150K',
  },
  {
    key: 'm-permits-inspections',
    name: 'Permits & Inspections',
    description: 'Permit applications and inspection scheduling',
    revenue: '$800K-$1.2M',
  },
  {
    key: 'm-engineer',
    name: 'Engineer',
    description: 'Engineering deliverables and PE stamp workflow',
    revenue: '$30K-$100K',
  },
]

interface ModuleEnablementProps {
  orgId: string
}

export function ModuleEnablement({ orgId }: ModuleEnablementProps) {
  const [entitlements, setEntitlements] = useState<ModuleEntitlement[]>([])
  const [enabledModules, setEnabledModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEntitlements()
  }, [orgId])

  async function fetchEntitlements() {
    try {
      setLoading(true)
      setError(null)

      // Fetch all entitlements for the org
      const entitlementsData = await api.getOrgEntitlements(orgId)
      setEntitlements(entitlementsData.entitlements || [])

      // Fetch enabled modules list
      const enabledData = await api.getEnabledModules(orgId)
      setEnabledModules(enabledData.modules || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load module entitlements')
    } finally {
      setLoading(false)
    }
  }

  async function toggleModule(moduleKey: string, currentlyEnabled: boolean) {
    try {
      setToggling(moduleKey)
      setError(null)

      if (currentlyEnabled) {
        await api.disableModule(orgId, moduleKey)
      } else {
        await api.enableModule(orgId, moduleKey)
      }

      // Refresh entitlements
      await fetchEntitlements()
    } catch (err: any) {
      setError(err.message || `Failed to ${currentlyEnabled ? 'disable' : 'enable'} module`)
    } finally {
      setToggling(null)
    }
  }

  const getModuleEntitlement = (moduleKey: string): ModuleEntitlement | undefined => {
    return entitlements.find((e) => e.moduleKey === moduleKey)
  }

  const isModuleEnabled = (moduleKey: string): boolean => {
    return enabledModules.includes(moduleKey)
  }

  const isExpired = (expiresAt?: string): boolean => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Modules Enabled
          </CardTitle>
          <CardDescription>Modules available to this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Loading modules...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Modules Enabled
        </CardTitle>
        <CardDescription>Enable or disable modules for this organization</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {AVAILABLE_MODULES.map((module) => {
            const entitlement = getModuleEntitlement(module.key)
            const enabled = isModuleEnabled(module.key)
            const expired = entitlement?.expiresAt ? isExpired(entitlement.expiresAt) : false
            const isToggling = toggling === module.key

            return (
              <div
                key={module.key}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{module.name}</h3>
                    {enabled && !expired ? (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Enabled
                      </Badge>
                    ) : expired ? (
                      <Badge variant="destructive" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Expired
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{module.description}</p>
                  {module.revenue && (
                    <p className="mt-1 text-xs text-gray-500">Revenue: {module.revenue}</p>
                  )}
                  {entitlement?.expiresAt && !expired && (
                    <p className="mt-1 text-xs text-gray-500">
                      Expires: {new Date(entitlement.expiresAt).toLocaleDateString()}
                    </p>
                  )}
                  {entitlement?.enabledAt && (
                    <p className="mt-1 text-xs text-gray-500">
                      Enabled: {new Date(entitlement.enabledAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <Button
                    variant={enabled && !expired ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => toggleModule(module.key, enabled && !expired)}
                    disabled={isToggling}
                  >
                    {isToggling
                      ? '...'
                      : enabled && !expired
                      ? 'Disable'
                      : expired
                      ? 'Re-enable'
                      : 'Enable'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {AVAILABLE_MODULES.length === 0 && (
          <p className="text-center py-8 text-gray-500">No modules available</p>
        )}
      </CardContent>
    </Card>
  )
}
