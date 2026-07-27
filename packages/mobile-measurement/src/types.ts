/**
 * Core types for hybrid LiDAR/vision measurement system
 */

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number // Depth in meters
}

export interface MeasurementResult {
  distance: number
  unit: 'mm' | 'cm' | 'inches' | 'feet' | 'meters'
  method: MeasurementMethod
  accuracy: 'high' | 'medium' | 'low'
  confidence: number // 0-100%
  timestamp: Date
  metadata?: {
    deviceModel?: string
    calibrationObject?: string
    perspectiveCorrection?: boolean
  }
}

export type MeasurementMethod =
  | 'lidar_direct'
  | 'tof_sensor'
  | 'reference_object'
  | 'ai_detection'
  | 'perspective_estimation'

export interface DeviceCapability {
  hasLiDAR: boolean
  hasToFSensor: boolean
  hasDualCamera: boolean
  hasFrontCamera: boolean
  cameraResolution: {
    width: number
    height: number
  }
  recommendedMethod: MeasurementMethod
  allAvailableMethods: MeasurementMethod[]
  deviceModel: string
  osVersion: string
}

export interface DepthFrame {
  depthData: Float32Array
  width: number
  height: number
  timestamp: number
  isLiDAR: boolean // true if LiDAR, false if ToF
  confidenceData?: Uint8Array
}

export interface ReferenceObjectCalibration {
  objectType: 'credit_card' | 'ruler' | 'coin' | 'hand' | 'door' | 'custom'
  realWorldSize: number // in mm
  pixelSize: number
  pixelsToCentimetersRatio: number
  confidence: number // 0-100%
  bounds: {
    x1: number
    y1: number
    x2: number
    y2: number
  }
}

export interface DetectedObject {
  type: string
  confidence: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  estimatedRealWorldSize?: number // in mm
}

export interface MeasurementSession {
  id: string
  startTime: Date
  deviceCapability: DeviceCapability
  calibration?: ReferenceObjectCalibration
  measurements: MeasurementResult[]
  method: MeasurementMethod
}

export interface CalibrationRequest {
  method: 'lidar_plane' | 'reference_object' | 'known_objects'
  referenceSize?: number
  referenceObjectImage?: string // Base64 or URL
  customObjectType?: string
}

export interface CaptureFrame {
  imageData: ArrayBuffer | string // Base64
  width: number
  height: number
  timestamp: number
  depthData?: DepthFrame
  isoValue?: number
  exposureTime?: number
}
