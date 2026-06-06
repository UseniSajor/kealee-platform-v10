export { searchFAQ, FAQ_DATABASE } from './faq';
export { classifyTicket } from './routing';
export { calculateRefund, REFUND_POLICIES } from './refund';
export type {
  SupportCategory,
  RefundReason,
  SupportTicket,
  FAQMatch,
  RoutingResult,
  RefundResult,
  EscalationResult,
} from './types';
