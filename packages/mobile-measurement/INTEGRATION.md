# Kealee Mobile Measurement Integration Guide

## Overview

This package provides a **hybrid measurement system** that works on 100% of user devices:

- **LiDAR Devices (15-20%)**: iPhone 12 Pro+, iPad Pro 2020+ → ±2-5mm accuracy
- **ToF Devices (8%)**: High-end Android → ±5-10mm accuracy
- **All Devices (100%)**: Reference object calibration → ±5-10% accuracy
- **Fallback (100%)**: Computer vision detection → ±10-20% accuracy

## Installation

```bash
cd packages/mobile-measurement
pnpm install
pnpm build
```

## Integration Steps

### 1. Add to React Native App

```typescript
// src/screens/CaptureScreen.tsx
import { MeasurementCapture } from '@kealee/mobile-measurement'

export default function CaptureScreen() {
  return (
    <MeasurementCapture
      autoCalibrate={true}
      onMeasurementComplete={(result) => {
        console.log(`Measured: ${result.distance}${result.unit}`)
        // Send to API
        saveMeasurement(result)
      }}
      onSessionEnd={(session) => {
        console.log(`Session complete: ${session.measurements.length} measurements`)
      }}
    />
  )
}
```

### 2. iOS Setup (LiDAR Support)

Add LiDAR permissions to `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access to measure distances using your device's depth sensors</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location helps us understand your project site</string>
```

Update `Podfile`:

```ruby
target 'YourApp' do
  pod 'react-native-vision-camera', path: '../node_modules/react-native-vision-camera'
  pod 'ARKit' # iOS 13+
end
```

### 3. Android Setup (ToF Support)

Add permissions to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-feature android:name="android.hardware.camera.ar" />
```

Update `build.gradle`:

```gradle
dependencies {
  implementation 'com.google.ar:core:1.43.0'
  implementation 'com.google.android.gms:play-services-vision:20.1.3'
}
```

### 4. API Integration

Send measurements to Kealee backend:

```typescript
// lib/measurement-api.ts
import { MeasurementResult } from '@kealee/mobile-measurement'

export async function saveMeasurement(
  result: MeasurementResult,
  projectId: string
) {
  const response = await fetch('/api/projects/{projectId}/measurements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      distance: result.distance,
      unit: result.unit,
      method: result.method,
      accuracy: result.accuracy,
      confidence: result.confidence,
      timestamp: result.timestamp,
      metadata: result.metadata,
    }),
  })

  return response.json()
}
```

## Usage Examples

### Basic Measurement

```typescript
import { measurementEngine, MeasurementCapture } from '@kealee/mobile-measurement'

export default function BasicMeasure() {
  const handleComplete = async (result) => {
    console.log(`Distance: ${result.distance}${result.unit}`)
    console.log(`Method: ${result.method}`)
    console.log(`Confidence: ${result.confidence}%`)

    // Convert to preferred unit
    const distanceInFeet = result.unit === 'mm' ? result.distance / 304.8 : result.distance
    console.log(`Distance: ${distanceInFeet.toFixed(2)} feet`)
  }

  return (
    <MeasurementCapture
      onMeasurementComplete={handleComplete}
      autoCalibrate={true}
    />
  )
}
```

### Advanced: Manual Engine Control

```typescript
import { measurementEngine } from '@kealee/mobile-measurement'

async function advancedMeasurement() {
  // Start session
  const session = await measurementEngine.startSession()
  console.log(`Device: ${session.deviceCapability.deviceModel}`)
  console.log(`Method: ${session.deviceCapability.recommendedMethod}`)

  // Manual calibration (for reference object method)
  const calibration = await measurementEngine.manualCalibrate(
    200, // 200 pixels
    85.6 // Credit card width (mm)
  )

  // Measure distance
  const result = await measurementEngine.measure(
    { x: 100, y: 200 },
    { x: 300, y: 200 }
  )

  console.log(`Distance: ${result.distance}mm ±${100 - result.confidence}%`)

  // End session
  const completedSession = await measurementEngine.endSession()
  console.log(`Measurements taken: ${completedSession.measurements.length}`)
}
```

### Handling Different Device Types

```typescript
import { measurementEngine } from '@kealee/mobile-measurement'

async function chooseOptimalMethod() {
  const capability = await measurementEngine.getCapability()

  if (capability.hasLiDAR) {
    console.log('🎯 Using LiDAR (±2-5mm)')
    // No calibration needed
  } else if (capability.hasToFSensor) {
    console.log('📹 Using ToF sensor (±5-10mm)')
    // May need calibration
  } else {
    console.log('📐 Using reference object (±5-10%)')
    // Requires calibration with credit card/ruler
  }

  console.log(`Available methods: ${capability.allAvailableMethods.join(', ')}`)
}
```

## Measurement Accuracy Guide

| Method | Accuracy | Devices | Setup Time |
|--------|----------|---------|-----------|
| LiDAR Direct | ±2-5mm | iPhone 12 Pro+ (15%) | Instant |
| ToF Sensor | ±5-10mm | High-end Android (8%) | Instant |
| Reference Object | ±5-10% | All phones (100%) | 10 seconds |
| AI Detection | ±10-20% | All phones (100%) | 5 seconds |
| Perspective Est. | ±10-20% | All phones (100%) | Instant |

## Testing

### Unit Tests

```bash
pnpm test
```

### Integration Testing

```typescript
// __tests__/measurement.integration.ts
import { measurementEngine } from '../src'

describe('MeasurementEngine', () => {
  it('should measure distance accurately with calibration', async () => {
    const session = await measurementEngine.startSession()
    
    // Calibrate with credit card (85.6mm wide)
    const calibration = measurementEngine.manualCalibrate(200, 85.6)
    
    // Measure 400 pixels = ~171.2mm
    const result = await measurementEngine.measure(
      { x: 0, y: 0 },
      { x: 400, y: 0 }
    )
    
    expect(result.distance).toBeCloseTo(171.2, -1)
    await measurementEngine.endSession()
  })
})
```

## Troubleshooting

### LiDAR Not Available

- Check iOS version (requires iOS 14.3+)
- Verify device model (iPhone 12 Pro+ / iPad Pro 2020+)
- Check camera permissions

### Reference Object Calibration Fails

- Ensure credit card/ruler is fully visible
- Improve lighting conditions
- Hold device steady for 2-3 seconds

### Low Confidence Measurements

- Move closer to object being measured
- Improve lighting
- Use LiDAR-capable device for better accuracy
- Consider AI auto-detection instead

## Performance

- LiDAR measurement: <100ms
- Reference object: 500-1000ms (includes calibration)
- AI detection: 1-2s (first run)

## Privacy & Security

- No measurement data stored on device
- All data transmitted encrypted to API
- No cloud processing of camera frames
- Reference object detection runs locally

## Future Enhancements

- [ ] 3D point cloud visualization
- [ ] Multi-point distance tracking
- [ ] Area/volume calculations
- [ ] Drawing annotations on measurements
- [ ] Batch measurement export
- [ ] AR overlay visualization
- [ ] Integration with project CAD files

## Support

For issues, feature requests, or questions:
- Check existing GitHub issues
- Create new issue with device model, OS version, and steps to reproduce
- Include measurement results for accuracy issues
