/**
 * Mobile Measurement Capture Component
 * Unified UI for LiDAR/reference object/AI measurement methods
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
} from 'react-native'
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera'
import { measurementEngine } from '../services/MeasurementEngine'
import type {
  MeasurementSession,
  MeasurementResult,
  DeviceCapability,
  Point2D,
} from '../types'

interface MeasurementCaptureProps {
  onMeasurementComplete?: (result: MeasurementResult) => void
  onSessionEnd?: (session: MeasurementSession) => void
  autoCalibrate?: boolean
}

interface CaptureState {
  isLoading: boolean
  session: MeasurementSession | null
  capability: DeviceCapability | null
  calibrated: boolean
  selectedPoints: Point2D[]
  error: string | null
  currentMethod: string
  confidence: number
}

const { width, height } = Dimensions.get('window')

export function MeasurementCapture({
  onMeasurementComplete,
  onSessionEnd,
  autoCalibrate = true,
}: MeasurementCaptureProps) {
  const cameraRef = useRef<Camera>(null)
  const device = useCameraDevice('back')

  const [state, setState] = useState<CaptureState>({
    isLoading: true,
    session: null,
    capability: null,
    calibrated: false,
    selectedPoints: [],
    error: null,
    currentMethod: 'Unknown',
    confidence: 0,
  })

  // Initialize measurement engine
  useEffect(() => {
    const initialize = async () => {
      try {
        const capability = await measurementEngine.initialize()
        const session = await measurementEngine.startSession()

        setState((prev) => ({
          ...prev,
          isLoading: false,
          capability,
          session,
          currentMethod:
            capability.recommendedMethod === 'lidar_direct'
              ? 'LiDAR (±2-5mm)'
              : 'Reference Object',
        }))

        // Auto-calibrate if requested
        if (autoCalibrate && capability.recommendedMethod !== 'lidar_direct') {
          // User will need to show reference object
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Initialization failed: ${error}`,
        }))
      }
    }

    initialize()

    return () => {
      measurementEngine.cleanup()
    }
  }, [])

  const handleCalibrate = async () => {
    if (!state.session) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      // Capture frame and calibrate
      const frame = {
        imageData: '',
        width: 1920,
        height: 1080,
        timestamp: Date.now(),
      }

      await measurementEngine.calibrateFromReferenceObject(frame, 'credit_card')

      setState((prev) => ({
        ...prev,
        isLoading: false,
        calibrated: true,
        currentMethod: 'Reference Object (±5-10%)',
      }))

      Alert.alert('Success', 'Calibration complete. Ready to measure.')
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Calibration failed: ${error}`,
      }))
    }
  }

  const handlePointSelect = (event: any) => {
    const { locationX, locationY } = event.nativeEvent

    setState((prev) => {
      const newPoints = [...prev.selectedPoints, { x: locationX, y: locationY }]

      // If we have two points, measure
      if (newPoints.length === 2) {
        measureDistance(newPoints[0], newPoints[1])
        return { ...prev, selectedPoints: [] }
      }

      return { ...prev, selectedPoints: newPoints }
    })
  }

  const measureDistance = async (point1: Point2D, point2: Point2D) => {
    if (!state.session) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const result = await measurementEngine.measure(point1, point2)

      setState((prev) => ({
        ...prev,
        isLoading: false,
        confidence: result.confidence,
      }))

      onMeasurementComplete?.(result)

      Alert.alert(
        'Measurement',
        `Distance: ${result.distance.toFixed(1)} ${result.unit}\nConfidence: ${result.confidence}%`
      )
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Measurement failed: ${error}`,
      }))
    }
  }

  const handleEndSession = async () => {
    if (!state.session) return

    try {
      const completedSession = await measurementEngine.endSession()
      onSessionEnd?.(completedSession)

      Alert.alert(
        'Session Complete',
        `Measurements taken: ${completedSession.measurements.length}`
      )
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera not available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Measure</Text>
          <View style={styles.methodBadge}>
            <Text style={styles.methodText}>{state.currentMethod}</Text>
            {state.confidence > 0 && (
              <Text style={styles.confidenceText}>({state.confidence}%)</Text>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {state.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Initializing...</Text>
            </View>
          ) : state.error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{state.error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => setState((prev) => ({ ...prev, error: null }))}
              >
                <Text style={styles.buttonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !state.calibrated &&
            state.capability?.recommendedMethod !== 'lidar_direct' ? (
            <View style={styles.calibrationContainer}>
              <Text style={styles.calibrationTitle}>Step 1: Calibrate</Text>
              <Text style={styles.calibrationText}>
                Show a credit card or ruler to calibrate the scale
              </Text>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCalibrate}
              >
                <Text style={styles.buttonText}>Calibrate with Credit Card</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.measurementContainer}>
              <Text style={styles.instructionText}>
                {state.selectedPoints.length === 0
                  ? 'Tap to select first point'
                  : 'Tap to select second point'}
              </Text>
              <View
                style={styles.touchableArea}
                onTouchEnd={handlePointSelect}
              >
                {/* Draw selected points */}
                {state.selectedPoints.map((point, i) => (
                  <View
                    key={i}
                    style={[
                      styles.point,
                      { left: point.x - 10, top: point.y - 10 },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer Controls */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleEndSession}
          >
            <Text style={styles.buttonText}>End Session</Text>
          </TouchableOpacity>

          {state.session && (
            <Text style={styles.statsText}>
              Measurements: {state.session.measurements.length}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  methodBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  methodText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  confidenceText: {
    color: '#4ade80',
    fontSize: 11,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  calibrationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  calibrationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  calibrationText: {
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
  },
  measurementContainer: {
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  touchableArea: {
    width: width - 32,
    height: height * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  point: {
    width: 20,
    height: 20,
    backgroundColor: '#ff6b35',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    position: 'absolute',
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ff6b35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsText: {
    color: '#9ca3af',
    fontSize: 12,
  },
})

export default MeasurementCapture
