"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Mail, FileCheck } from "lucide-react"

interface PermitLead {
  id: string
  fullName: string
  company: string
  email: string
  phone?: string
  contractorType: string
  permitsPerMonth: string
  status: string
  createdAt: string
}

export default function PermitLeadsPage() {
  const [leads, setLeads] = useState<PermitLead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/permit-service-leads')
      const data = await response.json()
      setLeads(data.leads || [])
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
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
            Permit Service Leads
          </h1>
          <p className="text-gray-600">Manage contractor permit service requests</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="space-y-4">
            {leads.map((lead) => (
              <div
                key={lead.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{lead.fullName}</h3>
                    <p className="text-gray-600">{lead.company}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                    {lead.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{lead.email}</span>
                  </div>
                  <div className="text-gray-600">{lead.contractorType}</div>
                  <div className="text-gray-600">{lead.permitsPerMonth}</div>
                  <div className="text-gray-600">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}

            {leads.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                No leads found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
