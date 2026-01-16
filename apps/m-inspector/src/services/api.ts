import axios, {AxiosInstance} from 'axios';
import {Inspection, InspectionPhoto, InspectionSketch, InspectionNote, InspectionSignature, Route} from '../types';
import {StorageService} from './storage';

const API_BASE_URL = process.env.API_BASE_URL || 'https://api.kealee.com';

export class ApiService {
  private static client: AxiosInstance | null = null;

  private static getClient(): AxiosInstance {
    if (!this.client) {
      this.client = axios.create({
        baseURL: API_BASE_URL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Add auth token interceptor
      this.client.interceptors.request.use(async (config) => {
        const token = await StorageService.getSecure('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    }
    return this.client;
  }

  // Inspections
  static async getInspections(since?: string): Promise<Inspection[]> {
    const response = await this.getClient().get('/api/inspections', {
      params: {since},
    });
    return response.data;
  }

  static async getInspection(id: string): Promise<Inspection> {
    const response = await this.getClient().get(`/api/inspections/${id}`);
    return response.data;
  }

  static async createInspection(inspection: Inspection): Promise<Inspection> {
    const response = await this.getClient().post('/api/inspections', inspection);
    return response.data;
  }

  static async updateInspection(id: string, inspection: Partial<Inspection>): Promise<Inspection> {
    const response = await this.getClient().put(`/api/inspections/${id}`, inspection);
    return response.data;
  }

  static async deleteInspection(id: string): Promise<void> {
    await this.getClient().delete(`/api/inspections/${id}`);
  }

  static async downloadInspectionsForDate(date: string): Promise<Inspection[]> {
    const response = await this.getClient().get('/api/inspections/download', {
      params: {date},
    });
    return response.data;
  }

  // Photos
  static async uploadInspectionPhoto(
    inspectionId: string,
    photo: InspectionPhoto,
  ): Promise<InspectionPhoto> {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: `${photo.id}.jpg`,
    } as any);
    formData.append('gpsLocation', JSON.stringify(photo.gpsLocation));
    formData.append('timestamp', photo.timestamp);
    if (photo.description) {
      formData.append('description', photo.description);
    }

    const response = await this.getClient().post(
      `/api/inspections/${inspectionId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
  }

  // Sketches
  static async uploadInspectionSketch(
    inspectionId: string,
    sketch: InspectionSketch,
  ): Promise<InspectionSketch> {
    const response = await this.getClient().post(`/api/inspections/${inspectionId}/sketches`, sketch);
    return response.data;
  }

  // Notes
  static async addInspectionNote(
    inspectionId: string,
    note: InspectionNote,
  ): Promise<InspectionNote> {
    const response = await this.getClient().post(`/api/inspections/${inspectionId}/notes`, note);
    return response.data;
  }

  // Signatures
  static async addInspectionSignature(
    inspectionId: string,
    signature: InspectionSignature,
  ): Promise<InspectionSignature> {
    const response = await this.getClient().post(
      `/api/inspections/${inspectionId}/signatures`,
      signature,
    );
    return response.data;
  }

  // Routes
  static async getOptimizedRoute(date: string): Promise<Route> {
    const response = await this.getClient().get('/api/routes/optimize', {
      params: {date},
    });
    return response.data;
  }

  // AI Services
  static async analyzePhotoCompliance(photoUri: string, inspectionType: string): Promise<any> {
    const formData = new FormData();
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    formData.append('inspectionType', inspectionType);

    const response = await this.getClient().post('/api/ai/analyze-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  static async lookupHistoricalData(address: string): Promise<any> {
    const response = await this.getClient().get('/api/inspections/historical', {
      params: {address},
    });
    return response.data;
  }

  // Authentication
  static async login(email: string, password: string): Promise<{token: string; user: any}> {
    const response = await this.getClient().post('/api/auth/login', {email, password});
    await StorageService.saveSecure('auth_token', response.data.token);
    return response.data;
  }

  static async logout(): Promise<void> {
    await StorageService.removeSecure('auth_token');
  }
}
