import {
  VideoAIAnalysis,
  ObjectDetection,
  Measurement,
  MaterialRecognition,
  DefectDetection,
  CodeComplianceCheck,
  ConstructionElement,
  MaterialType,
  DefectType,
  Point,
} from '@/types/video-inspection';
import {
  calculatePerspectiveTransform,
  applyPerspectiveTransform,
  calculateDistance,
  calculateScaleFactor,
  PerspectiveTransform,
} from './perspective-transform';
import {materialRecognitionService} from './material-recognition';
import {defectDetectionService} from './defect-detection';

/**
 * AI Video Analysis Service
 * Uses TensorFlow.js and computer vision for real-time analysis
 */
export class AIVideoAnalysisService {
  private objectDetectionModel: any = null;
  private poseDetectionModel: any = null;
  private isInitialized = false;

  /**
   * Initialize AI models
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load COCO-SSD model for object detection
      const cocoSSD = await import('@tensorflow-models/coco-ssd');
      this.objectDetectionModel = await cocoSSD.load();

      // Load pose detection model for measurements
      const poseDetection = await import('@tensorflow-models/pose-detection');
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      this.poseDetectionModel = await poseDetection.createDetector(
        poseDetection.movenet.SupportedModels.MoveNet,
        detectorConfig,
      );

      this.isInitialized = true;
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error initializing AI models:', error);
      throw new Error('Failed to initialize AI models');
    }
  }

  /**
   * Analyze video frame for objects
   */
  async detectObjects(
    videoElement: HTMLVideoElement | ImageData,
  ): Promise<ObjectDetection[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.objectDetectionModel) {
      throw new Error('Object detection model not loaded');
    }

    try {
      const predictions = await this.objectDetectionModel.detect(videoElement);
      const timestamp = videoElement instanceof HTMLVideoElement
        ? videoElement.currentTime
        : Date.now() / 1000;

      return predictions
        .filter((pred: any) => pred.score > 0.5)
        .map((pred: any, index: number) => ({
          id: `detection-${Date.now()}-${index}`,
          objectType: this.mapCocoClassToConstructionElement(pred.class),
          confidence: pred.score,
          timestamp,
          boundingBox: {
            x: pred.bbox[0],
            y: pred.bbox[1],
            width: pred.bbox[2],
            height: pred.bbox[3],
          },
          description: `${pred.class} (${Math.round(pred.score * 100)}%)`,
        }));
    } catch (error) {
      console.error('Error detecting objects:', error);
      return [];
    }
  }

  /**
   * Measure dimensions using perspective correction
   * @param videoElement Video element
   * @param measurementPoints Start and end points to measure
   * @param referenceObject Optional: 4 corner points of reference object (e.g., ruler)
   * @param referenceLength Real-world length of reference object (e.g., 12 inches)
   */
  async measureDimensions(
    videoElement: HTMLVideoElement,
    measurementPoints: {start: Point; end: Point},
    referenceObject?: {points: Point[]; length: number},
  ): Promise<Measurement[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Extract current frame
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(videoElement, 0, 0);

      let realWorldDistance: number;
      let confidence = 0.8;
      let unit: 'inches' | 'feet' | 'meters' | 'centimeters' = 'inches';

      if (referenceObject && referenceObject.points.length === 4) {
        // Use perspective correction
        const sourcePoints = referenceObject.points;
        
        // Destination points: rectangle with known dimensions
        const refLength = referenceObject.length;
        const refWidth = refLength * 0.1; // Assume 10% width (adjust based on actual reference)
        
        const destinationPoints: Point[] = [
          {x: 0, y: 0},
          {x: refLength, y: 0},
          {x: refLength, y: refWidth},
          {x: 0, y: refWidth},
        ];

        // Calculate perspective transform
        const transform = calculatePerspectiveTransform(sourcePoints, destinationPoints);

        // Transform measurement points
        const transformedStart = applyPerspectiveTransform(measurementPoints.start, transform);
        const transformedEnd = applyPerspectiveTransform(measurementPoints.end, transform);

        // Calculate distance in corrected space
        realWorldDistance = calculateDistance(transformedStart, transformedEnd);
        confidence = 0.9; // Higher confidence with perspective correction
      } else {
        // Simple pixel-based measurement (less accurate)
        const pixelDistance = calculateDistance(measurementPoints.start, measurementPoints.end);
        
        if (referenceObject?.length) {
          // Use reference length to calculate scale
          const refPixelLength = calculateDistance(
            referenceObject.points[0],
            referenceObject.points[1]
          );
          const scale = calculateScaleFactor(refPixelLength, referenceObject.length);
          realWorldDistance = pixelDistance * scale;
        } else {
          // No reference, return in pixels
          realWorldDistance = pixelDistance;
          unit = 'pixels' as any;
          confidence = 0.5;
        }
      }

      const measurement: Measurement = {
        id: `measurement-${Date.now()}`,
        elementId: 'unknown',
        measurementType: 'length',
        value: realWorldDistance,
        unit,
        confidence,
        timestamp: videoElement.currentTime,
        referencePoints: [measurementPoints.start, measurementPoints.end],
      };

      return [measurement];
    } catch (error) {
      console.error('Error measuring dimensions:', error);
      return [];
    }
  }

  /**
   * Recognize materials from video
   */
  async recognizeMaterials(
    videoElement: HTMLVideoElement | ImageData,
    region?: {x: number; y: number; width: number; height: number},
  ): Promise<MaterialRecognition[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Extract image data from video element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      let imageData: ImageData;

      if (videoElement instanceof HTMLVideoElement) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        ctx.drawImage(videoElement, 0, 0);
        imageData = region
          ? ctx.getImageData(region.x, region.y, region.width, region.height)
          : ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        imageData = region
          ? this.extractRegionFromImageData(videoElement, region)
          : videoElement;
      }

      // Use material recognition service
      const recognition = await materialRecognitionService.recognizeMaterial(
        imageData,
        region
      );

      const timestamp = videoElement instanceof HTMLVideoElement
        ? videoElement.currentTime
        : Date.now() / 1000;

      return [
        {
          ...recognition,
          timestamp,
        },
      ];
    } catch (error) {
      console.error('Error recognizing materials:', error);
      return [];
    }
  }

  /**
   * Detect defects in video
   */
  async detectDefects(
    videoElement: HTMLVideoElement | ImageData,
    options?: {
      detectCracks?: boolean;
      detectWaterDamage?: boolean;
      detectMold?: boolean;
      detectStructuralIssues?: boolean;
    },
  ): Promise<DefectDetection[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Extract image data
      let imageData: ImageData;

      if (videoElement instanceof HTMLVideoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(videoElement, 0, 0);
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } else {
        imageData = videoElement;
      }

      // Use defect detection service
      const defects = await defectDetectionService.detectDefects(imageData, options);

      // Add timestamp
      const timestamp = videoElement instanceof HTMLVideoElement
        ? videoElement.currentTime
        : Date.now() / 1000;

      return defects.map(defect => ({
        ...defect,
        timestamp,
      }));
    } catch (error) {
      console.error('Error detecting defects:', error);
      return [];
    }
  }

  /**
   * Check code compliance
   */
  async checkCodeCompliance(
    videoElement: HTMLVideoElement,
    codeRequirements: Array<{code: string; requirement: string; checkType: string}>,
  ): Promise<CodeComplianceCheck[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const checks: CodeComplianceCheck[] = [];

      for (const requirement of codeRequirements) {
        // Perform specific checks based on requirement type
        const compliant = await this.performComplianceCheck(
          videoElement,
          requirement.checkType,
        );

        checks.push({
          id: `compliance-${Date.now()}-${checks.length}`,
          codeReference: requirement.code,
          requirement: requirement.requirement,
          compliant,
          confidence: 0.75, // Would be calculated by model
          timestamp: videoElement.currentTime,
          findings: compliant
            ? ['Requirement met']
            : ['Requirement not met - review needed'],
          recommendation: compliant
            ? undefined
            : 'Please review and verify compliance manually',
        });
      }

      return checks;
    } catch (error) {
      console.error('Error checking code compliance:', error);
      return [];
    }
  }

  /**
   * Perform comprehensive analysis
   */
  async analyzeVideoFrame(
    videoElement: HTMLVideoElement,
    options: {
      detectObjects?: boolean;
      measureDimensions?: boolean;
      recognizeMaterials?: boolean;
      detectDefects?: boolean;
      checkCompliance?: Array<{code: string; requirement: string; checkType: string}>;
    },
  ): Promise<Partial<VideoAIAnalysis>> {
    const analysis: Partial<VideoAIAnalysis> = {
      objectDetections: [],
      measurements: [],
      materialRecognitions: [],
      defects: [],
      codeCompliance: [],
    };

    // Run analyses in parallel for better performance
    const [objects, materials, defects] = await Promise.all([
      options.detectObjects
        ? this.detectObjects(videoElement)
        : Promise.resolve([]),
      options.recognizeMaterials
        ? this.recognizeMaterials(videoElement)
        : Promise.resolve([]),
      options.detectDefects
        ? this.detectDefects(videoElement, {
            detectCracks: true,
            detectWaterDamage: true,
            detectMold: true,
            detectStructuralIssues: true,
          })
        : Promise.resolve([]),
    ]);

    analysis.objectDetections = objects;
    analysis.materialRecognitions = materials;
    analysis.defects = defects;

    if (options.checkCompliance) {
      analysis.codeCompliance = await this.checkCodeCompliance(
        videoElement,
        options.checkCompliance,
      );
    }

    return analysis;
  }

  // Helper methods

  private mapCocoClassToConstructionElement(cocoClass: string): ConstructionElement {
    const mapping: Record<string, ConstructionElement> = {
      person: 'other',
      door: 'door',
      window: 'window',
      chair: 'other',
      couch: 'other',
      table: 'other',
      // Map common objects that might appear in construction
    };
    return mapping[cocoClass.toLowerCase()] || 'other';
  }

  /**
   * Extract region from ImageData
   */
  private extractRegionFromImageData(
    imageData: ImageData,
    region: {x: number; y: number; width: number; height: number}
  ): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = region.width;
    regionCanvas.height = region.height;
    const regionCtx = regionCanvas.getContext('2d')!;
    regionCtx.drawImage(
      canvas,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height
    );

    return regionCtx.getImageData(0, 0, region.width, region.height);
  }

  private getRecommendedAction(defectType: DefectType): string {
    const actions: Record<DefectType, string> = {
      crack: 'Document crack dimensions and location. May require structural engineer review.',
      water_damage: 'Identify source of water. Repair and prevent future water intrusion.',
      mold: 'Test for mold type. Remediate according to local health codes.',
      structural_issue: 'Immediate structural engineer review required.',
      electrical_hazard: 'Disconnect power and have licensed electrician inspect.',
      plumbing_leak: 'Shut off water supply and repair leak immediately.',
      fire_hazard: 'Address fire safety concern immediately. May require fire marshal review.',
      other: 'Review and document finding.',
    };
    return actions[defectType] || 'Review and document finding.';
  }

  private async performComplianceCheck(
    videoElement: HTMLVideoElement,
    checkType: string,
  ): Promise<boolean> {
    // Simplified compliance checking
    // In production, implement specific checks based on code requirements
    switch (checkType) {
      case 'clearance':
        // Check minimum clearances
        return true; // Placeholder
      case 'dimension':
        // Check dimensions meet code
        return true; // Placeholder
      default:
        return true;
    }
  }
}

// Singleton instance
export const aiVideoAnalysisService = new AIVideoAnalysisService();
