'use client'

import { Building2, MapPin, Layers, Eye, Calendar, Camera } from 'lucide-react'

interface TwinOverviewProps {
  twin: {
    id: string
    address: string
    creation_path: string
    status: string
    created_at: string
    source_capture_session_ids: string[]
    floor_area_sqft?: number | null
    year_built?: number | null
    property_type?: string | null
  }
  spatialNodeCount: number
  systemNodeCount: number
  observationCount: number
  assetCount: number
}

const PATH_LABELS: Record<string, string> = {
  mobile_capture: 'Mobile Capture',
  desktop_upload: 'Desktop Upload',
  ai_intake: 'AI Intake',
  manual_entry: 'Manual Entry',
  import_plans: 'Plan Import',
  import_assessor: 'Assessor Import',
  import_permit: 'Permit Import',
  migration: 'Migration',
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#DCFCE7', text: '#166534', label: 'Active' },
  draft: { bg: '#FEF9C3', text: '#713F12', label: 'Draft' },
  archived: { bg: '#F3F4F6', text: '#6B7280', label: 'Archived' },
  pending_capture: { bg: '#FFF4ED', text: '#C2410C', label: 'Pending Capture' },
}

export function TwinOverview({
  twin,
  spatialNodeCount,
  systemNodeCount,
  observationCount,
  assetCount,
}: TwinOverviewProps) {
  const status = STATUS_STYLES[twin.status] ?? STATUS_STYLES.draft

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: '#1A2B4A' }}
          >
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#1A2B4A' }}>
              Digital Twin
            </h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5" />
              {twin.address}
            </p>
          </div>
        </div>
        <span
          className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: status.bg, color: status.text }}
        >
          {status.label}
        </span>
      </div>

      {/* Property details */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {twin.property_type && (
          <InfoTile label="Type" value={twin.property_type} />
        )}
        {twin.year_built && (
          <InfoTile label="Year Built" value={String(twin.year_built)} />
        )}
        {twin.floor_area_sqft && (
          <InfoTile label="Floor Area" value={`${twin.floor_area_sqft.toLocaleString()} sqft`} />
        )}
        <InfoTile
          label="Creation Path"
          value={PATH_LABELS[twin.creation_path] ?? twin.creation_path}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Layers className="h-4 w-4" />} value={spatialNodeCount} label="Spatial Nodes" />
        <StatCard icon={<Building2 className="h-4 w-4" />} value={systemNodeCount} label="Systems" />
        <StatCard icon={<Eye className="h-4 w-4" />} value={observationCount} label="Observations" />
        <StatCard icon={<Camera className="h-4 w-4" />} value={assetCount} label="Photos" />
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-400">
        <Calendar className="h-3.5 w-3.5" />
        Created {new Date(twin.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        {twin.source_capture_session_ids.length > 0 && (
          <span className="ml-auto flex items-center gap-1">
            <Camera className="h-3.5 w-3.5" />
            {twin.source_capture_session_ids.length} capture session{twin.source_capture_session_ids.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: '#1A2B4A' }}>{value}</p>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-gray-100 py-3">
      <span className="mb-1 text-gray-400">{icon}</span>
      <span className="text-2xl font-bold" style={{ color: '#1A2B4A' }}>{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
