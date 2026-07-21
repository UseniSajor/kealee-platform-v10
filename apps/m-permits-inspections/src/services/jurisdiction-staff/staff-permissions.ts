/**
 * Staff Permissions Service
 * Manages role-based permissions for jurisdiction staff
 */

import {StaffRole, StaffPermission, RolePermission} from '@/types/jurisdiction-staff';

export class StaffPermissionsService {
  private static rolePermissions: Map<StaffRole, StaffPermission[]> = new Map();

  /**
   * Initialize default permissions for each role
   */
  static initialize() {
    // Administrator - Full access
    this.rolePermissions.set('ADMINISTRATOR', [
      {id: 'perm-1', key: 'jurisdiction.manage', name: 'Manage Jurisdiction', category: 'admin'},
      {id: 'perm-2', key: 'staff.manage', name: 'Manage Staff', category: 'admin'},
      {id: 'perm-3', key: 'staff.view_all', name: 'View All Staff', category: 'admin'},
      {id: 'perm-4', key: 'permit.view_all', name: 'View All Permits', category: 'permit'},
      {id: 'perm-5', key: 'permit.approve', name: 'Approve Permits', category: 'permit'},
      {id: 'perm-6', key: 'inspection.view_all', name: 'View All Inspections', category: 'inspection'},
      {id: 'perm-7', key: 'review.view_all', name: 'View All Reviews', category: 'review'},
      {id: 'perm-8', key: 'report.generate', name: 'Generate Reports', category: 'reporting'},
      {id: 'perm-9', key: 'settings.configure', name: 'Configure Settings', category: 'admin'},
    ]);

    // Supervisor - Management access
    this.rolePermissions.set('SUPERVISOR', [
      {id: 'perm-10', key: 'staff.view', name: 'View Staff', category: 'admin'},
      {id: 'perm-11', key: 'staff.assign', name: 'Assign Work', category: 'admin'},
      {id: 'perm-12', key: 'permit.view_all', name: 'View All Permits', category: 'permit'},
      {id: 'perm-13', key: 'permit.approve', name: 'Approve Permits', category: 'permit'},
      {id: 'perm-14', key: 'inspection.view_all', name: 'View All Inspections', category: 'inspection'},
      {id: 'perm-15', key: 'review.view_all', name: 'View All Reviews', category: 'review'},
      {id: 'perm-16', key: 'review.supervise', name: 'Supervise Reviews', category: 'review'},
      {id: 'perm-17', key: 'report.generate', name: 'Generate Reports', category: 'reporting'},
    ]);

    // Plan Reviewer - Review access
    this.rolePermissions.set('PLAN_REVIEWER', [
      {id: 'perm-18', key: 'permit.view_assigned', name: 'View Assigned Permits', category: 'permit'},
      {id: 'perm-19', key: 'review.create', name: 'Create Reviews', category: 'review'},
      {id: 'perm-20', key: 'review.edit', name: 'Edit Reviews', category: 'review'},
      {id: 'perm-21', key: 'review.complete', name: 'Complete Reviews', category: 'review'},
      {id: 'perm-22', key: 'document.view', name: 'View Documents', category: 'permit'},
      {id: 'perm-23', key: 'document.markup', name: 'Markup Documents', category: 'review'},
      {id: 'perm-24', key: 'comment.add', name: 'Add Comments', category: 'review'},
    ]);

    // Inspector - Inspection access
    this.rolePermissions.set('INSPECTOR', [
      {id: 'perm-25', key: 'inspection.view_assigned', name: 'View Assigned Inspections', category: 'inspection'},
      {id: 'perm-26', key: 'inspection.schedule', name: 'Schedule Inspections', category: 'inspection'},
      {id: 'perm-27', key: 'inspection.complete', name: 'Complete Inspections', category: 'inspection'},
      {id: 'perm-28', key: 'inspection.photo', name: 'Upload Photos', category: 'inspection'},
      {id: 'perm-29', key: 'inspection.signature', name: 'Collect Signatures', category: 'inspection'},
      {id: 'perm-30', key: 'permit.view_inspection', name: 'View Permit for Inspection', category: 'permit'},
      {id: 'perm-31', key: 'mobile.access', name: 'Access Mobile App', category: 'inspection'},
    ]);

    // Permit Coordinator - Permit management
    this.rolePermissions.set('PERMIT_COORDINATOR', [
      {id: 'perm-32', key: 'permit.view_all', name: 'View All Permits', category: 'permit'},
      {id: 'perm-33', key: 'permit.create', name: 'Create Permits', category: 'permit'},
      {id: 'perm-34', key: 'permit.edit', name: 'Edit Permits', category: 'permit'},
      {id: 'perm-35', key: 'permit.assign', name: 'Assign Permits', category: 'permit'},
      {id: 'perm-36', key: 'permit.issue', name: 'Issue Permits', category: 'permit'},
      {id: 'perm-37', key: 'document.upload', name: 'Upload Documents', category: 'permit'},
      {id: 'perm-38', key: 'fee.calculate', name: 'Calculate Fees', category: 'permit'},
      {id: 'perm-39', key: 'applicant.communicate', name: 'Communicate with Applicants', category: 'permit'},
    ]);
  }

  /**
   * Get permissions for a role
   */
  static getRolePermissions(role: StaffRole): StaffPermission[] {
    if (this.rolePermissions.size === 0) {
      this.initialize();
    }
    return this.rolePermissions.get(role) || [];
  }

  /**
   * Check if role has permission
   */
  static hasPermission(role: StaffRole, permissionKey: string): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.some(p => p.key === permissionKey);
  }

  /**
   * Get all role permissions
   */
  static getAllRolePermissions(): RolePermission[] {
    if (this.rolePermissions.size === 0) {
      this.initialize();
    }

    return Array.from(this.rolePermissions.entries()).map(([role, permissions]) => ({
      role,
      permissions,
    }));
  }

  /**
   * Check if user can perform action
   */
  static canPerformAction(
    role: StaffRole,
    action: string,
    resource?: {type: string; id: string}
  ): boolean {
    // Check base permission
    if (!this.hasPermission(role, action)) {
      return false;
    }

    // Additional resource-specific checks can be added here
    return true;
  }
}

// Initialize on module load
StaffPermissionsService.initialize();
