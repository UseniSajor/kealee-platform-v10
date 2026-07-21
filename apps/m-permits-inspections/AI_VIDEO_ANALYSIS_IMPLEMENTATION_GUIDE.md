# AI Video Analysis Implementation Guide

## Overview

This guide explains how to build and implement the AI video analysis features for construction inspection:
1. Real-time object detection for construction elements
2. Dimension measurement using perspective correction
3. Material recognition from video
4. Defect detection and highlighting

---

## 1. Real-Time Object Detection for Construction Elements

### Approach

**Option A: Pre-trained Models (Quick Start)**
- Use COCO-SSD or YOLO models trained on general objects
- Fine-tune on construction-specific datasets
- Fast to implement, moderate accuracy

**Option B: Custom Training (Best Accuracy)**
- Train YOLOv8 or Detectron2 on construction datasets
- Higher accuracy for construction-specific elements
- Requires dataset collection and training

### Implementation Steps

#### Step 1: Choose Model Framework

```typescript
// Using TensorFlow.js with COCO-SSD (already implemented)
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Or use YOLOv8 (better for custom training)
import {YOLOv8} from '@tensorflow-models/yolo';
```

#### Step 2: Load and Initialize Model

```typescript
// Enhanced version with custom construction classes
class ConstructionObjectDetector {
  private model: any;
  private constructionClasses = [
    'wall', 'beam', 'column', 'door', 'window',
    'electrical_outlet', 'plumbing_fixture', 'hvac_duct',
    'stair', 'railing', 'concrete', 'steel', 'wood'
  ];

  async initialize() {
    // Load base COCO-SSD model
    this.model = await cocoSsd.load({
      base: 'mobilenet_v2', // or 'lite_mobilenet_v2' for mobile
    });
    
    // Optionally load custom fine-tuned model
    // this.model = await tf.loadLayersModel('/models/construction-detector/model.json');
  }

  async detect(videoElement: HTMLVideoElement): Promise<ObjectDetection[]> {
    const predictions = await this.model.detect(videoElement);
    
    // Filter and map to construction elements
    return predictions
      .filter(pred => pred.score > 0.5)
      .map(pred => ({
        id: `detection-${Date.now()}`,
        objectType: this.mapToConstructionElement(pred.class),
        confidence: pred.score,
        timestamp: videoElement.currentTime,
        boundingBox: {
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3],
        },
      }));
  }

  private mapToConstructionElement(cocoClass: string): ConstructionElement {
    // Enhanced mapping with construction-specific logic
    const mapping: Record<string, ConstructionElement> = {
      'person': 'other', // Could be inspector/contractor
      'door': 'door',
      'window': 'window',
      'chair': 'other',
      'couch': 'other',
      // Add more mappings
    };
    
    // Use ML to classify if not in mapping
    return mapping[cocoClass.toLowerCase()] || 'other';
  }
}
```

#### Step 3: Real-Time Processing

```typescript
// Process video frames in real-time
class RealTimeObjectDetection {
  private detector: ConstructionObjectDetector;
  private isProcessing = false;
  private frameInterval = 2000; // Analyze every 2 seconds

  async processVideoStream(videoElement: HTMLVideoElement) {
    const interval = setInterval(async () => {
      if (!this.isProcessing && videoElement.readyState === 4) {
        this.isProcessing = true;
        const detections = await this.detector.detect(videoElement);
        this.onDetections(detections);
        this.isProcessing = false;
      }
    }, this.frameInterval);
  }

  private onDetections(detections: ObjectDetection[]) {
    // Update UI with detections
    // Draw bounding boxes on canvas overlay
    // Store for report generation
  }
}
```

### Custom Training (Advanced)

If you need better accuracy for construction elements:

1. **Collect Dataset**
   - Images of walls, beams, columns, etc.
   - Label with bounding boxes (use LabelImg or CVAT)
   - Need 1000+ images per class for good results

2. **Train Model**
   ```python
   # Using YOLOv8 (recommended)
   from ultralytics import YOLO
   
   model = YOLO('yolov8n.pt')  # Start with nano for speed
   
   # Train on construction dataset
   results = model.train(
       data='construction-dataset.yaml',
       epochs=100,
       imgsz=640,
       batch=16
   )
   
   # Export to TensorFlow.js
   model.export(format='tfjs')
   ```

3. **Deploy**
   - Convert to TensorFlow.js format
   - Load in browser/mobile app
   - Use for real-time detection

---

## 2. Dimension Measurement Using Perspective Correction

### Approach

**Method: Reference Object + Perspective Transform**
- Use a known reference object (e.g., 12" ruler, standard door)
- Calculate perspective transform matrix
- Measure distances in corrected perspective

### Implementation

#### Step 1: Perspective Correction Algorithm

```typescript
class DimensionMeasurement {
  /**
   * Measure dimensions using perspective correction
   * @param videoElement Video element
   * @param referencePoints 4 points of reference object (e.g., ruler)
   * @param referenceLength Real-world length of reference (e.g., 12 inches)
   * @param measurementPoints Start and end points to measure
   */
  async measure(
    videoElement: HTMLVideoElement,
    referencePoints: Point[],
    referenceLength: number,
    measurementPoints: {start: Point; end: Point}
  ): Promise<Measurement> {
    // 1. Extract frame
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(videoElement, 0, 0);

    // 2. Calculate perspective transform
    const transform = this.calculatePerspectiveTransform(
      referencePoints,
      this.getReferenceCorners(referenceLength)
    );

    // 3. Transform measurement points
    const transformedStart = this.applyTransform(measurementPoints.start, transform);
    const transformedEnd = this.applyTransform(measurementPoints.end, transform);

    // 4. Calculate distance in corrected space
    const pixelDistance = Math.sqrt(
      Math.pow(transformedEnd.x - transformedStart.x, 2) +
      Math.pow(transformedEnd.y - transformedStart.y, 2)
    );

    // 5. Convert to real-world units
    const realWorldDistance = (pixelDistance / this.getReferencePixelLength(referencePoints)) * referenceLength;

    return {
      id: `measurement-${Date.now()}`,
      elementId: 'unknown',
      measurementType: 'length',
      value: realWorldDistance,
      unit: 'inches',
      confidence: 0.85, // Based on reference object clarity
      timestamp: videoElement.currentTime,
      referencePoints: [measurementPoints.start, measurementPoints.end],
    };
  }

  /**
   * Calculate perspective transform matrix using 4-point correspondence
   */
  private calculatePerspectiveTransform(
    sourcePoints: Point[],
    destinationPoints: Point[]
  ): number[][] {
    // Using OpenCV's getPerspectiveTransform algorithm
    // Simplified version - in production use cv.getPerspectiveTransform
    
    // This is a 3x3 transformation matrix
    // For full implementation, use a library like opencv.js or perspective-transform
    
    // For now, return identity matrix (would need full implementation)
    return [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1]
    ];
  }

  /**
   * Apply perspective transform to a point
   */
  private applyTransform(point: Point, transform: number[][]): Point {
    const [x, y] = [point.x, point.y];
    const w = transform[2][0] * x + transform[2][1] * y + transform[2][2];
    
    return {
      x: (transform[0][0] * x + transform[0][1] * y + transform[0][2]) / w,
      y: (transform[1][0] * x + transform[1][1] * y + transform[1][2]) / w,
    };
  }

  private getReferenceCorners(length: number): Point[] {
    // Return corners of reference object in real-world coordinates
    // For a 12" ruler, this would be a rectangle
    return [
      {x: 0, y: 0},
      {x: length, y: 0},
      {x: length, y: 1}, // Assuming 1" width
      {x: 0, y: 1},
    ];
  }

  private getReferencePixelLength(points: Point[]): number {
    // Calculate pixel length of reference object
    const [p1, p2] = points;
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
}
```

#### Step 2: AR Overlay for Measurement

```typescript
// Use AR.js or 8th Wall for AR measurement overlay
class ARMeasurementOverlay {
  /**
   * Display AR ruler overlay for measurement
   */
  displayRulerOverlay(videoElement: HTMLVideoElement) {
    // 1. Detect reference object (ruler, door frame, etc.)
    // 2. Calculate scale
    // 3. Overlay measurement grid
    // 4. Allow user to select measurement points
  }

  /**
   * Interactive measurement tool
   */
  enableMeasurementTool() {
    // User clicks two points on video
    // System calculates distance using perspective correction
    // Display measurement on overlay
  }
}
```

#### Step 3: Using Libraries

**Option 1: OpenCV.js**
```bash
npm install opencv-js
```

```typescript
import cv from 'opencv-js';

// Calculate perspective transform
const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [/* points */]);
const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [/* points */]);
const transform = cv.getPerspectiveTransform(srcPoints, dstPoints);
```

**Option 2: Perspective Transform Library**
```bash
npm install perspective-transform
```

```typescript
import PerspectiveTransform from 'perspective-transform';

const pt = PerspectiveTransform(
  [x1, y1, x2, y2, x3, y3, x4, y4], // Source
  [0, 0, width, 0, width, height, 0, height] // Destination
);

const [x, y] = pt.transform(x, y);
```

---

## 3. Material Recognition from Video

### Approach

**Method 1: Color + Texture Analysis (Quick)**
- Analyze color histograms
- Texture analysis (GLCM, LBP)
- Simple heuristics

**Method 2: Deep Learning (Accurate)**
- Train CNN on material images
- Use pre-trained models (MaterialNet, Places365)
- Fine-tune for construction materials

### Implementation

#### Step 1: Color and Texture Analysis

```typescript
class MaterialRecognition {
  /**
   * Recognize material from video frame region
   */
  async recognizeMaterial(
    imageData: ImageData,
    region?: {x: number; y: number; width: number; height: number}
  ): Promise<MaterialRecognition> {
    // Extract region
    const regionData = region
      ? this.extractRegion(imageData, region)
      : imageData;

    // 1. Color analysis
    const colorFeatures = this.analyzeColor(regionData);
    
    // 2. Texture analysis
    const textureFeatures = this.analyzeTexture(regionData);
    
    // 3. Classify material
    const materialType = this.classifyMaterial(colorFeatures, textureFeatures);
    const confidence = this.calculateConfidence(colorFeatures, textureFeatures);

    return {
      id: `material-${Date.now()}`,
      materialType,
      confidence,
      timestamp: Date.now() / 1000,
      boundingBox: region || {
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      },
    };
  }

  private analyzeColor(imageData: ImageData): ColorFeatures {
    const data = imageData.data;
    let r = 0, g = 0, b = 0;
    let rVariance = 0, gVariance = 0, bVariance = 0;
    const pixelCount = data.length / 4;

    // Calculate mean
    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }
    r /= pixelCount;
    g /= pixelCount;
    b /= pixelCount;

    // Calculate variance
    for (let i = 0; i < data.length; i += 4) {
      rVariance += Math.pow(data[i] - r, 2);
      gVariance += Math.pow(data[i + 1] - g, 2);
      bVariance += Math.pow(data[i + 2] - b, 2);
    }
    rVariance /= pixelCount;
    gVariance /= pixelCount;
    bVariance /= pixelCount;

    return {
      mean: {r, g, b},
      variance: {r: rVariance, g: gVariance, b: bVariance},
      histogram: this.calculateHistogram(imageData),
    };
  }

  private analyzeTexture(imageData: ImageData): TextureFeatures {
    // Gray-level Co-occurrence Matrix (GLCM) features
    const glcm = this.calculateGLCM(imageData);
    
    return {
      contrast: this.calculateContrast(glcm),
      homogeneity: this.calculateHomogeneity(glcm),
      energy: this.calculateEnergy(glcm),
      entropy: this.calculateEntropy(glcm),
    };
  }

  private classifyMaterial(
    color: ColorFeatures,
    texture: TextureFeatures
  ): MaterialType {
    // Rule-based classification (can be replaced with ML model)
    const {r, g, b} = color.mean;
    
    // Concrete: Light gray, high variance
    if (r > 200 && g > 200 && b > 200 && color.variance.r > 500) {
      return 'concrete';
    }
    
    // Steel: Dark gray/black, low variance
    if (r < 100 && g < 100 && b < 100 && color.variance.r < 200) {
      return 'steel';
    }
    
    // Wood: Brown tones, medium variance
    if (r > 100 && r < 200 && g > 80 && g < 150 && b > 50 && b < 120) {
      return 'wood';
    }
    
    // Use texture features for more accuracy
    if (texture.contrast > 0.5 && texture.energy < 0.3) {
      return 'drywall';
    }
    
    return 'other';
  }

  private calculateGLCM(imageData: ImageData): number[][] {
    // Simplified GLCM calculation
    // Full implementation would calculate co-occurrence matrix
    const size = 256;
    const glcm: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    
    // Convert to grayscale and calculate co-occurrences
    // (Full implementation needed)
    
    return glcm;
  }
}
```

#### Step 2: Deep Learning Approach (Better Accuracy)

```typescript
// Using TensorFlow.js with custom trained model
class MaterialRecognitionML {
  private model: tf.LayersModel;

  async initialize() {
    // Load pre-trained material recognition model
    this.model = await tf.loadLayersModel('/models/material-recognition/model.json');
  }

  async recognizeMaterial(imageData: ImageData): Promise<MaterialRecognition> {
    // Preprocess image
    const tensor = this.preprocessImage(imageData);
    
    // Run inference
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const probabilities = await prediction.data();
    
    // Get top prediction
    const materialTypes: MaterialType[] = [
      'concrete', 'steel', 'wood', 'drywall',
      'insulation', 'electrical_wire', 'plumbing_pipe', 'other'
    ];
    
    const maxIndex = probabilities.indexOf(Math.max(...probabilities));
    const materialType = materialTypes[maxIndex];
    const confidence = probabilities[maxIndex];

    return {
      id: `material-${Date.now()}`,
      materialType,
      confidence,
      timestamp: Date.now() / 1000,
      boundingBox: {
        x: 0,
        y: 0,
        width: imageData.width,
        height: imageData.height,
      },
    };
  }

  private preprocessImage(imageData: ImageData): tf.Tensor {
    // Resize to model input size (e.g., 224x224)
    // Normalize pixel values
    // Convert to tensor
    return tf.browser.fromPixels(imageData)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .div(255.0);
  }
}
```

#### Step 3: Training Material Recognition Model

```python
# Using TensorFlow/Keras
import tensorflow as tf
from tensorflow import keras

# Load dataset
train_ds = keras.utils.image_dataset_from_directory(
    'construction-materials-dataset',
    image_size=(224, 224),
    batch_size=32,
    validation_split=0.2,
    subset='training',
    seed=123
)

# Use transfer learning
base_model = keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)

base_model.trainable = False

model = keras.Sequential([
    base_model,
    keras.layers.GlobalAveragePooling2D(),
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(8, activation='softmax')  # 8 material types
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Train
model.fit(train_ds, epochs=10)

# Export to TensorFlow.js
tfjs.converters.save_keras_model(model, 'models/material-recognition')
```

---

## 4. Defect Detection and Highlighting

### Approach

**Method 1: Object Detection for Defects**
- Train YOLO/SSD on defect images (cracks, water damage, etc.)
- Detect and classify defects in real-time

**Method 2: Segmentation**
- Use U-Net or DeepLab for pixel-level defect segmentation
- More precise but slower

**Method 3: Anomaly Detection**
- Train autoencoder on normal construction
- Detect anomalies (defects) as outliers

### Implementation

#### Step 1: Defect Detection with Object Detection

```typescript
class DefectDetector {
  private model: any;
  private defectTypes: DefectType[] = [
    'crack', 'water_damage', 'mold', 'structural_issue',
    'electrical_hazard', 'plumbing_leak', 'fire_hazard'
  ];

  async initialize() {
    // Load custom-trained defect detection model
    // Or use general object detection and filter for defects
    this.model = await cocoSsd.load();
    
    // Better: Load custom YOLOv8 model trained on defects
    // this.model = await tf.loadLayersModel('/models/defect-detector/model.json');
  }

  async detectDefects(
    videoElement: HTMLVideoElement
  ): Promise<DefectDetection[]> {
    // 1. Detect objects
    const detections = await this.model.detect(videoElement);
    
    // 2. Filter for defect-like objects
    const defectCandidates = detections.filter(d => 
      this.isDefectCandidate(d.class, d.score)
    );
    
    // 3. Classify defect type
    const defects: DefectDetection[] = [];
    for (const candidate of defectCandidates) {
      const defectType = await this.classifyDefectType(
        videoElement,
        candidate.bbox
      );
      
      defects.push({
        id: `defect-${Date.now()}-${defects.length}`,
        defectType,
        severity: this.calculateSeverity(defectType, candidate.score),
        confidence: candidate.score,
        timestamp: videoElement.currentTime,
        boundingBox: {
          x: candidate.bbox[0],
          y: candidate.bbox[1],
          width: candidate.bbox[2],
          height: candidate.bbox[3],
        },
        description: `Detected ${defectType}`,
        recommendedAction: this.getRecommendedAction(defectType),
      });
    }
    
    return defects;
  }

  private isDefectCandidate(className: string, confidence: number): boolean {
    // Heuristics for defect detection
    const defectKeywords = ['crack', 'stain', 'damage', 'leak', 'mold'];
    return defectKeywords.some(keyword => 
      className.toLowerCase().includes(keyword)
    ) && confidence > 0.6;
  }

  private async classifyDefectType(
    videoElement: HTMLVideoElement,
    bbox: number[]
  ): Promise<DefectType> {
    // Extract region
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);
    
    const imageData = ctx.getImageData(bbox[0], bbox[1], bbox[2], bbox[3]);
    
    // Analyze region for defect characteristics
    // Use color, texture, shape analysis
    const features = this.extractDefectFeatures(imageData);
    
    // Classify using rules or ML model
    return this.classifyFromFeatures(features);
  }

  private extractDefectFeatures(imageData: ImageData): DefectFeatures {
    // Extract features that help identify defect type
    return {
      colorVariance: this.calculateColorVariance(imageData),
      edgeDensity: this.calculateEdgeDensity(imageData),
      texturePattern: this.analyzeTexturePattern(imageData),
    };
  }

  private classifyFromFeatures(features: DefectFeatures): DefectType {
    // Rule-based or ML-based classification
    // Cracks: High edge density, linear patterns
    if (features.edgeDensity > 0.3 && features.texturePattern === 'linear') {
      return 'crack';
    }
    
    // Water damage: Dark stains, high color variance
    if (features.colorVariance > 500 && this.isDarkStain(imageData)) {
      return 'water_damage';
    }
    
    // Mold: Green/brown patches
    if (this.hasMoldColors(imageData)) {
      return 'mold';
    }
    
    return 'other';
  }

  private calculateSeverity(
    defectType: DefectType,
    confidence: number
  ): 'minor' | 'major' | 'critical' {
    // Severity rules
    const severityMap: Record<DefectType, 'minor' | 'major' | 'critical'> = {
      crack: confidence > 0.8 ? 'critical' : confidence > 0.6 ? 'major' : 'minor',
      water_damage: 'major',
      mold: 'major',
      structural_issue: 'critical',
      electrical_hazard: 'critical',
      plumbing_leak: 'major',
      fire_hazard: 'critical',
      other: 'minor',
    };
    
    return severityMap[defectType] || 'minor';
  }
}
```

#### Step 2: Visual Highlighting

```typescript
class DefectHighlighter {
  /**
   * Draw defect highlights on canvas overlay
   */
  highlightDefects(
    canvas: HTMLCanvasElement,
    defects: DefectDetection[],
    videoElement: HTMLVideoElement
  ) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const defect of defects) {
      const {x, y, width, height} = defect.boundingBox;
      
      // Choose color based on severity
      const color = this.getSeverityColor(defect.severity);
      
      // Draw bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, width, height);
      
      // Draw label
      ctx.fillStyle = color;
      ctx.font = '16px Arial';
      ctx.fillText(
        `${defect.defectType} (${Math.round(defect.confidence * 100)}%)`,
        x,
        y - 5
      );
      
      // Draw severity indicator
      this.drawSeverityIndicator(ctx, x + width - 20, y, defect.severity);
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ef4444'; // Red
      case 'major': return '#f59e0b'; // Orange
      case 'minor': return '#eab308'; // Yellow
      default: return '#64748b'; // Gray
    }
  }

  private drawSeverityIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    severity: string
  ) {
    ctx.fillStyle = this.getSeverityColor(severity);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

#### Step 3: Training Defect Detection Model

```python
# Collect defect dataset
# - Cracks: 500+ images
# - Water damage: 500+ images
# - Mold: 300+ images
# - Other defects: 200+ images each

# Train YOLOv8
from ultralytics import YOLO

model = YOLO('yolov8n.pt')

# Train
results = model.train(
    data='defects-dataset.yaml',
    epochs=100,
    imgsz=640,
    batch=16,
    name='defect-detector'
)

# Export to TensorFlow.js
model.export(format='tfjs')
```

---

## Integration with Existing System

### Complete Integration Example

```typescript
// Enhanced AI Video Analysis Service
export class EnhancedAIVideoAnalysisService extends AIVideoAnalysisService {
  private objectDetector: ConstructionObjectDetector;
  private materialRecognizer: MaterialRecognitionML;
  private defectDetector: DefectDetector;
  private dimensionMeasurer: DimensionMeasurement;

  async initialize() {
    await super.initialize();
    
    // Initialize specialized models
    this.objectDetector = new ConstructionObjectDetector();
    await this.objectDetector.initialize();
    
    this.materialRecognizer = new MaterialRecognitionML();
    await this.materialRecognizer.initialize();
    
    this.defectDetector = new DefectDetector();
    await this.defectDetector.initialize();
    
    this.dimensionMeasurer = new DimensionMeasurement();
  }

  async analyzeVideoFrame(
    videoElement: HTMLVideoElement,
    options: AnalysisOptions
  ): Promise<VideoAIAnalysis> {
    const analysis: Partial<VideoAIAnalysis> = {};

    // Parallel processing for performance
    const [objects, materials, defects, measurements] = await Promise.all([
      options.detectObjects
        ? this.objectDetector.detect(videoElement)
        : Promise.resolve([]),
      options.recognizeMaterials
        ? this.recognizeMaterials(videoElement)
        : Promise.resolve([]),
      options.detectDefects
        ? this.defectDetector.detectDefects(videoElement)
        : Promise.resolve([]),
      options.measureDimensions && options.referenceObject
        ? this.dimensionMeasurer.measure(
            videoElement,
            options.referenceObject.points,
            options.referenceObject.length,
            options.measurementPoints
          )
        : Promise.resolve([]),
    ]);

    return {
      objectDetections: objects,
      materialRecognitions: materials,
      defects,
      measurements,
      codeCompliance: options.checkCompliance
        ? await this.checkCodeCompliance(videoElement, options.codeRequirements)
        : [],
    };
  }
}
```

---

## Performance Optimization

1. **Model Quantization**: Use quantized models for faster inference
2. **Frame Skipping**: Analyze every N frames, not every frame
3. **Region of Interest**: Only analyze relevant regions
4. **Web Workers**: Run AI processing in background threads
5. **Model Caching**: Cache model predictions for similar frames

---

## Next Steps

1. **Collect Datasets**: Gather construction images for training
2. **Train Models**: Use YOLOv8, TensorFlow, or PyTorch
3. **Convert to TensorFlow.js**: Deploy models to browser/mobile
4. **Fine-tune**: Improve accuracy on your specific use cases
5. **Integrate**: Add to existing video inspection system

---

## Resources

- **YOLOv8**: https://github.com/ultralytics/ultralytics
- **TensorFlow.js**: https://www.tensorflow.org/js
- **OpenCV.js**: https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html
- **COCO Dataset**: https://cocodataset.org/
- **Construction Datasets**: Search for "construction defect dataset" on Kaggle
