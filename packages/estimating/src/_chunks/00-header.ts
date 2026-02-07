// ============================================================
// Kealee Platform – Marketplace Assembly Seed Data
// DC-Baltimore Corridor · 2024-2025 Pricing
// ============================================================

export interface MarketplaceAssembly {
  code: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  materialCostLow: number;
  materialCostMid: number;
  materialCostHigh: number;
  laborCostLow: number;
  laborCostMid: number;
  laborCostHigh: number;
  laborHoursPerUnit?: number;
  regionMultiplier: Record<string, number>;
  tradesRequired: string[];
  complexity: string;
  tags: string[];
}

const DC_BALT_REGION: Record<string, number> = {
  DC: 1.15,
  Baltimore: 1.0,
  Frederick: 0.9,
  NoVA: 1.2,
  Annapolis: 1.05,
  Columbia: 1.08,
  Bethesda: 1.18,
  "Silver Spring": 1.12,
  Rockville: 1.14,
  Towson: 1.02,
};

const R = DC_BALT_REGION;

export const MARKETPLACE_ASSEMBLIES: MarketplaceAssembly[] = [
