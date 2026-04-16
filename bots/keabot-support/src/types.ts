export type SupportCategory =
  | 'permit_support' | 'contractor_support' | 'payment_support'
  | 'design_support' | 'estimate_support' | 'faq_search' | 'general_support';

export type RefundReason =
  | 'contractor_quality_issue' | 'project_cancelled' | 'service_not_provided';

export interface SupportTicket {
  id: string;
  question: string;
  userId?: string;
  projectId?: string;
  category: SupportCategory;
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface FAQMatch {
  found: boolean;
  answer?: string;
  confidence: number;
  autoRespond: boolean;
  faqId?: string;
}

export interface RoutingResult {
  category: SupportCategory;
  confidence: number;
  assignTo: string;
  keywords: string[];
}

export interface RefundResult {
  approved: boolean;
  reason: RefundReason;
  refundAmount: number;
  originalAmount: number;
  refundPercentage: number;
  message: string;
  stripeRefundId?: string;
}

export interface EscalationResult {
  ticketId: string;
  escalated: boolean;
  assignedTo: string;
  severity: 'low' | 'medium' | 'high';
  expectedResponseTime: string;
}
