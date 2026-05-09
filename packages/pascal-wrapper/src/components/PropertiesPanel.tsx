'use client'

/**
 * @kealee/pascal-wrapper — PropertiesPanel
 *
 * Context-sensitive properties panel. Shows editable properties for
 * whatever is currently selected (wall, room, furniture, or scene).
 */

import React from 'react'
import { useEditorStore, useActiveFloor, useSceneStats } from '../SceneContext'
import type { WallType, MaterialPreset, RoomType, DesignStyle } from '../types'
import { MATERIAL_LABELS } from '../constants'
import { formatFeet, wallLength } from '../utils/geometry'

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
    {children}
  </p>
)

const Field: React.FC<{ children: React.ReactNode; label: string }> = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <Label>{label}</Label>
    {children}
  </div>
)

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB',
  fontSize: 12, outline: 'none', backgroundColor: 'white', cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #E5E7EB',
  fontSize: 12, outline: 'none', backgroundColor: 'white', boxSizing: 'border-box',
}

// ---------------------------------------------------------------------------

function WallProperties() {
  const { selectedWallId, updateWall, deleteWall } = useEditorStore(s => s)
  const floor = useActiveFloor()
  const wall = floor?.walls.find(w => w.id === selectedWallId)
  if (!wall) return null

  const len = wallLength(wall)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1A2B4A' }}>Wall</p>
        <span style={{ fontSize: 11, color: '#E8724B', fontWeight: 600 }}>{formatFeet(len)}</span>
      </div>
      <Field label="Type">
        <select
          value={wall.type}
          onChange={e => updateWall(wall.id, { type: e.target.value as WallType })}
          style={selectStyle}
        >
          <option value="interior">Interior</option>
          <option value="exterior">Exterior</option>
          <option value="load_bearing">Load Bearing</option>
          <option value="partition">Partition</option>
          <option value="foundation">Foundation</option>
        </select>
      </Field>
      <Field label="Thickness (ft)">
        <input
          type="number" min={0.25} max={2} step={0.25}
          value={wall.thickness}
          onChange={e => updateWall(wall.id, { thickness: parseFloat(e.target.value) || 0.5 })}
          style={inputStyle}
        />
      </Field>
      <Field label="Height (ft)">
        <input
          type="number" min={6} max={20} step={0.5}
          value={wall.height}
          onChange={e => updateWall(wall.id, { height: parseFloat(e.target.value) || 9 })}
          style={inputStyle}
        />
      </Field>
      <Field label="Material">
        <select
          value={wall.material}
          onChange={e => updateWall(wall.id, { material: e.target.value as MaterialPreset })}
          style={selectStyle}
        >
          {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <button
        onClick={() => deleteWall(wall.id)}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
          backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 4,
        }}
      >
        Delete Wall
      </button>
    </div>
  )
}

function RoomProperties() {
  const { selectedRoomId, updateRoom, deleteRoom } = useEditorStore(s => s)
  const floor = useActiveFloor()
  const room = floor?.rooms.find(r => r.id === selectedRoomId)
  if (!room) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1A2B4A' }}>Room</p>
        <span style={{ fontSize: 11, color: '#E8724B', fontWeight: 600 }}>{Math.round(room.areaSqFt)} sf</span>
      </div>
      <Field label="Name">
        <input
          type="text" value={room.name}
          onChange={e => updateRoom(room.id, { name: e.target.value })}
          style={inputStyle}
        />
      </Field>
      <Field label="Type">
        <select
          value={room.type}
          onChange={e => updateRoom(room.id, { type: e.target.value as RoomType })}
          style={selectStyle}
        >
          {(['living','dining','kitchen','bedroom','bathroom','half_bath','office','garage','basement',
             'utility','hallway','closet','mud_room','foyer','sunroom','game_room','gym','studio','deck','patio','other'] as RoomType[]).map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </Field>
      <Field label="Floor Material">
        <select
          value={room.floorMaterial}
          onChange={e => updateRoom(room.id, { floorMaterial: e.target.value as MaterialPreset })}
          style={selectStyle}
        >
          {Object.entries(MATERIAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="Ceiling Height (ft)">
        <input
          type="number" min={6} max={20} step={0.5}
          value={room.ceilingHeight}
          onChange={e => updateRoom(room.id, { ceilingHeight: parseFloat(e.target.value) || 9 })}
          style={inputStyle}
        />
      </Field>
      <button
        onClick={() => deleteRoom(room.id)}
        style={{
          width: '100%', padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
          backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 4,
        }}
      >
        Delete Room
      </button>
    </div>
  )
}

function SceneStats() {
  const stats = useSceneStats()
  const scene = useEditorStore(s => s.scene)

  const rows = [
    { label: 'Floor Area', value: `${stats.totalFloorAreaSqFt} sf` },
    { label: 'Rooms', value: stats.roomCount },
    { label: 'Floors', value: stats.floorCount },
    { label: 'Walls', value: `${stats.totalWallLengthFt} lf` },
    { label: 'Doors', value: stats.doorCount },
    { label: 'Windows', value: stats.windowCount },
    { label: 'Ext. Perimeter', value: `${stats.exteriorPerimeterFt} lf` },
  ]

  return (
    <div>
      <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13, color: '#1A2B4A' }}>Scene Stats</p>
      <p style={{ margin: '0 0 8px', fontSize: 11, color: '#9CA3AF' }}>{scene.projectType.replace(/_/g, ' ')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#6B7280' }}>{r.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1A2B4A' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export interface PropertiesPanelProps {
  className?: string
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ className }) => {
  const { selectedWallId, selectedRoomId, selectedFurnitureId } = useEditorStore(s => s)

  const hasSelection = selectedWallId || selectedRoomId || selectedFurnitureId

  return (
    <div
      className={className}
      style={{
        width: 240, height: '100%', backgroundColor: 'white',
        borderLeft: '1px solid #E5E7EB', padding: 16, overflowY: 'auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {selectedWallId     && <WallProperties />}
      {selectedRoomId     && <RoomProperties />}
      {!hasSelection      && <SceneStats />}
    </div>
  )
}
