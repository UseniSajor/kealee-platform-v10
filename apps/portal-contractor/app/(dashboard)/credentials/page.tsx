'use client'

import { useState } from 'react'
import { ShieldCheck, Upload, Calendar, AlertTriangle, CheckCircle, Clock, FileText, Wrench, Award, Shield, DollarSign } from 'lucide-react'

// ── v20 Seed: CSI Cost Categories ──────────────────────────────────
const CSI_TRADE_CATEGORIES = [
  { division: '03', key: 'CSI_03_CONCRETE', name: 'Concrete', typicalTrades: ['Concrete Finisher', 'Ironworker (Rebar)', 'General Labor', 'Crane Operator'] },
  { division: '04', key: 'CSI_04_MASONRY', name: 'Masonry', typicalTrades: ['Mason', 'General Labor', 'Ironworker (Rebar)'] },
  { division: '05', key: 'CSI_05_METALS', name: 'Metals', typicalTrades: ['Ironworker', 'Welder', 'Crane Operator', 'Sheet Metal Worker'] },
  { division: '06', key: 'CSI_06_WOOD_PLASTICS', name: 'Wood, Plastics & Composites', typicalTrades: ['Carpenter', 'Cabinet Maker', 'General Labor'] },
  { division: '07', key: 'CSI_07_THERMAL_MOISTURE', name: 'Thermal & Moisture Protection', typicalTrades: ['Roofer', 'Insulator', 'General Labor', 'Sheet Metal Worker'] },
  { division: '08', key: 'CSI_08_DOORS_WINDOWS', name: 'Doors & Windows', typicalTrades: ['Carpenter', 'Glazier', 'General Labor'] },
  { division: '09', key: 'CSI_09_FINISHES', name: 'Finishes', typicalTrades: ['Drywall Finisher', 'Tile Setter', 'Painter', 'Flooring Installer'] },
  { division: '22', key: 'CSI_22_PLUMBING', name: 'Plumbing', typicalTrades: ['Plumber', 'General Labor'] },
  { division: '23', key: 'CSI_23_MECHANICAL', name: 'Heating, Ventilating & Air Conditioning', typicalTrades: ['HVAC Technician', 'Sheet Metal Worker', 'Insulator', 'General Labor'] },
  { division: '26', key: 'CSI_26_ELECTRICAL', name: 'Electrical', typicalTrades: ['Electrician', 'General Labor'] },
] as const

// ── Contractor Credential Data ─────────────────────────────────────
interface License {
  id: string
  name: string
  issuer: string
  number: string
  expiry: string
  status: 'active' | 'expiring_soon' | 'expired'
  daysUntilExpiry: number
}

interface Insurance {
  id: string
  name: string
  carrier: string
  policyNumber: string
  expiry: string
  status: 'active' | 'expiring_soon' | 'expired'
  daysUntilExpiry: number
  coverageAmount: number
}

interface CsiCertification {
  division: string
  name: string
  certified: boolean
  licenses: License[]
  certifications: string[]
}

const GENERAL_LICENSES: License[] = [
  { id: 'gl-1', name: 'General Contractor License', issuer: 'Texas TDLR', number: 'GC-2024-78432', expiry: '2027-06-30', status: 'active', daysUntilExpiry: 477 },
  { id: 'gl-2', name: 'Residential Building Contractor', issuer: 'Texas TDLR', number: 'RBC-2025-11289', expiry: '2027-12-15', status: 'active', daysUntilExpiry: 645 },
  { id: 'gl-3', name: 'EPA Lead-Safe Certification', issuer: 'EPA', number: 'NAT-F228943-1', expiry: '2026-05-20', status: 'expiring_soon', daysUntilExpiry: 71 },
  { id: 'gl-4', name: 'OSHA 30-Hour Card', issuer: 'OSHA', number: 'OSHA-30-2023-5541', expiry: '2028-01-01', status: 'active', daysUntilExpiry: 662 },
]

const INSURANCE_POLICIES: Insurance[] = [
  { id: 'ins-1', name: 'General Liability Insurance', carrier: 'State Farm', policyNumber: 'GLI-99284756', expiry: '2026-09-15', status: 'active', daysUntilExpiry: 189, coverageAmount: 2000000 },
  { id: 'ins-2', name: 'Workers Compensation', carrier: 'Hartford Insurance', policyNumber: 'WC-44829173', expiry: '2026-04-30', status: 'expiring_soon', daysUntilExpiry: 51, coverageAmount: 1000000 },
  { id: 'ins-3', name: 'Commercial Auto Insurance', carrier: 'Progressive', policyNumber: 'AI-33571920', expiry: '2026-12-01', status: 'active', daysUntilExpiry: 266, coverageAmount: 500000 },
  { id: 'ins-4', name: 'Umbrella / Excess Liability', carrier: 'State Farm', policyNumber: 'UL-77432901', expiry: '2026-09-15', status: 'active', daysUntilExpiry: 189, coverageAmount: 5000000 },
  { id: 'ins-5', name: 'Builders Risk Insurance', carrier: 'Zurich', policyNumber: 'BR-55019287', expiry: '2026-06-01', status: 'active', daysUntilExpiry: 83, coverageAmount: 1500000 },
]

const CSI_CERTIFICATIONS: CsiCertification[] = [
  {
    division: '03',
    name: 'Concrete',
    certified: true,
    licenses: [
      { id: 'csi-03-1', name: 'ACI Concrete Field Technician', issuer: 'American Concrete Institute', number: 'ACI-FT-44921', expiry: '2027-03-15', status: 'active', daysUntilExpiry: 370 },
    ],
    certifications: ['ACI Grade I Field Technician', 'Flatwork Finishing Specialist'],
  },
  {
    division: '05',
    name: 'Metals',
    certified: false,
    licenses: [],
    certifications: [],
  },
  {
    division: '06',
    name: 'Wood, Plastics & Composites',
    certified: true,
    licenses: [
      { id: 'csi-06-1', name: 'Finish Carpentry Certification', issuer: 'United Brotherhood of Carpenters', number: 'UBC-FC-2024-7819', expiry: '2027-08-01', status: 'active', daysUntilExpiry: 509 },
    ],
    certifications: ['Journeyman Carpenter', 'Cabinet Installation Specialist', 'AWI Quality Certification Program'],
  },
  {
    division: '07',
    name: 'Thermal & Moisture Protection',
    certified: true,
    licenses: [
      { id: 'csi-07-1', name: 'Roofing Contractor License', issuer: 'Texas TDLR', number: 'RC-2025-33041', expiry: '2027-01-31', status: 'active', daysUntilExpiry: 327 },
    ],
    certifications: ['GAF Master Elite Contractor', 'BPI Building Envelope Specialist'],
  },
  {
    division: '08',
    name: 'Doors & Windows',
    certified: true,
    licenses: [],
    certifications: ['Pella Certified Installer', 'AAMA InstallationMasters'],
  },
  {
    division: '09',
    name: 'Finishes',
    certified: true,
    licenses: [
      { id: 'csi-09-1', name: 'Certified Tile Installer', issuer: 'CTEF', number: 'CTI-2024-09921', expiry: '2027-05-01', status: 'active', daysUntilExpiry: 417 },
    ],
    certifications: ['CTEF Certified Tile Installer', 'NWFA Certified Installer (Hardwood)', 'Painting & Decorating Contractors of America (PDCA)'],
  },
  {
    division: '22',
    name: 'Plumbing',
    certified: true,
    licenses: [
      { id: 'csi-22-1', name: 'Master Plumber License', issuer: 'TSBPE', number: 'MP-2023-65521', expiry: '2027-09-30', status: 'active', daysUntilExpiry: 569 },
    ],
    certifications: ['Texas Master Plumber', 'Backflow Prevention Assembly Tester'],
  },
  {
    division: '23',
    name: 'Heating, Ventilating & Air Conditioning',
    certified: true,
    licenses: [
      { id: 'csi-23-1', name: 'HVAC Contractor License', issuer: 'Texas TDLR', number: 'HVAC-2024-88403', expiry: '2026-11-30', status: 'active', daysUntilExpiry: 265 },
      { id: 'csi-23-2', name: 'EPA 608 Universal Certification', issuer: 'EPA', number: 'EPA608-UNI-339021', expiry: '2099-12-31', status: 'active', daysUntilExpiry: 9999 },
    ],
    certifications: ['NATE Certified HVAC Technician', 'EPA 608 Universal', 'ACCA Manual J/D/S Certified'],
  },
  {
    division: '26',
    name: 'Electrical',
    certified: true,
    licenses: [
      { id: 'csi-26-1', name: 'Master Electrician License', issuer: 'Texas TDLR', number: 'ME-2024-22817', expiry: '2027-04-15', status: 'active', daysUntilExpiry: 401 },
    ],
    certifications: ['Texas Master Electrician', 'NABCEP PV Installation Professional (Solar)'],
  },
  {
    division: '04',
    name: 'Masonry',
    certified: false,
    licenses: [],
    certifications: [],
  },
]

// Sort by division number
const sortedCsiCerts = [...CSI_CERTIFICATIONS].sort((a, b) => a.division.localeCompare(b.division))

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', color: '#38A169', bgColor: 'rgba(56,161,105,0.1)', icon: CheckCircle },
  expiring_soon: { label: 'Expiring Soon', color: '#92400E', bgColor: 'rgba(251,191,36,0.15)', icon: AlertTriangle },
  expired: { label: 'Expired', color: '#E53E3E', bgColor: 'rgba(229,62,62,0.1)', icon: AlertTriangle },
}

export default function CredentialsPage() {
  const [activeTab, setActiveTab] = useState<'csi' | 'licenses' | 'insurance'>('csi')

  const totalCsiCertified = sortedCsiCerts.filter(c => c.certified).length
  const expiringSoon = [...GENERAL_LICENSES, ...INSURANCE_POLICIES].filter(c => c.status === 'expiring_soon').length
  const totalLicenses = GENERAL_LICENSES.length + sortedCsiCerts.reduce((s, c) => s + c.licenses.length, 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: '#1A2B4A' }}>Credentials</h1>
          <p className="mt-1 text-sm text-gray-600">Licenses, insurance, and CSI trade certifications</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: '#E8793A' }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#C65A20')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#E8793A')}
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>

      {/* Alert Banner */}
      {expiringSoon > 0 && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">{expiringSoon} credential{expiringSoon > 1 ? 's' : ''} expiring within 90 days</p>
            <p className="text-xs text-amber-700">Please renew before expiry to maintain your active bidding status</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">CSI Divisions Certified</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#2ABFBF' }}>{totalCsiCertified} / {CSI_TRADE_CATEGORIES.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Active Licenses</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#1A2B4A' }}>{totalLicenses}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Insurance Policies</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: '#38A169' }}>{INSURANCE_POLICIES.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Expiring Soon</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: expiringSoon > 0 ? '#92400E' : '#38A169' }}>{expiringSoon}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { key: 'csi' as const, label: 'CSI Trade Certifications', icon: Wrench },
            { key: 'licenses' as const, label: 'General Licenses', icon: Award },
            { key: 'insurance' as const, label: 'Insurance Certificates', icon: Shield },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 border-b-2 pb-3 text-sm font-medium"
              style={{
                borderColor: activeTab === tab.key ? '#E8793A' : 'transparent',
                color: activeTab === tab.key ? '#E8793A' : '#6B7280',
              }}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* CSI Trade Certifications Tab */}
      {activeTab === 'csi' && (
        <div className="space-y-4">
          {sortedCsiCerts.map((csi) => {
            const seedData = CSI_TRADE_CATEGORIES.find(c => c.division === csi.division)
            return (
              <div key={csi.division} className="rounded-xl border border-gray-200 bg-white shadow-sm" style={{ borderLeftWidth: '4px', borderLeftColor: csi.certified ? '#38A169' : '#E5E7EB' }}>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg p-2.5" style={{ backgroundColor: csi.certified ? 'rgba(56,161,105,0.1)' : 'rgba(229,231,235,0.5)' }}>
                        <Wrench className="h-5 w-5" style={{ color: csi.certified ? '#38A169' : '#9CA3AF' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>Division {csi.division} - {csi.name}</h3>
                          {csi.certified ? (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(56,161,105,0.1)', color: '#38A169' }}>Certified</span>
                          ) : (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: 'rgba(229,231,235,0.5)', color: '#9CA3AF' }}>Not Certified</span>
                          )}
                        </div>
                        {seedData && (
                          <p className="mt-0.5 text-xs text-gray-500">Typical trades: {seedData.typicalTrades.join(', ')}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {csi.certified && (
                    <div className="mt-4 space-y-3">
                      {/* Trade Licenses */}
                      {csi.licenses.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-gray-500">Licenses</p>
                          {csi.licenses.map((lic) => {
                            const config = statusConfig[lic.status]
                            const StatusIcon = config.icon
                            return (
                              <div key={lic.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                <div>
                                  <p className="text-sm font-medium" style={{ color: '#1A2B4A' }}>{lic.name}</p>
                                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                                    <span>{lic.issuer}</span>
                                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{lic.number}</span>
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Exp: {new Date(lic.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                </div>
                                <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>
                                  <StatusIcon className="h-3 w-3" />{config.label}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Certifications */}
                      {csi.certifications.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-xs font-medium text-gray-500">Certifications</p>
                          <div className="flex flex-wrap gap-1.5">
                            {csi.certifications.map((cert) => (
                              <span key={cert} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700">
                                <CheckCircle className="h-3 w-3" style={{ color: '#38A169' }} />
                                {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!csi.certified && (
                    <div className="mt-3">
                      <button
                        className="text-xs font-medium"
                        style={{ color: '#E8793A' }}
                      >
                        + Add credentials for this division
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* General Licenses Tab */}
      {activeTab === 'licenses' && (
        <div className="space-y-4">
          {GENERAL_LICENSES.map((lic) => {
            const config = statusConfig[lic.status]
            const StatusIcon = config.icon
            return (
              <div key={lic.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: lic.status === 'expiring_soon' ? 'rgba(251,191,36,0.15)' : 'rgba(56,161,105,0.1)' }}>
                      <ShieldCheck className="h-5 w-5" style={{ color: lic.status === 'expiring_soon' ? '#92400E' : '#38A169' }} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>{lic.name}</h3>
                      <p className="text-sm text-gray-600">{lic.issuer}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{lic.number}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Expires {new Date(lic.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{lic.daysUntilExpiry} days remaining</span>
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Insurance Certificates Tab */}
      {activeTab === 'insurance' && (
        <div className="space-y-4">
          {INSURANCE_POLICIES.map((ins) => {
            const config = statusConfig[ins.status]
            const StatusIcon = config.icon
            return (
              <div key={ins.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg p-2.5" style={{ backgroundColor: ins.status === 'expiring_soon' ? 'rgba(251,191,36,0.15)' : 'rgba(56,161,105,0.1)' }}>
                      <Shield className="h-5 w-5" style={{ color: ins.status === 'expiring_soon' ? '#92400E' : '#38A169' }} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold" style={{ color: '#1A2B4A' }}>{ins.name}</h3>
                      <p className="text-sm text-gray-600">{ins.carrier}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{ins.policyNumber}</span>
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Coverage: ${(ins.coverageAmount / 1000000).toFixed(1)}M</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Expires {new Date(ins.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ins.daysUntilExpiry} days remaining</span>
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: config.bgColor, color: config.color }}>
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
