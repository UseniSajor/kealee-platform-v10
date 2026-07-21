// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type UserRole = 'CLIENT' | 'PM' | 'ADMIN' | 'JURISDICTION_STAFF';

export interface Permit {
  id: string;
  permitNumber?: string;
  projectId: string;
  clientId: string;
  jurisdictionId: string;
  pmUserId: string;
  permitType: string;
  subtype?: string;
  scope: string;
  valuation: number;
  kealeeStatus: string;
  jurisdictionStatus?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inspection {
  id: string;
  permitId: string;
  projectId: string;
  inspectionType: string;
  scheduledDate?: Date;
  result?: string;
  inspectorNotes?: string;
  createdAt: Date;
}

export interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  state: string;
  county?: string;
  city?: string;
}

export interface PermitApplicationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  fields: FormField[];
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'file' | 'textarea';
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}
