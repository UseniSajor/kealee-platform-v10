/**
 * RS Means Importer
 * Import cost data from RS Means
 */

import { PrismaClient, MaterialCategory, AssemblyCategory, AssemblyItemType } from '@prisma/client';
import { randomUUID as uuid } from 'crypto';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

export interface RSMeansItem {
  lineNumber: string;
  description: string;
  crew: string;
  dailyOutput: number;
  laborHours: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
  cityIndex?: number;
}

export interface RSMeansAssembly {
  assemblyNumber: string;
  description: string;
  unit: string;
  components: RSMeansItem[];
  totalMaterial: number;
  totalLabor: number;
  totalEquipment: number;
  totalCost: number;
}

export interface ImportOptions {
  databaseId: string;
  cityCode?: string;
  year?: number;
  applyIndex?: boolean;
  overwriteExisting?: boolean;
  categories?: string[];
}

export interface ImportResult {
  success: boolean;
  itemsImported: number;
  assembliesImported: number;
  itemsSkipped: number;
  errors: string[];
  importedAt: Date;
}

export class RSMeansImporter {
  // City cost indices (sample data - would be updated from RS Means in production)
  private readonly cityIndices: Record<string, number> = {
    'NATIONAL': 1.0,
    'NEW_YORK_NY': 1.32,
    'LOS_ANGELES_CA': 1.14,
    'CHICAGO_IL': 1.15,
    'HOUSTON_TX': 0.92,
    'PHOENIX_AZ': 0.93,
    'PHILADELPHIA_PA': 1.17,
    'SAN_ANTONIO_TX': 0.87,
    'SAN_DIEGO_CA': 1.11,
    'DALLAS_TX': 0.90,
    'SAN_JOSE_CA': 1.28,
    'AUSTIN_TX': 0.89,
    'SEATTLE_WA': 1.09,
    'DENVER_CO': 0.97,
    'BOSTON_MA': 1.21,
    'ATLANTA_GA': 0.91,
    'MIAMI_FL': 0.94,
  };

  /**
   * Import items from RS Means data to MaterialCost table
   */
  async importItems(
    items: RSMeansItem[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      itemsImported: 0,
      assembliesImported: 0,
      itemsSkipped: 0,
      errors: [],
      importedAt: new Date(),
    };

    const cityIndex = options.applyIndex && options.cityCode
      ? this.cityIndices[options.cityCode] || 1.0
      : 1.0;

    for (const item of items) {
      try {
        // Check if category is in filter
        if (options.categories && options.categories.length > 0) {
          const itemCategory = item.lineNumber.substring(0, 2);
          if (!options.categories.includes(itemCategory)) {
            result.itemsSkipped++;
            continue;
          }
        }

        // Check for existing item by csiCode
        const existing = await prisma.materialCost.findFirst({
          where: {
            costDatabaseId: options.databaseId,
            csiCode: item.lineNumber,
          },
        });

        if (existing && !options.overwriteExisting) {
          result.itemsSkipped++;
          continue;
        }

        // Apply city index and calculate unit cost (total of material + labor + equipment)
        const adjustedMaterial = new Decimal(item.materialCost).times(cityIndex);
        const adjustedLabor = new Decimal(item.laborCost).times(cityIndex);
        const adjustedEquipment = new Decimal(item.equipmentCost).times(cityIndex);
        const adjustedTotal = adjustedMaterial.plus(adjustedLabor).plus(adjustedEquipment);

        const data = {
          csiCode: item.lineNumber,
          csiDivision: this.getCsiDivision(item.lineNumber),
          name: item.description,
          description: `Crew: ${item.crew}, Daily Output: ${item.dailyOutput}`,
          category: this.getMaterialCategory(item.lineNumber),
          subcategory: this.getSubcategory(item.lineNumber),
          unit: item.unit,
          unitCost: adjustedTotal.toNumber(),
          minCost: adjustedTotal.times(0.85).toNumber(),
          maxCost: adjustedTotal.times(1.15).toNumber(),
          isActive: true,
          lastUpdated: new Date(),
          metadata: {
            source: 'RS_MEANS',
            originalCosts: {
              material: item.materialCost,
              labor: item.laborCost,
              equipment: item.equipmentCost,
            },
            adjustedCosts: {
              material: adjustedMaterial.toNumber(),
              labor: adjustedLabor.toNumber(),
              equipment: adjustedEquipment.toNumber(),
            },
            crew: item.crew,
            dailyOutput: item.dailyOutput,
            laborHours: item.laborHours,
            cityIndex,
            cityCode: options.cityCode || 'NATIONAL',
            year: options.year || new Date().getFullYear(),
          },
          updatedAt: new Date(),
        };

        if (existing) {
          await prisma.materialCost.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.materialCost.create({
            data: {
              id: uuid(),
              costDatabaseId: options.databaseId,
              ...data,
            },
          });
        }

        result.itemsImported++;

      } catch (error) {
        result.errors.push(`${item.lineNumber}: ${error}`);
      }
    }

    result.success = result.errors.length === 0;

    // Log import result
    this.logImport(options, result);

    return result;
  }

  /**
   * Import assemblies from RS Means data
   */
  async importAssemblies(
    assemblies: RSMeansAssembly[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      itemsImported: 0,
      assembliesImported: 0,
      itemsSkipped: 0,
      errors: [],
      importedAt: new Date(),
    };

    const cityIndex = options.applyIndex && options.cityCode
      ? this.cityIndices[options.cityCode] || 1.0
      : 1.0;

    for (const assembly of assemblies) {
      try {
        // Check if category is in filter
        if (options.categories && options.categories.length > 0) {
          const assemblyCategory = assembly.assemblyNumber.substring(0, 2);
          if (!options.categories.includes(assemblyCategory)) {
            result.itemsSkipped++;
            continue;
          }
        }

        // Check for existing assembly by csiCode
        const existing = await prisma.assembly.findFirst({
          where: {
            costDatabaseId: options.databaseId,
            csiCode: assembly.assemblyNumber,
          },
        });

        if (existing && !options.overwriteExisting) {
          result.itemsSkipped++;
          continue;
        }

        // Calculate totals with city index
        const adjustedMaterial = new Decimal(assembly.totalMaterial).times(cityIndex);
        const adjustedLabor = new Decimal(assembly.totalLabor).times(cityIndex);
        const adjustedEquipment = new Decimal(assembly.totalEquipment).times(cityIndex);
        const adjustedTotal = adjustedMaterial.plus(adjustedLabor).plus(adjustedEquipment);

        // Calculate total labor hours from components
        const totalLaborHours = assembly.components.reduce(
          (sum, comp) => sum + comp.laborHours,
          0
        );

        const assemblyData = {
          csiCode: assembly.assemblyNumber,
          name: assembly.description,
          category: this.getAssemblyCategory(assembly.assemblyNumber),
          subcategory: this.getSubcategory(assembly.assemblyNumber),
          unit: assembly.unit,
          unitCost: adjustedTotal.toNumber(),
          materialCost: adjustedMaterial.toNumber(),
          laborCost: adjustedLabor.toNumber(),
          equipmentCost: adjustedEquipment.toNumber(),
          laborHours: totalLaborHours,
          isActive: true,
          metadata: {
            source: 'RS_MEANS',
            originalCosts: {
              material: assembly.totalMaterial,
              labor: assembly.totalLabor,
              equipment: assembly.totalEquipment,
            },
            cityIndex,
            cityCode: options.cityCode || 'NATIONAL',
            year: options.year || new Date().getFullYear(),
          },
          updatedAt: new Date(),
        };

        let assemblyId: string;

        if (existing) {
          await prisma.assembly.update({
            where: { id: existing.id },
            data: assemblyData,
          });
          assemblyId = existing.id;

          // Delete existing assembly items to replace them
          await prisma.assemblyItem.deleteMany({
            where: { assemblyId: existing.id },
          });
        } else {
          assemblyId = uuid();
          await prisma.assembly.create({
            data: {
              id: assemblyId,
              costDatabaseId: options.databaseId,
              ...assemblyData,
            },
          });
        }

        // Create AssemblyItem records for each component
        for (let index = 0; index < assembly.components.length; index++) {
          const comp = assembly.components[index];
          const compUnitCost = new Decimal(comp.totalCost).times(cityIndex).toNumber();

          await prisma.assemblyItem.create({
            data: {
              id: uuid(),
              assemblyId,
              itemType: this.getAssemblyItemType(comp),
              description: comp.description,
              quantity: 1,
              unit: comp.unit,
              unitCost: compUnitCost,
              totalCost: compUnitCost,
              laborHours: comp.laborHours,
              sortOrder: index,
              notes: `RS Means Line: ${comp.lineNumber}, Crew: ${comp.crew}`,
            },
          });
        }

        result.assembliesImported++;

      } catch (error) {
        result.errors.push(`${assembly.assemblyNumber}: ${error}`);
      }
    }

    result.success = result.errors.length === 0;

    // Log import result
    this.logImport(options, result);

    return result;
  }

  /**
   * Get available city indices
   */
  getCityIndices(): { code: string; name: string; index: number }[] {
    return Object.entries(this.cityIndices).map(([code, index]) => ({
      code,
      name: code.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      index,
    }));
  }

  /**
   * Apply city index to costs
   */
  applyCityIndex(
    costs: { material: number; labor: number; equipment: number },
    cityCode: string
  ): { material: number; labor: number; equipment: number; total: number } {
    const index = this.cityIndices[cityCode] || 1.0;

    return {
      material: new Decimal(costs.material).times(index).toNumber(),
      labor: new Decimal(costs.labor).times(index).toNumber(),
      equipment: new Decimal(costs.equipment).times(index).toNumber(),
      total: new Decimal(costs.material + costs.labor + costs.equipment)
        .times(index)
        .toNumber(),
    };
  }

  /**
   * Get CSI division number from RS Means code
   */
  private getCsiDivision(code: string): number {
    const divCode = code.substring(0, 2);
    return parseInt(divCode, 10) || 0;
  }

  /**
   * Get MaterialCategory enum from RS Means code
   */
  private getMaterialCategory(code: string): MaterialCategory {
    const divCode = code.substring(0, 2);
    const categoryMap: Record<string, MaterialCategory> = {
      '01': MaterialCategory.GENERAL_CONDITIONS,
      '02': MaterialCategory.EARTHWORK,
      '03': MaterialCategory.CONCRETE,
      '04': MaterialCategory.MASONRY,
      '05': MaterialCategory.METALS,
      '06': MaterialCategory.WOOD_PLASTICS_COMPOSITES,
      '07': MaterialCategory.THERMAL_MOISTURE,
      '08': MaterialCategory.OPENINGS,
      '09': MaterialCategory.FINISHES,
      '10': MaterialCategory.SPECIALTIES,
      '11': MaterialCategory.EQUIPMENT_MATERIAL,
      '12': MaterialCategory.FURNISHINGS,
      '13': MaterialCategory.SPECIAL_CONSTRUCTION,
      '14': MaterialCategory.CONVEYING,
      '21': MaterialCategory.FIRE_SUPPRESSION,
      '22': MaterialCategory.PLUMBING_MATERIAL,
      '23': MaterialCategory.HVAC_MATERIAL,
      '26': MaterialCategory.ELECTRICAL_MATERIAL,
      '27': MaterialCategory.COMMUNICATIONS,
      '28': MaterialCategory.ELECTRONIC_SAFETY,
      '31': MaterialCategory.EARTHWORK,
      '32': MaterialCategory.EXTERIOR_IMPROVEMENTS,
      '33': MaterialCategory.UTILITIES,
    };

    return categoryMap[divCode] || MaterialCategory.OTHER_MATERIAL;
  }

  /**
   * Get AssemblyCategory enum from RS Means code
   */
  private getAssemblyCategory(code: string): AssemblyCategory {
    const divCode = code.substring(0, 2);
    const categoryMap: Record<string, AssemblyCategory> = {
      '01': AssemblyCategory.GENERAL_CONDITIONS_ASSEMBLY,
      '02': AssemblyCategory.DEMOLITION_ASSEMBLY,
      '03': AssemblyCategory.FOUNDATIONS,
      '04': AssemblyCategory.FOUNDATIONS,
      '05': AssemblyCategory.FRAMING,
      '06': AssemblyCategory.FRAMING,
      '07': AssemblyCategory.ROOFING_ASSEMBLY,
      '08': AssemblyCategory.DOORS_HARDWARE,
      '09': AssemblyCategory.INTERIOR_FINISHES,
      '10': AssemblyCategory.INTERIOR_FINISHES,
      '11': AssemblyCategory.OTHER_ASSEMBLY,
      '12': AssemblyCategory.CABINETRY,
      '13': AssemblyCategory.OTHER_ASSEMBLY,
      '14': AssemblyCategory.OTHER_ASSEMBLY,
      '21': AssemblyCategory.PLUMBING_ROUGH,
      '22': AssemblyCategory.PLUMBING_ROUGH,
      '23': AssemblyCategory.HVAC_ROUGH,
      '26': AssemblyCategory.ELECTRICAL_ROUGH,
      '27': AssemblyCategory.ELECTRICAL_ROUGH,
      '28': AssemblyCategory.ELECTRICAL_ROUGH,
      '31': AssemblyCategory.SITEWORK,
      '32': AssemblyCategory.SITEWORK,
      '33': AssemblyCategory.SITEWORK,
    };

    return categoryMap[divCode] || AssemblyCategory.OTHER_ASSEMBLY;
  }

  /**
   * Get subcategory from RS Means code
   */
  private getSubcategory(code: string): string {
    // RS Means codes typically have format: XX YY ZZ
    // where XX is division, YY is subdivision, ZZ is specific item
    const parts = code.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return code.substring(0, 5);
  }

  /**
   * Get AssemblyItemType from RS Means item
   */
  private getAssemblyItemType(item: RSMeansItem): AssemblyItemType {
    // Determine component type based on cost distribution
    const total = item.materialCost + item.laborCost + item.equipmentCost;
    if (total === 0) return AssemblyItemType.OTHER_ITEM;

    const materialRatio = item.materialCost / total;
    const laborRatio = item.laborCost / total;
    const equipmentRatio = item.equipmentCost / total;

    if (materialRatio > 0.5) return AssemblyItemType.MATERIAL_ITEM;
    if (laborRatio > 0.5) return AssemblyItemType.LABOR_ITEM;
    if (equipmentRatio > 0.5) return AssemblyItemType.EQUIPMENT_ITEM;
    if (materialRatio > laborRatio && materialRatio > equipmentRatio) return AssemblyItemType.MATERIAL_ITEM;
    if (laborRatio > equipmentRatio) return AssemblyItemType.LABOR_ITEM;
    return AssemblyItemType.EQUIPMENT_ITEM;
  }

  /**
   * Log import result (console logging since importLog model doesn't exist)
   */
  private logImport(
    options: ImportOptions,
    result: ImportResult
  ): void {
    const logEntry = {
      source: 'RS_MEANS',
      databaseId: options.databaseId,
      itemsImported: result.itemsImported,
      assembliesImported: result.assembliesImported,
      itemsSkipped: result.itemsSkipped,
      errors: result.errors,
      options: {
        cityCode: options.cityCode,
        year: options.year,
        applyIndex: options.applyIndex,
        categories: options.categories,
      },
      importedAt: result.importedAt,
    };

    console.log('[RS Means Import]', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Get import history from cost database metadata
   */
  async getImportHistory(
    databaseId: string
  ): Promise<{
    source: string;
    itemsImported: number;
    assembliesImported: number;
    importedAt: Date;
  }[]> {
    // Since there's no importLog model, we can check the costDatabase metadata
    // or return material/assembly counts as a summary
    const database = await prisma.costDatabase.findUnique({
      where: { id: databaseId },
      include: {
        _count: {
          select: {
            materials: true,
            assemblies: true,
          },
        },
      },
    });

    if (!database) {
      return [];
    }

    // Return a summary based on the database metadata if available
    const metadata = database.metadata as Record<string, unknown> | null;
    const importHistory = (metadata?.importHistory as Array<{
      source: string;
      itemsImported: number;
      assembliesImported: number;
      importedAt: string;
    }>) || [];

    return importHistory.map((log: {
      source: string;
      itemsImported: number;
      assembliesImported: number;
      importedAt: string;
    }) => ({
      source: log.source,
      itemsImported: log.itemsImported,
      assembliesImported: log.assembliesImported,
      importedAt: new Date(log.importedAt),
    }));
  }
}

export const rsMeansImporter = new RSMeansImporter();
