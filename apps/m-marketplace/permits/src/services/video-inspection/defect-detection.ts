/**
 * Defect Detection Service
 * Detects and classifies construction defects in video frames
 */

import {DefectType, DefectDetection, BoundingBox} from '@permits/src/types/video-inspection';

export interface DefectFeatures {
  colorVariance: number;
  edgeDensity: number;
  texturePattern: 'linear' | 'circular' | 'irregular' | 'smooth';
  darkness: number;
  contrast: number;
}

export class DefectDetectionService {
  /**
   * Detect defects in video frame
   */
  async detectDefects(
    imageData: ImageData,
    options: {
      detectCracks?: boolean;
      detectWaterDamage?: boolean;
      detectMold?: boolean;
      detectStructuralIssues?: boolean;
      minConfidence?: number;
    } = {}
  ): Promise<DefectDetection[]> {
    const {
      detectCracks = true,
      detectWaterDamage = true,
      detectMold = true,
      detectStructuralIssues = true,
      minConfidence = 0.6,
    } = options;

    const defects: DefectDetection[] = [];

    // Convert to grayscale for analysis
    const grayscale = this.toGrayscale(imageData);

    // Detect cracks
    if (detectCracks) {
      const cracks = await this.detectCracks(imageData, grayscale);
      defects.push(...cracks.filter(d => d.confidence >= minConfidence));
    }

    // Detect water damage
    if (detectWaterDamage) {
      const waterDamage = await this.detectWaterDamage(imageData, grayscale);
      defects.push(...waterDamage.filter(d => d.confidence >= minConfidence));
    }

    // Detect mold
    if (detectMold) {
      const mold = await this.detectMold(imageData);
      defects.push(...mold.filter(d => d.confidence >= minConfidence));
    }

    // Detect structural issues
    if (detectStructuralIssues) {
      const structural = await this.detectStructuralIssues(imageData, grayscale);
      defects.push(...structural.filter(d => d.confidence >= minConfidence));
    }

    return defects;
  }

  /**
   * Detect cracks in construction materials
   */
  private async detectCracks(
    imageData: ImageData,
    grayscale: number[]
  ): Promise<DefectDetection[]> {
    const defects: DefectDetection[] = [];
    const width = imageData.width;
    const height = imageData.height;

    // Use edge detection to find linear patterns (cracks)
    const edges = this.detectEdges(grayscale, width, height);
    const crackRegions = this.findLinearRegions(edges, width, height);

    for (const region of crackRegions) {
      const features = this.extractDefectFeatures(imageData, region);
      
      // Cracks are typically: high edge density, linear pattern, dark
      if (
        features.edgeDensity > 0.3 &&
        features.texturePattern === 'linear' &&
        features.darkness > 0.6
      ) {
        const confidence = this.calculateCrackConfidence(features);
        
        defects.push({
          id: `crack-${Date.now()}-${defects.length}`,
          defectType: 'crack',
          severity: this.calculateSeverity('crack', confidence, region),
          confidence,
          timestamp: Date.now() / 1000,
          boundingBox: region,
          description: `Crack detected: ${this.describeCrack(region, features)}`,
          recommendedAction: this.getRecommendedAction('crack'),
        });
      }
    }

    return defects;
  }

  /**
   * Detect water damage (stains, discoloration)
   */
  private async detectWaterDamage(
    imageData: ImageData,
    grayscale: number[]
  ): Promise<DefectDetection[]> {
    const defects: DefectDetection[] = [];
    const width = imageData.width;
    const height = imageData.height;

    // Water damage typically shows as dark stains with irregular shapes
    const darkRegions = this.findDarkRegions(grayscale, width, height, 0.4);

    for (const region of darkRegions) {
      const features = this.extractDefectFeatures(imageData, region);
      
      // Water damage: dark, irregular shape, high color variance
      if (
        features.darkness > 0.5 &&
        features.texturePattern === 'irregular' &&
        features.colorVariance > 400
      ) {
        const confidence = this.calculateWaterDamageConfidence(features);
        
        defects.push({
          id: `water-damage-${Date.now()}-${defects.length}`,
          defectType: 'water_damage',
          severity: this.calculateSeverity('water_damage', confidence, region),
          confidence,
          timestamp: Date.now() / 1000,
          boundingBox: region,
          description: 'Water damage detected: dark staining and discoloration',
          recommendedAction: this.getRecommendedAction('water_damage'),
        });
      }
    }

    return defects;
  }

  /**
   * Detect mold (green/brown patches)
   */
  private async detectMold(imageData: ImageData): Promise<DefectDetection[]> {
    const defects: DefectDetection[] = [];
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Mold typically has green or brown coloration
    const moldRegions: BoundingBox[] = [];

    // Scan for mold-colored regions
    for (let y = 0; y < height - 20; y += 10) {
      for (let x = 0; x < width - 20; x += 10) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Mold colors: green (50-150, 100-200, 50-150) or brown (100-150, 80-120, 50-100)
        const isGreenMold = g > r && g > b && g > 100 && g < 200 && r < 150 && b < 150;
        const isBrownMold = r > 100 && r < 150 && g > 80 && g < 120 && b > 50 && b < 100;

        if (isGreenMold || isBrownMold) {
          // Check surrounding area
          const region = this.growRegion(imageData, {x, y}, 20, 20);
          if (region) {
            moldRegions.push(region);
          }
        }
      }
    }

    // Merge overlapping regions
    const mergedRegions = this.mergeOverlappingRegions(moldRegions);

    for (const region of mergedRegions) {
      const features = this.extractDefectFeatures(imageData, region);
      const confidence = this.calculateMoldConfidence(features, imageData, region);
      
      if (confidence > 0.6) {
        defects.push({
          id: `mold-${Date.now()}-${defects.length}`,
          defectType: 'mold',
          severity: this.calculateSeverity('mold', confidence, region),
          confidence,
          timestamp: Date.now() / 1000,
          boundingBox: region,
          description: 'Mold growth detected: green/brown discoloration',
          recommendedAction: this.getRecommendedAction('mold'),
        });
      }
    }

    return defects;
  }

  /**
   * Detect structural issues (misalignment, damage)
   */
  private async detectStructuralIssues(
    imageData: ImageData,
    grayscale: number[]
  ): Promise<DefectDetection[]> {
    const defects: DefectDetection[] = [];
    const width = imageData.width;
    const height = imageData.height;

    // Structural issues: significant deviations from expected patterns
    // Look for unusual shapes, misalignments, or damage patterns

    // Detect unusual edge patterns
    const edges = this.detectEdges(grayscale, width, height);
    const unusualRegions = this.findUnusualPatterns(edges, width, height);

    for (const region of unusualRegions) {
      const features = this.extractDefectFeatures(imageData, region);
      
      // Structural issues: high contrast, irregular patterns
      if (features.contrast > 0.4 && features.texturePattern === 'irregular') {
        const confidence = this.calculateStructuralConfidence(features);
        
        defects.push({
          id: `structural-${Date.now()}-${defects.length}`,
          defectType: 'structural_issue',
          severity: 'critical', // Structural issues are always critical
          confidence,
          timestamp: Date.now() / 1000,
          boundingBox: region,
          description: 'Potential structural issue detected',
          recommendedAction: this.getRecommendedAction('structural_issue'),
        });
      }
    }

    return defects;
  }

  /**
   * Extract defect features from region
   */
  private extractDefectFeatures(
    imageData: ImageData,
    region: BoundingBox
  ): DefectFeatures {
    const regionData = this.extractRegion(imageData, region);
    const data = regionData.data;
    const pixelCount = data.length / 4;

    // Calculate color variance
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const rMean = rSum / pixelCount;
    const gMean = gSum / pixelCount;
    const bMean = bSum / pixelCount;

    let rVar = 0, gVar = 0, bVar = 0;
    for (let i = 0; i < data.length; i += 4) {
      rVar += Math.pow(data[i] - rMean, 2);
      gVar += Math.pow(data[i + 1] - gMean, 2);
      bVar += Math.pow(data[i + 2] - bMean, 2);
    }

    const colorVariance = (rVar + gVar + bVar) / (3 * pixelCount);

    // Calculate darkness (inverse of brightness)
    const brightness = (rMean + gMean + bMean) / 3;
    const darkness = 1 - (brightness / 255);

    // Calculate edge density
    const grayscale = this.toGrayscale(regionData);
    const edgeDensity = this.calculateEdgeDensity(grayscale, region.width, region.height);

    // Determine texture pattern
    const texturePattern = this.analyzeTexturePattern(grayscale, region.width, region.height);

    // Calculate contrast
    const contrast = this.calculateContrast(grayscale, region.width, region.height);

    return {
      colorVariance,
      edgeDensity,
      texturePattern,
      darkness,
      contrast,
    };
  }

  /**
   * Detect edges using Sobel operator
   */
  private detectEdges(grayscale: number[], width: number, height: number): boolean[] {
    const edges: boolean[] = new Array(grayscale.length).fill(false);
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    const threshold = 50;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = (y + ky) * width + (x + kx);
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            const pixel = grayscale[idx];

            gx += pixel * sobelX[kernelIdx];
            gy += pixel * sobelY[kernelIdx];
          }
        }

        const magnitude = Math.sqrt(gx * gx + gy * gy);
        const idx = y * width + x;
        edges[idx] = magnitude > threshold;
      }
    }

    return edges;
  }

  /**
   * Find linear regions (potential cracks)
   */
  private findLinearRegions(
    edges: boolean[],
    width: number,
    height: number
  ): BoundingBox[] {
    const regions: BoundingBox[] = [];
    const visited = new Set<number>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] && !visited.has(idx)) {
          const region = this.floodFillLinear(edges, width, height, x, y, visited);
          if (region && this.isLinear(region)) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill to find connected linear components
   */
  private floodFillLinear(
    edges: boolean[],
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Set<number>
  ): BoundingBox | null {
    const stack: Array<[number, number]> = [[startX, startY]];
    const pixels: Array<[number, number]> = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || !edges[idx]) {
        continue;
      }

      visited.add(idx);
      pixels.push([x, y]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Check 8-connected neighbors
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          stack.push([x + dx, y + dy]);
        }
      }
    }

    if (pixels.length < 10) return null; // Too small

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Check if region is linear (crack-like)
   */
  private isLinear(region: BoundingBox): boolean {
    const aspectRatio = Math.max(region.width, region.height) / Math.min(region.width, region.height);
    return aspectRatio > 3; // Long and thin
  }

  /**
   * Find dark regions (potential water damage)
   */
  private findDarkRegions(
    grayscale: number[],
    width: number,
    height: number,
    darknessThreshold: number
  ): BoundingBox[] {
    const regions: BoundingBox[] = [];
    const visited = new Set<number>();
    const darkThreshold = 255 * (1 - darknessThreshold);

    for (let y = 0; y < height - 10; y += 5) {
      for (let x = 0; x < width - 10; x += 5) {
        const idx = y * width + x;
        if (grayscale[idx] < darkThreshold && !visited.has(idx)) {
          const region = this.floodFillDark(grayscale, width, height, x, y, darkThreshold, visited);
          if (region && region.width * region.height > 100) {
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill for dark regions
   */
  private floodFillDark(
    grayscale: number[],
    width: number,
    height: number,
    startX: number,
    startY: number,
    threshold: number,
    visited: Set<number>
  ): BoundingBox | null {
    const stack: Array<[number, number]> = [[startX, startY]];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    let count = 0;

    while (stack.length > 0 && count < 1000) {
      const [x, y] = stack.pop()!;
      const idx = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx)) {
        continue;
      }

      if (grayscale[idx] >= threshold) {
        continue;
      }

      visited.add(idx);
      count++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // 4-connected neighbors
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    if (count < 20) return null;

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  /**
   * Find unusual patterns (structural issues)
   */
  private findUnusualPatterns(
    edges: boolean[],
    width: number,
    height: number
  ): BoundingBox[] {
    // Look for regions with high edge density but irregular patterns
    const regions: BoundingBox[] = [];
    const blockSize = 32;

    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        let edgeCount = 0;
        for (let by = 0; by < blockSize; by++) {
          for (let bx = 0; bx < blockSize; bx++) {
            const idx = (y + by) * width + (x + bx);
            if (edges[idx]) edgeCount++;
          }
        }

        const edgeDensity = edgeCount / (blockSize * blockSize);
        if (edgeDensity > 0.3) {
          regions.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
          });
        }
      }
    }

    return regions;
  }

  // Helper methods
  private toGrayscale(imageData: ImageData): number[] {
    const data = imageData.data;
    const grayscale: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayscale.push(Math.round(gray));
    }
    return grayscale;
  }

  private extractRegion(imageData: ImageData, region: BoundingBox): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = region.width;
    canvas.height = region.height;
    const ctx = canvas.getContext('2d')!;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(tempCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);
    return ctx.getImageData(0, 0, region.width, region.height);
  }

  private calculateEdgeDensity(grayscale: number[], width: number, height: number): number {
    const edges = this.detectEdges(grayscale, width, height);
    const edgeCount = edges.filter(e => e).length;
    return edgeCount / (width * height);
  }

  private analyzeTexturePattern(grayscale: number[], width: number, height: number): 'linear' | 'circular' | 'irregular' | 'smooth' {
    const edges = this.detectEdges(grayscale, width, height);
    const linearRegions = this.findLinearRegions(edges, width, height);
    
    if (linearRegions.length > 0) {
      return 'linear';
    }

    const edgeDensity = this.calculateEdgeDensity(grayscale, width, height);
    if (edgeDensity < 0.1) {
      return 'smooth';
    }
    if (edgeDensity > 0.3) {
      return 'irregular';
    }

    return 'smooth';
  }

  private calculateContrast(grayscale: number[], width: number, height: number): number {
    let sum = 0;
    let sumSq = 0;
    const pixelCount = grayscale.length;

    for (const gray of grayscale) {
      sum += gray;
      sumSq += gray * gray;
    }

    const mean = sum / pixelCount;
    const variance = (sumSq / pixelCount) - (mean * mean);
    return Math.sqrt(variance) / 255; // Normalize
  }

  private growRegion(imageData: ImageData, point: Point, maxWidth: number, maxHeight: number): BoundingBox | null {
    // Simplified region growing
    return {
      x: Math.max(0, point.x - 10),
      y: Math.max(0, point.y - 10),
      width: Math.min(maxWidth, imageData.width - point.x + 10),
      height: Math.min(maxHeight, imageData.height - point.y + 10),
    };
  }

  private mergeOverlappingRegions(regions: BoundingBox[]): BoundingBox[] {
    // Simple merging: if regions overlap significantly, merge them
    const merged: BoundingBox[] = [];
    const used = new Set<number>();

    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;

      let current = regions[i];
      used.add(i);

      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;

        if (this.overlaps(current, regions[j])) {
          current = this.mergeBoundingBoxes(current, regions[j]);
          used.add(j);
        }
      }

      merged.push(current);
    }

    return merged;
  }

  private overlaps(box1: BoundingBox, box2: BoundingBox): boolean {
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }

  private mergeBoundingBoxes(box1: BoundingBox, box2: BoundingBox): BoundingBox {
    return {
      x: Math.min(box1.x, box2.x),
      y: Math.min(box1.y, box2.y),
      width: Math.max(box1.x + box1.width, box2.x + box2.width) - Math.min(box1.x, box2.x),
      height: Math.max(box1.y + box1.height, box2.y + box2.height) - Math.min(box1.y, box2.y),
    };
  }

  private calculateCrackConfidence(features: DefectFeatures): number {
    let confidence = 0.5;
    if (features.edgeDensity > 0.3) confidence += 0.2;
    if (features.texturePattern === 'linear') confidence += 0.2;
    if (features.darkness > 0.6) confidence += 0.1;
    return Math.min(1.0, confidence);
  }

  private calculateWaterDamageConfidence(features: DefectFeatures): number {
    let confidence = 0.5;
    if (features.darkness > 0.5) confidence += 0.2;
    if (features.colorVariance > 400) confidence += 0.2;
    if (features.texturePattern === 'irregular') confidence += 0.1;
    return Math.min(1.0, confidence);
  }

  private calculateMoldConfidence(features: DefectFeatures, imageData: ImageData, region: BoundingBox): number {
    let confidence = 0.5;
    const regionData = this.extractRegion(imageData, region);
    const data = regionData.data;

    // Check for green/brown colors
    let greenCount = 0, brownCount = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (g > r && g > b && g > 100) greenCount++;
      if (r > 100 && r < 150 && g > 80 && g < 120) brownCount++;
    }

    const greenRatio = greenCount / (data.length / 4);
    const brownRatio = brownCount / (data.length / 4);

    if (greenRatio > 0.3 || brownRatio > 0.3) confidence += 0.3;
    if (features.texturePattern === 'irregular') confidence += 0.2;

    return Math.min(1.0, confidence);
  }

  private calculateStructuralConfidence(features: DefectFeatures): number {
    let confidence = 0.6;
    if (features.contrast > 0.4) confidence += 0.2;
    if (features.texturePattern === 'irregular') confidence += 0.2;
    return Math.min(1.0, confidence);
  }

  private calculateSeverity(
    defectType: DefectType,
    confidence: number,
    region: BoundingBox
  ): 'minor' | 'major' | 'critical' {
    const area = region.width * region.height;
    const sizeFactor = area > 10000 ? 1.0 : area > 5000 ? 0.7 : 0.5;

    const baseSeverity: Record<DefectType, 'minor' | 'major' | 'critical'> = {
      crack: confidence > 0.8 ? 'critical' : confidence > 0.6 ? 'major' : 'minor',
      water_damage: 'major',
      mold: 'major',
      structural_issue: 'critical',
      electrical_hazard: 'critical',
      plumbing_leak: 'major',
      fire_hazard: 'critical',
      other: 'minor',
    };

    const base = baseSeverity[defectType];
    if (base === 'critical') return 'critical';
    if (base === 'major' && sizeFactor > 0.7) return 'major';
    return 'minor';
  }

  private describeCrack(region: BoundingBox, features: DefectFeatures): string {
    const length = Math.max(region.width, region.height);
    const width = Math.min(region.width, region.height);
    return `Length: ${length}px, Width: ${width}px, Pattern: ${features.texturePattern}`;
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
}

// Singleton instance
export const defectDetectionService = new DefectDetectionService();
