/**
 * Feature Flag System for Gradual Rollout
 *
 * Enables:
 * - Module-level feature flags
 * - Percentage-based rollout
 * - User segment targeting
 * - A/B testing
 * - Kill switches
 *
 * Priority Rollout Order:
 * 1. m-ops-services (complete)
 * 2. m-permits-inspections (complete)
 * 3. m-project-owner (complete)
 * 4. m-architect (complete)
 * 5. m-finance-trust (complete)
 * 6. m-marketplace (partial)
 * 7. m-engineer (new)
 */

// ============ Types ============

export type ModuleId =
  | 'm-ops-services'
  | 'm-permits-inspections'
  | 'm-project-owner'
  | 'm-architect'
  | 'm-finance-trust'
  | 'm-marketplace'
  | 'm-engineer'
  | 'estimation-engine'
  | 'precon-workflow';

export type FeatureStatus = 'enabled' | 'disabled' | 'beta' | 'alpha' | 'deprecated';

export type RolloutStage = 'internal' | 'beta' | 'early_access' | 'general_availability' | 'stable';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  module: ModuleId;
  status: FeatureStatus;
  rolloutPercentage: number; // 0-100
  rolloutStage: RolloutStage;
  enabledForUsers?: string[]; // Specific user IDs
  enabledForRoles?: string[]; // Specific roles
  enabledForOrgs?: string[]; // Specific organizations
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  status: FeatureStatus;
  rolloutStage: RolloutStage;
  rolloutPercentage: number;
  priority: number; // Lower = higher priority
  dependencies: ModuleId[];
  features: string[];
}

export interface UserContext {
  userId: string;
  email?: string;
  role?: string;
  organizationId?: string;
  createdAt?: string;
  metadata?: Record<string, any>;
}

// ============ Module Configuration ============

export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  'm-ops-services': {
    id: 'm-ops-services',
    name: 'Operations Services',
    status: 'enabled',
    rolloutStage: 'stable',
    rolloutPercentage: 100,
    priority: 1,
    dependencies: [],
    features: [
      'gc-subscriptions',
      'a-la-carte-services',
      'roi-calculator',
      'package-comparison',
    ],
  },

  'm-permits-inspections': {
    id: 'm-permits-inspections',
    name: 'Permits & Inspections',
    status: 'enabled',
    rolloutStage: 'stable',
    rolloutPercentage: 100,
    priority: 2,
    dependencies: [],
    features: [
      'permit-tracking',
      'inspection-scheduling',
      'ai-document-review',
      'jurisdiction-support',
    ],
  },

  'm-project-owner': {
    id: 'm-project-owner',
    name: 'Project Owner Portal',
    status: 'enabled',
    rolloutStage: 'stable',
    rolloutPercentage: 100,
    priority: 3,
    dependencies: ['m-finance-trust'],
    features: [
      'project-dashboard',
      'milestone-tracking',
      'contractor-management',
      'precon-workflow',
    ],
  },

  'm-architect': {
    id: 'm-architect',
    name: 'Architecture Services',
    status: 'enabled',
    rolloutStage: 'stable',
    rolloutPercentage: 100,
    priority: 4,
    dependencies: [],
    features: [
      'design-packages',
      'drawing-management',
      'revision-tracking',
      'permit-packages',
    ],
  },

  'm-finance-trust': {
    id: 'm-finance-trust',
    name: 'Finance & Trust Hub',
    status: 'enabled',
    rolloutStage: 'stable',
    rolloutPercentage: 100,
    priority: 5,
    dependencies: [],
    features: [
      'escrow-management',
      'milestone-releases',
      'payment-processing',
      'financial-reporting',
    ],
  },

  'm-marketplace': {
    id: 'm-marketplace',
    name: 'Contractor Marketplace',
    status: 'beta',
    rolloutStage: 'early_access',
    rolloutPercentage: 50,
    priority: 6,
    dependencies: ['m-finance-trust'],
    features: [
      'contractor-listings',
      'lead-generation',
      'bid-management',
      'reviews-ratings',
    ],
  },

  'm-engineer': {
    id: 'm-engineer',
    name: 'Engineering Services',
    status: 'beta',
    rolloutStage: 'beta',
    rolloutPercentage: 25,
    priority: 7,
    dependencies: ['m-finance-trust'],
    features: [
      'structural-engineering',
      'mep-engineering',
      'civil-engineering',
      'geotechnical-services',
    ],
  },

  'estimation-engine': {
    id: 'estimation-engine',
    name: 'Estimation Engine (APP-15)',
    status: 'enabled',
    rolloutStage: 'general_availability',
    rolloutPercentage: 100,
    priority: 3,
    dependencies: [],
    features: [
      'labor-estimation',
      'material-takeoffs',
      'timeline-projection',
      'profit-analysis',
    ],
  },

  'precon-workflow': {
    id: 'precon-workflow',
    name: 'Pre-Construction Workflow',
    status: 'enabled',
    rolloutStage: 'general_availability',
    rolloutPercentage: 100,
    priority: 3,
    dependencies: ['m-project-owner', 'm-finance-trust'],
    features: [
      'design-packages',
      'srp-generation',
      'contractor-bidding',
      'escrow-contracts',
    ],
  },
};

// ============ Feature Flags ============

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Billing Features
  'billing.subscriptions': {
    id: 'billing.subscriptions',
    name: 'Subscription Billing',
    description: 'Enable recurring subscription billing',
    module: 'm-ops-services',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-27',
  },

  'billing.annual-discount': {
    id: 'billing.annual-discount',
    name: 'Annual Billing Discount',
    description: '15% discount for annual subscriptions',
    module: 'm-ops-services',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-27',
  },

  // Pre-Con Features
  'precon.design-packages': {
    id: 'precon.design-packages',
    name: 'Design Packages',
    description: 'Enable design package purchases',
    module: 'precon-workflow',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-27',
  },

  'precon.marketplace-bidding': {
    id: 'precon.marketplace-bidding',
    name: 'Marketplace Bidding',
    description: 'Enable contractor bidding in marketplace',
    module: 'precon-workflow',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-27',
  },

  // Finance Features
  'finance.escrow-deposits': {
    id: 'finance.escrow-deposits',
    name: 'Escrow Deposits',
    description: 'Enable escrow deposit functionality',
    module: 'm-finance-trust',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-27',
  },

  'finance.card-payments': {
    id: 'finance.card-payments',
    name: 'Card Payments for Escrow',
    description: 'Allow card payments for escrow deposits',
    module: 'm-finance-trust',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-27',
  },

  // Engineering Features
  'engineer.quote-system': {
    id: 'engineer.quote-system',
    name: 'Engineering Quote System',
    description: 'Enable engineering quote requests',
    module: 'm-engineer',
    status: 'beta',
    rolloutPercentage: 50,
    rolloutStage: 'beta',
    enabledForRoles: ['admin', 'beta_tester'],
    createdAt: '2024-01-25',
    updatedAt: '2024-01-27',
  },

  'engineer.rush-orders': {
    id: 'engineer.rush-orders',
    name: 'Rush Engineering Orders',
    description: 'Enable rush and emergency engineering orders',
    module: 'm-engineer',
    status: 'alpha',
    rolloutPercentage: 10,
    rolloutStage: 'internal',
    enabledForRoles: ['admin'],
    createdAt: '2024-01-27',
    updatedAt: '2024-01-27',
  },

  // Marketplace Features
  'marketplace.lead-purchase': {
    id: 'marketplace.lead-purchase',
    name: 'Lead Purchase',
    description: 'Enable contractors to purchase leads',
    module: 'm-marketplace',
    status: 'beta',
    rolloutPercentage: 50,
    rolloutStage: 'early_access',
    createdAt: '2024-01-20',
    updatedAt: '2024-01-27',
  },

  'marketplace.premium-listings': {
    id: 'marketplace.premium-listings',
    name: 'Premium Contractor Listings',
    description: 'Enable premium featured listings',
    module: 'm-marketplace',
    status: 'beta',
    rolloutPercentage: 25,
    rolloutStage: 'beta',
    createdAt: '2024-01-22',
    updatedAt: '2024-01-27',
  },

  // Estimation Features
  'estimation.ai-analysis': {
    id: 'estimation.ai-analysis',
    name: 'AI-Powered Estimation',
    description: 'Use AI for cost estimation analysis',
    module: 'estimation-engine',
    status: 'enabled',
    rolloutPercentage: 100,
    rolloutStage: 'stable',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-27',
  },
};

// ============ Feature Flag Service ============

class FeatureFlagService {
  private overrides: Map<string, boolean> = new Map();

  /**
   * Check if a module is enabled
   */
  isModuleEnabled(moduleId: ModuleId, context?: UserContext): boolean {
    const config = MODULE_CONFIGS[moduleId];
    if (!config) return false;

    // Check if module status allows access
    if (config.status === 'disabled' || config.status === 'deprecated') {
      return false;
    }

    // Check dependencies
    for (const dep of config.dependencies) {
      if (!this.isModuleEnabled(dep, context)) {
        return false;
      }
    }

    // Check rollout percentage
    if (context?.userId) {
      return this.isInRollout(context.userId, config.rolloutPercentage);
    }

    return config.rolloutPercentage === 100;
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(featureId: string, context?: UserContext): boolean {
    // Check for overrides first
    const override = this.overrides.get(featureId);
    if (override !== undefined) {
      return override;
    }

    const flag = FEATURE_FLAGS[featureId];
    if (!flag) return false;

    // Check feature status
    if (flag.status === 'disabled' || flag.status === 'deprecated') {
      return false;
    }

    // Check if module is enabled
    if (!this.isModuleEnabled(flag.module, context)) {
      return false;
    }

    // Check user-specific enablement
    if (context) {
      if (flag.enabledForUsers?.includes(context.userId)) {
        return true;
      }
      if (flag.enabledForRoles && context.role && flag.enabledForRoles.includes(context.role)) {
        return true;
      }
      if (flag.enabledForOrgs && context.organizationId && flag.enabledForOrgs.includes(context.organizationId)) {
        return true;
      }
    }

    // Check rollout percentage
    if (context?.userId) {
      return this.isInRollout(context.userId, flag.rolloutPercentage);
    }

    return flag.rolloutPercentage === 100;
  }

  /**
   * Get all enabled features for a user
   */
  getEnabledFeatures(context: UserContext): string[] {
    return Object.keys(FEATURE_FLAGS).filter((featureId) =>
      this.isFeatureEnabled(featureId, context)
    );
  }

  /**
   * Get module status
   */
  getModuleStatus(moduleId: ModuleId): ModuleConfig | null {
    return MODULE_CONFIGS[moduleId] || null;
  }

  /**
   * Get all modules sorted by priority
   */
  getModulesByPriority(): ModuleConfig[] {
    return Object.values(MODULE_CONFIGS).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Set feature override (for testing/admin)
   */
  setOverride(featureId: string, enabled: boolean): void {
    this.overrides.set(featureId, enabled);
  }

  /**
   * Clear feature override
   */
  clearOverride(featureId: string): void {
    this.overrides.delete(featureId);
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Update rollout percentage for a feature
   */
  updateRolloutPercentage(featureId: string, percentage: number): boolean {
    const flag = FEATURE_FLAGS[featureId];
    if (!flag) return false;

    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    flag.updatedAt = new Date().toISOString();
    return true;
  }

  /**
   * Update module rollout percentage
   */
  updateModuleRollout(moduleId: ModuleId, percentage: number): boolean {
    const config = MODULE_CONFIGS[moduleId];
    if (!config) return false;

    config.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    return true;
  }

  /**
   * Check if user is in rollout based on percentage
   */
  private isInRollout(userId: string, percentage: number): boolean {
    if (percentage === 100) return true;
    if (percentage === 0) return false;

    // Consistent hashing based on user ID
    const hash = this.hashString(userId);
    const bucket = hash % 100;
    return bucket < percentage;
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get rollout report
   */
  getRolloutReport(): {
    modules: Array<{ id: string; name: string; status: string; rollout: number; stage: string }>;
    features: Array<{ id: string; name: string; status: string; rollout: number; module: string }>;
  } {
    const modules = Object.values(MODULE_CONFIGS).map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      rollout: m.rolloutPercentage,
      stage: m.rolloutStage,
    }));

    const features = Object.values(FEATURE_FLAGS).map((f) => ({
      id: f.id,
      name: f.name,
      status: f.status,
      rollout: f.rolloutPercentage,
      module: f.module,
    }));

    return { modules, features };
  }
}

// ============ Export Singleton ============

export const featureFlags = new FeatureFlagService();

// ============ React Hook (for frontend) ============

export function useFeatureFlag(featureId: string, context?: UserContext): boolean {
  return featureFlags.isFeatureEnabled(featureId, context);
}

export function useModuleEnabled(moduleId: ModuleId, context?: UserContext): boolean {
  return featureFlags.isModuleEnabled(moduleId, context);
}

// ============ Express/Fastify Middleware ============

export function requireFeature(featureId: string) {
  return (request: any, reply: any, next?: () => void) => {
    const context: UserContext = {
      userId: request.userId || request.user?.id,
      role: request.userRole || request.user?.role,
      organizationId: request.organizationId || request.user?.organizationId,
    };

    if (!featureFlags.isFeatureEnabled(featureId, context)) {
      if (reply.status) {
        return reply.status(404).send({ error: 'Feature not available' });
      }
      return reply.sendStatus?.(404);
    }

    next?.();
  };
}

export function requireModule(moduleId: ModuleId) {
  return (request: any, reply: any, next?: () => void) => {
    const context: UserContext = {
      userId: request.userId || request.user?.id,
      role: request.userRole || request.user?.role,
      organizationId: request.organizationId || request.user?.organizationId,
    };

    if (!featureFlags.isModuleEnabled(moduleId, context)) {
      if (reply.status) {
        return reply.status(404).send({ error: 'Module not available' });
      }
      return reply.sendStatus?.(404);
    }

    next?.();
  };
}

export default featureFlags;
