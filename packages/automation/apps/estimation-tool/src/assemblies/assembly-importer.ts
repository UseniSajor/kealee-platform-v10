/**
 * Assembly Importer
 * Import assemblies from external sources
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import Decimal from 'decimal.js';
import { assemblyBuilder, CreateAssemblyInput, CreateComponentInput } from './assembly-builder.js';

const prisma = new PrismaClient();

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  assemblies: { csiCode: string; name: string; id: string }[];
}

export interface CSVAssemblyRow {
  csiCode: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  unit: string;
  materialCost?: number;
  laborCost?: number;
  equipmentCost?: number;
  laborHours?: number;
  productionRate?: number;
  crewSize?: number;
  tags?: string;
}

export interface RSMeansAssembly {
  unitNumber: string;
  description: string;
  crewCode: string;
  dailyOutput: number;
  laborHours: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  totalCost: number;
}

export interface ImportOptions {
  costDatabaseId: string;
  updateExisting?: boolean;
  createMissing?: boolean;
  categoryMapping?: Record<string, string>;
  priceMultiplier?: number;
  defaultMarkup?: number;
}

export class AssemblyImporter {
  /**
   * Import assemblies from CSV data
   */
  async importFromCSV(
    data: CSVAssemblyRow[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      assemblies: [],
    };

    for (const row of data) {
      try {
        // Check for existing assembly by csiCode within the cost database
        const existing = await prisma.assembly.findFirst({
          where: {
            costDatabaseId: options.costDatabaseId,
            csiCode: row.csiCode,
          },
        });

        if (existing && !options.updateExisting) {
          result.skippedCount++;
          continue;
        }

        // Map category if mapping provided
        const category = options.categoryMapping?.[row.category] || row.category;

        // Build items from costs
        const items: CreateComponentInput[] = [];
        let sortOrder = 0;

        if (row.materialCost && row.materialCost > 0) {
          const cost = row.materialCost * (options.priceMultiplier || 1);
          items.push({
            type: 'MATERIAL',
            name: 'Materials',
            quantity: 1,
            unit: row.unit,
            unitCost: cost,
            sortOrder: sortOrder++,
          });
        }

        if (row.laborCost && row.laborCost > 0) {
          const cost = row.laborCost * (options.priceMultiplier || 1);
          items.push({
            type: 'LABOR',
            name: 'Labor',
            quantity: row.laborHours || 1,
            unit: 'HR',
            unitCost: row.laborHours ? cost / row.laborHours : cost,
            sortOrder: sortOrder++,
          });
        }

        if (row.equipmentCost && row.equipmentCost > 0) {
          const cost = row.equipmentCost * (options.priceMultiplier || 1);
          items.push({
            type: 'EQUIPMENT',
            name: 'Equipment',
            quantity: 1,
            unit: row.unit,
            unitCost: cost,
            sortOrder: sortOrder++,
          });
        }

        const input: CreateAssemblyInput = {
          costDatabaseId: options.costDatabaseId,
          csiCode: row.csiCode,
          name: row.name,
          description: row.description,
          category,
          subcategory: row.subcategory,
          unit: row.unit,
          items,
          productionRate: row.productionRate,
          crewSize: row.crewSize,
          tags: row.tags?.split(',').map((t) => t.trim()) || [],
        };

        let assembly;
        if (existing) {
          assembly = await assemblyBuilder.updateAssembly(existing.id, {
            name: row.name,
            description: row.description,
            category,
            subcategory: row.subcategory,
            productionRate: row.productionRate,
            crewSize: row.crewSize,
          });
        } else {
          assembly = await assemblyBuilder.createAssembly(input);
        }

        result.importedCount++;
        result.assemblies.push({
          csiCode: assembly.csiCode,
          name: assembly.name,
          id: assembly.id,
        });
      } catch (error) {
        result.errorCount++;
        result.errors.push(`Row ${row.csiCode}: ${error}`);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  /**
   * Import from RS Means format
   */
  async importFromRSMeans(
    data: RSMeansAssembly[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      assemblies: [],
    };

    for (const item of data) {
      try {
        // Check for existing by csiCode (using RS Means unit number)
        const existing = await prisma.assembly.findFirst({
          where: {
            costDatabaseId: options.costDatabaseId,
            csiCode: item.unitNumber,
          },
        });

        if (existing && !options.updateExisting) {
          result.skippedCount++;
          continue;
        }

        // Parse category from unit number (e.g., "03 11 13.10" -> "03")
        const divisionCode = item.unitNumber.split(' ')[0];
        const category = this.mapDivisionToCategory(divisionCode);

        // Build items
        const items: CreateComponentInput[] = [];
        let sortOrder = 0;

        if (item.materialCost > 0) {
          const cost = item.materialCost * (options.priceMultiplier || 1);
          items.push({
            type: 'MATERIAL',
            name: 'Materials',
            quantity: 1,
            unit: item.unit,
            unitCost: cost,
            sortOrder: sortOrder++,
          });
        }

        if (item.laborCost > 0) {
          const cost = item.laborCost * (options.priceMultiplier || 1);
          const rate = item.laborHours > 0 ? cost / item.laborHours : cost;
          items.push({
            type: 'LABOR',
            name: `Crew ${item.crewCode}`,
            quantity: item.laborHours,
            unit: 'HR',
            unitCost: rate,
            sortOrder: sortOrder++,
            metadata: { crewCode: item.crewCode },
          });
        }

        if (item.equipmentCost > 0) {
          const cost = item.equipmentCost * (options.priceMultiplier || 1);
          items.push({
            type: 'EQUIPMENT',
            name: 'Equipment',
            quantity: 1,
            unit: item.unit,
            unitCost: cost,
            sortOrder: sortOrder++,
          });
        }

        const input: CreateAssemblyInput = {
          costDatabaseId: options.costDatabaseId,
          csiCode: item.unitNumber,
          name: item.description,
          category,
          unit: item.unit,
          items,
          productionRate: item.dailyOutput,
          metadata: {
            source: 'RS Means',
            crewCode: item.crewCode,
          },
          tags: ['RSMeans', divisionCode],
        };

        let assembly;
        if (existing) {
          // Update existing with new data
          await prisma.assembly.update({
            where: { id: existing.id },
            data: {
              name: item.description,
              productionRate: item.dailyOutput,
              updatedAt: new Date(),
            },
          });
          assembly = { id: existing.id, csiCode: item.unitNumber, name: item.description };
        } else {
          assembly = await assemblyBuilder.createAssembly(input);
        }

        result.importedCount++;
        result.assemblies.push({
          csiCode: assembly.csiCode,
          name: assembly.name,
          id: assembly.id,
        });
      } catch (error) {
        result.errorCount++;
        result.errors.push(`${item.unitNumber}: ${error}`);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  /**
   * Import from JSON format
   */
  async importFromJSON(
    data: CreateAssemblyInput[],
    options: ImportOptions
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      importedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      assemblies: [],
    };

    for (const item of data) {
      try {
        // Override cost database
        item.costDatabaseId = options.costDatabaseId;

        // Check for existing
        const existing = await prisma.assembly.findFirst({
          where: {
            costDatabaseId: options.costDatabaseId,
            csiCode: item.csiCode,
          },
        });

        if (existing && !options.updateExisting) {
          result.skippedCount++;
          continue;
        }

        // Apply price multiplier if specified
        if (options.priceMultiplier && item.items) {
          item.items = item.items.map((c) => ({
            ...c,
            unitCost: c.unitCost * options.priceMultiplier!,
          }));
        }

        let assembly;
        if (existing) {
          assembly = await assemblyBuilder.updateAssembly(existing.id, {
            name: item.name,
            description: item.description,
            category: item.category,
            subcategory: item.subcategory,
            productionRate: item.productionRate,
            crewSize: item.crewSize,
            tags: item.tags,
            metadata: item.metadata,
          });
        } else {
          assembly = await assemblyBuilder.createAssembly(item);
        }

        result.importedCount++;
        result.assemblies.push({
          csiCode: assembly.csiCode,
          name: assembly.name,
          id: assembly.id,
        });
      } catch (error) {
        result.errorCount++;
        result.errors.push(`${item.csiCode}: ${error}`);
      }
    }

    result.success = result.errorCount === 0;
    return result;
  }

  /**
   * Export assemblies to JSON
   */
  async exportToJSON(
    costDatabaseId: string,
    options?: {
      category?: string;
      includeItems?: boolean;
    }
  ): Promise<object[]> {
    const assemblies = await prisma.assembly.findMany({
      where: {
        costDatabaseId,
        ...(options?.category && { category: options.category as any }),
      },
      include: options?.includeItems ? { items: true } : undefined,
      orderBy: { csiCode: 'asc' },
    });

    return assemblies.map((a: any) => ({
      csiCode: a.csiCode,
      name: a.name,
      description: a.description,
      category: a.category,
      subcategory: a.subcategory,
      unit: a.unit,
      items: options?.includeItems ? a.items : undefined,
      laborHours: a.laborHours,
      materialCost: a.materialCost,
      laborCost: a.laborCost,
      equipmentCost: a.equipmentCost,
      unitCost: a.unitCost,
      productionRate: a.productionRate,
      crewSize: a.crewSize,
      complexity: a.complexity,
      notes: a.notes,
      tags: a.tags,
      isActive: a.isActive,
      metadata: a.metadata,
    }));
  }

  /**
   * Validate import data
   */
  validateCSVData(data: CSVAssemblyRow[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const csiCodes = new Set<string>();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;

      if (!row.csiCode) {
        errors.push(`Row ${rowNum}: Missing csiCode`);
      } else if (csiCodes.has(row.csiCode)) {
        errors.push(`Row ${rowNum}: Duplicate csiCode "${row.csiCode}"`);
      } else {
        csiCodes.add(row.csiCode);
      }

      if (!row.name) {
        errors.push(`Row ${rowNum}: Missing name`);
      }

      if (!row.category) {
        errors.push(`Row ${rowNum}: Missing category`);
      }

      if (!row.unit) {
        errors.push(`Row ${rowNum}: Missing unit`);
      }

      // Validate costs are numbers
      if (row.materialCost && isNaN(Number(row.materialCost))) {
        errors.push(`Row ${rowNum}: Invalid material cost`);
      }
      if (row.laborCost && isNaN(Number(row.laborCost))) {
        errors.push(`Row ${rowNum}: Invalid labor cost`);
      }
      if (row.equipmentCost && isNaN(Number(row.equipmentCost))) {
        errors.push(`Row ${rowNum}: Invalid equipment cost`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Map CSI division code to category
   */
  private mapDivisionToCategory(divisionCode: string): string {
    const divisions: Record<string, string> = {
      '01': '01 - General Requirements',
      '02': '02 - Existing Conditions',
      '03': '03 - Concrete',
      '04': '04 - Masonry',
      '05': '05 - Metals',
      '06': '06 - Wood, Plastics & Composites',
      '07': '07 - Thermal & Moisture Protection',
      '08': '08 - Openings',
      '09': '09 - Finishes',
      '10': '10 - Specialties',
      '11': '11 - Equipment',
      '12': '12 - Furnishings',
      '13': '13 - Special Construction',
      '14': '14 - Conveying Equipment',
      '21': '21 - Fire Suppression',
      '22': '22 - Plumbing',
      '23': '23 - HVAC',
      '25': '25 - Integrated Automation',
      '26': '26 - Electrical',
      '27': '27 - Communications',
      '28': '28 - Electronic Safety & Security',
      '31': '31 - Earthwork',
      '32': '32 - Exterior Improvements',
      '33': '33 - Utilities',
    };

    return divisions[divisionCode] || `${divisionCode} - Uncategorized`;
  }
}

export const assemblyImporter = new AssemblyImporter();
