/**
 * Material Recognition Service
 * Analyzes color, texture, and patterns to identify construction materials
 */

import {MaterialType, MaterialRecognition} from '@permits/src/types/video-inspection';

export interface ColorFeatures {
  mean: {r: number; g: number; b: number};
  variance: {r: number; g: number; b: number};
  histogram: number[][];
  dominantColors: Array<{r: number; g: number; b: number; percentage: number}>;
}

export interface TextureFeatures {
  contrast: number;
  homogeneity: number;
  energy: number;
  entropy: number;
  edgeDensity: number;
}

export class MaterialRecognitionService {
  /**
   * Recognize material from image data
   */
  async recognizeMaterial(
    imageData: ImageData,
    region?: {x: number; y: number; width: number; height: number}
  ): Promise<MaterialRecognition> {
    // Extract region if specified
    const regionData = region
      ? this.extractRegion(imageData, region)
      : imageData;

    // Analyze features
    const colorFeatures = this.analyzeColor(regionData);
    const textureFeatures = this.analyzeTexture(regionData);

    // Classify material
    const {materialType, confidence} = this.classifyMaterial(
      colorFeatures,
      textureFeatures
    );

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
      description: `Detected ${materialType} material`,
    };
  }

  /**
   * Analyze color features
   */
  private analyzeColor(imageData: ImageData): ColorFeatures {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    // Calculate mean
    let rSum = 0, gSum = 0, bSum = 0;
    for (let i = 0; i < data.length; i += 4) {
      rSum += data[i];
      gSum += data[i + 1];
      bSum += data[i + 2];
    }

    const mean = {
      r: rSum / pixelCount,
      g: gSum / pixelCount,
      b: bSum / pixelCount,
    };

    // Calculate variance
    let rVar = 0, gVar = 0, bVar = 0;
    for (let i = 0; i < data.length; i += 4) {
      rVar += Math.pow(data[i] - mean.r, 2);
      gVar += Math.pow(data[i + 1] - mean.g, 2);
      bVar += Math.pow(data[i + 2] - mean.b, 2);
    }

    const variance = {
      r: rVar / pixelCount,
      g: gVar / pixelCount,
      b: bVar / pixelCount,
    };

    // Calculate histogram
    const histogram = this.calculateHistogram(imageData);

    // Find dominant colors using k-means clustering (simplified)
    const dominantColors = this.findDominantColors(imageData, 3);

    return {mean, variance, histogram, dominantColors};
  }

  /**
   * Analyze texture features using GLCM (Gray-Level Co-occurrence Matrix)
   */
  private analyzeTexture(imageData: ImageData): TextureFeatures {
    // Convert to grayscale
    const grayscale = this.toGrayscale(imageData);

    // Calculate GLCM
    const glcm = this.calculateGLCM(grayscale, 1, 0); // Offset: 1 pixel right

    // Calculate texture features from GLCM
    const contrast = this.calculateContrast(glcm);
    const homogeneity = this.calculateHomogeneity(glcm);
    const energy = this.calculateEnergy(glcm);
    const entropy = this.calculateEntropy(glcm);

    // Calculate edge density using Sobel operator
    const edgeDensity = this.calculateEdgeDensity(grayscale);

    return {contrast, homogeneity, energy, entropy, edgeDensity};
  }

  /**
   * Classify material based on features
   */
  private classifyMaterial(
    color: ColorFeatures,
    texture: TextureFeatures
  ): {materialType: MaterialType; confidence: number} {
    const {r, g, b} = color.mean;
    const {r: rVar, g: gVar, b: bVar} = color.variance;
    const avgVariance = (rVar + gVar + bVar) / 3;

    let materialType: MaterialType = 'other';
    let confidence = 0.5;

    // Concrete: Light gray, high variance (texture)
    if (r > 180 && g > 180 && b > 180 && avgVariance > 400) {
      if (texture.contrast > 0.3 && texture.energy < 0.4) {
        materialType = 'concrete';
        confidence = 0.85;
      }
    }

    // Steel: Dark gray/black, low variance, smooth
    if (r < 120 && g < 120 && b < 120 && avgVariance < 300) {
      if (texture.contrast < 0.2 && texture.energy > 0.6) {
        materialType = 'steel';
        confidence = 0.80;
      }
    }

    // Wood: Brown tones, medium variance, grain texture
    if (r > 100 && r < 200 && g > 80 && g < 160 && b > 50 && b < 130) {
      if (texture.contrast > 0.25 && texture.contrast < 0.5) {
        materialType = 'wood';
        confidence = 0.75;
      }
    }

    // Drywall: Very light, low contrast, smooth
    if (r > 200 && g > 200 && b > 200 && texture.contrast < 0.15) {
      materialType = 'drywall';
      confidence = 0.70;
    }

    // Insulation: Light, fluffy texture, high entropy
    if (r > 200 && g > 200 && b > 200 && texture.entropy > 4.0) {
      materialType = 'insulation';
      confidence = 0.65;
    }

    // Electrical wire: Dark, cylindrical (detected by shape analysis)
    if (r < 80 && g < 80 && b < 80 && texture.energy > 0.7) {
      // Additional shape analysis would confirm
      materialType = 'electrical_wire';
      confidence = 0.60;
    }

    // Plumbing pipe: Metallic, cylindrical
    if ((r > 150 && r < 200) && (g > 150 && g < 200) && (b > 150 && b < 200)) {
      if (texture.energy > 0.65) {
        materialType = 'plumbing_pipe';
        confidence = 0.65;
      }
    }

    return {materialType, confidence};
  }

  /**
   * Extract region from image data
   */
  private extractRegion(
    imageData: ImageData,
    region: {x: number; y: number; width: number; height: number}
  ): ImageData {
    const {x, y, width, height} = region;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Create temporary canvas with full image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(imageData, 0, 0);

    // Draw region to new canvas
    ctx.drawImage(tempCanvas, x, y, width, height, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * Convert to grayscale
   */
  private toGrayscale(imageData: ImageData): number[] {
    const data = imageData.data;
    const grayscale: number[] = [];

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grayscale.push(Math.round(gray));
    }

    return grayscale;
  }

  /**
   * Calculate color histogram
   */
  private calculateHistogram(imageData: ImageData): number[][] {
    const bins = 32; // 32 bins per channel
    const histogram: number[][] = [[], [], []]; // R, G, B

    for (let i = 0; i < bins; i++) {
      histogram[0][i] = 0;
      histogram[1][i] = 0;
      histogram[2][i] = 0;
    }

    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const rBin = Math.floor((data[i] / 255) * bins);
      const gBin = Math.floor((data[i + 1] / 255) * bins);
      const bBin = Math.floor((data[i + 2] / 255) * bins);

      histogram[0][rBin]++;
      histogram[1][gBin]++;
      histogram[2][bBin]++;
    }

    return histogram;
  }

  /**
   * Find dominant colors using simplified k-means
   */
  private findDominantColors(
    imageData: ImageData,
    k: number
  ): Array<{r: number; g: number; b: number; percentage: number}> {
    const data = imageData.data;
    const pixelCount = data.length / 4;

    // Simplified: Use color quantization
    const colorMap = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      // Quantize colors to reduce precision
      const r = Math.floor(data[i] / 32) * 32;
      const g = Math.floor(data[i + 1] / 32) * 32;
      const b = Math.floor(data[i + 2] / 32) * 32;
      const key = `${r},${g},${b}`;

      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    // Get top k colors
    const sorted = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, k);

    return sorted.map(([color, count]) => {
      const [r, g, b] = color.split(',').map(Number);
      return {
        r,
        g,
        b,
        percentage: (count / pixelCount) * 100,
      };
    });
  }

  /**
   * Calculate GLCM (Gray-Level Co-occurrence Matrix)
   */
  private calculateGLCM(
    grayscale: number[],
    offsetX: number,
    offsetY: number,
    width: number = Math.sqrt(grayscale.length),
    height: number = Math.sqrt(grayscale.length)
  ): number[][] {
    const levels = 256;
    const glcm: number[][] = Array(levels)
      .fill(0)
      .map(() => Array(levels).fill(0));

    for (let y = 0; y < height - offsetY; y++) {
      for (let x = 0; x < width - offsetX; x++) {
        const i = y * width + x;
        const j = (y + offsetY) * width + (x + offsetX);

        if (i < grayscale.length && j < grayscale.length) {
          const gray1 = Math.min(grayscale[i], levels - 1);
          const gray2 = Math.min(grayscale[j], levels - 1);
          glcm[gray1][gray2]++;
        }
      }
    }

    // Normalize
    let sum = 0;
    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        sum += glcm[i][j];
      }
    }

    if (sum > 0) {
      for (let i = 0; i < levels; i++) {
        for (let j = 0; j < levels; j++) {
          glcm[i][j] /= sum;
        }
      }
    }

    return glcm;
  }

  /**
   * Calculate contrast from GLCM
   */
  private calculateContrast(glcm: number[][]): number {
    let contrast = 0;
    for (let i = 0; i < glcm.length; i++) {
      for (let j = 0; j < glcm[i].length; j++) {
        contrast += glcm[i][j] * Math.pow(i - j, 2);
      }
    }
    return contrast;
  }

  /**
   * Calculate homogeneity from GLCM
   */
  private calculateHomogeneity(glcm: number[][]): number {
    let homogeneity = 0;
    for (let i = 0; i < glcm.length; i++) {
      for (let j = 0; j < glcm[i].length; j++) {
        homogeneity += glcm[i][j] / (1 + Math.abs(i - j));
      }
    }
    return homogeneity;
  }

  /**
   * Calculate energy from GLCM
   */
  private calculateEnergy(glcm: number[][]): number {
    let energy = 0;
    for (let i = 0; i < glcm.length; i++) {
      for (let j = 0; j < glcm[i].length; j++) {
        energy += Math.pow(glcm[i][j], 2);
      }
    }
    return Math.sqrt(energy);
  }

  /**
   * Calculate entropy from GLCM
   */
  private calculateEntropy(glcm: number[][]): number {
    let entropy = 0;
    for (let i = 0; i < glcm.length; i++) {
      for (let j = 0; j < glcm[i].length; j++) {
        if (glcm[i][j] > 0) {
          entropy -= glcm[i][j] * Math.log2(glcm[i][j]);
        }
      }
    }
    return entropy;
  }

  /**
   * Calculate edge density using Sobel operator
   */
  private calculateEdgeDensity(grayscale: number[]): number {
    const width = Math.sqrt(grayscale.length);
    const height = Math.sqrt(grayscale.length);
    let edgePixels = 0;

    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

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
        if (magnitude > 50) { // Threshold for edge
          edgePixels++;
        }
      }
    }

    return edgePixels / (width * height);
  }
}

// Singleton instance
export const materialRecognitionService = new MaterialRecognitionService();
