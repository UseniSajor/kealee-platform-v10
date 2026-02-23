/**
 * Training and Certification Tracking Service
 * Manages staff training records and certifications
 */

import {JurisdictionStaff, TrainingRecord, Certification} from '@permits/src/types/jurisdiction-staff';
import {isAfter, isBefore, addYears, differenceInDays} from 'date-fns';

export class TrainingCertificationService {
  /**
   * Add training record for staff
   */
  async addTrainingRecord(
    staff: JurisdictionStaff,
    training: Omit<TrainingRecord, 'id'>
  ): Promise<JurisdictionStaff> {
    const newRecord: TrainingRecord = {
      id: `training-${Date.now()}`,
      ...training,
    };

    return {
      ...staff,
      trainingRecords: [...staff.trainingRecords, newRecord],
    };
  }

  /**
   * Add certification for staff
   */
  async addCertification(
    staff: JurisdictionStaff,
    certification: Omit<Certification, 'id'>
  ): Promise<JurisdictionStaff> {
    const newCert: Certification = {
      id: `cert-${Date.now()}`,
      ...certification,
    };

    return {
      ...staff,
      certifications: [...staff.certifications, newCert],
    };
  }

  /**
   * Get expiring certifications
   */
  getExpiringCertifications(
    staff: JurisdictionStaff,
    daysAhead: number = 90
  ): Certification[] {
    const cutoffDate = addYears(new Date(), daysAhead / 365);
    const today = new Date();

    return staff.certifications.filter(cert => {
      if (!cert.expiresAt) return false;
      return isAfter(cert.expiresAt, today) && isBefore(cert.expiresAt, cutoffDate);
    });
  }

  /**
   * Get expired certifications
   */
  getExpiredCertifications(staff: JurisdictionStaff): Certification[] {
    const today = new Date();

    return staff.certifications.filter(cert => {
      if (!cert.expiresAt) return false;
      return isBefore(cert.expiresAt, today);
    });
  }

  /**
   * Get expiring training
   */
  getExpiringTraining(
    staff: JurisdictionStaff,
    daysAhead: number = 90
  ): TrainingRecord[] {
    const cutoffDate = addYears(new Date(), daysAhead / 365);
    const today = new Date();

    return staff.trainingRecords.filter(training => {
      if (!training.expiresAt) return false;
      return isAfter(training.expiresAt, today) && isBefore(training.expiresAt, cutoffDate);
    });
  }

  /**
   * Check if staff meets certification requirements
   */
  meetsCertificationRequirements(
    staff: JurisdictionStaff,
    requiredCertifications: string[]
  ): {meets: boolean; missing: string[]} {
    const staffCertNames = staff.certifications
      .filter(c => !c.expiresAt || isAfter(c.expiresAt, new Date()))
      .map(c => c.name);

    const missing = requiredCertifications.filter(
      req => !staffCertNames.some(cert => cert.toLowerCase().includes(req.toLowerCase()))
    );

    return {
      meets: missing.length === 0,
      missing,
    };
  }

  /**
   * Get training compliance status
   */
  getTrainingCompliance(staff: JurisdictionStaff): {
    compliant: boolean;
    totalHours: number;
    requiredHours?: number;
    expiringSoon: number;
    expired: number;
  } {
    const totalHours = staff.trainingRecords.reduce((sum, t) => sum + t.hours, 0);
    const expiringSoon = this.getExpiringTraining(staff, 90).length;
    const expired = staff.trainingRecords.filter(t => {
      if (!t.expiresAt) return false;
      return isBefore(t.expiresAt, new Date());
    }).length;

    // In production, would check against jurisdiction requirements
    const requiredHours = 40; // Example: 40 hours per year

    return {
      compliant: totalHours >= (requiredHours || 0) && expired === 0,
      totalHours,
      requiredHours,
      expiringSoon,
      expired,
    };
  }

  /**
   * Get certification summary
   */
  getCertificationSummary(staff: JurisdictionStaff): {
    total: number;
    active: number;
    expiringSoon: number;
    expired: number;
    verified: number;
    unverified: number;
  } {
    const today = new Date();
    const expiringCutoff = addYears(today, 0.25); // 90 days

    const active = staff.certifications.filter(c => {
      if (!c.expiresAt) return true;
      return isAfter(c.expiresAt, today);
    });

    const expiringSoon = staff.certifications.filter(c => {
      if (!c.expiresAt) return false;
      return isAfter(c.expiresAt, today) && isBefore(c.expiresAt, expiringCutoff);
    });

    const expired = staff.certifications.filter(c => {
      if (!c.expiresAt) return false;
      return isBefore(c.expiresAt, today);
    });

    const verified = staff.certifications.filter(c => c.verified).length;

    return {
      total: staff.certifications.length,
      active: active.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      verified,
      unverified: staff.certifications.length - verified,
    };
  }

  /**
   * Get days until certification expires
   */
  getDaysUntilExpiration(certification: Certification): number | null {
    if (!certification.expiresAt) return null;
    return differenceInDays(certification.expiresAt, new Date());
  }

  /**
   * Verify certification
   */
  async verifyCertification(
    staff: JurisdictionStaff,
    certificationId: string,
    verified: boolean = true
  ): Promise<JurisdictionStaff> {
    return {
      ...staff,
      certifications: staff.certifications.map(cert =>
        cert.id === certificationId ? {...cert, verified} : cert
      ),
    };
  }

  /**
   * Get training history
   */
  getTrainingHistory(
    staff: JurisdictionStaff,
    limit?: number
  ): TrainingRecord[] {
    const sorted = [...staff.trainingRecords].sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Get certification history
   */
  getCertificationHistory(
    staff: JurisdictionStaff,
    limit?: number
  ): Certification[] {
    const sorted = [...staff.certifications].sort(
      (a, b) => b.issuedAt.getTime() - a.issuedAt.getTime()
    );

    return limit ? sorted.slice(0, limit) : sorted;
  }

  /**
   * Check if staff can perform role (has required certifications)
   */
  canPerformRole(
    staff: JurisdictionStaff,
    role: string,
    requiredCertifications: Record<string, string[]>
  ): {canPerform: boolean; missing: string[]} {
    const required = requiredCertifications[role] || [];
    return this.meetsCertificationRequirements(staff, required);
  }
}

// Singleton instance
export const trainingCertificationService = new TrainingCertificationService();
