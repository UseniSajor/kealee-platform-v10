/**
 * Mobile App Provisioning Service
 * Manages mobile device provisioning for field staff
 */

import {JurisdictionStaff} from '@permits/src/types/jurisdiction-staff';

export interface MobileDevice {
  id: string;
  staffId: string;
  deviceId: string;
  deviceType: 'ios' | 'android';
  deviceName?: string;
  osVersion?: string;
  appVersion?: string;
  lastSeen: Date;
  isActive: boolean;
  provisioningStatus: 'pending' | 'provisioned' | 'revoked' | 'expired';
  provisionedAt?: Date;
  revokedAt?: Date;
}

export interface ProvisioningRequest {
  staffId: string;
  deviceId: string;
  deviceType: 'ios' | 'android';
  deviceName?: string;
  requestedAt: Date;
}

export class MobileProvisioningService {
  private devices: Map<string, MobileDevice> = new Map();

  /**
   * Provision mobile device for staff
   */
  async provisionDevice(
    staff: JurisdictionStaff,
    request: ProvisioningRequest
  ): Promise<{success: boolean; device: MobileDevice; accessToken?: string}> {
    // Check if staff is eligible for mobile access
    if (!this.isEligibleForMobile(staff)) {
      return {
        success: false,
        device: null as any,
      };
    }

    // Check if device already exists
    const existingDevice = Array.from(this.devices.values()).find(
      d => d.deviceId === request.deviceId
    );

    if (existingDevice) {
      // Reactivate if revoked
      if (existingDevice.provisioningStatus === 'revoked') {
        const updatedDevice: MobileDevice = {
          ...existingDevice,
          isActive: true,
          provisioningStatus: 'provisioned',
          provisionedAt: new Date(),
          revokedAt: undefined,
        };
        this.devices.set(existingDevice.id, updatedDevice);

        return {
          success: true,
          device: updatedDevice,
          accessToken: this.generateAccessToken(staff.id, request.deviceId),
        };
      }

      return {
        success: true,
        device: existingDevice,
        accessToken: this.generateAccessToken(staff.id, request.deviceId),
      };
    }

    // Create new device
    const device: MobileDevice = {
      id: `device-${Date.now()}`,
      staffId: staff.id,
      deviceId: request.deviceId,
      deviceType: request.deviceType,
      deviceName: request.deviceName,
      lastSeen: new Date(),
      isActive: true,
      provisioningStatus: 'provisioned',
      provisionedAt: new Date(),
    };

    this.devices.set(device.id, device);

    // Update staff record
    const updatedStaff: JurisdictionStaff = {
      ...staff,
      mobileDeviceId: device.id,
      lastActive: new Date(),
    };

    return {
      success: true,
      device,
      accessToken: this.generateAccessToken(staff.id, request.deviceId),
    };
  }

  /**
   * Revoke mobile device access
   */
  async revokeDevice(deviceId: string, reason?: string): Promise<boolean> {
    const device = Array.from(this.devices.values()).find(
      d => d.deviceId === deviceId
    );

    if (!device) return false;

    const updatedDevice: MobileDevice = {
      ...device,
      isActive: false,
      provisioningStatus: 'revoked',
      revokedAt: new Date(),
    };

    this.devices.set(device.id, updatedDevice);
    return true;
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(
    deviceId: string,
    updates: {
      lastSeen?: Date;
      appVersion?: string;
      osVersion?: string;
      location?: {latitude: number; longitude: number};
    }
  ): Promise<MobileDevice | null> {
    const device = Array.from(this.devices.values()).find(
      d => d.deviceId === deviceId
    );

    if (!device) return null;

    const updatedDevice: MobileDevice = {
      ...device,
      lastSeen: updates.lastSeen || device.lastSeen,
      appVersion: updates.appVersion || device.appVersion,
      osVersion: updates.osVersion || device.osVersion,
    };

    this.devices.set(device.id, updatedDevice);
    return updatedDevice;
  }

  /**
   * Get devices for staff
   */
  getStaffDevices(staffId: string): MobileDevice[] {
    return Array.from(this.devices.values()).filter(d => d.staffId === staffId);
  }

  /**
   * Get all provisioned devices
   */
  getAllDevices(): MobileDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Check device status
   */
  async checkDeviceStatus(deviceId: string): Promise<{
    exists: boolean;
    isActive: boolean;
    status: string;
    lastSeen?: Date;
  }> {
    const device = Array.from(this.devices.values()).find(
      d => d.deviceId === deviceId
    );

    if (!device) {
      return {
        exists: false,
        isActive: false,
        status: 'not_found',
      };
    }

    return {
      exists: true,
      isActive: device.isActive,
      status: device.provisioningStatus,
      lastSeen: device.lastSeen,
    };
  }

  /**
   * Check if staff is eligible for mobile access
   */
  private isEligibleForMobile(staff: JurisdictionStaff): boolean {
    // Only inspectors and supervisors get mobile access
    const eligibleRoles: string[] = ['INSPECTOR', 'SUPERVISOR'];
    return eligibleRoles.includes(staff.role);
  }

  /**
   * Generate access token for mobile app
   */
  private generateAccessToken(staffId: string, deviceId: string): string {
    // In production, use JWT or similar
    const payload = {
      staffId,
      deviceId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    // Return base64 encoded token (in production, use proper JWT)
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Validate access token
   */
  validateAccessToken(token: string): {valid: boolean; staffId?: string; deviceId?: string} {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      
      if (payload.expiresAt < Date.now()) {
        return {valid: false};
      }

      return {
        valid: true,
        staffId: payload.staffId,
        deviceId: payload.deviceId,
      };
    } catch {
      return {valid: false};
    }
  }

  /**
   * Get device statistics
   */
  getDeviceStatistics(): {
    total: number;
    active: number;
    provisioned: number;
    revoked: number;
    byType: {ios: number; android: number};
  } {
    const allDevices = Array.from(this.devices.values());

    return {
      total: allDevices.length,
      active: allDevices.filter(d => d.isActive).length,
      provisioned: allDevices.filter(d => d.provisioningStatus === 'provisioned').length,
      revoked: allDevices.filter(d => d.provisioningStatus === 'revoked').length,
      byType: {
        ios: allDevices.filter(d => d.deviceType === 'ios').length,
        android: allDevices.filter(d => d.deviceType === 'android').length,
      },
    };
  }
}

// Singleton instance
export const mobileProvisioningService = new MobileProvisioningService();
