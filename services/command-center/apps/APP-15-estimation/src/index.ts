/**
 * APP-15: ESTIMATION ENGINE
 * AI-powered project estimation with labor, materials, and timeline
 * Automation Level: 85%
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createWorker, queues, JOB_OPTIONS, QUEUE_NAMES } from '../../../shared/queue.js';
import { getEventBus, EVENT_TYPES } from '../../../shared/events.js';
import { generateJSON, generateText } from '../../../shared/ai/claude.js';
import { formatCurrency } from '../../../shared/utils/money.js';
import { addWorkingDays, getWorkingDays } from '../../../shared/utils/date.js';

const prisma = new PrismaClient();
const eventBus = getEventBus('estimation-engine');

// ============================================================================
// TYPES
// ============================================================================

type ProjectType =
  | 'KITCHEN_REMODEL'
  | 'BATHROOM_REMODEL'
  | 'ROOM_ADDITION'
  | 'NEW_CONSTRUCTION'
  | 'RENOVATION'
  | 'COMMERCIAL_TI'
  | 'EXTERIOR'
  | 'CUSTOM';

type EstimateStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'SENT_TO_CLIENT'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

interface Estimate {
  id: string;
  projectId?: string;
  clientId?: string;
  projectType: ProjectType;
  status: EstimateStatus;
  scope: ProjectScope;
  laborEstimate: LaborEstimate;
  materialEstimate: MaterialEstimate;
  timeline: TimelineEstimate;
  totalCost: number;
  contingency: number;
  markup: number;
  finalPrice: number;
  confidence: number;
  assumptions: string[];
  exclusions: string[];
  validUntil: Date;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

interface ProjectScope {
  description: string;
  squareFootage?: number;
  rooms?: number;
  floors?: number;
  features: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'custom';
  siteConditions?: string[];
}

interface LaborEstimate {
  trades: TradeEstimate[];
  totalHours: number;
  totalCost: number;
  breakdown: { category: string; hours: number; cost: number }[];
}

interface TradeEstimate {
  trade: string;
  description: string;
  hours: number;
  rate: number;
  cost: number;
  workers: number;
  duration: number; // days
}

interface MaterialEstimate {
  categories: MaterialCategory[];
  totalCost: number;
  allowances: { item: string; amount: number }[];
}

interface MaterialCategory {
  name: string;
  items: MaterialItem[];
  subtotal: number;
}

interface MaterialItem {
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  supplier?: string;
  leadTime?: number; // days
}

interface TimelineEstimate {
  startDate?: Date;
  endDate?: Date;
  totalDays: number;
  phases: PhaseEstimate[];
  milestones: Milestone[];
  criticalPath: string[];
}

interface PhaseEstimate {
  name: string;
  order: number;
  duration: number; // days
  trades: string[];
  dependencies: string[];
  description: string;
}

interface Milestone {
  name: string;
  date?: Date;
  dayOffset: number;
  deliverables: string[];
}

interface EstimateRequest {
  projectType: ProjectType;
  scope: ProjectScope;
  location?: { city: string; state: string; zip: string };
  preferredStartDate?: Date;
  budgetRange?: { min: number; max: number };
  prioritize?: 'cost' | 'speed' | 'quality';
}

interface ServiceTicket {
  id: string;
  type: ServiceTicketType;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  estimatedHours?: number;
  actualHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  workflow: WorkflowStep[];
}

type ServiceTicketType =
  | 'NEW_PROJECT_INTAKE'
  | 'CHANGE_ORDER'
  | 'WARRANTY_CLAIM'
  | 'PUNCH_LIST'
  | 'MAINTENANCE'
  | 'EMERGENCY_REPAIR'
  | 'CONSULTATION';

type TicketStatus =
  | 'INTAKE'
  | 'ESTIMATION'
  | 'APPROVAL'
  | 'SCHEDULING'
  | 'IN_PROGRESS'
  | 'QUALITY_CHECK'
  | 'CLOSEOUT'
  | 'COMPLETED'
  | 'CANCELLED';

interface WorkflowStep {
  step: TicketStatus;
  enteredAt: Date;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  data?: Record<string, any>;
}

// ============================================================================
// ESTIMATION SERVICE
// ============================================================================

class EstimationService {
  // Labor rates by trade (hourly)
  private laborRates: Record<string, number> = {
    'General Labor': 45,
    'Carpenter': 65,
    'Electrician': 85,
    'Plumber': 80,
    'HVAC Technician': 85,
    'Painter': 55,
    'Tile Setter': 70,
    'Roofer': 60,
    'Concrete': 55,
    'Drywall': 50,
    'Flooring': 60,
    'Cabinet Installer': 70,
    'Mason': 75,
    'Welder': 80,
    'Supervisor': 95,
    'Project Manager': 110,
  };

  // Material cost multipliers by region
  private regionMultipliers: Record<string, number> = {
    'CA': 1.25,
    'NY': 1.30,
    'TX': 0.95,
    'FL': 1.00,
    'WA': 1.15,
    'DEFAULT': 1.00,
  };

  // Complexity multipliers
  private complexityMultipliers = {
    simple: 1.0,
    moderate: 1.25,
    complex: 1.5,
    custom: 1.75,
  };

  /**
   * Generate comprehensive estimate using AI
   */
  async generateEstimate(request: EstimateRequest): Promise<Estimate> {
    // Get AI-generated scope analysis
    const scopeAnalysis = await this.analyzeScope(request);

    // Calculate labor estimate
    const laborEstimate = await this.estimateLabor(request, scopeAnalysis);

    // Calculate material estimate
    const materialEstimate = await this.estimateMaterials(request, scopeAnalysis);

    // Calculate timeline
    const timeline = await this.estimateTimeline(request, laborEstimate);

    // Calculate totals
    const totalCost = laborEstimate.totalCost + materialEstimate.totalCost;
    const contingency = totalCost * 0.10; // 10% contingency
    const markup = (totalCost + contingency) * 0.15; // 15% markup
    const finalPrice = totalCost + contingency + markup;

    // Calculate confidence based on scope clarity
    const confidence = this.calculateConfidence(request, scopeAnalysis);

    const estimate: Estimate = {
      id: crypto.randomUUID(),
      projectType: request.projectType,
      status: 'DRAFT',
      scope: request.scope,
      laborEstimate,
      materialEstimate,
      timeline,
      totalCost,
      contingency,
      markup,
      finalPrice,
      confidence,
      assumptions: scopeAnalysis.assumptions,
      exclusions: scopeAnalysis.exclusions,
      validUntil: addWorkingDays(new Date(), 30),
      createdAt: new Date(),
    };

    return estimate;
  }

  /**
   * Analyze project scope using AI
   */
  private async analyzeScope(request: EstimateRequest): Promise<{
    trades: string[];
    phases: string[];
    assumptions: string[];
    exclusions: string[];
    riskFactors: string[];
  }> {
    const prompt = `Analyze this construction project scope and provide estimation guidance:

Project Type: ${request.projectType}
Description: ${request.scope.description}
Square Footage: ${request.scope.squareFootage || 'Not specified'}
Complexity: ${request.scope.complexity}
Features: ${request.scope.features.join(', ')}
Site Conditions: ${request.scope.siteConditions?.join(', ') || 'Standard'}

Provide analysis in JSON format:
{
  "trades": ["list of required trades"],
  "phases": ["list of construction phases in order"],
  "assumptions": ["list of assumptions made"],
  "exclusions": ["items not included in estimate"],
  "riskFactors": ["potential risk factors"]
}`;

    return await generateJSON({
      systemPrompt: 'You are a construction estimating expert. Analyze project scopes and provide detailed trade and phase breakdowns.',
      userPrompt: prompt,
    });
  }

  /**
   * Estimate labor costs
   */
  private async estimateLabor(
    request: EstimateRequest,
    scopeAnalysis: { trades: string[]; phases: string[] }
  ): Promise<LaborEstimate> {
    const trades: TradeEstimate[] = [];
    let totalHours = 0;
    let totalCost = 0;

    // Base hours per trade based on project type and size
    const baseHours = this.getBaseHours(request);
    const complexityMultiplier = this.complexityMultipliers[request.scope.complexity];

    for (const trade of scopeAnalysis.trades) {
      const rate = this.laborRates[trade] || this.laborRates['General Labor'];
      const hours = Math.round((baseHours[trade] || 40) * complexityMultiplier);
      const cost = hours * rate;
      const workers = Math.ceil(hours / 40); // Assume 40 hours per worker
      const duration = Math.ceil(hours / (workers * 8)); // 8 hours per day

      trades.push({
        trade,
        description: `${trade} work for ${request.projectType.toLowerCase().replace('_', ' ')}`,
        hours,
        rate,
        cost,
        workers,
        duration,
      });

      totalHours += hours;
      totalCost += cost;
    }

    // Add supervision
    const supervisionHours = Math.round(totalHours * 0.1);
    const supervisionCost = supervisionHours * this.laborRates['Supervisor'];
    trades.push({
      trade: 'Supervisor',
      description: 'Project supervision and coordination',
      hours: supervisionHours,
      rate: this.laborRates['Supervisor'],
      cost: supervisionCost,
      workers: 1,
      duration: Math.ceil(supervisionHours / 8),
    });
    totalHours += supervisionHours;
    totalCost += supervisionCost;

    // Create breakdown by category
    const breakdown = this.createLaborBreakdown(trades);

    return { trades, totalHours, totalCost, breakdown };
  }

  /**
   * Get base hours by trade for project type
   */
  private getBaseHours(request: EstimateRequest): Record<string, number> {
    const sqft = request.scope.squareFootage || 500;
    const hoursPerSqft: Record<ProjectType, Record<string, number>> = {
      KITCHEN_REMODEL: {
        'Carpenter': 40, 'Electrician': 24, 'Plumber': 32, 'Tile Setter': 24,
        'Cabinet Installer': 16, 'Painter': 16, 'Drywall': 16, 'Flooring': 12,
      },
      BATHROOM_REMODEL: {
        'Plumber': 32, 'Tile Setter': 40, 'Electrician': 16, 'Carpenter': 16,
        'Painter': 12, 'Drywall': 12,
      },
      ROOM_ADDITION: {
        'Carpenter': sqft * 0.15, 'Electrician': sqft * 0.08, 'Plumber': sqft * 0.05,
        'HVAC Technician': sqft * 0.06, 'Drywall': sqft * 0.08, 'Painter': sqft * 0.06,
        'Roofer': sqft * 0.04, 'Concrete': 24, 'Flooring': sqft * 0.05,
      },
      NEW_CONSTRUCTION: {
        'Carpenter': sqft * 0.2, 'Electrician': sqft * 0.1, 'Plumber': sqft * 0.08,
        'HVAC Technician': sqft * 0.08, 'Drywall': sqft * 0.1, 'Painter': sqft * 0.08,
        'Roofer': sqft * 0.05, 'Concrete': sqft * 0.06, 'Flooring': sqft * 0.06,
      },
      RENOVATION: {
        'Carpenter': sqft * 0.12, 'Electrician': sqft * 0.06, 'Plumber': sqft * 0.04,
        'Drywall': sqft * 0.08, 'Painter': sqft * 0.06, 'Flooring': sqft * 0.05,
      },
      COMMERCIAL_TI: {
        'Carpenter': sqft * 0.1, 'Electrician': sqft * 0.12, 'HVAC Technician': sqft * 0.1,
        'Drywall': sqft * 0.1, 'Painter': sqft * 0.06, 'Flooring': sqft * 0.08,
      },
      EXTERIOR: {
        'Roofer': 40, 'Painter': 32, 'Carpenter': 24, 'Mason': 24, 'General Labor': 16,
      },
      CUSTOM: {
        'Carpenter': 80, 'Electrician': 40, 'Plumber': 40, 'General Labor': 40,
      },
    };

    return hoursPerSqft[request.projectType] || hoursPerSqft.CUSTOM;
  }

  /**
   * Create labor breakdown by category
   */
  private createLaborBreakdown(trades: TradeEstimate[]): { category: string; hours: number; cost: number }[] {
    const categories: Record<string, { hours: number; cost: number }> = {
      'Rough Work': { hours: 0, cost: 0 },
      'MEP (Mechanical/Electrical/Plumbing)': { hours: 0, cost: 0 },
      'Finish Work': { hours: 0, cost: 0 },
      'Management': { hours: 0, cost: 0 },
    };

    for (const trade of trades) {
      if (['Electrician', 'Plumber', 'HVAC Technician'].includes(trade.trade)) {
        categories['MEP (Mechanical/Electrical/Plumbing)'].hours += trade.hours;
        categories['MEP (Mechanical/Electrical/Plumbing)'].cost += trade.cost;
      } else if (['Carpenter', 'Concrete', 'Roofer', 'Mason', 'Drywall'].includes(trade.trade)) {
        categories['Rough Work'].hours += trade.hours;
        categories['Rough Work'].cost += trade.cost;
      } else if (['Painter', 'Tile Setter', 'Flooring', 'Cabinet Installer'].includes(trade.trade)) {
        categories['Finish Work'].hours += trade.hours;
        categories['Finish Work'].cost += trade.cost;
      } else {
        categories['Management'].hours += trade.hours;
        categories['Management'].cost += trade.cost;
      }
    }

    return Object.entries(categories).map(([category, data]) => ({
      category,
      ...data,
    }));
  }

  /**
   * Estimate material costs
   */
  private async estimateMaterials(
    request: EstimateRequest,
    scopeAnalysis: { trades: string[] }
  ): Promise<MaterialEstimate> {
    const regionMultiplier = this.regionMultipliers[request.location?.state || 'DEFAULT'];
    const complexityMultiplier = this.complexityMultipliers[request.scope.complexity];
    const sqft = request.scope.squareFootage || 500;

    // Generate material list using AI
    const materialPrompt = `Generate a material estimate for:
Project Type: ${request.projectType}
Square Footage: ${sqft}
Features: ${request.scope.features.join(', ')}
Trades Required: ${scopeAnalysis.trades.join(', ')}

Provide material categories and items in JSON:
{
  "categories": [
    {
      "name": "Category Name",
      "items": [
        { "name": "Item", "quantity": 10, "unit": "each", "unitCost": 50 }
      ]
    }
  ],
  "allowances": [
    { "item": "Fixtures", "amount": 5000 }
  ]
}`;

    const aiMaterials = await generateJSON<{
      categories: { name: string; items: { name: string; quantity: number; unit: string; unitCost: number }[] }[];
      allowances: { item: string; amount: number }[];
    }>({
      systemPrompt: 'You are a construction estimating expert. Generate realistic material estimates with current market pricing.',
      userPrompt: materialPrompt,
    });

    // Apply multipliers and calculate totals
    const categories: MaterialCategory[] = aiMaterials.categories.map(cat => {
      const items: MaterialItem[] = cat.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitCost: Math.round(item.unitCost * regionMultiplier * 100) / 100,
        totalCost: Math.round(item.quantity * item.unitCost * regionMultiplier * 100) / 100,
      }));

      return {
        name: cat.name,
        items,
        subtotal: items.reduce((sum, item) => sum + item.totalCost, 0),
      };
    });

    const materialSubtotal = categories.reduce((sum, cat) => sum + cat.subtotal, 0);
    const allowancesTotal = aiMaterials.allowances.reduce((sum, a) => sum + a.amount, 0);
    const totalCost = Math.round((materialSubtotal + allowancesTotal) * complexityMultiplier);

    return {
      categories,
      totalCost,
      allowances: aiMaterials.allowances,
    };
  }

  /**
   * Estimate project timeline
   */
  private async estimateTimeline(
    request: EstimateRequest,
    laborEstimate: LaborEstimate
  ): Promise<TimelineEstimate> {
    // Calculate total duration based on labor
    const totalLaborDays = Math.ceil(laborEstimate.totalHours / 8);
    // Assume 60% efficiency for parallel work
    const totalDays = Math.ceil(totalLaborDays * 0.6);

    // Generate phases based on project type
    const phases = this.generatePhases(request.projectType, totalDays);

    // Generate milestones
    const milestones = this.generateMilestones(phases);

    // Identify critical path
    const criticalPath = phases
      .filter(p => p.dependencies.length === 0 || phases.findIndex(ph => ph.name === p.dependencies[0]) < phases.indexOf(p))
      .map(p => p.name);

    return {
      startDate: request.preferredStartDate,
      endDate: request.preferredStartDate
        ? addWorkingDays(request.preferredStartDate, totalDays)
        : undefined,
      totalDays,
      phases,
      milestones,
      criticalPath,
    };
  }

  /**
   * Generate construction phases
   */
  private generatePhases(projectType: ProjectType, totalDays: number): PhaseEstimate[] {
    const phaseTemplates: Record<ProjectType, PhaseEstimate[]> = {
      KITCHEN_REMODEL: [
        { name: 'Demo & Prep', order: 1, duration: 2, trades: ['General Labor'], dependencies: [], description: 'Demolition and site preparation' },
        { name: 'Rough Plumbing', order: 2, duration: 2, trades: ['Plumber'], dependencies: ['Demo & Prep'], description: 'Plumbing rough-in' },
        { name: 'Rough Electrical', order: 3, duration: 2, trades: ['Electrician'], dependencies: ['Demo & Prep'], description: 'Electrical rough-in' },
        { name: 'Drywall', order: 4, duration: 3, trades: ['Drywall'], dependencies: ['Rough Plumbing', 'Rough Electrical'], description: 'Drywall installation and finish' },
        { name: 'Cabinets', order: 5, duration: 2, trades: ['Cabinet Installer'], dependencies: ['Drywall'], description: 'Cabinet installation' },
        { name: 'Countertops', order: 6, duration: 1, trades: ['General Labor'], dependencies: ['Cabinets'], description: 'Countertop installation' },
        { name: 'Tile & Backsplash', order: 7, duration: 2, trades: ['Tile Setter'], dependencies: ['Countertops'], description: 'Tile and backsplash' },
        { name: 'Final MEP', order: 8, duration: 2, trades: ['Plumber', 'Electrician'], dependencies: ['Cabinets'], description: 'Final plumbing and electrical' },
        { name: 'Paint & Touch-up', order: 9, duration: 2, trades: ['Painter'], dependencies: ['Tile & Backsplash', 'Final MEP'], description: 'Painting and final touches' },
      ],
      BATHROOM_REMODEL: [
        { name: 'Demo', order: 1, duration: 1, trades: ['General Labor'], dependencies: [], description: 'Demolition' },
        { name: 'Rough Plumbing', order: 2, duration: 2, trades: ['Plumber'], dependencies: ['Demo'], description: 'Plumbing rough-in' },
        { name: 'Rough Electrical', order: 3, duration: 1, trades: ['Electrician'], dependencies: ['Demo'], description: 'Electrical rough-in' },
        { name: 'Waterproofing', order: 4, duration: 1, trades: ['General Labor'], dependencies: ['Rough Plumbing'], description: 'Waterproofing membrane' },
        { name: 'Tile', order: 5, duration: 3, trades: ['Tile Setter'], dependencies: ['Waterproofing'], description: 'Floor and wall tile' },
        { name: 'Vanity & Fixtures', order: 6, duration: 1, trades: ['Plumber', 'Carpenter'], dependencies: ['Tile'], description: 'Vanity and fixture installation' },
        { name: 'Final Connections', order: 7, duration: 1, trades: ['Plumber', 'Electrician'], dependencies: ['Vanity & Fixtures'], description: 'Final connections' },
        { name: 'Paint & Accessories', order: 8, duration: 1, trades: ['Painter'], dependencies: ['Final Connections'], description: 'Paint and accessories' },
      ],
      ROOM_ADDITION: [
        { name: 'Foundation', order: 1, duration: 5, trades: ['Concrete'], dependencies: [], description: 'Foundation work' },
        { name: 'Framing', order: 2, duration: 5, trades: ['Carpenter'], dependencies: ['Foundation'], description: 'Wall and roof framing' },
        { name: 'Roofing', order: 3, duration: 3, trades: ['Roofer'], dependencies: ['Framing'], description: 'Roof installation' },
        { name: 'Windows & Doors', order: 4, duration: 2, trades: ['Carpenter'], dependencies: ['Framing'], description: 'Window and door installation' },
        { name: 'MEP Rough', order: 5, duration: 5, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Windows & Doors'], description: 'MEP rough-in' },
        { name: 'Insulation', order: 6, duration: 2, trades: ['General Labor'], dependencies: ['MEP Rough'], description: 'Insulation' },
        { name: 'Drywall', order: 7, duration: 4, trades: ['Drywall'], dependencies: ['Insulation'], description: 'Drywall' },
        { name: 'Flooring', order: 8, duration: 3, trades: ['Flooring'], dependencies: ['Drywall'], description: 'Flooring installation' },
        { name: 'MEP Trim', order: 9, duration: 3, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Drywall'], description: 'MEP trim-out' },
        { name: 'Paint & Finish', order: 10, duration: 3, trades: ['Painter'], dependencies: ['Flooring', 'MEP Trim'], description: 'Paint and finish work' },
      ],
      NEW_CONSTRUCTION: [
        { name: 'Site Prep', order: 1, duration: 5, trades: ['General Labor', 'Concrete'], dependencies: [], description: 'Site preparation' },
        { name: 'Foundation', order: 2, duration: 10, trades: ['Concrete'], dependencies: ['Site Prep'], description: 'Foundation' },
        { name: 'Framing', order: 3, duration: 15, trades: ['Carpenter'], dependencies: ['Foundation'], description: 'Framing' },
        { name: 'Roofing', order: 4, duration: 5, trades: ['Roofer'], dependencies: ['Framing'], description: 'Roofing' },
        { name: 'Exterior', order: 5, duration: 10, trades: ['Carpenter', 'Mason'], dependencies: ['Roofing'], description: 'Exterior finish' },
        { name: 'MEP Rough', order: 6, duration: 15, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Framing'], description: 'MEP rough-in' },
        { name: 'Insulation', order: 7, duration: 5, trades: ['General Labor'], dependencies: ['MEP Rough'], description: 'Insulation' },
        { name: 'Drywall', order: 8, duration: 10, trades: ['Drywall'], dependencies: ['Insulation'], description: 'Drywall' },
        { name: 'Interior Finish', order: 9, duration: 15, trades: ['Carpenter', 'Flooring', 'Tile Setter'], dependencies: ['Drywall'], description: 'Interior finish' },
        { name: 'MEP Trim', order: 10, duration: 5, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Drywall'], description: 'MEP trim' },
        { name: 'Paint', order: 11, duration: 5, trades: ['Painter'], dependencies: ['Interior Finish', 'MEP Trim'], description: 'Painting' },
        { name: 'Final Punch', order: 12, duration: 5, trades: ['General Labor'], dependencies: ['Paint'], description: 'Final punch and cleanup' },
      ],
      RENOVATION: [
        { name: 'Demo', order: 1, duration: 3, trades: ['General Labor'], dependencies: [], description: 'Selective demolition' },
        { name: 'Structural', order: 2, duration: 3, trades: ['Carpenter'], dependencies: ['Demo'], description: 'Structural modifications' },
        { name: 'MEP Rough', order: 3, duration: 5, trades: ['Electrician', 'Plumber'], dependencies: ['Structural'], description: 'MEP rough-in' },
        { name: 'Drywall', order: 4, duration: 4, trades: ['Drywall'], dependencies: ['MEP Rough'], description: 'Drywall' },
        { name: 'Flooring', order: 5, duration: 3, trades: ['Flooring'], dependencies: ['Drywall'], description: 'Flooring' },
        { name: 'Paint & Finish', order: 6, duration: 3, trades: ['Painter'], dependencies: ['Flooring'], description: 'Paint and finish' },
      ],
      COMMERCIAL_TI: [
        { name: 'Demo', order: 1, duration: 3, trades: ['General Labor'], dependencies: [], description: 'Demolition' },
        { name: 'Framing', order: 2, duration: 5, trades: ['Carpenter'], dependencies: ['Demo'], description: 'Metal stud framing' },
        { name: 'MEP Rough', order: 3, duration: 7, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Framing'], description: 'MEP rough-in' },
        { name: 'Ceiling Grid', order: 4, duration: 3, trades: ['Carpenter'], dependencies: ['MEP Rough'], description: 'Ceiling grid' },
        { name: 'Drywall', order: 5, duration: 5, trades: ['Drywall'], dependencies: ['Ceiling Grid'], description: 'Drywall' },
        { name: 'Flooring', order: 6, duration: 4, trades: ['Flooring'], dependencies: ['Drywall'], description: 'Flooring' },
        { name: 'MEP Trim', order: 7, duration: 3, trades: ['Electrician', 'Plumber', 'HVAC Technician'], dependencies: ['Ceiling Grid'], description: 'MEP trim' },
        { name: 'Paint', order: 8, duration: 3, trades: ['Painter'], dependencies: ['Flooring', 'MEP Trim'], description: 'Painting' },
      ],
      EXTERIOR: [
        { name: 'Prep', order: 1, duration: 2, trades: ['General Labor'], dependencies: [], description: 'Surface preparation' },
        { name: 'Roofing', order: 2, duration: 4, trades: ['Roofer'], dependencies: ['Prep'], description: 'Roofing work' },
        { name: 'Siding/Stucco', order: 3, duration: 5, trades: ['Carpenter', 'Mason'], dependencies: ['Prep'], description: 'Siding or stucco' },
        { name: 'Paint', order: 4, duration: 3, trades: ['Painter'], dependencies: ['Siding/Stucco'], description: 'Exterior painting' },
        { name: 'Cleanup', order: 5, duration: 1, trades: ['General Labor'], dependencies: ['Roofing', 'Paint'], description: 'Site cleanup' },
      ],
      CUSTOM: [
        { name: 'Planning', order: 1, duration: 5, trades: ['Project Manager'], dependencies: [], description: 'Planning and coordination' },
        { name: 'Phase 1', order: 2, duration: 10, trades: ['Carpenter', 'Electrician', 'Plumber'], dependencies: ['Planning'], description: 'Phase 1 work' },
        { name: 'Phase 2', order: 3, duration: 10, trades: ['Drywall', 'Painter', 'Flooring'], dependencies: ['Phase 1'], description: 'Phase 2 work' },
        { name: 'Completion', order: 4, duration: 5, trades: ['General Labor'], dependencies: ['Phase 2'], description: 'Completion and punch' },
      ],
    };

    return phaseTemplates[projectType] || phaseTemplates.CUSTOM;
  }

  /**
   * Generate project milestones
   */
  private generateMilestones(phases: PhaseEstimate[]): Milestone[] {
    const milestones: Milestone[] = [];
    let dayOffset = 0;

    // Start milestone
    milestones.push({
      name: 'Project Start',
      dayOffset: 0,
      deliverables: ['Permits obtained', 'Materials ordered', 'Site prepared'],
    });

    // Phase completion milestones
    for (const phase of phases) {
      dayOffset += phase.duration;
      if (phase.order % 3 === 0 || phase.order === phases.length) {
        milestones.push({
          name: `${phase.name} Complete`,
          dayOffset,
          deliverables: [`${phase.name} work completed`, 'Quality inspection passed'],
        });
      }
    }

    // Final milestone
    milestones.push({
      name: 'Project Completion',
      dayOffset,
      deliverables: ['Final inspection passed', 'Client walkthrough complete', 'Documentation delivered'],
    });

    return milestones;
  }

  /**
   * Calculate estimate confidence
   */
  private calculateConfidence(request: EstimateRequest, scopeAnalysis: any): number {
    let confidence = 100;

    // Reduce confidence for missing information
    if (!request.scope.squareFootage) confidence -= 15;
    if (!request.location) confidence -= 10;
    if (request.scope.complexity === 'custom') confidence -= 20;
    if (request.scope.features.length < 3) confidence -= 10;
    if (scopeAnalysis.riskFactors.length > 3) confidence -= 15;

    return Math.max(50, confidence);
  }

  /**
   * Create service ticket with workflow
   */
  async createServiceTicket(data: {
    type: ServiceTicketType;
    clientId: string;
    projectId?: string;
    title: string;
    description: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<ServiceTicket> {
    const ticket: ServiceTicket = {
      id: crypto.randomUUID(),
      type: data.type,
      status: 'INTAKE',
      priority: data.priority || 'medium',
      clientId: data.clientId,
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      createdAt: new Date(),
      workflow: [{
        step: 'INTAKE',
        enteredAt: new Date(),
      }],
    };

    return ticket;
  }

  /**
   * Advance ticket to next workflow step
   */
  advanceTicketWorkflow(
    ticket: ServiceTicket,
    userId: string,
    notes?: string,
    data?: Record<string, any>
  ): ServiceTicket {
    const workflowOrder: TicketStatus[] = [
      'INTAKE',
      'ESTIMATION',
      'APPROVAL',
      'SCHEDULING',
      'IN_PROGRESS',
      'QUALITY_CHECK',
      'CLOSEOUT',
      'COMPLETED',
    ];

    const currentIndex = workflowOrder.indexOf(ticket.status);
    if (currentIndex === -1 || currentIndex >= workflowOrder.length - 1) {
      return ticket;
    }

    // Complete current step
    const currentStep = ticket.workflow.find(w => w.step === ticket.status && !w.completedAt);
    if (currentStep) {
      currentStep.completedAt = new Date();
      currentStep.completedBy = userId;
      currentStep.notes = notes;
      currentStep.data = data;
    }

    // Advance to next step
    const nextStatus = workflowOrder[currentIndex + 1];
    ticket.status = nextStatus;
    ticket.workflow.push({
      step: nextStatus,
      enteredAt: new Date(),
    });

    if (nextStatus === 'COMPLETED') {
      ticket.completedAt = new Date();
    }

    return ticket;
  }
}

const estimationService = new EstimationService();

// ============================================================================
// WORKER
// ============================================================================

async function processEstimationJob(job: Job): Promise<any> {
  const { type, ...data } = job.data;

  switch (type) {
    case 'GENERATE_ESTIMATE':
      return await generateEstimate(data);

    case 'CREATE_TICKET':
      return await createTicket(data);

    case 'ADVANCE_WORKFLOW':
      return await advanceWorkflow(data);

    case 'UPDATE_ESTIMATE':
      return await updateEstimate(data);

    case 'CONVERT_TO_PROJECT':
      return await convertToProject(data);

    default:
      throw new Error(`Unknown job type: ${type}`);
  }
}

async function generateEstimate(data: EstimateRequest) {
  const estimate = await estimationService.generateEstimate(data);

  // Save to database
  const saved = await prisma.estimate.create({
    data: {
      projectType: estimate.projectType,
      status: estimate.status,
      scope: estimate.scope as any,
      laborEstimate: estimate.laborEstimate as any,
      materialEstimate: estimate.materialEstimate as any,
      timeline: estimate.timeline as any,
      totalCost: estimate.totalCost,
      contingency: estimate.contingency,
      markup: estimate.markup,
      finalPrice: estimate.finalPrice,
      confidence: estimate.confidence,
      assumptions: estimate.assumptions,
      exclusions: estimate.exclusions,
      validUntil: estimate.validUntil,
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.ESTIMATE_GENERATED, {
    estimateId: saved.id,
    projectType: estimate.projectType,
    finalPrice: estimate.finalPrice,
    confidence: estimate.confidence,
  });

  return { ...estimate, id: saved.id };
}

async function createTicket(data: {
  type: ServiceTicketType;
  clientId: string;
  projectId?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}) {
  const ticket = await estimationService.createServiceTicket(data);

  // Save to database
  const saved = await prisma.serviceTicket.create({
    data: {
      type: ticket.type,
      status: ticket.status,
      priority: ticket.priority,
      clientId: ticket.clientId,
      projectId: ticket.projectId,
      title: ticket.title,
      description: ticket.description,
      workflow: ticket.workflow as any,
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.TICKET_CREATED, {
    ticketId: saved.id,
    type: ticket.type,
    priority: ticket.priority,
    clientId: ticket.clientId,
  });

  return { ...ticket, id: saved.id };
}

async function advanceWorkflow(data: {
  ticketId: string;
  userId: string;
  notes?: string;
  stepData?: Record<string, any>;
}) {
  const ticket = await prisma.serviceTicket.findUnique({
    where: { id: data.ticketId },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const updated = estimationService.advanceTicketWorkflow(
    ticket as unknown as ServiceTicket,
    data.userId,
    data.notes,
    data.stepData
  );

  // Update in database
  await prisma.serviceTicket.update({
    where: { id: data.ticketId },
    data: {
      status: updated.status,
      workflow: updated.workflow as any,
      completedAt: updated.completedAt,
    } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.TICKET_STATUS_CHANGED, {
    ticketId: data.ticketId,
    newStatus: updated.status,
    previousStatus: ticket.status,
  });

  return updated;
}

async function updateEstimate(data: {
  estimateId: string;
  updates: Partial<Estimate>;
}) {
  const estimate = await prisma.estimate.update({
    where: { id: data.estimateId },
    data: data.updates as any,
  });

  return estimate;
}

async function convertToProject(data: {
  estimateId: string;
  clientId: string;
  startDate: Date;
}) {
  const estimate = await prisma.estimate.findUnique({
    where: { id: data.estimateId },
  });

  if (!estimate) {
    throw new Error('Estimate not found');
  }

  // Create project from estimate
  const project = await prisma.project.create({
    data: {
      clientId: data.clientId,
      name: `${(estimate as any).projectType} Project`,
      status: 'PLANNING',
      startDate: data.startDate,
      endDate: addWorkingDays(data.startDate, (estimate as any).timeline?.totalDays || 30),
      totalBudget: (estimate as any).finalPrice,
      estimateId: estimate.id,
    } as any,
  });

  // Update estimate status
  await prisma.estimate.update({
    where: { id: data.estimateId },
    data: { status: 'ACCEPTED', projectId: project.id } as any,
  });

  // Emit event
  await eventBus.publish(EVENT_TYPES.PROJECT_CREATED, {
    projectId: project.id,
    estimateId: data.estimateId,
    clientId: data.clientId,
  });

  return project;
}

// Create worker
export const estimationWorker = createWorker(
  QUEUE_NAMES.ESTIMATION as any,
  processEstimationJob
);

// ============================================================================
// ROUTES
// ============================================================================

export async function estimationRoutes(fastify: FastifyInstance) {
  /**
   * Generate new estimate
   */
  fastify.post('/estimates', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as EstimateRequest;

    const job = await queues.ESTIMATION.add(
      'generate-estimate',
      { type: 'GENERATE_ESTIMATE', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'generating' };
  });

  /**
   * Get estimate by ID
   */
  fastify.get('/estimates/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const estimate = await prisma.estimate.findUnique({
      where: { id },
    });

    if (!estimate) {
      return reply.status(404).send({ error: 'Estimate not found' });
    }

    return estimate;
  });

  /**
   * Update estimate status
   */
  fastify.patch('/estimates/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { status, approvedBy } = request.body as { status: EstimateStatus; approvedBy?: string };

    const estimate = await prisma.estimate.update({
      where: { id },
      data: {
        status,
        ...(status === 'APPROVED' && { approvedBy, approvedAt: new Date() }),
      } as any,
    });

    return estimate;
  });

  /**
   * Convert estimate to project
   */
  fastify.post('/estimates/:id/convert', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { clientId, startDate } = request.body as { clientId: string; startDate: string };

    const job = await queues.ESTIMATION.add(
      'convert-to-project',
      { type: 'CONVERT_TO_PROJECT', estimateId: id, clientId, startDate: new Date(startDate) },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'converting' };
  });

  /**
   * Create service ticket
   */
  fastify.post('/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    const data = request.body as {
      type: ServiceTicketType;
      clientId: string;
      projectId?: string;
      title: string;
      description: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    };

    const job = await queues.ESTIMATION.add(
      'create-ticket',
      { type: 'CREATE_TICKET', ...data },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'creating' };
  });

  /**
   * Get service ticket
   */
  fastify.get('/tickets/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const ticket = await prisma.serviceTicket.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!ticket) {
      return reply.status(404).send({ error: 'Ticket not found' });
    }

    return ticket;
  });

  /**
   * Advance ticket workflow
   */
  fastify.post('/tickets/:id/advance', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { userId, notes, stepData } = request.body as {
      userId: string;
      notes?: string;
      stepData?: Record<string, any>;
    };

    const job = await queues.ESTIMATION.add(
      'advance-workflow',
      { type: 'ADVANCE_WORKFLOW', ticketId: id, userId, notes, stepData },
      JOB_OPTIONS.DEFAULT
    );

    return { jobId: job.id, status: 'advancing' };
  });

  /**
   * Get tickets for client
   */
  fastify.get('/clients/:clientId/tickets', async (request: FastifyRequest, reply: FastifyReply) => {
    const { clientId } = request.params as { clientId: string };
    const { status } = request.query as { status?: string };

    const tickets = await prisma.serviceTicket.findMany({
      where: {
        clientId,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return { tickets };
  });

  /**
   * Get labor rates
   */
  fastify.get('/rates/labor', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      rates: {
        'General Labor': 45,
        'Carpenter': 65,
        'Electrician': 85,
        'Plumber': 80,
        'HVAC Technician': 85,
        'Painter': 55,
        'Tile Setter': 70,
        'Roofer': 60,
        'Concrete': 55,
        'Drywall': 50,
        'Flooring': 60,
        'Cabinet Installer': 70,
        'Mason': 75,
        'Welder': 80,
        'Supervisor': 95,
        'Project Manager': 110,
      },
    };
  });

  /**
   * Ticket transition (status change)
   */
  fastify.post('/tickets/:id/transition', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { newStatus, assignedTo, notes, estimateId } = request.body as {
      newStatus: TicketStatus;
      assignedTo?: string;
      notes?: string;
      estimateId?: string;
    };

    const ticket = await prisma.serviceTicket.findUnique({ where: { id } });
    if (!ticket) {
      return reply.status(404).send({ error: 'Ticket not found' });
    }

    // Update ticket
    const updated = await prisma.serviceTicket.update({
      where: { id },
      data: {
        status: newStatus,
        ...(assignedTo && { assignedTo }),
        ...(estimateId && { estimateId }),
        workflow: [
          ...((ticket as any).workflow || []),
          { step: newStatus, enteredAt: new Date(), notes },
        ],
        ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
      } as any,
    });

    // Emit event
    await eventBus.publish(EVENT_TYPES.TICKET_STATUS_CHANGED, {
      ticketId: id,
      newStatus,
      previousStatus: ticket.status,
    });

    return updated;
  });

  /**
   * Get estimate for project
   */
  fastify.get('/project/:projectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { projectId } = request.params as { projectId: string };

    const estimate = await prisma.estimate.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (!estimate) {
      return reply.status(404).send({ error: 'No estimate found for this project' });
    }

    return estimate;
  });

  /**
   * Metrics endpoint (for OS-PM API integration)
   */
  fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeTickets,
      pendingEstimates,
      completedThisMonth,
      acceptedEstimates,
      totalEstimates,
    ] = await Promise.all([
      prisma.serviceTicket.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      prisma.estimate.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.serviceTicket.count({
        where: { completedAt: { gte: startOfMonth } },
      }),
      prisma.estimate.count({ where: { status: 'ACCEPTED' } }),
      prisma.estimate.count(),
    ]);

    const averageEstimateAccuracy = totalEstimates > 0
      ? Math.round((acceptedEstimates / totalEstimates) * 100)
      : 0;

    return {
      activeTickets,
      pendingEstimates,
      completedThisMonth,
      averageEstimateAccuracy,
    };
  });

  /**
   * Dashboard metrics
   */
  fastify.get('/dashboard/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    const [
      estimatesThisMonth,
      acceptedEstimates,
      pendingTickets,
      avgEstimateValue,
    ] = await Promise.all([
      prisma.estimate.count({
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } },
      }),
      prisma.estimate.count({ where: { status: 'ACCEPTED' } }),
      prisma.serviceTicket.count({
        where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      }),
      prisma.estimate.aggregate({
        _avg: { finalPrice: true },
      }),
    ]);

    return {
      estimatesThisMonth,
      acceptedEstimates,
      pendingTickets,
      avgEstimateValue: (avgEstimateValue._avg as any)?.finalPrice || 0,
    };
  });
}
