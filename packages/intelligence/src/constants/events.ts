/** All intelligence platform automation events */
export const PROPERTY_EVENTS = [
  'PROPERTY_IMPORTED',
  'PROPERTY_UPDATED',
  'PARCEL_ANALYZED',
  'OWNER_MATCHED',
  'PERMIT_HISTORY_IMPORTED',
  'MARKET_DATA_IMPORTED',
  'OPPORTUNITY_SCORE_REQUESTED',
  'CAMPAIGN_RECOMMENDATION_REQUESTED',
  'LEAD_SEGMENT_UPDATED',
  'CRM_STATUS_UPDATED',
  'CAMPAIGN_RESPONSE_RECEIVED',
] as const

export const LEAD_EVENTS = [
  'LEAD_CREATED',
  'FORM_SUBMITTED',
  'DESIGN_CONCEPT_VIEWED',
  'ESTIMATE_REQUESTED',
  'PERMIT_HELP_REQUESTED',
  'SMS_REPLY_RECEIVED',
  'EMAIL_CLICKED',
  'CALL_BOOKED',
  'PAYMENT_STARTED',
  'PAYMENT_COMPLETED',
] as const

export const CAPITAL_EVENTS = [
  'FINANCING_INTERESTED',
  'CAPITAL_REVIEW_REQUESTED',
  'PROJECT_BUDGET_UPDATED',
  'ESTIMATED_EQUITY_UPDATED',
  'LOAN_PRODUCT_SELECTED',
  'LENDER_PACKAGE_REQUESTED',
  'CUSTOMER_OPTED_IN_FINANCING',
] as const

export const PROJECT_EVENTS = [
  'PROJECT_CREATED',
  'INTAKE_UPDATED',
  'SCOPE_UPDATED',
  'PHOTO_UPLOADED',
  'ESTIMATE_GENERATED',
  'PERMIT_PACKAGE_REQUESTED',
  'CONTRACTOR_BID_UPLOADED',
  'CHANGE_ORDER_REQUESTED',
  'INSPECTION_FAILED',
  'TASK_UPDATED',
  'CUSTOMER_DECISION_SUBMITTED',
] as const

export const INTELLIGENCE_EVENT_TYPES = [
  ...PROPERTY_EVENTS,
  ...LEAD_EVENTS,
  ...CAPITAL_EVENTS,
  ...PROJECT_EVENTS,
] as const

export type IntelligenceEventType = (typeof INTELLIGENCE_EVENT_TYPES)[number]

export const INTELLIGENCE_SOURCE_APP = 'APP-INTELLIGENCE'

export type IntelligenceEngineType = 'property' | 'opportunity' | 'lead' | 'capital' | 'project'

export const LOAN_PRODUCTS = [
  'heloc',
  'home_equity_loan',
  'renovation_loan',
  'construction_loan',
  'dscr_loan',
  'bridge_loan',
  'private_money',
  'commercial_loan',
  'developer_capital_stack',
  'draw_schedule',
] as const

export type LoanProduct = (typeof LOAN_PRODUCTS)[number]
