/**
 * Native bridge for LiDAR and depth sensor access
 * Handles iOS ARKit and Android depth APIs
 */

import { NativeModules, Platform } from 'react-native'
import type { DepthFrame, Point2D } from '../types'

const { NativeLiDARModule } = NativeModules

interface INativeLiDARBridge {
  isAvailable(): Promise<boolean>
  requestPermission(): Promise<boolean>
  startSession(): Promise<void>
  stopSession(): Promise<void>
  getDepthAtPoint(point: Point2D): Promise<number | null> // Returns depth in meters
  captureDepthFrame(): Promise<DepthFrame | null>
  getLiDARSpecs(): Promise<{ accuracy: number; maxRange: number }>
}

class NativeLiDARBridge implements INativeLiDARBridge {
  private sessionActive = false
  private isInitialized = false

  async initialize(): Promise<void> {
    if (this.isInitialized) return
    try {
      await NativeLiDARModule.initialize()
      this.isInitialized = true
    } catch (error) {
      console.warn('[LiDAR] Failed to initialize:', error)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.initialize()
      return await NativeLiDARModule.isLiDARAvailable()
    } catch {
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      return await NativeLiDARModule.requestLiDARPermission()
    } catch {
      return false
    }
  }

  async startSession(): Promise<void> {
    try {
      await this.initialize()
      const hasPermission = await this.requestPermission()
      if (!hasPermission) throw new Error('LiDAR permission denied')

      await NativeLiDARModule.startLiDARSession()
      this.sessionActive = true
    } catch (error) {
      console.error('[LiDAR] Failed to start session:', error)
      throw error
    }
  }

  async stopSession(): Promise<void> {
    try {
      if (this.sessionActive) {
        await NativeLiDARModule.stopLiDARSession()
        this.sessionActive = false
      }
    } catch (error) {
      console.error('[LiDAR] Failed to stop session:', error)
    }
  }

  async getDepthAtPoint(point: Point2D): Promise<number | null> {
    if (!this.sessionActive) return null
    try {
      return await NativeLiDARModule.getDepthAtPoint(point.x, point.y)
    } catch {
      return null
    }
  }

  async captureDepthFrame(): Promise<DepthFrame | null> {
    if (!this.sessionActive) return null
    try {
      const frame = await NativeLiDARModule.captureDepthFrame()
      return {
        depthData: new Float32Array(frame.depthData),
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
        isLiDAR: true,
        confidenceData: frame.confidenceData ? new Uint8Array(frame.confidenceData) : undefined,
      }
    } catch {
      return null
    }
  }

  async getLiDARSpecs(): Promise<{ accuracy: number; maxRange: number }> {
    try {
      return await NativeLiDARModule.getLiDARSpecs()
    } catch {
      return { accuracy: 5, maxRange: 5 } // Default specs (5mm accuracy, 5m range)
    }
  }

  isSessionActive(): boolean {
    return this.sessionActive
  }

  async cleanup(): Promise<void> {
    await this.stopSession()
  }
}

export const nativeLiDARBridge = new NativeLiDARBridge()
