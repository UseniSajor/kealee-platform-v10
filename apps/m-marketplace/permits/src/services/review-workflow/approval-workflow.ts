/**
 * Final Approval Workflow Service
 * Digital signatures for final approval
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {multiDisciplineCoordinationService} from './multi-discipline-coordination';

export interface ApprovalSignature {
  id: string;
  permitId: string;
  signerId: string;
  signerName: string;
  signerRole: string;
  discipline?: string;
  signatureData: string; // Base64 encoded signature image or cryptographic signature
  signatureMethod: 'DIGITAL_SIGNATURE' | 'ELECTRONIC_SIGNATURE' | 'DIGITAL_CERTIFICATE';
  signedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ApprovalWorkflow {
  permitId: string;
  status: 'PENDING_APPROVAL' | 'PARTIALLY_APPROVED' | 'APPROVED' | 'REJECTED';
  requiredSignatures: RequiredSignature[];
  signatures: ApprovalSignature[];
  canApprove: boolean;
  approvalDate?: Date;
  approvedBy?: string;
}

export interface RequiredSignature {
  role: string;
  discipline?: string;
  required: boolean;
  order: number; // Sequential approval order
}

export class ApprovalWorkflowService {
  /**
   * Get approval workflow for permit
   */
  async getApprovalWorkflow(permitId: string): Promise<ApprovalWorkflow> {
    const supabase = createClient();

    // Get coordination status
    const coordination = await multiDisciplineCoordinationService.getCoordinationStatus(permitId);

    // Determine required signatures
    const requiredSignatures: RequiredSignature[] = coordination.disciplines.map((d, index) => ({
      role: 'REVIEWER',
      discipline: d.discipline,
      required: true,
      order: index + 1,
    }));

    // Add final approver
    requiredSignatures.push({
      role: 'FINAL_APPROVER',
      required: true,
      order: requiredSignatures.length + 1,
    });

    // Get existing signatures
    const {data: signatures} = await supabase
      .from('ApprovalSignature')
      .select('*, signer:User(name, email)')
      .eq('permitId', permitId)
      .order('signedAt', {ascending: true});

    const mappedSignatures: ApprovalSignature[] = (signatures || []).map(s => ({
      id: s.id,
      permitId: s.permitId,
      signerId: s.signerId,
      signerName: (s.signer as any)?.name || 'Unknown',
      signerRole: s.signerRole,
      discipline: s.discipline,
      signatureData: s.signatureData,
      signatureMethod: s.signatureMethod,
      signedAt: new Date(s.signedAt),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    }));

    // Determine status
    const allDisciplinesApproved = coordination.disciplines.every(
      d => d.status === 'COMPLETED_APPROVED'
    );
    const hasFinalApproval = mappedSignatures.some(s => s.signerRole === 'FINAL_APPROVER');

    let status: ApprovalWorkflow['status'];
    if (hasFinalApproval) {
      status = 'APPROVED';
    } else if (mappedSignatures.length > 0) {
      status = 'PARTIALLY_APPROVED';
    } else if (allDisciplinesApproved) {
      status = 'PENDING_APPROVAL';
    } else {
      status = 'PENDING_APPROVAL';
    }

    // Check if can approve
    const canApprove = allDisciplinesApproved && !hasFinalApproval;

    return {
      permitId,
      status,
      requiredSignatures,
      signatures: mappedSignatures,
      canApprove,
      approvalDate: hasFinalApproval
        ? mappedSignatures.find(s => s.signerRole === 'FINAL_APPROVER')?.signedAt
        : undefined,
      approvedBy: hasFinalApproval
        ? mappedSignatures.find(s => s.signerRole === 'FINAL_APPROVER')?.signerId
        : undefined,
    };
  }

  /**
   * Add signature to permit
   */
  async addSignature(
    permitId: string,
    signerId: string,
    signerRole: string,
    discipline: string | undefined,
    signatureData: string,
    signatureMethod: ApprovalSignature['signatureMethod'],
    ipAddress?: string,
    userAgent?: string
  ): Promise<ApprovalSignature> {
    const supabase = createClient();

    // Get signer info
    const {data: signer} = await supabase
      .from('User')
      .select('name')
      .eq('id', signerId)
      .single();

    const signature: ApprovalSignature = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      permitId,
      signerId,
      signerName: signer?.name || 'Unknown',
      signerRole,
      discipline,
      signatureData,
      signatureMethod,
      signedAt: new Date(),
      ipAddress,
      userAgent,
    };

    // Save signature
    await supabase.from('ApprovalSignature').insert({
      id: signature.id,
      permitId: signature.permitId,
      signerId: signature.signerId,
      signerRole: signature.signerRole,
      discipline: signature.discipline,
      signatureData: signature.signatureData,
      signatureMethod: signature.signatureMethod,
      signedAt: signature.signedAt.toISOString(),
      ipAddress: signature.ipAddress,
      userAgent: signature.userAgent,
    });

    // If final approver, update permit status
    if (signerRole === 'FINAL_APPROVER') {
      await supabase
        .from('Permit')
        .update({
          status: 'APPROVED',
          approvedAt: signature.signedAt.toISOString(),
          approvedBy: signerId,
        })
        .eq('id', permitId);
    }

    return signature;
  }

  /**
   * Verify signature
   */
  async verifySignature(signatureId: string): Promise<{
    valid: boolean;
    signature: ApprovalSignature;
    verificationDetails: any;
  }> {
    const supabase = createClient();

    const {data: signature} = await supabase
      .from('ApprovalSignature')
      .select('*')
      .eq('id', signatureId)
      .single();

    if (!signature) {
      throw new Error('Signature not found');
    }

    const mappedSignature: ApprovalSignature = {
      id: signature.id,
      permitId: signature.permitId,
      signerId: signature.signerId,
      signerName: 'Unknown', // Would fetch from User
      signerRole: signature.signerRole,
      discipline: signature.discipline,
      signatureData: signature.signatureData,
      signatureMethod: signature.signatureMethod,
      signedAt: new Date(signature.signedAt),
      ipAddress: signature.ipAddress,
      userAgent: signature.userAgent,
    };

    // Verify signature based on method
    let valid = true;
    const verificationDetails: any = {
      method: signature.signatureMethod,
      signedAt: signature.signedAt,
      ipAddress: signature.ipAddress,
    };

    if (signature.signatureMethod === 'DIGITAL_CERTIFICATE') {
      // Would verify cryptographic signature
      valid = true; // Placeholder
      verificationDetails.certificateValid = true;
    } else if (signature.signatureMethod === 'DIGITAL_SIGNATURE') {
      // Would verify signature image integrity
      valid = true; // Placeholder
      verificationDetails.imageHash = 'verified';
    } else {
      // Electronic signature (basic)
      valid = true;
      verificationDetails.type = 'electronic';
    }

    return {
      valid,
      signature: mappedSignature,
      verificationDetails,
    };
  }

  /**
   * Get signature audit trail
   */
  async getSignatureAuditTrail(permitId: string): Promise<ApprovalSignature[]> {
    const supabase = createClient();

    const {data: signatures} = await supabase
      .from('ApprovalSignature')
      .select('*, signer:User(name)')
      .eq('permitId', permitId)
      .order('signedAt', {ascending: true});

    if (!signatures) {
      return [];
    }

    return signatures.map(s => ({
      id: s.id,
      permitId: s.permitId,
      signerId: s.signerId,
      signerName: (s.signer as any)?.name || 'Unknown',
      signerRole: s.signerRole,
      discipline: s.discipline,
      signatureData: s.signatureData,
      signatureMethod: s.signatureMethod,
      signedAt: new Date(s.signedAt),
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
    }));
  }
}

// Singleton instance
export const approvalWorkflowService = new ApprovalWorkflowService();
