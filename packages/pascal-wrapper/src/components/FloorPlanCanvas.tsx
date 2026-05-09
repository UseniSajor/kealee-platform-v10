'use client'

/**
 * @kealee/pascal-wrapper — FloorPlanCanvas (2D SVG Editor)
 *
 * SVG-based 2D floor plan drawing canvas. Handles:
 * - Wall drawing (click-to-start, click-to-end)
 * - Room visualization with colors
 * - Furniture placement
 * - Door/window symbols on walls
 * - Dimension annotations
 * - Snap-to-grid
 * - Pan and zoom
 * - Selection
 */

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useEditorStore, useActiveFloor } from '../SceneContext'
import type { Wall, Room, FurnitureElement, WallOpening } from '../types'
import {
  wallLength, wallMidpoint, wallPerpendicularAngle,
  snapPoint, findNearestEndpoint, feetToPixels, formatFeet
} from '../utils/geometry'
import { ROOM_COLORS, FURNITURE_CATALOG } from '../constants'

// ---------------------------------------------------------------------------
// SVG Symbol renderers
// ---------------------------------------------------------------------------

function DoorSymbol({ opening, wall, pxPerFt, zoom }: {
  opening: WallOpening; wall: Wall; pxPerFt: number; zoom: number
}) {
  const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1)
  const len = wallLength(wall)
  const pos = opening.position * len
  const originX = wall.x1 + Math.cos(wallAngle) * pos
  const originY = wall.y1 + Math.sin(wallAngle) * pos
  const doorWidthPx = feetToPixels(opening.width, pxPerFt, zoom)
  const swingAngle = opening.swingAngle ?? 90

  return (
    <g transform={`translate(${feetToPixels(originX, pxPerFt, zoom)}, ${feetToPixels(originY, pxPerFt, zoom)}) rotate(${(wallAngle * 180) / Math.PI})`}>
      {/* Door panel */}
      <line x1={0} y1={0} x2={doorWidthPx} y2={0} stroke="#1A2B4A" strokeWidth={2} />
      {/* Swing arc */}
      <path
        d={`M 0,0 A ${doorWidthPx},${doorWidthPx} 0 0,${opening.swingSide === 'right' ? 1 : 0} ${doorWidthPx * Math.cos((swingAngle * Math.PI) / 180)},${doorWidthPx * Math.sin((swingAngle * Math.PI) / 180) * (opening.swingSide === 'right' ? -1 : 1)}`}
        stroke="#1A2B4A" strokeWidth={1} strokeDasharray="4,4" fill="none"
      />
    </g>
  )
}

function WindowSymbol({ opening, wall, pxPerFt, zoom }: {
  opening: WallOpening; wall: Wall; pxPerFt: number; zoom: number
}) {
  const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1)
  const len = wallLength(wall)
  const pos = opening.position * len
  const originX = wall.x1 + Math.cos(wallAngle) * pos
  const originY = wall.y1 + Math.sin(wallAngle) * pos
  const winWidthPx = feetToPixels(opening.width, pxPerFt, zoom)
  const thickPx = feetToPixels(wall.thickness, pxPerFt, zoom)

  return (
    <g transform={`translate(${feetToPixels(originX, pxPerFt, zoom)}, ${feetToPixels(originY, pxPerFt, zoom)}) rotate(${(wallAngle * 180) / Math.PI})`}>
      {/* Window fill — white gap in wall */}
      <rect x={0} y={-thickPx / 2} width={winWidthPx} height={thickPx} fill="white" />
      {/* Triple line window symbol */}
      <line x1={0} y1={-thickPx / 2} x2={winWidthPx} y2={-thickPx / 2} stroke="#4488cc" strokeWidth={1.5} />
      <line x1={0} y1={0}            x2={winWidthPx} y2={0}            stroke="#4488cc" strokeWidth={1.5} />
      <line x1={0} y1={thickPx / 2}  x2={winWidthPx} y2={thickPx / 2}  stroke="#4488cc" strokeWidth={1.5} />
    </g>
  )
}

function WallElement({ wall, isSelected, pxPerFt, zoom, onClick }: {
  wall: Wall; isSelected: boolean; pxPerFt: number; zoom: number; onClick: () => void
}) {
  const x1 = feetToPixels(wall.x1, pxPerFt, zoom)
  const y1 = feetToPixels(wall.y1, pxPerFt, zoom)
  const x2 = feetToPixels(wall.x2, pxPerFt, zoom)
  const y2 = feetToPixels(wall.y2, pxPerFt, zoom)
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const thickPx = feetToPixels(wall.thickness, pxPerFt, zoom)
  const len = wallLength(wall)

  const wallColor = wall.type === 'exterior'      ? '#1A2B4A' :
                    wall.type === 'load_bearing'   ? '#374151' : '#6B7280'

  const mid = wallMidpoint(wall)
  const perpAngle = wallPerpendicularAngle(wall)
  const dimOffset = thickPx / 2 + 16

  const dimX = feetToPixels(mid.x, pxPerFt, zoom) + Math.cos(perpAngle) * dimOffset
  const dimY = feetToPixels(mid.y, pxPerFt, zoom) + Math.sin(perpAngle) * dimOffset

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Selection glow */}
      {isSelected && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#E8724B" strokeWidth={thickPx + 6} strokeLinecap="round" opacity={0.3}
        />
      )}
      {/* Wall body */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isSelected ? '#E8724B' : wallColor}
        strokeWidth={thickPx}
        strokeLinecap="square"
      />

      {/* Openings */}
      {wall.openings.map(o => (
        o.type === 'window'
          ? <WindowSymbol key={o.id} opening={o} wall={wall} pxPerFt={pxPerFt} zoom={zoom} />
          : <DoorSymbol key={o.id} opening={o} wall={wall} pxPerFt={pxPerFt} zoom={zoom} />
      ))}

      {/* Dimension label (show when selected or zoom >= 0.8) */}
      {(isSelected || zoom >= 0.8) && (
        <text
          x={dimX} y={dimY}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fill={isSelected ? '#E8724B' : '#6B7280'}
          fontFamily="system-ui, sans-serif"
          transform={`rotate(${(angle * 180) / Math.PI}, ${dimX}, ${dimY})`}
        >
          {formatFeet(len)}
        </text>
      )}
    </g>
  )
}

function RoomElement({ room, isSelected, pxPerFt, zoom, onClick }: {
  room: Room; isSelected: boolean; pxPerFt: number; zoom: number; onClick: () => void
}) {
  if (room.polygon.length < 3) return null
  const pts = room.polygon.map(p =>
    `${feetToPixels(p.x, pxPerFt, zoom)},${feetToPixels(p.y, pxPerFt, zoom)}`
  ).join(' ')

  const centX = room.polygon.reduce((a, p) => a + p.x, 0) / room.polygon.length
  const centY = room.polygon.reduce((a, p) => a + p.y, 0) / room.polygon.length

  const baseColor = ROOM_COLORS[room.type] ?? '#EEEEEE'

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <polygon
        points={pts}
        fill={baseColor}
        stroke={isSelected ? '#E8724B' : '#CBD5E1'}
        strokeWidth={isSelected ? 2 : 1}
        opacity={0.7}
      />
      <text
        x={feetToPixels(centX, pxPerFt, zoom)}
        y={feetToPixels(centY, pxPerFt, zoom)}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={Math.max(8, 11 * zoom)} fill="#374151"
        fontFamily="system-ui, sans-serif" fontWeight="600"
      >
        {room.name}
      </text>
      {zoom >= 0.7 && (
        <text
          x={feetToPixels(centX, pxPerFt, zoom)}
          y={feetToPixels(centY, pxPerFt, zoom) + Math.max(10, 14 * zoom)}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.max(7, 9 * zoom)} fill="#6B7280"
          fontFamily="system-ui, sans-serif"
        >
          {Math.round(room.areaSqFt)} sf
        </text>
      )}
    </g>
  )
}

function FurnitureElement2D({ item, isSelected, pxPerFt, zoom, onClick }: {
  item: FurnitureElement; isSelected: boolean; pxPerFt: number; zoom: number; onClick: () => void
}) {
  const cx = feetToPixels(item.x, pxPerFt, zoom)
  const cy = feetToPixels(item.y, pxPerFt, zoom)
  const w  = feetToPixels(item.width, pxPerFt, zoom)
  const d  = feetToPixels(item.depth, pxPerFt, zoom)
  const catalog = FURNITURE_CATALOG.find(c => c.id === item.catalogId)

  return (
    <g
      transform={`translate(${cx}, ${cy}) rotate(${item.rotation})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={-w / 2} y={-d / 2} width={w} height={d}
        fill={isSelected ? '#FEF3C7' : '#F1F5F9'}
        stroke={isSelected ? '#E8724B' : '#94A3B8'}
        strokeWidth={isSelected ? 2 : 1}
        rx={2}
      />
      {zoom >= 0.6 && (
        <text
          textAnchor="middle" dominantBaseline="middle"
          fontSize={Math.max(6, 8 * zoom)} fill="#475569"
          fontFamily="system-ui, sans-serif"
        >
          {catalog?.symbol ?? '⬜'}
        </text>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

function Grid({ pxPerFt, zoom, width, height, offsetX, offsetY }: {
  pxPerFt: number; zoom: number; width: number; height: number
  offsetX: number; offsetY: number
}) {
  const gridPx = pxPerFt * zoom
  const minorLines: React.ReactNode[] = []
  const majorLines: React.ReactNode[] = []

  // Only show grid when zoomed in enough
  if (gridPx < 5) return null

  const startX = Math.floor(-offsetX / gridPx) - 1
  const startY = Math.floor(-offsetY / gridPx) - 1
  const endX   = startX + Math.ceil(width / gridPx) + 2
  const endY   = startY + Math.ceil(height / gridPx) + 2

  for (let xi = startX; xi <= endX; xi++) {
    const x = xi * gridPx + (offsetX % gridPx)
    const isMajor = xi % 10 === 0
    const line = (
      <line key={`vx${xi}`} x1={x} y1={0} x2={x} y2={height}
        stroke={isMajor ? '#CBD5E1' : '#E2E8F0'} strokeWidth={isMajor ? 0.75 : 0.5} />
    )
    isMajor ? majorLines.push(line) : minorLines.push(line)
  }
  for (let yi = startY; yi <= endY; yi++) {
    const y = yi * gridPx + (offsetY % gridPx)
    const isMajor = yi % 10 === 0
    const line = (
      <line key={`hy${yi}`} x1={0} y1={y} x2={width} y2={y}
        stroke={isMajor ? '#CBD5E1' : '#E2E8F0'} strokeWidth={isMajor ? 0.75 : 0.5} />
    )
    isMajor ? majorLines.push(line) : minorLines.push(line)
  }

  return <g>{minorLines}{majorLines}</g>
}

// ---------------------------------------------------------------------------
// Main canvas
// ---------------------------------------------------------------------------

export interface FloorPlanCanvasProps {
  width?: number
  height?: number
  className?: string
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  width = 800, height = 600, className,
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const {
    toolMode, viewMode, zoom, offsetX, offsetY, pxPerFt,
    selectedWallId, selectedRoomId, selectedFurnitureId,
    drawingWall,
    setZoom, setOffset, setSelectedWall, setSelectedRoom, setSelectedFurniture,
    setDrawingWall, addWall,
  } = useEditorStore(s => s)
  const floor = useActiveFloor()

  // Pan state
  const isPanning = useRef(false)
  const panStart  = useRef({ x: 0, y: 0, ox: 0, oy: 0 })

  // Convert screen → scene coordinates
  const screenToScene = useCallback((sx: number, sy: number) => ({
    x: (sx - offsetX) / (pxPerFt * zoom),
    y: (sy - offsetY) / (pxPerFt * zoom),
  }), [offsetX, offsetY, pxPerFt, zoom])

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (toolMode === 'pan' || e.button === 1) {
      isPanning.current = true
      panStart.current = { x: e.clientX, y: e.clientY, ox: offsetX, oy: offsetY }
      e.preventDefault()
      return
    }
    if (toolMode === 'wall') {
      const rect = svgRef.current!.getBoundingClientRect()
      const raw = screenToScene(e.clientX - rect.left, e.clientY - rect.top)
      const snapped = snapPoint(raw.x, raw.y)
      // Find nearby endpoint
      const nearby = findNearestEndpoint(snapped.x, snapped.y, floor?.walls ?? [], null)
      const start = nearby ?? snapped
      setDrawingWall({ x1: start.x, y1: start.y, x2: start.x, y2: start.y })
    }
  }, [toolMode, offsetX, offsetY, screenToScene, floor, setDrawingWall])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      setOffset(panStart.current.ox + dx, panStart.current.oy + dy)
      return
    }
    if (toolMode === 'wall' && drawingWall) {
      const rect = svgRef.current!.getBoundingClientRect()
      const raw = screenToScene(e.clientX - rect.left, e.clientY - rect.top)
      const snapped = snapPoint(raw.x, raw.y)
      const nearby = findNearestEndpoint(snapped.x, snapped.y, floor?.walls ?? [], null)
      const end = nearby ?? snapped
      setDrawingWall({ ...drawingWall, x2: end.x, y2: end.y })
    }
  }, [toolMode, drawingWall, screenToScene, floor, setOffset, setDrawingWall])

  const handleMouseUp = useCallback(() => {
    isPanning.current = false
    if (toolMode === 'wall' && drawingWall) {
      const len = Math.sqrt((drawingWall.x2 - drawingWall.x1) ** 2 + (drawingWall.y2 - drawingWall.y1) ** 2)
      if (len >= 0.5) {
        addWall({
          x1: drawingWall.x1, y1: drawingWall.y1,
          x2: drawingWall.x2, y2: drawingWall.y2,
          thickness: 0.5, height: 9, type: 'interior', material: 'drywall',
        })
      }
      setDrawingWall(null)
    }
  }, [toolMode, drawingWall, addWall, setDrawingWall])

  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const rect = svgRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const newZoom = Math.max(0.2, Math.min(5, zoom * delta))
    // Zoom toward cursor
    setOffset(mx - (mx - offsetX) * (newZoom / zoom), my - (my - offsetY) * (newZoom / zoom))
    setZoom(newZoom)
  }, [zoom, offsetX, offsetY, setZoom, setOffset])

  const cursor = toolMode === 'pan' ? 'grab' :
                 toolMode === 'wall' ? 'crosshair' :
                 toolMode === 'select' ? 'default' : 'crosshair'

  if (!floor) return <div className={className} style={{ width, height, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>Select a floor to edit</div>

  return (
    <svg
      ref={svgRef}
      width={width} height={height}
      style={{ background: '#F8FAFC', cursor, userSelect: 'none', display: 'block' }}
      className={className}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Grid */}
      <Grid pxPerFt={pxPerFt} zoom={zoom} width={width} height={height} offsetX={offsetX} offsetY={offsetY} />

      {/* Scene content group (panned + zoomed) */}
      <g transform={`translate(${offsetX}, ${offsetY}) scale(${zoom})`}>
        {/* Rooms (render below walls) */}
        {floor.rooms.map(room => (
          <RoomElement
            key={room.id} room={room}
            isSelected={selectedRoomId === room.id}
            pxPerFt={pxPerFt} zoom={1}
            onClick={() => setSelectedRoom(room.id)}
          />
        ))}

        {/* Furniture */}
        {floor.furniture.map(item => (
          <FurnitureElement2D
            key={item.id} item={item}
            isSelected={selectedFurnitureId === item.id}
            pxPerFt={pxPerFt} zoom={1}
            onClick={() => setSelectedFurniture(item.id)}
          />
        ))}

        {/* Walls (render above rooms) */}
        {floor.walls.map(wall => (
          <WallElement
            key={wall.id} wall={wall}
            isSelected={selectedWallId === wall.id}
            pxPerFt={pxPerFt} zoom={1}
            onClick={() => setSelectedWall(wall.id)}
          />
        ))}

        {/* In-progress wall while drawing */}
        {drawingWall && (
          <line
            x1={feetToPixels(drawingWall.x1, pxPerFt, 1)}
            y1={feetToPixels(drawingWall.y1, pxPerFt, 1)}
            x2={feetToPixels(drawingWall.x2, pxPerFt, 1)}
            y2={feetToPixels(drawingWall.y2, pxPerFt, 1)}
            stroke="#E8724B" strokeWidth={feetToPixels(0.5, pxPerFt, 1)}
            strokeDasharray="8,8" strokeLinecap="square" opacity={0.7}
          />
        )}
      </g>

      {/* Scale indicator */}
      <g transform={`translate(${width - 120}, ${height - 30})`}>
        <line x1={0} y1={8} x2={pxPerFt * zoom * 10} y2={8} stroke="#94A3B8" strokeWidth={2} />
        <line x1={0} y1={4} x2={0} y2={12} stroke="#94A3B8" strokeWidth={1.5} />
        <line x1={pxPerFt * zoom * 10} y1={4} x2={pxPerFt * zoom * 10} y2={12} stroke="#94A3B8" strokeWidth={1.5} />
        <text x={pxPerFt * zoom * 5} y={22} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="system-ui">10 ft</text>
      </g>
    </svg>
  )
}
