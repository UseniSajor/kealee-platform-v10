// ============================================================
// VIDEO INSPECTION TYPE DEFINITIONS
// ============================================================

export interface VideoInspection {
  id: string;
  inspectionId: string;
  permitId: string;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: VideoInspectionStatus;
  participants: VideoInspectionParticipant[];
  recording?: VideoRecording;
  checklist: VideoInspectionChecklistItem[];
  aiAnalysis?: VideoAIAnalysis;
  report?: VideoInspectionReport;
  createdAt: Date;
  updatedAt: Date;
}

export type VideoInspectionStatus =
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface VideoInspectionParticipant {
  id: string;
  userId: string;
  name: string;
  role: ParticipantRole;
  joinedAt?: Date;
  leftAt?: Date;
  isConnected: boolean;
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
}

export type ParticipantRole = 'inspector' | 'contractor' | 'owner' | 'observer';

export interface VideoRecording {
  id: string;
  recordingId: string;
  storageUrl: string;
  encrypted: boolean;
  duration: number;
  fileSize: number;
  format: 'mp4' | 'webm';
  thumbnailUrl?: string;
  transcriptUrl?: string;
  createdAt: Date;
}

export interface VideoInspectionChecklistItem {
  id: string;
  category: string;
  description: string;
  required: boolean;
  status: ChecklistItemStatus;
  timestamp?: number; // Video timestamp in seconds
  screenshotUrl?: string;
  notes?: string;
  aiFindings?: AIFinding[];
  completedAt?: Date;
}

export type ChecklistItemStatus = 'pending' | 'in-progress' | 'completed' | 'skipped';

export interface AIFinding {
  id: string;
  type: AIFindingType;
  confidence: number;
  description: string;
  timestamp: number;
  boundingBox?: BoundingBox;
  severity: 'info' | 'minor' | 'major' | 'critical';
}

export type AIFindingType =
  | 'object_detection'
  | 'dimension_measurement'
  | 'material_recognition'
  | 'defect_detection'
  | 'code_compliance';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface VideoAIAnalysis {
  id: string;
  inspectionId: string;
  objectDetections: ObjectDetection[];
  measurements: Measurement[];
  materialRecognitions: MaterialRecognition[];
  defects: DefectDetection[];
  codeCompliance: CodeComplianceCheck[];
  processedAt: Date;
}

export interface ObjectDetection {
  id: string;
  objectType: ConstructionElement;
  confidence: number;
  timestamp: number;
  boundingBox: BoundingBox;
  description?: string;
}

export type ConstructionElement =
  | 'wall'
  | 'beam'
  | 'column'
  | 'door'
  | 'window'
  | 'electrical_outlet'
  | 'plumbing_fixture'
  | 'hvac_duct'
  | 'stair'
  | 'railing'
  | 'other';

export interface Measurement {
  id: string;
  elementId: string;
  measurementType: MeasurementType;
  value: number;
  unit: 'inches' | 'feet' | 'meters' | 'centimeters';
  confidence: number;
  timestamp: number;
  referencePoints: Point[];
}

export type MeasurementType = 'length' | 'width' | 'height' | 'area' | 'volume' | 'angle';

export interface Point {
  x: number;
  y: number;
}

export interface MaterialRecognition {
  id: string;
  materialType: MaterialType;
  confidence: number;
  timestamp: number;
  boundingBox: BoundingBox;
  description?: string;
}

export type MaterialType =
  | 'concrete'
  | 'steel'
  | 'wood'
  | 'drywall'
  | 'insulation'
  | 'electrical_wire'
  | 'plumbing_pipe'
  | 'other';

export interface DefectDetection {
  id: string;
  defectType: DefectType;
  severity: 'minor' | 'major' | 'critical';
  confidence: number;
  timestamp: number;
  boundingBox: BoundingBox;
  description: string;
  recommendedAction?: string;
}

export type DefectType =
  | 'crack'
  | 'water_damage'
  | 'mold'
  | 'structural_issue'
  | 'electrical_hazard'
  | 'plumbing_leak'
  | 'fire_hazard'
  | 'other';

export interface CodeComplianceCheck {
  id: string;
  codeReference: string;
  requirement: string;
  compliant: boolean;
  confidence: number;
  timestamp: number;
  findings: string[];
  recommendation?: string;
}

export interface VideoInspectionReport {
  id: string;
  inspectionId: string;
  generatedAt: Date;
  generatedBy: 'ai' | 'inspector' | 'system';
  summary: string;
  deficiencies: Deficiency[];
  complianceStatus: ComplianceStatus;
  recommendations: string[];
  videoReferences: VideoReference[];
  attachments: ReportAttachment[];
}

export interface Deficiency {
  id: string;
  category: string;
  description: string;
  severity: 'minor' | 'major' | 'critical';
  codeReference?: string;
  videoTimestamp: number;
  screenshotUrl?: string;
  aiDetected: boolean;
  inspectorConfirmed: boolean;
}

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'pending';

export interface VideoReference {
  timestamp: number;
  description: string;
  screenshotUrl?: string;
  findings: string[];
}

export interface ReportAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  description: string;
  timestamp?: number;
}

// WebRTC Types
export interface WebRTCConnection {
  id: string;
  inspectionId: string;
  localStream?: MediaStream;
  remoteStreams: Map<string, MediaStream>;
  peerConnections: Map<string, RTCPeerConnection>;
  dataChannel?: RTCDataChannel;
  iceServers: RTCIceServer[];
}

export interface ScreenShare {
  id: string;
  participantId: string;
  stream: MediaStream;
  startedAt: Date;
  documentUrl?: string;
}

// AR Marker Types
export interface ARMarker {
  id: string;
  checklistItemId: string;
  position: MarkerPosition;
  instruction: string;
  required: boolean;
}

export interface MarkerPosition {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  overlay?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

// Platform Integration Types
export interface ZoomMeeting {
  meetingId: string;
  joinUrl: string;
  password?: string;
  startTime: Date;
  duration: number;
}

export interface TeamsMeeting {
  meetingId: string;
  joinUrl: string;
  startTime: Date;
  duration: number;
}

export interface VideoPlatformConfig {
  platform: 'webrtc' | 'zoom' | 'teams';
  config: WebRTCConfig | ZoomConfig | TeamsConfig;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  signalingServer: string;
}

export interface ZoomConfig {
  apiKey: string;
  apiSecret: string;
  sdkKey: string;
  sdkSecret: string;
}

export interface TeamsConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
}
