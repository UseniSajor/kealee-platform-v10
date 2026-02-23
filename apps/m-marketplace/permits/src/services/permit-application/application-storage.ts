/**
 * Application Storage Service
 * Handles save and resume functionality for permit applications
 */

import {WizardFormData} from '@permits/src/components/permit/application-wizard';

export interface SavedApplication {
  id: string;
  userId: string;
  data: Partial<WizardFormData>;
  currentStep: number;
  progress: number; // 0-100
  savedAt: Date;
  expiresAt: Date;
  jurisdictionId?: string;
  permitType?: string;
}

export class ApplicationStorageService {
  private storageKey = 'permit-applications';
  private expirationDays = 30;

  /**
   * Save application progress
   */
  async saveApplication(
    userId: string,
    data: Partial<WizardFormData>,
    currentStep: number
  ): Promise<SavedApplication> {
    const application: SavedApplication = {
      id: `draft-${Date.now()}`,
      userId,
      data,
      currentStep,
      progress: this.calculateProgress(data, currentStep),
      savedAt: new Date(),
      expiresAt: new Date(Date.now() + this.expirationDays * 24 * 60 * 60 * 1000),
      jurisdictionId: data.jurisdictionId,
      permitType: data.permitType,
    };

    // Save to localStorage (temporary)
    const saved = this.getSavedApplications();
    saved.push(application);
    localStorage.setItem(this.storageKey, JSON.stringify(saved));

    // Also save to server for persistence
    try {
      await fetch('/api/permit-applications/drafts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(application),
      });
    } catch (error) {
      console.warn('Failed to save to server, using local storage only:', error);
    }

    return application;
  }

  /**
   * Get saved application
   */
  async getSavedApplication(applicationId: string): Promise<SavedApplication | null> {
    // Try server first
    try {
      const response = await fetch(`/api/permit-applications/drafts/${applicationId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Failed to load from server, trying local storage:', error);
    }

    // Fallback to localStorage
    const saved = this.getSavedApplications();
    const application = saved.find(a => a.id === applicationId);

    if (!application) return null;

    // Check expiration
    if (new Date(application.expiresAt) < new Date()) {
      this.deleteApplication(applicationId);
      return null;
    }

    return application;
  }

  /**
   * Get all saved applications for user
   */
  async getSavedApplications(userId?: string): Promise<SavedApplication[]> {
    // Try server first
    try {
      const url = userId
        ? `/api/permit-applications/drafts?userId=${userId}`
        : '/api/permit-applications/drafts';
      const response = await fetch(url);
      if (response.ok) {
        const applications = await response.json();
        return applications.filter((a: SavedApplication) => 
          new Date(a.expiresAt) > new Date()
        );
      }
    } catch (error) {
      console.warn('Failed to load from server, trying local storage:', error);
    }

    // Fallback to localStorage
    const saved = this.getSavedApplications();
    const filtered = userId
      ? saved.filter(a => a.userId === userId)
      : saved;

    // Filter expired
    const valid = filtered.filter(a => new Date(a.expiresAt) > new Date());

    // Remove expired from storage
    const expired = filtered.filter(a => new Date(a.expiresAt) <= new Date());
    expired.forEach(a => this.deleteApplication(a.id));

    return valid;
  }

  /**
   * Delete saved application
   */
  async deleteApplication(applicationId: string): Promise<void> {
    // Delete from server
    try {
      await fetch(`/api/permit-applications/drafts/${applicationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to delete from server:', error);
    }

    // Delete from localStorage
    const saved = this.getSavedApplications();
    const filtered = saved.filter(a => a.id !== applicationId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Auto-save application progress
   */
  startAutoSave(
    userId: string,
    getFormData: () => Partial<WizardFormData>,
    getCurrentStep: () => number,
    intervalMs: number = 30000 // 30 seconds
  ): () => void {
    const interval = setInterval(async () => {
      const data = getFormData();
      const step = getCurrentStep();

      // Only auto-save if there's meaningful data
      if (this.hasMeaningfulData(data)) {
        await this.saveApplication(userId, data, step);
      }
    }, intervalMs);

    // Return cleanup function
    return () => clearInterval(interval);
  }

  /**
   * Check if form has meaningful data
   */
  private hasMeaningfulData(data: Partial<WizardFormData>): boolean {
    return !!(
      data.projectId ||
      data.propertyId ||
      data.address ||
      data.permitType ||
      data.valuation
    );
  }

  /**
   * Calculate progress percentage
   */
  private calculateProgress(data: Partial<WizardFormData>, currentStep: number): number {
    const totalSteps = 5;
    const stepProgress = (currentStep / totalSteps) * 100;

    // Weight by completed fields
    const requiredFields = [
      'projectId',
      'propertyId',
      'address',
      'permitType',
      'scope',
      'valuation',
      'jurisdictionId',
    ];

    const completedFields = requiredFields.filter(field => {
      const value = (data as any)[field];
      return value !== undefined && value !== null && value !== '';
    }).length;

    const fieldProgress = (completedFields / requiredFields.length) * 100;

    // Average of step and field progress
    return Math.round((stepProgress + fieldProgress) / 2);
  }

  /**
   * Get saved applications from localStorage
   */
  private getSavedApplications(): SavedApplication[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];
      return JSON.parse(stored).map((a: any) => ({
        ...a,
        savedAt: new Date(a.savedAt),
        expiresAt: new Date(a.expiresAt),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Clear expired applications
   */
  async clearExpiredApplications(): Promise<number> {
    const saved = this.getSavedApplications();
    const now = new Date();
    const valid = saved.filter(a => new Date(a.expiresAt) > now);
    const expired = saved.length - valid.length;

    localStorage.setItem(this.storageKey, JSON.stringify(valid));

    // Also clear from server
    try {
      await fetch('/api/permit-applications/drafts/cleanup', {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Failed to cleanup server drafts:', error);
    }

    return expired;
  }
}

// Singleton instance
export const applicationStorageService = new ApplicationStorageService();
