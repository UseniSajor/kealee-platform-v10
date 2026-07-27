/**
 * Reference Object Calibration Service
 * Uses known object sizes (credit cards, coins, rulers) for scale calibration
 */

import type {
  ReferenceObjectCalibration,
  DetectedObject,
  Point2D,
  CaptureFrame,
} from '../types'

// Standard reference object sizes (in millimeters)
const REFERENCE_OBJECT_SIZES = {
  credit_card: {
    width: 85.6,
    height: 53.98,
    name: 'Credit Card (standard)',
  },
  coin_penny: {
    diameter: 19.05,
    name: 'Penny',
  },
  coin_quarter: {
    diameter: 24.26,
    name: 'Quarter',
  },
  ruler: {
    unit: 25.4, // 1 inch in mm
    name: 'Standard Ruler',
  },
  door: {
    height: 2000, // Standard door height (2 meters)
    name: 'Standard Door',
  },
  hand: {
    palmWidth: 80, // Average adult palm width
    name: 'Hand Width',
  },
}

export class ReferenceObjectService {
  /**
   * Detect reference objects in frame using ML
   */
  async detectReferenceObjects(
    frame: CaptureFrame
  ): Promise<DetectedObject[]> {
    try {
      // This would use ML Kit or TensorFlow for detection
      // For now, return mock implementation
      return await this.detectObjectsWithML(frame)
    } catch (error) {
      console.error('[ReferenceObject] Detection failed:', error)
      return []
    }
  }

  /**
   * Calibrate scale from detected credit card
   */
  async calibrateFromCreditCard(
    frame: CaptureFrame,
    detectedCard: DetectedObject
  ): Promise<ReferenceObjectCalibration> {
    const cardSize = REFERENCE_OBJECT_SIZES.credit_card

    // Calculate pixels per mm
    const cardWidthInPixels = detectedCard.bounds.width
    const cardWidthInMM = cardSize.width
    const pixelsToCentimetersRatio = (cardWidthInMM / 10) / cardWidthInPixels

    return {
      objectType: 'credit_card',
      realWorldSize: cardSize.width,
      pixelSize: cardWidthInPixels,
      pixelsToCentimetersRatio,
      confidence: Math.min(detectedCard.confidence * 100, 95),
      bounds: {
        x1: detectedCard.bounds.x,
        y1: detectedCard.bounds.y,
        x2: detectedCard.bounds.x + detectedCard.bounds.width,
        y2: detectedCard.bounds.y + detectedCard.bounds.height,
      },
    }
  }

  /**
   * Calibrate scale from detected door frame (standard 2m height)
   */
  async calibrateFromDoor(
    frame: CaptureFrame,
    detectedDoor: DetectedObject
  ): Promise<ReferenceObjectCalibration> {
    const doorSize = REFERENCE_OBJECT_SIZES.door

    const doorHeightInPixels = detectedDoor.bounds.height
    const doorHeightInMM = doorSize.height
    const pixelsToCentimetersRatio = (doorHeightInMM / 10) / doorHeightInPixels

    return {
      objectType: 'door',
      realWorldSize: doorSize.height,
      pixelSize: doorHeightInPixels,
      pixelsToCentimetersRatio,
      confidence: Math.min(detectedDoor.confidence * 90, 85),
      bounds: {
        x1: detectedDoor.bounds.x,
        y1: detectedDoor.bounds.y,
        x2: detectedDoor.bounds.x + detectedDoor.bounds.width,
        y2: detectedDoor.bounds.y + detectedDoor.bounds.height,
      },
    }
  }

  /**
   * Manual calibration with custom reference object
   */
  manualCalibrate(
    pixelLength: number,
    realWorldLength: number, // in mm
    objectType: string = 'custom'
  ): ReferenceObjectCalibration {
    const pixelsToCentimetersRatio = (realWorldLength / 10) / pixelLength

    return {
      objectType: objectType as any,
      realWorldSize: realWorldLength,
      pixelSize: pixelLength,
      pixelsToCentimetersRatio,
      confidence: 80, // User calibration is ~80% confident
      bounds: { x1: 0, y1: 0, x2: pixelLength, y2: 0 },
    }
  }

  /**
   * Calculate distance using calibration
   */
  calculateDistance(
    point1: Point2D,
    point2: Point2D,
    calibration: ReferenceObjectCalibration
  ): number {
    const pixelDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    )

    // Convert pixels to centimeters, then to millimeters
    return pixelDistance * calibration.pixelsToCentimetersRatio * 10
  }

  /**
   * Validate calibration quality
   */
  validateCalibration(calibration: ReferenceObjectCalibration): {
    isValid: boolean
    confidence: number
    reason?: string
  } {
    if (calibration.confidence < 60) {
      return {
        isValid: false,
        confidence: calibration.confidence,
        reason: 'Confidence too low',
      }
    }

    if (calibration.pixelsToCentimetersRatio <= 0) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Invalid calibration ratio',
      }
    }

    if (calibration.pixelsToCentimetersRatio > 1) {
      return {
        isValid: false,
        confidence: 0,
        reason: 'Calibration ratio exceeds physical limits',
      }
    }

    return {
      isValid: true,
      confidence: calibration.confidence,
    }
  }

  /**
   * ML-based object detection (placeholder)
   * In production, use TensorFlow Lite or ML Kit
   */
  private async detectObjectsWithML(
    frame: CaptureFrame
  ): Promise<DetectedObject[]> {
    // This would integrate with:
    // - Google ML Kit Object Detection
    // - TensorFlow Lite
    // - Apple Vision framework (via native bridge)

    return [
      {
        type: 'credit_card',
        confidence: 0.85,
        bounds: { x: 100, y: 100, width: 200, height: 127 },
      },
      {
        type: 'door',
        confidence: 0.72,
        bounds: { x: 0, y: 0, width: 400, height: 1200 },
      },
    ]
  }

  /**
   * Get suggested reference objects in frame
   */
  suggestReferenceObjects(
    detectedObjects: DetectedObject[]
  ): DetectedObject[] {
    const supportedTypes = [
      'credit_card',
      'coin',
      'ruler',
      'door',
      'hand',
    ]

    return detectedObjects
      .filter((obj) => supportedTypes.includes(obj.type))
      .sort((a, b) => b.confidence - a.confidence)
  }
}

export const referenceObjectService = new ReferenceObjectService()
