"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, Button, Badge } from "@ops/components/ui"
import { Users, Mail, Phone } from "lucide-react"

interface GCLead {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  gcType: string
  teamSize: string
  packageInterest: string
  status: string
  createdAt: string
}

export default function GCOpsLeadsPage() {
  const [leads, setLeads] = useState<GCLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/gc-ops-leads')
      const data = await response.json()
      setLeads(data.leads)
      setLoading(false)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GC Operations Leads
          </h1>
          <p className="text-gray-600">Manage contractor operations service leads</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/portal/gc-ops-leads/${lead.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{lead.fullName}</h3>
                      <p className="text-gray-600">{lead.company}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">{lead.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span>{lead.email}</span>
                    </div>
                    <div className="text-gray-600">{lead.gcType}</div>
                    <div className="text-gray-600">{lead.teamSize}</div>
                    <div className="text-gray-600">{lead.packageInterest.split(' - ')[0]}</div>
                  </div>
                </Link>
              ))}

              {leads.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  No leads found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
