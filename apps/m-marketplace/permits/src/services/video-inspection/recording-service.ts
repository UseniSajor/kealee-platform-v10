import RecordRTC from 'recordrtc';
import {VideoRecording} from '@permits/src/types/video-inspection';

/**
 * Video Recording Service
 * Handles recording of video inspections with encryption and cloud storage
 */
export class RecordingService {
  private recorder: RecordRTC | null = null;
  private stream: MediaStream | null = null;
  private recordingStartTime: number = 0;

  /**
   * Start recording video inspection
   */
  async startRecording(
    stream: MediaStream,
    options: {
      mimeType?: string;
      videoBitsPerSecond?: number;
      audioBitsPerSecond?: number;
      frameRate?: number;
    } = {},
  ): Promise<void> {
    try {
      this.stream = stream;
      this.recordingStartTime = Date.now();

      const config: any = {
        type: 'video',
        mimeType: options.mimeType || 'video/webm;codecs=vp8,opus',
        videoBitsPerSecond: options.videoBitsPerSecond || 2500000,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
        frameRate: options.frameRate || 30,
        timeSlice: 1000, // Record in 1-second chunks
      };

      this.recorder = new RecordRTC(stream, config);

      // Start recording
      this.recorder.startRecording();

      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording');
    }
  }

  /**
   * Stop recording and get blob
   */
  async stopRecording(): Promise<Blob> {
    if (!this.recorder) {
      throw new Error('Recording not started');
    }

    return new Promise((resolve, reject) => {
      this.recorder!.stopRecording(() => {
        try {
          const blob = this.recorder!.getBlob();
          this.recorder = null;
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Pause recording
   */
  pauseRecording(): void {
    if (this.recorder) {
      this.recorder.pauseRecording();
    }
  }

  /**
   * Resume recording
   */
  resumeRecording(): void {
    if (this.recorder) {
      this.recorder.resumeRecording();
    }
  }

  /**
   * Get recording duration
   */
  getDuration(): number {
    if (!this.recordingStartTime) return 0;
    return (Date.now() - this.recordingStartTime) / 1000; // seconds
  }

  /**
   * Upload recording to cloud storage with encryption
   */
  async uploadRecording(
    blob: Blob,
    inspectionId: string,
    options: {
      encrypt?: boolean;
      generateThumbnail?: boolean;
      generateTranscript?: boolean;
    } = {},
  ): Promise<VideoRecording> {
    try {
      // Encrypt if requested
      let encryptedBlob = blob;
      if (options.encrypt) {
        encryptedBlob = await this.encryptBlob(blob);
      }

      // Create form data
      const formData = new FormData();
      formData.append('video', encryptedBlob, `inspection-${inspectionId}-${Date.now()}.webm`);
      formData.append('inspectionId', inspectionId);
      formData.append('encrypted', String(options.encrypt || false));
      formData.append('generateThumbnail', String(options.generateThumbnail || false));
      formData.append('generateTranscript', String(options.generateTranscript || false));

      // Upload to server
      const response = await fetch('/api/video-inspections/recordings/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      const recording: VideoRecording = await response.json();
      return recording;
    } catch (error) {
      console.error('Error uploading recording:', error);
      throw new Error('Failed to upload recording');
    }
  }

  /**
   * Encrypt blob using Web Crypto API
   */
  private async encryptBlob(blob: Blob): Promise<Blob> {
    try {
      // Generate encryption key
      const key = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt'],
      );

      // Convert blob to array buffer
      const arrayBuffer = await blob.arrayBuffer();

      // Encrypt
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        arrayBuffer,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return new Blob([combined], {type: blob.type});
    } catch (error) {
      console.error('Error encrypting blob:', error);
      throw new Error('Failed to encrypt recording');
    }
  }

  /**
   * Generate thumbnail from video blob
   */
  async generateThumbnail(blob: Blob, timeOffset: number = 1): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(blob);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(timeOffset, video.duration);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0);
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(url);
        resolve(thumbnailUrl);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to generate thumbnail'));
      };

      video.src = url;
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.recorder) {
      this.recorder.destroy();
      this.recorder = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }
}

// Singleton instance
export const recordingService = new RecordingService();
