/**
 * Jurisdiction Loader
 * Handles loading and detecting jurisdictions for permit applications
 */

import { api } from './api/client';

export interface Jurisdiction {
  id: string;
  name: string;
  code: string;
  state: string;
  county?: string;
  city?: string;
  portalUrl?: string;
  requiredDocuments?: Record<string, string[]>;
  feeSchedule?: Record<string, any>;
  avgReviewDays?: number;
  firstTimeApprovalRate?: number;
}

export interface DetectedJurisdiction {
  city?: string;
  county?: string;
  state: string;
  country: string;
  zipCode?: string;
  jurisdictionCode?: string;
  detectedJurisdiction?: string;
}

/**
 * Load all available jurisdictions
 */
export async function loadJurisdictions(): Promise<Jurisdiction[]> {
  try {
    const response = await api.jurisdictions.list();
    return response.jurisdictions || [];
  } catch (error) {
    console.error('Failed to load jurisdictions:', error);
    return [];
  }
}

/**
 * Detect jurisdiction from address using Google Places API
 */
export async function detectJurisdiction(
  address: string
): Promise<DetectedJurisdiction | null> {
  try {
    const response = await api.places.detectJurisdiction(address);
    return response.jurisdiction || null;
  } catch (error) {
    console.error('Failed to detect jurisdiction:', error);
    return null;
  }
}

/**
 * Get jurisdiction details by ID
 */
export async function getJurisdiction(
  id: string
): Promise<Jurisdiction | null> {
  try {
    const response = await api.jurisdictions.get(id);
    return response.jurisdiction || null;
  } catch (error) {
    console.error('Failed to get jurisdiction:', error);
    return null;
  }
}

/**
 * Find jurisdiction by code (e.g., "US-DC-DC", "US-MD-MONT")
 */
export async function findJurisdictionByCode(
  code: string
): Promise<Jurisdiction | null> {
  const jurisdictions = await loadJurisdictions();
  return (
    jurisdictions.find((j) => j.code === code) ||
    jurisdictions.find((j) => j.code?.toLowerCase() === code.toLowerCase()) ||
    null
  );
}

