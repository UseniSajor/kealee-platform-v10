'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api } from '@/lib/api'
import { Plus, Search, MapPinned, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Jurisdiction {
  id: string
  name: string
  code: string
  state: string
  county?: string
  city?: string
  portalUrl?: string
  subscriptionTier?: string
  isActive: boolean
  createdAt: string
}

export default function JurisdictionsPage() {
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchJurisdictions()
  }, [])

  async function fetchJurisdictions() {
    try {
      setLoading(true)
      setError(null)
      // Note: This endpoint may need to be created in the API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/permits/jurisdictions`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setJurisdictions(data.jurisdictions || [])
      } else {
        // Fallback to empty array if endpoint doesn't exist yet
        setJurisdictions([])
      }
    } catch (err: any) {
      console.error('Jurisdictions fetch error:', err)
      setError(err.message || 'Failed to load jurisdictions')
      setJurisdictions([])
    } finally {
      setLoading(false)
    }
  }

  const filteredJurisdictions = jurisdictions.filter((j) =>
    j.name.toLowerCase().includes(search.toLowerCase()) ||
    j.code.toLowerCase().includes(search.toLowerCase()) ||
    j.state.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Jurisdictions</h1>
              <p className="text-gray-600 mt-2">
                Jurisdiction setup, fee schedules, staff roles, subscription tier (meta-level)
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Jurisdiction
            </Button>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jurisdictions by name, code, or state..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                <p className="mt-4 text-gray-600">Loading jurisdictions...</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Jurisdictions ({filteredJurisdictions.length})</CardTitle>
                <CardDescription>
                  Manage jurisdiction configurations and link to permit operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredJurisdictions.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPinned className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">No jurisdictions found</p>
                    <p className="text-sm text-gray-500">
                      {search ? 'Try adjusting your search' : 'Create your first jurisdiction to get started'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJurisdictions.map((jurisdiction) => (
                        <TableRow key={jurisdiction.id}>
                          <TableCell className="font-medium">{jurisdiction.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{jurisdiction.code}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {jurisdiction.city && `${jurisdiction.city}, `}
                              {jurisdiction.county && `${jurisdiction.county}, `}
                              {jurisdiction.state}
                            </div>
                          </TableCell>
                          <TableCell>
                            {jurisdiction.subscriptionTier ? (
                              <Badge variant="outline">{jurisdiction.subscriptionTier}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={jurisdiction.isActive ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}>
                              {jurisdiction.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              {jurisdiction.portalUrl && (
                                <Link href={jurisdiction.portalUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <MapPinned className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">Operational Work</p>
                  <p className="text-sm text-blue-800">
                    Permit application processing, plan review, and inspection scheduling are handled in the{' '}
                    <code className="font-mono bg-blue-100 px-1 rounded">m-permits-inspections</code> app.
                    This page is for configuration and setup only.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
