/**
 * Cost Database Module
 * Manages cost databases, material pricing, labor rates, equipment rates,
 * regional adjustments, and automated price updates
 */

// Database manager for CostDatabase CRUD operations
export * from './database-manager.js';

// Material costs using MaterialCost Prisma model
export * from './material-costs.js';

// Labor rates using LaborRate Prisma model
export * from './labor-rates.js';

// Equipment rates using EquipmentRate Prisma model
export * from './equipment-rates.js';

// Regional cost adjustment manager
export * from './regional-adjustment.js';

// Price updater for automated material cost updates
export * from './price-updater.js';

// Re-export enums from Prisma for convenience
export {
  CostDatabaseType,
  MaterialCategory,
  LaborTrade,
  EquipmentCategory,
} from '@prisma/client';
