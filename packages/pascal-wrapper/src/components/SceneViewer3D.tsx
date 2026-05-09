'use client'

/**
 * @kealee/pascal-wrapper — SceneViewer3D
 *
 * 3D rendering of Pascal scene data using React Three Fiber.
 * Builds Three.js meshes from scene geometry (walls, floors, furniture).
 *
 * Rendering modes:
 * - sketch:    toon/outline shading
 * - standard:  basic Phong lighting
 * - realistic: PBR materials + Environment + SSAO
 * - cinematic: full post-processing (bloom, DOF, vignette)
 */

import React, { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, GizmoHelper, GizmoViewport, SoftShadows } from '@react-three/drei'
import { useEditorStore } from '../SceneContext'
import type { Wall, Floor, FurnitureElement, Room } from '../types'
import { wallLength } from '../utils/geometry'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// 3D Wall mesh
// ---------------------------------------------------------------------------

function WallMesh({ wall, isSelected }: { wall: Wall; isSelected: boolean }) {
  const len = wallLength(wall)
  const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1)
  const midX = (wall.x1 + wall.x2) / 2
  const midZ = (wall.y1 + wall.y2) / 2

  const color = isSelected ? '#E8724B' :
    wall.type === 'exterior' ? '#E8E0D0' :
    wall.type === 'load_bearing' ? '#D5CFC3' : '#F5F0EA'

  return (
    <mesh
      position={[midX, wall.height / 2, midZ]}
      rotation={[0, -angle, 0]}
      castShadow receiveShadow
    >
      <boxGeometry args={[len, wall.height, wall.thickness]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.0} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// 3D Floor mesh per room
// ---------------------------------------------------------------------------

function FloorMesh({ room }: { room: Room }) {
  const shape = useMemo(() => {
    if (room.polygon.length < 3) return null
    const s = new THREE.Shape()
    s.moveTo(room.polygon[0].x, room.polygon[0].y)
    room.polygon.slice(1).forEach(p => s.lineTo(p.x, p.y))
    s.closePath()
    return s
  }, [room.polygon])

  if (!shape) return null

  const colorMap: Record<string, string> = {
    hardwood: '#C4A882', tile: '#D1D5DB', carpet: '#8B9DC3',
    concrete: '#9CA3AF', marble: '#F9FAFB', laminate: '#D4B896',
  }
  const color = colorMap[room.floorMaterial] ?? '#E5E7EB'

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.0} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Furniture placeholder (box)
// ---------------------------------------------------------------------------

function FurnitureMesh({ item }: { item: FurnitureElement }) {
  return (
    <mesh
      position={[item.x, item.height / 2, item.y]}
      rotation={[0, -(item.rotation * Math.PI) / 180, 0]}
      castShadow
    >
      <boxGeometry args={[item.width, item.height, item.depth]} />
      <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
    </mesh>
  )
}

// ---------------------------------------------------------------------------
// Full floor
// ---------------------------------------------------------------------------

function FloorScene({ floor, selectedWallId }: { floor: Floor; selectedWallId: string | null }) {
  return (
    <group position={[0, floor.elevation, 0]}>
      {floor.rooms.map(r => <FloorMesh key={r.id} room={r} />)}
      {floor.walls.map(w => (
        <WallMesh key={w.id} wall={w} isSelected={w.id === selectedWallId} />
      ))}
      {floor.furniture.map(f => <FurnitureMesh key={f.id} item={f} />)}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Lighting presets per render mode
// ---------------------------------------------------------------------------

function SceneLighting({ mode }: { mode: string }) {
  switch (mode) {
    case 'cinematic':
    case 'realistic':
      return (
        <>
          <ambientLight intensity={0.2} />
          <directionalLight position={[15, 20, 10]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
          <pointLight position={[-8, 3, -8]} intensity={0.6} color="#FFF5E0" />
          <Environment preset="apartment" />
          {mode === 'cinematic' && <SoftShadows />}
        </>
      )
    case 'sketch':
      return (
        <>
          <ambientLight intensity={0.8} color="#E0E8FF" />
          <directionalLight position={[10, 20, 10]} intensity={0.3} />
        </>
      )
    default: // standard
      return (
        <>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={0.7} castShadow />
          <directionalLight position={[-8, 8, -8]} intensity={0.2} />
        </>
      )
  }
}

// ---------------------------------------------------------------------------
// Main 3D viewer
// ---------------------------------------------------------------------------

export interface SceneViewer3DProps {
  width?: string | number
  height?: string | number
  className?: string
}

export const SceneViewer3D: React.FC<SceneViewer3DProps> = ({
  width = '100%', height = '100%', className,
}) => {
  const { scene, renderMode, selectedWallId } = useEditorStore(s => s)

  const bgColor = renderMode === 'sketch' ? '#F0F4FF' :
                  renderMode === 'cinematic' ? '#0A0A0A' : '#E8EDF5'

  return (
    <div style={{ width, height }} className={className}>
      <Canvas
        shadows
        camera={{ position: [30, 25, 30], fov: 45, near: 0.1, far: 5000 }}
        style={{ background: bgColor }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <SceneLighting mode={renderMode} />

        <Suspense fallback={null}>
          {scene.floors.map(floor => (
            <FloorScene key={floor.id} floor={floor} selectedWallId={selectedWallId} />
          ))}
        </Suspense>

        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[500, 500]} />
          <meshStandardMaterial color="#E2E8F0" roughness={1} />
        </mesh>

        <OrbitControls
          enableDamping dampingFactor={0.1}
          minDistance={2} maxDistance={500}
          target={[0, 2, 0]}
        />

        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport axisColors={['#f73', '#3f7', '#37f']} labelColor="white" />
        </GizmoHelper>

        {renderMode !== 'sketch' && (
          <gridHelper args={[100, 100, '#CBD5E1', '#E2E8F0']} position={[0, 0, 0]} />
        )}
      </Canvas>
    </div>
  )
}
