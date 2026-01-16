export interface Inspection {
  id: string;
  permitId: string;
  permitNumber: string;
  address: string;
  inspectionType: InspectionType;
  scheduledDate: string;
  status: InspectionStatus;
  checklist: ChecklistItem[];
  photos: InspectionPhoto[];
  sketches: InspectionSketch[];
  notes: InspectionNote[];
  signatures: InspectionSignature[];
  gpsLocation?: GPSLocation;
  completedAt?: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InspectionType =
  | 'footing'
  | 'foundation'
  | 'framing'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'final'
  | 'other';

export type InspectionStatus = 'scheduled' | 'in-progress' | 'passed' | 'failed' | 'partial';

export interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  status: 'pending' | 'pass' | 'fail' | 'na';
  notes?: string;
  photos?: string[];
  timestamp?: string;
}

export interface InspectionPhoto {
  id: string;
  uri: string;
  thumbnailUri?: string;
  gpsLocation: GPSLocation;
  timestamp: string;
  description?: string;
  codeComplianceAnalysis?: CodeComplianceAnalysis;
  synced: boolean;
}

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp: string;
}

export interface InspectionSketch {
  id: string;
  name: string;
  svgData: string;
  timestamp: string;
  synced: boolean;
}

export interface InspectionNote {
  id: string;
  text: string;
  voiceRecordingUri?: string;
  timestamp: string;
  synced: boolean;
}

export interface InspectionSignature {
  id: string;
  signerName: string;
  signerRole: string;
  signatureData: string;
  timestamp: string;
  synced: boolean;
}

export interface CodeComplianceAnalysis {
  compliant: boolean;
  confidence: number;
  violations?: ComplianceViolation[];
  recommendations?: string[];
}

export interface ComplianceViolation {
  code: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  location?: string;
}

export interface Route {
  id: string;
  date: string;
  inspections: RouteInspection[];
  optimized: boolean;
  estimatedDuration: number;
  estimatedDistance: number;
}

export interface RouteInspection {
  inspectionId: string;
  address: string;
  scheduledTime: string;
  estimatedArrival: string;
  order: number;
  coordinates: GPSLocation;
}

export interface SyncConflict {
  id: string;
  inspectionId: string;
  localVersion: Inspection;
  serverVersion: Inspection;
  conflictType: 'edit' | 'delete' | 'create';
  resolved: boolean;
}

export interface OfflineQueueItem {
  id: string;
  type: 'inspection' | 'photo' | 'sketch' | 'note' | 'signature';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}
