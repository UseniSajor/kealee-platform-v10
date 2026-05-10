'use client'

/**
 * @kealee/pascal-wrapper — Scene Context
 *
 * Global state for the Pascal Editor using Zustand + Immer.
 * Manages floors, walls, rooms, furniture, tool mode, view mode,
 * undo/redo history, and autosave.
 */

import React, { createContext, useContext, useCallback, useRef } from 'react'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { v4 as uuid } from 'uuid'
import type {
  PascalSceneData, Floor, Wall, Room, FurnitureElement,
  WallOpening, ToolMode, ViewMode, RenderMode, ProjectType,
  MaterialPreset, DesignStyle, Vec2,
} from './types'
import { DEFAULT_WALL_THICKNESS_FT, DEFAULT_CEILING_HEIGHT_FT } from './types'
import { calculateSceneStats } from './utils/geometry'

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

export interface EditorStore {
  scene: PascalSceneData
  activeFloorId: string
  toolMode: ToolMode
  viewMode: ViewMode
  renderMode: RenderMode
  selectedWallId: string | null
  selectedRoomId: string | null
  selectedFurnitureId: string | null
  isDirty: boolean
  isSaving: boolean
  history: PascalSceneData[]
  historyIndex: number
  // Viewport
  zoom: number
  offsetX: number
  offsetY: number
  pxPerFt: number  // base pixels per foot at zoom=1
  // Drawing state (transient, not saved)
  drawingWall: { x1: number; y1: number; x2: number; y2: number } | null
  // Actions
  setToolMode: (mode: ToolMode) => void
  setViewMode: (mode: ViewMode) => void
  setRenderMode: (mode: RenderMode) => void
  setZoom: (zoom: number) => void
  setOffset: (x: number, y: number) => void
  setActiveFloor: (id: string) => void
  setSelectedWall: (id: string | null) => void
  setSelectedRoom: (id: string | null) => void
  setSelectedFurniture: (id: string | null) => void
  setDrawingWall: (wall: { x1: number; y1: number; x2: number; y2: number } | null) => void
  // Scene mutations
  addWall: (wall: Omit<Wall, 'id' | 'floorId' | 'openings'>) => string
  updateWall: (id: string, updates: Partial<Wall>) => void
  deleteWall: (id: string) => void
  addOpeningToWall: (wallId: string, opening: Omit<WallOpening, 'id'>) => string
  removeOpeningFromWall: (wallId: string, openingId: string) => void
  addRoom: (room: Omit<Room, 'id' | 'floorId'>) => string
  updateRoom: (id: string, updates: Partial<Room>) => void
  deleteRoom: (id: string) => void
  addFurniture: (item: Omit<FurnitureElement, 'id' | 'floorId'>) => string
  moveFurniture: (id: string, x: number, y: number) => void
  rotateFurniture: (id: string, degrees: number) => void
  deleteFurniture: (id: string) => void
  addFloor: (name: string, level: number) => string
  updateScene: (updates: Partial<Pick<PascalSceneData, 'name' | 'projectType' | 'materials' | 'metadata'>>) => void
  setIsSaving: (v: boolean) => void
  setIsDirty: (v: boolean) => void
  // History
  pushHistory: () => void
  undo: () => void
  redo: () => void
  // Load
  loadScene: (scene: PascalSceneData) => void
}

// ---------------------------------------------------------------------------
// Scene factory
// ---------------------------------------------------------------------------

export function createDefaultScene(
  projectType: ProjectType = 'addition',
  name = 'New Project',
): PascalSceneData {
  const groundFloorId = uuid()
  return {
    id: uuid(),
    name,
    projectType,
    floors: [
      {
        id: groundFloorId,
        name: 'Ground Floor',
        level: 0,
        elevation: 0,
        walls: [],
        rooms: [],
        furniture: [],
      },
    ],
    camera: { position: { x: 0, y: 20, z: 20 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
    viewport: { offsetX: 0, offsetY: 0, zoom: 1 },
    materials: {
      floorMaterials: { hardwood: 0 } as Record<MaterialPreset, number>,
      wallMaterial: 'drywall',
      style: 'modern',
    },
    metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  }
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

const createEditorStore = (initialScene?: PascalSceneData) => {
  const defaultScene = initialScene ?? createDefaultScene()
  return create<EditorStore>()(
    immer((set, get) => ({
      scene: defaultScene,
      activeFloorId: defaultScene.floors[0]?.id ?? '',
      toolMode: 'select',
      viewMode: '2d',
      renderMode: 'standard',
      selectedWallId: null,
      selectedRoomId: null,
      selectedFurnitureId: null,
      isDirty: false,
      isSaving: false,
      history: [defaultScene],
      historyIndex: 0,
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      pxPerFt: 20,
      drawingWall: null,

      setToolMode: (mode) => set(s => { s.toolMode = mode }),
      setViewMode: (mode) => set(s => { s.viewMode = mode }),
      setRenderMode: (mode) => set(s => { s.renderMode = mode }),
      setZoom: (zoom) => set(s => { s.zoom = Math.max(0.2, Math.min(5, zoom)) }),
      setOffset: (x, y) => set(s => { s.offsetX = x; s.offsetY = y }),
      setActiveFloor: (id) => set(s => { s.activeFloorId = id }),
      setSelectedWall: (id) => set(s => { s.selectedWallId = id; s.selectedRoomId = null; s.selectedFurnitureId = null }),
      setSelectedRoom: (id) => set(s => { s.selectedRoomId = id; s.selectedWallId = null; s.selectedFurnitureId = null }),
      setSelectedFurniture: (id) => set(s => { s.selectedFurnitureId = id; s.selectedWallId = null; s.selectedRoomId = null }),
      setDrawingWall: (wall) => set(s => { s.drawingWall = wall }),
      setIsSaving: (v) => set(s => { s.isSaving = v }),
      setIsDirty: (v) => set(s => { s.isDirty = v }),

      addWall: (wall) => {
        const id = uuid()
        const floorId = get().activeFloorId
        set(s => {
          const floor = s.scene.floors.find(f => f.id === floorId)
          if (floor) {
            const wallDefaults = {
              thickness: DEFAULT_WALL_THICKNESS_FT,
              height: DEFAULT_CEILING_HEIGHT_FT,
              type: 'interior' as const,
              material: 'drywall' as const,
            }
            floor.walls.push({
              id, floorId,
              openings: [],
              ...wallDefaults,
              ...wall,
            })
          }
          s.isDirty = true
        })
        get().pushHistory()
        return id
      },

      updateWall: (id, updates) => set(s => {
        const floor = s.scene.floors.find(f => f.walls.some(w => w.id === id))
        const wall = floor?.walls.find(w => w.id === id)
        if (wall) Object.assign(wall, updates)
        s.isDirty = true
      }),

      deleteWall: (id) => {
        set(s => {
          for (const floor of s.scene.floors) {
            floor.walls = floor.walls.filter(w => w.id !== id)
          }
          if (s.selectedWallId === id) s.selectedWallId = null
          s.isDirty = true
        })
        get().pushHistory()
      },

      addOpeningToWall: (wallId, opening) => {
        const id = uuid()
        set(s => {
          const floor = s.scene.floors.find(f => f.walls.some(w => w.id === wallId))
          const wall = floor?.walls.find(w => w.id === wallId)
          if (wall) wall.openings.push({ id, ...opening })
          s.isDirty = true
        })
        return id
      },

      removeOpeningFromWall: (wallId, openingId) => set(s => {
        const floor = s.scene.floors.find(f => f.walls.some(w => w.id === wallId))
        const wall = floor?.walls.find(w => w.id === wallId)
        if (wall) wall.openings = wall.openings.filter(o => o.id !== openingId)
        s.isDirty = true
      }),

      addRoom: (room) => {
        const id = uuid()
        const floorId = get().activeFloorId
        set(s => {
          const floor = s.scene.floors.find(f => f.id === floorId)
          if (floor) floor.rooms.push({ id, floorId, ...room })
          s.isDirty = true
        })
        get().pushHistory()
        return id
      },

      updateRoom: (id, updates) => set(s => {
        const floor = s.scene.floors.find(f => f.rooms.some(r => r.id === id))
        const room = floor?.rooms.find(r => r.id === id)
        if (room) Object.assign(room, updates)
        s.isDirty = true
      }),

      deleteRoom: (id) => {
        set(s => {
          for (const floor of s.scene.floors) {
            floor.rooms = floor.rooms.filter(r => r.id !== id)
          }
          if (s.selectedRoomId === id) s.selectedRoomId = null
          s.isDirty = true
        })
        get().pushHistory()
      },

      addFurniture: (item) => {
        const id = uuid()
        const floorId = get().activeFloorId
        set(s => {
          const floor = s.scene.floors.find(f => f.id === floorId)
          if (floor) floor.furniture.push({ id, floorId, ...item })
          s.isDirty = true
        })
        get().pushHistory()
        return id
      },

      moveFurniture: (id, x, y) => set(s => {
        const floor = s.scene.floors.find(f => f.furniture.some(fi => fi.id === id))
        const item = floor?.furniture.find(fi => fi.id === id)
        if (item) { item.x = x; item.y = y }
        s.isDirty = true
      }),

      rotateFurniture: (id, degrees) => set(s => {
        const floor = s.scene.floors.find(f => f.furniture.some(fi => fi.id === id))
        const item = floor?.furniture.find(fi => fi.id === id)
        if (item) item.rotation = (item.rotation + degrees) % 360
        s.isDirty = true
      }),

      deleteFurniture: (id) => {
        set(s => {
          for (const floor of s.scene.floors) {
            floor.furniture = floor.furniture.filter(fi => fi.id !== id)
          }
          if (s.selectedFurnitureId === id) s.selectedFurnitureId = null
          s.isDirty = true
        })
        get().pushHistory()
      },

      addFloor: (name, level) => {
        const id = uuid()
        set(s => {
          s.scene.floors.push({ id, name, level, elevation: level * 9, walls: [], rooms: [], furniture: [] })
          s.isDirty = true
        })
        return id
      },

      updateScene: (updates) => set(s => {
        Object.assign(s.scene, updates)
        s.scene.metadata.updatedAt = new Date().toISOString()
        s.isDirty = true
      }),

      pushHistory: () => set(s => {
        const snapshot = JSON.parse(JSON.stringify(s.scene)) as PascalSceneData
        s.history = s.history.slice(0, s.historyIndex + 1)
        s.history.push(snapshot)
        // Cap at 50 steps
        if (s.history.length > 50) s.history.shift()
        s.historyIndex = s.history.length - 1
      }),

      undo: () => set(s => {
        if (s.historyIndex > 0) {
          s.historyIndex--
          s.scene = JSON.parse(JSON.stringify(s.history[s.historyIndex]))
          s.isDirty = true
        }
      }),

      redo: () => set(s => {
        if (s.historyIndex < s.history.length - 1) {
          s.historyIndex++
          s.scene = JSON.parse(JSON.stringify(s.history[s.historyIndex]))
          s.isDirty = true
        }
      }),

      loadScene: (scene) => set(s => {
        s.scene = scene
        s.activeFloorId = scene.floors[0]?.id ?? ''
        s.history = [JSON.parse(JSON.stringify(scene))]
        s.historyIndex = 0
        s.isDirty = false
        s.zoom = scene.viewport?.zoom ?? 1
        s.offsetX = scene.viewport?.offsetX ?? 0
        s.offsetY = scene.viewport?.offsetY ?? 0
      }),
    }))
  )
}

// ---------------------------------------------------------------------------
// React context wrapper
// ---------------------------------------------------------------------------

type Store = ReturnType<typeof createEditorStore>
const EditorContext = createContext<Store | null>(null)

export interface EditorProviderProps {
  children: React.ReactNode
  initialScene?: PascalSceneData
}

export const EditorProvider: React.FC<EditorProviderProps> = ({ children, initialScene }) => {
  const storeRef = useRef<Store>()
  if (!storeRef.current) {
    storeRef.current = createEditorStore(initialScene)
  }
  return (
    <EditorContext.Provider value={storeRef.current}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditorStore<T>(selector: (state: EditorStore) => T): T {
  const store = useContext(EditorContext)
  if (!store) throw new Error('useEditorStore must be used within <EditorProvider>')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (store as any)(selector)
}

/** Convenience hook: active floor */
export function useActiveFloor(): Floor | null {
  const { scene, activeFloorId } = useEditorStore(s => ({ scene: s.scene, activeFloorId: s.activeFloorId }))
  return scene.floors.find(f => f.id === activeFloorId) ?? null
}

/** Convenience hook: scene stats (memoized on floor changes) */
export function useSceneStats() {
  const scene = useEditorStore(s => s.scene)
  return calculateSceneStats(scene)
}
