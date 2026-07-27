/**
 * Kealee Mobile Measurement Package
 * Hybrid LiDAR, ToF, reference object, and AI-based measurement system
 *
 * @example
 * ```typescript
 * import { MeasurementCapture, measurementEngine } from '@kealee/mobile-measurement'
 *
 * export default function MeasureScreen() {
 *   return (
 *     <MeasurementCapture
 *       autoCalibrate={true}
 *       onMeasurementComplete={(result) => console.log(result)}
 *     />
 *   )
 * }
 * ```
 */

// Types
export type {
  Point2D,
  Point3D,
  MeasurementResult,
  MeasurementMethod,
  DeviceCapability,
  DepthFrame,
  ReferenceObjectCalibration,
  DetectedObject,
  MeasurementSession,
  CalibrationRequest,
  CaptureFrame,
} from './types'

// Services
export { measurementEngine } from './services/MeasurementEngine'
export { referenceObjectService } from './services/ReferenceObjectService'
export { nativeLiDARBridge } from './native/NativeLiDARBridge'

// Components
export { MeasurementCapture } from './components/MeasurementCapture'

// Classes
export { MeasurementEngine } from './services/MeasurementEngine'
export { ReferenceObjectService } from './services/ReferenceObjectService'
