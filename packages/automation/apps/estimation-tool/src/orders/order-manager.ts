/**
 * Order Manager
 * Manage estimation work orders using the Estimate model with metadata storage
 *
 * Order information is stored in Estimate.metadata.orderInfo
 * The Estimate status field tracks order status (DRAFT_ESTIMATE, IN_PROGRESS_ESTIMATE, etc.)
 */

import { PrismaClient, Estimate, EstimateStatus, EstimateType, Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import {
  notifyOrderCreated,
  notifyOrderAssigned,
  notifyOrderCompleted,
} from '@kealee/realtime';

const prisma = new PrismaClient();

/**
 * Helper type for JSON-serializable order info to satisfy Prisma's InputJsonValue
 */
type JsonOrderInfo = Prisma.InputJsonValue;

// Order types for internal categorization (stored in metadata)
export type OrderType =
  | 'NEW_ESTIMATE'
  | 'REVISION'
  | 'CHANGE_ORDER'
  | 'VALUE_ENGINEERING'
  | 'TAKEOFF_ONLY'
  | 'PRICING_ONLY'
  | 'REVIEW'
  | 'COMPARISON';

export type OrderPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// Maps internal order status to Estimate status
export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ON_HOLD';

export interface OrderScope {
  projectType?: string;
  buildingType?: string;
  squareFootage?: number;
  divisions?: string[];
  complexity?: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  specialRequirements?: string[];
  documents?: OrderDocument[];
}

export interface OrderDocument {
  id: string;
  name: string;
  type: 'DRAWINGS' | 'SPECIFICATIONS' | 'ADDENDUM' | 'RFI' | 'OTHER';
  url: string;
  uploadedAt: Date;
}

export interface OrderDeliverable {
  id: string;
  type: 'ESTIMATE' | 'TAKEOFF' | 'REPORT' | 'COMPARISON' | 'ANALYSIS';
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate?: Date;
  completedAt?: Date;
  resultId?: string;
}

/**
 * Order info structure stored in Estimate.metadata.orderInfo
 */
export interface OrderInfo {
  type: OrderType;
  priority: OrderPriority;
  assignedTo?: string;
  assignedTeam?: string;
  dueDate?: string; // ISO date string
  estimatedHours?: number;
  actualHours?: number;
  notes: string[];
  deliverables: OrderDeliverable[];
  scope: OrderScope;
  createdBy: string;
  completedAt?: string; // ISO date string
}

export interface EstimationOrder {
  id: string;
  organizationId: string;
  projectId: string;
  bidRequestId?: string;
  type: OrderType;
  priority: OrderPriority;
  status: OrderStatus;
  title: string;
  description?: string;
  scope: OrderScope;
  assignedTo?: string;
  assignedTeam?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  estimateId?: string;
  deliverables: OrderDeliverable[];
  notes: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  completedAt?: Date;
}

export interface CreateOrderInput {
  organizationId: string;
  projectId: string;
  bidRequestId?: string;
  type: OrderType;
  priority?: OrderPriority;
  title: string;
  description?: string;
  scope?: Partial<OrderScope>;
  assignedTo?: string;
  assignedTeam?: string;
  dueDate?: Date;
  estimatedHours?: number;
  createdBy: string;
}

/**
 * Map OrderType to EstimateType for creating Estimate records
 */
function mapOrderTypeToEstimateType(orderType: OrderType): EstimateType {
  const mapping: Record<OrderType, EstimateType> = {
    NEW_ESTIMATE: 'DETAILED',
    REVISION: 'DETAILED',
    CHANGE_ORDER: 'CHANGE_ORDER_ESTIMATE',
    VALUE_ENGINEERING: 'VALUE_ENGINEERING',
    TAKEOFF_ONLY: 'PRELIMINARY',
    PRICING_ONLY: 'QUICK_BUDGET',
    REVIEW: 'DETAILED',
    COMPARISON: 'DETAILED',
  };
  return mapping[orderType] || 'DETAILED';
}

/**
 * Map OrderStatus to EstimateStatus
 */
function mapOrderStatusToEstimateStatus(orderStatus: OrderStatus): EstimateStatus {
  const mapping: Record<OrderStatus, EstimateStatus> = {
    DRAFT: 'DRAFT_ESTIMATE',
    PENDING: 'DRAFT_ESTIMATE',
    ASSIGNED: 'DRAFT_ESTIMATE',
    IN_PROGRESS: 'IN_PROGRESS_ESTIMATE',
    REVIEW: 'UNDER_REVIEW_ESTIMATE',
    COMPLETED: 'APPROVED_ESTIMATE',
    CANCELLED: 'ARCHIVED_ESTIMATE',
    ON_HOLD: 'DRAFT_ESTIMATE',
  };
  return mapping[orderStatus] || 'DRAFT_ESTIMATE';
}

/**
 * Map EstimateStatus to OrderStatus
 */
function mapEstimateStatusToOrderStatus(estimateStatus: EstimateStatus, orderInfo?: OrderInfo): OrderStatus {
  // Check if order has specific status info stored
  if (orderInfo) {
    // Check for cancelled or on-hold via notes
    const lastNote = orderInfo.notes?.[orderInfo.notes.length - 1] || '';
    if (lastNote.includes('Cancelled:')) return 'CANCELLED';
    if (lastNote.includes('Put on hold:')) return 'ON_HOLD';
    if (orderInfo.assignedTo && estimateStatus === 'DRAFT_ESTIMATE') return 'ASSIGNED';
    if (!orderInfo.assignedTo && estimateStatus === 'DRAFT_ESTIMATE') return 'PENDING';
    if (orderInfo.completedAt) return 'COMPLETED';
  }

  const mapping: Record<EstimateStatus, OrderStatus> = {
    DRAFT_ESTIMATE: 'DRAFT',
    IN_PROGRESS_ESTIMATE: 'IN_PROGRESS',
    UNDER_REVIEW_ESTIMATE: 'REVIEW',
    PENDING_APPROVAL_ESTIMATE: 'REVIEW',
    APPROVED_ESTIMATE: 'COMPLETED',
    SENT_ESTIMATE: 'COMPLETED',
    ACCEPTED_ESTIMATE: 'COMPLETED',
    REJECTED_ESTIMATE: 'CANCELLED',
    EXPIRED_ESTIMATE: 'CANCELLED',
    SUPERSEDED: 'COMPLETED',
    ARCHIVED_ESTIMATE: 'CANCELLED',
  };
  return mapping[estimateStatus] || 'DRAFT';
}

/**
 * Type guard to check if metadata has orderInfo
 */
function hasOrderInfo(metadata: unknown): metadata is { orderInfo: OrderInfo } {
  return (
    metadata !== null &&
    typeof metadata === 'object' &&
    'orderInfo' in metadata &&
    (metadata as Record<string, unknown>).orderInfo !== null &&
    typeof (metadata as Record<string, unknown>).orderInfo === 'object'
  );
}

/**
 * Extract orderInfo from metadata safely
 */
function getOrderInfo(metadata: unknown): OrderInfo | undefined {
  if (hasOrderInfo(metadata)) {
    return metadata.orderInfo;
  }
  return undefined;
}

export class OrderManager {
  /**
   * Create a new estimation order
   * Creates an Estimate record with order info stored in metadata.orderInfo
   */
  async createOrder(input: CreateOrderInput): Promise<EstimationOrder> {
    // Calculate estimated hours if not provided
    const estimatedHours = input.estimatedHours || this.estimateWorkHours(
      input.type,
      input.scope
    );

    // Create deliverables based on order type
    const deliverables = this.createDeliverables(input.type, input.dueDate);

    // Determine initial status
    const initialOrderStatus: OrderStatus = input.assignedTo ? 'ASSIGNED' : 'PENDING';
    const estimateStatus = mapOrderStatusToEstimateStatus(initialOrderStatus);
    const estimateType = mapOrderTypeToEstimateType(input.type);

    // Build order info for metadata
    const orderInfo: OrderInfo = {
      type: input.type,
      priority: input.priority || 'MEDIUM',
      assignedTo: input.assignedTo,
      assignedTeam: input.assignedTeam,
      dueDate: input.dueDate?.toISOString(),
      estimatedHours,
      notes: [],
      deliverables,
      scope: (input.scope || {}) as OrderScope,
      createdBy: input.createdBy,
    };

    const estimate = await prisma.estimate.create({
      data: {
        id: uuid(),
        organizationId: input.organizationId,
        projectId: input.projectId,
        bidRequestId: input.bidRequestId,
        name: input.title,
        description: input.description,
        type: estimateType,
        status: estimateStatus,
        projectType: input.scope?.projectType,
        buildingType: input.scope?.buildingType,
        squareFootage: input.scope?.squareFootage,
        metadata: { orderInfo } as unknown as JsonOrderInfo,
      },
    });

    const order = this.mapEstimateToOrder(estimate);

    // Broadcast order created event
    notifyOrderCreated({
      orderId: order.id,
      projectId: order.projectId,
      organizationId: order.organizationId,
      title: order.title,
      type: order.type,
      status: order.status,
      priority: order.priority,
      assignedTo: order.assignedTo,
    }, input.createdBy).catch((err: unknown) =>
      console.error('[Realtime] order.created broadcast failed:', err)
    );

    return order;
  }

  /**
   * Get order by ID (finds Estimate with order metadata)
   */
  async getOrder(orderId: string): Promise<EstimationOrder | null> {
    const estimate = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!estimate) return null;

    // Check if this estimate has order info
    const orderInfo = getOrderInfo(estimate.metadata);
    if (!orderInfo) return null;

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Get orders for organization
   * Queries Estimates that have orderInfo in metadata
   */
  async getOrganizationOrders(
    organizationId: string,
    options?: {
      status?: OrderStatus;
      priority?: OrderPriority;
      assignedTo?: string;
      type?: OrderType;
      limit?: number;
    }
  ): Promise<EstimationOrder[]> {
    // Build status filter
    const statusFilter = options?.status
      ? mapOrderStatusToEstimateStatus(options.status)
      : undefined;

    const estimates = await prisma.estimate.findMany({
      where: {
        organizationId,
        ...(statusFilter && { status: statusFilter }),
        // Post-filter for metadata with order info
      },
      take: options?.limit ? options.limit * 2 : undefined, // Fetch extra since we filter
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    // Filter and map estimates that have order info
    let orders = estimates
      .filter((e: Estimate) => {
        const orderInfo = getOrderInfo(e.metadata);
        if (!orderInfo) return false;

        // Apply additional filters
        if (options?.priority && orderInfo.priority !== options.priority) return false;
        if (options?.assignedTo && orderInfo.assignedTo !== options.assignedTo) return false;
        if (options?.type && orderInfo.type !== options.type) return false;

        return true;
      })
      .map((e: Estimate) => this.mapEstimateToOrder(e));

    // Sort by priority and due date
    orders = orders.sort((a, b) => {
      const priorityOrder: Record<OrderPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });

    // Apply limit after filtering
    if (options?.limit) {
      orders = orders.slice(0, options.limit);
    }

    return orders;
  }

  /**
   * Get orders for project
   */
  async getProjectOrders(projectId: string): Promise<EstimationOrder[]> {
    const estimates = await prisma.estimate.findMany({
      where: {
        projectId,
        // Post-filter for metadata with order info
      },
      orderBy: { createdAt: 'desc' },
    });

    return estimates
      .filter((e: Estimate) => getOrderInfo(e.metadata) !== undefined)
      .map((e: Estimate) => this.mapEstimateToOrder(e));
  }

  /**
   * Get pending orders (queue)
   */
  async getPendingOrders(
    organizationId: string,
    options?: { limit?: number }
  ): Promise<EstimationOrder[]> {
    const estimates = await prisma.estimate.findMany({
      where: {
        organizationId,
        status: { in: ['DRAFT_ESTIMATE'] },
        // Post-filter for metadata with order info
      },
      take: (options?.limit || 20) * 2, // Fetch extra since we filter
      orderBy: { createdAt: 'desc' },
    });

    // Filter for pending/assigned orders and sort by priority
    let orders = estimates
      .filter((e: Estimate) => {
        const orderInfo = getOrderInfo(e.metadata);
        if (!orderInfo) return false;
        const status = mapEstimateStatusToOrderStatus(e.status, orderInfo);
        return status === 'PENDING' || status === 'ASSIGNED';
      })
      .map((e: Estimate) => this.mapEstimateToOrder(e));

    // Sort by priority and due date
    orders = orders.sort((a, b) => {
      const priorityOrder: Record<OrderPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      return 0;
    });

    // Apply limit after filtering
    return orders.slice(0, options?.limit || 20);
  }

  /**
   * Update order
   */
  async updateOrder(
    orderId: string,
    updates: Partial<{
      priority: OrderPriority;
      status: OrderStatus;
      title: string;
      description: string;
      scope: Partial<OrderScope>;
      assignedTo: string;
      assignedTeam: string;
      dueDate: Date;
      estimatedHours: number;
      actualHours: number;
      estimateId: string;
    }>
  ): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    // Merge scope updates
    const updatedScope = updates.scope
      ? { ...orderInfo.scope, ...updates.scope }
      : orderInfo.scope;

    // Build updated order info
    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      ...(updates.priority && { priority: updates.priority }),
      ...(updates.assignedTo !== undefined && { assignedTo: updates.assignedTo }),
      ...(updates.assignedTeam !== undefined && { assignedTeam: updates.assignedTeam }),
      ...(updates.dueDate && { dueDate: updates.dueDate.toISOString() }),
      ...(updates.estimatedHours !== undefined && { estimatedHours: updates.estimatedHours }),
      ...(updates.actualHours !== undefined && { actualHours: updates.actualHours }),
      scope: updatedScope,
    };

    // Determine estimate status if order status changed
    const estimateStatus = updates.status
      ? mapOrderStatusToEstimateStatus(updates.status)
      : undefined;

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        ...(updates.title && { name: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.scope?.projectType && { projectType: updates.scope.projectType }),
        ...(updates.scope?.buildingType && { buildingType: updates.scope.buildingType }),
        ...(updates.scope?.squareFootage !== undefined && { squareFootage: updates.scope.squareFootage }),
        ...(estimateStatus && { status: estimateStatus }),
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Assign order
   */
  async assignOrder(
    orderId: string,
    assignedTo: string,
    options?: { team?: string; notes?: string }
  ): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    // Update order info with assignment
    const updatedNotes = options?.notes
      ? [...orderInfo.notes, `Assigned to ${assignedTo}: ${options.notes}`]
      : orderInfo.notes;

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      assignedTo,
      ...(options?.team && { assignedTeam: options.team }),
      notes: updatedNotes,
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    const assignedOrder = this.mapEstimateToOrder(estimate);

    // Broadcast order assigned event
    notifyOrderAssigned({
      orderId: assignedOrder.id,
      projectId: assignedOrder.projectId,
      organizationId: assignedOrder.organizationId,
      title: assignedOrder.title,
      type: assignedOrder.type,
      status: assignedOrder.status,
      assignedTo,
      assignedTeam: options?.team,
    }, assignedTo).catch((err: unknown) =>
      console.error('[Realtime] order.assigned broadcast failed:', err)
    );

    return assignedOrder;
  }

  /**
   * Start work on order
   */
  async startOrder(orderId: string, userId: string): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      notes: [...orderInfo.notes, `Work started by ${userId} at ${new Date().toISOString()}`],
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        status: 'IN_PROGRESS_ESTIMATE',
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Complete order
   */
  async completeOrder(
    orderId: string,
    options: {
      estimateId?: string;
      actualHours?: number;
      notes?: string;
    }
  ): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const updatedNotes = options.notes
      ? [...orderInfo.notes, `Completed: ${options.notes}`]
      : orderInfo.notes;

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      ...(options.actualHours !== undefined && { actualHours: options.actualHours }),
      notes: updatedNotes,
      completedAt: new Date().toISOString(),
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        status: 'APPROVED_ESTIMATE',
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    const completedOrder = this.mapEstimateToOrder(estimate);

    // Broadcast order completed event
    notifyOrderCompleted({
      orderId: completedOrder.id,
      projectId: completedOrder.projectId,
      organizationId: completedOrder.organizationId,
      title: completedOrder.title,
      type: completedOrder.type,
      status: completedOrder.status,
    }).catch((err: unknown) =>
      console.error('[Realtime] order.completed broadcast failed:', err)
    );

    return completedOrder;
  }

  /**
   * Put order on hold
   */
  async holdOrder(orderId: string, reason: string): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      notes: [...orderInfo.notes, `Put on hold: ${reason}`],
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        status: 'DRAFT_ESTIMATE',
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, reason: string): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      notes: [...orderInfo.notes, `Cancelled: ${reason}`],
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        status: 'ARCHIVED_ESTIMATE',
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Add note to order
   */
  async addNote(orderId: string, note: string): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      notes: [...orderInfo.notes, `${new Date().toISOString()}: ${note}`],
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Update deliverable status
   */
  async updateDeliverable(
    orderId: string,
    deliverableId: string,
    updates: Partial<{
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
      resultId: string;
    }>
  ): Promise<EstimationOrder> {
    const existing = await prisma.estimate.findUnique({
      where: { id: orderId },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    const orderInfo = getOrderInfo(existing.metadata);
    if (!orderInfo) {
      throw new Error('Order metadata not found');
    }

    const deliverables = orderInfo.deliverables || [];
    const deliverableIndex = deliverables.findIndex(d => d.id === deliverableId);

    if (deliverableIndex === -1) {
      throw new Error('Deliverable not found');
    }

    deliverables[deliverableIndex] = {
      ...deliverables[deliverableIndex],
      ...updates,
      ...(updates.status === 'COMPLETED' && { completedAt: new Date() }),
    };

    const updatedOrderInfo: OrderInfo = {
      ...orderInfo,
      deliverables,
    };

    const estimate = await prisma.estimate.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...(existing.metadata as Record<string, unknown> || {}),
          orderInfo: updatedOrderInfo
        } as unknown as JsonOrderInfo,
      },
    });

    return this.mapEstimateToOrder(estimate);
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(
    organizationId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<{
    total: number;
    byStatus: Record<OrderStatus, number>;
    byType: Record<OrderType, number>;
    byPriority: Record<OrderPriority, number>;
    averageCompletionTime: number;
    onTimeRate: number;
  }> {
    const whereClause: Record<string, unknown> = {
      organizationId,
    };

    if (options?.startDate || options?.endDate) {
      whereClause.createdAt = {
        ...(options.startDate && { gte: options.startDate }),
        ...(options.endDate && { lte: options.endDate }),
      };
    }

    const estimates = await prisma.estimate.findMany({
      where: whereClause,
    });

    // Filter to only estimates with order info
    const orders = estimates
      .filter((e: Estimate) => getOrderInfo(e.metadata) !== undefined)
      .map((e: Estimate) => this.mapEstimateToOrder(e));

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const completionTimes: number[] = [];
    let onTimeCount = 0;
    let completedWithDueDate = 0;

    for (const order of orders) {
      // Count by status
      byStatus[order.status] = (byStatus[order.status] || 0) + 1;

      // Count by type
      byType[order.type] = (byType[order.type] || 0) + 1;

      // Count by priority
      byPriority[order.priority] = (byPriority[order.priority] || 0) + 1;

      // Calculate completion time
      if (order.status === 'COMPLETED' && order.completedAt) {
        const duration = order.completedAt.getTime() - order.createdAt.getTime();
        completionTimes.push(duration / (1000 * 60 * 60)); // Convert to hours

        // Check if on time
        if (order.dueDate) {
          completedWithDueDate++;
          if (order.completedAt <= order.dueDate) {
            onTimeCount++;
          }
        }
      }
    }

    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, t) => sum + t, 0) / completionTimes.length
      : 0;

    const onTimeRate = completedWithDueDate > 0
      ? (onTimeCount / completedWithDueDate) * 100
      : 100;

    return {
      total: orders.length,
      byStatus: byStatus as Record<OrderStatus, number>,
      byType: byType as Record<OrderType, number>,
      byPriority: byPriority as Record<OrderPriority, number>,
      averageCompletionTime,
      onTimeRate,
    };
  }

  /**
   * Estimate work hours
   */
  private estimateWorkHours(type: OrderType, scope?: Partial<OrderScope>): number {
    const baseHours: Record<OrderType, number> = {
      NEW_ESTIMATE: 16,
      REVISION: 4,
      CHANGE_ORDER: 6,
      VALUE_ENGINEERING: 8,
      TAKEOFF_ONLY: 8,
      PRICING_ONLY: 4,
      REVIEW: 2,
      COMPARISON: 4,
    };

    let hours = baseHours[type] || 8;

    // Adjust for complexity
    if (scope?.complexity === 'COMPLEX') {
      hours *= 2;
    } else if (scope?.complexity === 'SIMPLE') {
      hours *= 0.5;
    }

    // Adjust for square footage
    if (scope?.squareFootage) {
      if (scope.squareFootage > 100000) hours *= 1.5;
      else if (scope.squareFootage > 50000) hours *= 1.25;
    }

    // Adjust for divisions
    if (scope?.divisions && scope.divisions.length > 10) {
      hours *= 1.25;
    }

    return Math.ceil(hours);
  }

  /**
   * Create deliverables for order type
   */
  private createDeliverables(type: OrderType, dueDate?: Date): OrderDeliverable[] {
    const deliverables: OrderDeliverable[] = [];

    switch (type) {
      case 'NEW_ESTIMATE':
        deliverables.push(
          { id: uuid(), type: 'TAKEOFF', description: 'Quantity takeoff', status: 'PENDING', dueDate },
          { id: uuid(), type: 'ESTIMATE', description: 'Cost estimate', status: 'PENDING', dueDate },
        );
        break;
      case 'REVISION':
        deliverables.push(
          { id: uuid(), type: 'ESTIMATE', description: 'Revised estimate', status: 'PENDING', dueDate },
        );
        break;
      case 'CHANGE_ORDER':
        deliverables.push(
          { id: uuid(), type: 'ESTIMATE', description: 'Change order estimate', status: 'PENDING', dueDate },
          { id: uuid(), type: 'REPORT', description: 'Change order summary', status: 'PENDING', dueDate },
        );
        break;
      case 'VALUE_ENGINEERING':
        deliverables.push(
          { id: uuid(), type: 'ANALYSIS', description: 'VE analysis', status: 'PENDING', dueDate },
          { id: uuid(), type: 'REPORT', description: 'VE recommendations', status: 'PENDING', dueDate },
        );
        break;
      case 'TAKEOFF_ONLY':
        deliverables.push(
          { id: uuid(), type: 'TAKEOFF', description: 'Quantity takeoff', status: 'PENDING', dueDate },
        );
        break;
      case 'PRICING_ONLY':
        deliverables.push(
          { id: uuid(), type: 'ESTIMATE', description: 'Pricing', status: 'PENDING', dueDate },
        );
        break;
      case 'REVIEW':
        deliverables.push(
          { id: uuid(), type: 'REPORT', description: 'Review report', status: 'PENDING', dueDate },
        );
        break;
      case 'COMPARISON':
        deliverables.push(
          { id: uuid(), type: 'COMPARISON', description: 'Estimate comparison', status: 'PENDING', dueDate },
        );
        break;
    }

    return deliverables;
  }

  /**
   * Map Estimate record to EstimationOrder
   */
  private mapEstimateToOrder(estimate: Estimate): EstimationOrder {
    const orderInfo = getOrderInfo(estimate.metadata);

    // Default order info if not present
    const defaultOrderInfo: OrderInfo = {
      type: 'NEW_ESTIMATE',
      priority: 'MEDIUM',
      notes: [],
      deliverables: [],
      scope: {},
      createdBy: '',
    };

    const info = orderInfo || defaultOrderInfo;
    const orderStatus = mapEstimateStatusToOrderStatus(estimate.status, info);

    return {
      id: estimate.id,
      organizationId: estimate.organizationId,
      projectId: estimate.projectId || '',
      bidRequestId: estimate.bidRequestId || undefined,
      type: info.type,
      priority: info.priority,
      status: orderStatus,
      title: estimate.name,
      description: estimate.description || undefined,
      scope: info.scope,
      assignedTo: info.assignedTo,
      assignedTeam: info.assignedTeam,
      dueDate: info.dueDate ? new Date(info.dueDate) : undefined,
      estimatedHours: info.estimatedHours,
      actualHours: info.actualHours,
      estimateId: estimate.id,
      deliverables: info.deliverables,
      notes: info.notes,
      metadata: (estimate.metadata as Record<string, unknown>) || {},
      createdAt: estimate.createdAt,
      updatedAt: estimate.updatedAt,
      createdBy: info.createdBy,
      completedAt: info.completedAt ? new Date(info.completedAt) : undefined,
    };
  }
}

export const orderManager = new OrderManager();
