/**
 * Estimation Tool API Routes
 * Fastify API endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID as uuid } from 'crypto';

// Import modules
import { costDatabaseManager } from '../cost-database/database-manager.js';
import { materialCostManager } from '../cost-database/material-costs.js';
import { laborRateManager } from '../cost-database/labor-rates.js';
import { equipmentRateManager } from '../cost-database/equipment-rates.js';
import { regionalAdjustmentManager } from '../cost-database/regional-adjustment.js';
import { priceUpdater } from '../cost-database/price-updater.js';

import { assemblyBuilder } from '../assemblies/assembly-builder.js';
import { assemblyCalculator } from '../assemblies/assembly-calculator.js';
import { ASSEMBLY_TEMPLATES, getTemplateByCode, templateToInput } from '../assemblies/assembly-library.js';
import { assemblyImporter } from '../assemblies/assembly-importer.js';

import { takeoffManager } from '../takeoff/takeoff-manager.js';
import { planAnalyzer } from '../takeoff/plan-analyzer.js';
import { quantityExtractor } from '../takeoff/quantity-extractor.js';

import { estimateBuilder } from '../estimates/estimate-builder.js';
import { estimateCalculator } from '../estimates/estimate-calculator.js';
import { sectionManager } from '../estimates/section-manager.js';
import { lineItemManager } from '../estimates/line-item-manager.js';
import { revisionManager } from '../estimates/revision-manager.js';
import { exportGenerator } from '../estimates/export-generator.js';

import { scopeAnalyzer } from '../ai/scope-analyzer.js';
import { costPredictor } from '../ai/cost-predictor.js';
import { assemblySuggester } from '../ai/assembly-suggester.js';
import { valueEngineer } from '../ai/value-engineer.js';
import { comparisonAnalyzer } from '../ai/comparison-analyzer.js';
import { aiTakeoffService } from '../ai/ai-takeoff.js';

import { orderManager } from '../orders/order-manager.js';
import { assignmentEngine } from '../orders/assignment-engine.js';
import { deliveryHandler } from '../orders/delivery-handler.js';

import { bidEngineSync } from '../integrations/bid-engine-sync.js';
import { budgetTrackerSync } from '../integrations/budget-tracker-sync.js';
import { rsMeansImporter } from '../integrations/rsmeans-importer.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health check
  app.get('/health', async () => ({ status: 'ok', service: 'estimation-tool' }));

  // ===== COST DATABASE ROUTES =====

  // Databases
  app.get('/api/databases', async (request: FastifyRequest<{ Querystring: { organizationId: string } }>) => {
    return costDatabaseManager.listDatabases(request.query.organizationId);
  });

  app.post('/api/databases', async (request: FastifyRequest<{ Body: any }>) => {
    return costDatabaseManager.createDatabase(request.body as Parameters<typeof costDatabaseManager.createDatabase>[0]);
  });

  app.get('/api/databases/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return costDatabaseManager.getDatabase(request.params.id);
  });

  // Cost Items - use materialCostManager.listMaterials for searching
  app.get('/api/databases/:databaseId/items', async (request: FastifyRequest<{
    Params: { databaseId: string };
    Querystring: { search?: string; category?: string; limit?: number };
  }>) => {
    type ListMaterialsOptions = NonNullable<Parameters<typeof materialCostManager.listMaterials>[1]>;
    return materialCostManager.listMaterials(request.params.databaseId, {
      category: request.query.category as ListMaterialsOptions['category'],
      limit: request.query.limit,
    });
  });

  // Material Costs
  app.get('/api/materials', async (request: FastifyRequest<{
    Querystring: { databaseId: string; search?: string; category?: string };
  }>) => {
    type ListMaterialsOptions = NonNullable<Parameters<typeof materialCostManager.listMaterials>[1]>;
    return materialCostManager.listMaterials(request.query.databaseId, {
      category: request.query.category as ListMaterialsOptions['category'],
    });
  });

  // Labor Rates
  app.get('/api/labor-rates', async (request: FastifyRequest<{
    Querystring: { databaseId: string; tradeCode?: string };
  }>) => {
    type ListLaborRatesOptions = NonNullable<Parameters<typeof laborRateManager.listLaborRates>[1]>;
    return laborRateManager.listLaborRates(request.query.databaseId, {
      trade: request.query.tradeCode as ListLaborRatesOptions['trade'],
    });
  });

  // Equipment Rates
  app.get('/api/equipment-rates', async (request: FastifyRequest<{
    Querystring: { databaseId: string };
  }>) => {
    return equipmentRateManager.listEquipmentRates(request.query.databaseId);
  });

  // Regional Adjustments
  app.get('/api/regional-indices', async () => {
    return regionalAdjustmentManager.getDefaultIndices();
  });

  app.post('/api/regional-adjust', async (request: FastifyRequest<{
    Body: { costs: { materialCost: number; laborCost: number; equipmentCost: number }; fromRegion: string; toRegion: string };
  }>) => {
    return regionalAdjustmentManager.adjustEstimate(
      request.body.costs,
      { state: request.body.fromRegion },
      { state: request.body.toRegion }
    );
  });

  // Price Updates
  app.post('/api/prices/update', async (request: FastifyRequest<{
    Body: { databaseId: string; source: string; items: any[] };
  }>) => {
    return priceUpdater.startUpdate(
      request.body.databaseId,
      request.body.source,
      request.body.items
    );
  });

  // ===== ASSEMBLY ROUTES =====

  // Assemblies
  app.get('/api/assemblies', async (request: FastifyRequest<{
    Querystring: { organizationId: string; databaseId?: string; category?: string; search?: string };
  }>) => {
    return assemblyBuilder.listAssemblies(request.query.organizationId, {
      category: request.query.category,
      search: request.query.search,
    });
  });

  app.post('/api/assemblies', async (request: FastifyRequest<{ Body: any }>) => {
    return assemblyBuilder.createAssembly(request.body as Parameters<typeof assemblyBuilder.createAssembly>[0]);
  });

  app.get('/api/assemblies/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return assemblyBuilder.getAssembly(request.params.id);
  });

  app.put('/api/assemblies/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>) => {
    return assemblyBuilder.updateAssembly(request.params.id, request.body as Parameters<typeof assemblyBuilder.updateAssembly>[1]);
  });

  app.delete('/api/assemblies/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await assemblyBuilder.deleteAssembly(request.params.id);
    return { success: true };
  });

  // Assembly Library
  app.get('/api/assembly-library/templates', async () => {
    return ASSEMBLY_TEMPLATES;
  });

  app.post('/api/assembly-library/create-from-template', async (request: FastifyRequest<{
    Body: { templateCode: string; databaseId: string };
  }>) => {
    const template = getTemplateByCode(request.body.templateCode);
    if (!template) {
      throw new Error(`Template not found: ${request.body.templateCode}`);
    }
    const input = templateToInput(template, request.body.databaseId);
    return assemblyBuilder.createAssembly(input);
  });

  // Assembly Import
  app.post('/api/assemblies/import/csv', async (request: FastifyRequest<{
    Body: { data: any[]; options: any };
  }>) => {
    return assemblyImporter.importFromCSV(request.body.data, request.body.options);
  });

  app.post('/api/assemblies/import/rsmeans', async (request: FastifyRequest<{
    Body: { data: any[]; options: any };
  }>) => {
    return assemblyImporter.importFromRSMeans(request.body.data, request.body.options);
  });

  // ===== TAKEOFF ROUTES =====

  // Takeoff Sessions
  app.post('/api/takeoffs', async (request: FastifyRequest<{ Body: any }>) => {
    return takeoffManager.createTakeoff(request.body as Parameters<typeof takeoffManager.createTakeoff>[0]);
  });

  app.get('/api/takeoffs/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return takeoffManager.getTakeoff(request.params.id);
  });

  app.post('/api/takeoffs/:id/measurements', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>) => {
    const measurementInput = {
      ...(request.body as Record<string, unknown>),
      takeoffId: request.params.id,
    } as Parameters<typeof takeoffManager.addMeasurement>[0];
    return takeoffManager.addMeasurement(measurementInput);
  });

  app.get('/api/takeoffs/:id/summary', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return takeoffManager.getSummary(request.params.id);
  });

  // Plan Analysis
  app.post('/api/plans/analyze', async (request: FastifyRequest<{
    Body: { planId: string; planData: string; options?: any };
  }>) => {
    return planAnalyzer.analyzePlan(
      request.body.planId,
      request.body.planData,
      request.body.options
    );
  });

  // Quantity Extraction
  app.post('/api/quantities/extract', async (request: FastifyRequest<{
    Body: { projectId: string; analysisId: string; options?: any };
  }>) => {
    return quantityExtractor.extractFromAnalysis(
      request.body.projectId,
      request.body.analysisId,
      request.body.options
    );
  });

  // ===== ESTIMATE ROUTES =====

  // Estimates
  app.get('/api/estimates', async (request: FastifyRequest<{
    Querystring: { projectId: string; status?: string; type?: string };
  }>) => {
    return estimateBuilder.getProjectEstimates(request.query.projectId, {
      status: request.query.status as any,
      type: request.query.type as any,
    });
  });

  app.post('/api/estimates', async (request: FastifyRequest<{ Body: any }>) => {
    return estimateBuilder.createEstimate(request.body as Parameters<typeof estimateBuilder.createEstimate>[0]);
  });

  app.get('/api/estimates/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return estimateBuilder.getEstimate(request.params.id);
  });

  app.put('/api/estimates/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>) => {
    return estimateBuilder.updateEstimate(request.params.id, request.body as Parameters<typeof estimateBuilder.updateEstimate>[1]);
  });

  app.delete('/api/estimates/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    await estimateBuilder.deleteEstimate(request.params.id);
    return { success: true };
  });

  app.post('/api/estimates/:id/duplicate', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { newName?: string };
  }>) => {
    return estimateBuilder.duplicateEstimate(request.params.id, request.body.newName);
  });

  app.get('/api/estimates/:id/summary', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return estimateBuilder.getEstimateSummary(request.params.id);
  });

  // Calculate Estimate
  app.post('/api/estimates/:id/calculate', async (request: FastifyRequest<{
    Params: { id: string };
    Body?: any;
  }>) => {
    return estimateCalculator.calculateEstimate(request.params.id, request.body as Parameters<typeof estimateCalculator.calculateEstimate>[1]);
  });

  // Sections
  app.get('/api/estimates/:estimateId/sections', async (request: FastifyRequest<{
    Params: { estimateId: string };
  }>) => {
    return sectionManager.getEstimateSections(request.params.estimateId);
  });

  app.post('/api/estimates/:estimateId/sections', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: any;
  }>) => {
    const sectionInput = {
      ...(request.body as Record<string, unknown>),
      estimateId: request.params.estimateId,
    };
    return sectionManager.createSection(sectionInput as Parameters<typeof sectionManager.createSection>[0]);
  });

  app.post('/api/estimates/:estimateId/sections/csi', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: { divisions?: string[] };
  }>) => {
    return sectionManager.createCSISections(
      request.params.estimateId,
      request.body.divisions
    );
  });

  // Line Items
  app.get('/api/estimates/:estimateId/items', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Querystring: { sectionId?: string; search?: string };
  }>) => {
    return lineItemManager.getEstimateLineItems(request.params.estimateId, {
      sectionId: request.query.sectionId,
      search: request.query.search,
    });
  });

  app.post('/api/estimates/:estimateId/items', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: any;
  }>) => {
    const lineItemInput = {
      ...(request.body as Record<string, unknown>),
      estimateId: request.params.estimateId,
    };
    return lineItemManager.createLineItem(lineItemInput as Parameters<typeof lineItemManager.createLineItem>[0]);
  });

  app.post('/api/estimates/:estimateId/items/bulk', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: { items: Record<string, unknown>[]; options?: any };
  }>) => {
    const bulkInput = {
      items: request.body.items.map((item: Record<string, unknown>) => ({
        ...item,
        estimateId: request.params.estimateId,
      })),
      options: request.body.options,
    };
    return lineItemManager.bulkCreateLineItems(bulkInput as Parameters<typeof lineItemManager.bulkCreateLineItems>[0]);
  });

  app.post('/api/estimates/:estimateId/items/from-assembly', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: { sectionId: string; assemblyId: string; quantity: number; options?: any };
  }>) => {
    return lineItemManager.addFromAssembly(
      request.params.estimateId,
      request.body.sectionId,
      request.body.assemblyId,
      request.body.quantity,
      request.body.options
    );
  });

  // Revisions
  app.get('/api/estimates/:estimateId/revisions', async (request: FastifyRequest<{
    Params: { estimateId: string };
  }>) => {
    return revisionManager.getEstimateRevisions(request.params.estimateId);
  });

  app.post('/api/estimates/:estimateId/revisions', async (request: FastifyRequest<{
    Params: { estimateId: string };
    Body: any;
  }>) => {
    const revisionInput = {
      ...(request.body as Record<string, unknown>),
      estimateId: request.params.estimateId,
    };
    return revisionManager.createRevision(revisionInput as Parameters<typeof revisionManager.createRevision>[0]);
  });

  // Export
  app.post('/api/estimates/:id/export', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>, reply: FastifyReply) => {
    const result = await exportGenerator.exportEstimate(request.params.id, request.body as Parameters<typeof exportGenerator.exportEstimate>[1]);

    reply.header('Content-Type', result.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
    return reply.send(result.data);
  });

  // ===== AI ROUTES =====

  // Scope Analysis
  app.post('/api/ai/scope-analysis', async (request: FastifyRequest<{
    Body: { estimateId: string; options?: any };
  }>) => {
    return scopeAnalyzer.analyzeScope(request.body.estimateId, request.body.options);
  });

  // Cost Prediction
  app.post('/api/ai/cost-prediction', async (request: FastifyRequest<{
    Body: { estimateId: string; options?: any };
  }>) => {
    return costPredictor.predictCost(request.body.estimateId, request.body.options);
  });

  app.post('/api/ai/cost-forecast', async (request: FastifyRequest<{
    Body: { estimateId: string; months?: number };
  }>) => {
    return costPredictor.forecastCosts(request.body.estimateId, request.body.months);
  });

  // Assembly Suggestions
  app.post('/api/ai/suggest-assemblies', async (request: FastifyRequest<{
    Body: { estimateId: string; context?: any };
  }>) => {
    return assemblySuggester.suggestAssemblies(request.body.estimateId, request.body.context || {});
  });

  app.post('/api/ai/suggest-for-scope', async (request: FastifyRequest<{
    Body: { description: string; options?: any };
  }>) => {
    return assemblySuggester.suggestForScopeItem(request.body.description, request.body.options);
  });

  // Value Engineering
  app.post('/api/ai/value-engineering', async (request: FastifyRequest<{
    Body: { estimateId: string; options?: any };
  }>) => {
    return valueEngineer.analyzeVE(request.body.estimateId, request.body.options);
  });

  // Estimate Comparison
  app.post('/api/ai/compare-estimates', async (request: FastifyRequest<{
    Body: { estimateIds: string[] };
  }>) => {
    return comparisonAnalyzer.compareEstimates(request.body.estimateIds);
  });

  app.post('/api/ai/benchmark', async (request: FastifyRequest<{
    Body: { estimateId: string; options?: any };
  }>) => {
    return comparisonAnalyzer.benchmarkEstimate(request.body.estimateId, request.body.options);
  });

  // AI Takeoff - Process uploaded plans/photos
  app.post('/api/ai/takeoff', async (request: FastifyRequest<{
    Body: {
      projectId?: string;
      estimateId?: string;
      organizationId: string;
      files: Array<{ url: string; fileName: string; fileType: string; pageCount?: number; discipline?: string }>;
      options?: { disciplines?: string[]; detailLevel?: string; autoLink?: boolean; scaleOverride?: string };
    };
  }>) => {
    return aiTakeoffService.processFiles(request.body as any);
  });

  // AI Progress Photo Analysis
  app.post('/api/ai/analyze-photo', async (request: FastifyRequest<{
    Body: { projectId: string; photoUrl: string; options?: { compareToSchedule?: boolean } };
  }>) => {
    return aiTakeoffService.analyzeProgressPhoto(
      request.body.projectId,
      request.body.photoUrl,
      request.body.options
    );
  });

  // ===== ORDER ROUTES =====

  // Orders
  app.get('/api/orders', async (request: FastifyRequest<{
    Querystring: { organizationId: string; status?: string; assignedTo?: string };
  }>) => {
    return orderManager.getOrganizationOrders(request.query.organizationId, {
      status: request.query.status as any,
      assignedTo: request.query.assignedTo,
    });
  });

  app.post('/api/orders', async (request: FastifyRequest<{ Body: any }>) => {
    return orderManager.createOrder(request.body as Parameters<typeof orderManager.createOrder>[0]);
  });

  app.get('/api/orders/:id', async (request: FastifyRequest<{ Params: { id: string } }>) => {
    return orderManager.getOrder(request.params.id);
  });

  app.put('/api/orders/:id', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>) => {
    return orderManager.updateOrder(request.params.id, request.body as Parameters<typeof orderManager.updateOrder>[1]);
  });

  app.post('/api/orders/:id/assign', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { assignedTo: string; team?: string; notes?: string };
  }>) => {
    return orderManager.assignOrder(
      request.params.id,
      request.body.assignedTo,
      { team: request.body.team, notes: request.body.notes }
    );
  });

  app.post('/api/orders/:id/start', async (request: FastifyRequest<{
    Params: { id: string };
    Body: { userId: string };
  }>) => {
    return orderManager.startOrder(request.params.id, request.body.userId);
  });

  app.post('/api/orders/:id/complete', async (request: FastifyRequest<{
    Params: { id: string };
    Body: any;
  }>) => {
    return orderManager.completeOrder(request.params.id, request.body as Parameters<typeof orderManager.completeOrder>[1]);
  });

  // Auto-assignment
  app.post('/api/orders/:id/auto-assign', async (request: FastifyRequest<{
    Params: { id: string };
    Body?: any;
  }>) => {
    const order = await orderManager.getOrder(request.params.id);
    if (!order) throw new Error('Order not found');
    return assignmentEngine.autoAssign(order, request.body as Parameters<typeof assignmentEngine.autoAssign>[1]);
  });

  // Team Workload
  app.get('/api/workload', async (request: FastifyRequest<{
    Querystring: { organizationId: string };
  }>) => {
    return assignmentEngine.getTeamWorkload(request.query.organizationId);
  });

  // Delivery
  app.post('/api/orders/:orderId/deliver', async (request: FastifyRequest<{
    Params: { orderId: string };
    Body: { deliverableId: string; options: any };
  }>) => {
    return deliveryHandler.deliverEstimate(
      request.params.orderId,
      request.body.deliverableId,
      request.body.options
    );
  });

  // ===== INTEGRATION ROUTES =====

  // Bid Engine
  app.post('/api/integrations/bid-engine/sync', async (request: FastifyRequest<{
    Body: { organizationId: string };
  }>) => {
    return bidEngineSync.syncBidRequests(request.body.organizationId);
  });

  app.post('/api/integrations/bid-engine/submit', async (request: FastifyRequest<{
    Body: any;
  }>) => {
    return bidEngineSync.submitBid(request.body as Parameters<typeof bidEngineSync.submitBid>[0]);
  });

  app.get('/api/integrations/bid-engine/pending', async (request: FastifyRequest<{
    Querystring: { organizationId: string };
  }>) => {
    return bidEngineSync.getPendingBidRequests(request.query.organizationId);
  });

  // Budget Tracker
  app.post('/api/integrations/budget-tracker/transfer', async (request: FastifyRequest<{
    Body: any;
  }>) => {
    return budgetTrackerSync.transferToBudget(request.body as Parameters<typeof budgetTrackerSync.transferToBudget>[0]);
  });

  app.get('/api/integrations/budget-tracker/compare', async (request: FastifyRequest<{
    Querystring: { estimateId: string; projectId: string };
  }>) => {
    return budgetTrackerSync.compareEstimateToBudget(
      request.query.estimateId,
      request.query.projectId
    );
  });

  // RS Means
  app.get('/api/integrations/rsmeans/city-indices', async () => {
    return rsMeansImporter.getCityIndices();
  });

  app.post('/api/integrations/rsmeans/import/items', async (request: FastifyRequest<{
    Body: { items: any[]; options: any };
  }>) => {
    return rsMeansImporter.importItems(request.body.items, request.body.options);
  });

  app.post('/api/integrations/rsmeans/import/assemblies', async (request: FastifyRequest<{
    Body: { assemblies: any[]; options: any };
  }>) => {
    return rsMeansImporter.importAssemblies(request.body.assemblies, request.body.options);
  });
}
