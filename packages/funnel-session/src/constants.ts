import type { FunnelUserType, FunnelProjectType, BudgetRange, FunnelTimeline } from './types'

export interface FunnelOption<T> {
  value: T
  label: string
  icon: string
  description?: string
}

export const USER_TYPES: FunnelOption<FunnelUserType>[] = [
  { value: 'HOMEOWNER', label: 'Homeowner', icon: 'Home', description: 'Planning a renovation or new build' },
  { value: 'CONTRACTOR', label: 'Contractor', icon: 'HardHat', description: 'Looking for projects or tools' },
  { value: 'ARCHITECT', label: 'Architect', icon: 'Compass', description: 'Design professional seeking collaboration' },
  { value: 'INVESTOR', label: 'Investor', icon: 'TrendingUp', description: 'Real estate investment projects' },
  { value: 'PROPERTY_MANAGER', label: 'Property Manager', icon: 'Building2', description: 'Managing property improvements' },
]

export const PROJECT_TYPES: FunnelOption<FunnelProjectType>[] = [
  { value: 'KITCHEN_REMODEL', label: 'Kitchen Remodel', icon: 'ChefHat' },
  { value: 'BATHROOM_REMODEL', label: 'Bathroom Remodel', icon: 'Bath' },
  { value: 'WHOLE_HOME', label: 'Whole Home', icon: 'Home' },
  { value: 'ADDITION', label: 'Addition', icon: 'PlusSquare' },
  { value: 'NEW_CONSTRUCTION', label: 'New Construction', icon: 'Building' },
  { value: 'EXTERIOR', label: 'Exterior', icon: 'Trees' },
  { value: 'LANDSCAPING', label: 'Landscaping', icon: 'Flower2' },
  { value: 'COMMERCIAL', label: 'Commercial', icon: 'Store' },
]

export const BUDGET_RANGES: FunnelOption<BudgetRange>[] = [
  { value: 'UNDER_25K', label: 'Under $25K', icon: 'DollarSign', description: 'Small projects & repairs' },
  { value: 'RANGE_25K_50K', label: '$25K - $50K', icon: 'DollarSign', description: 'Mid-size renovations' },
  { value: 'RANGE_50K_100K', label: '$50K - $100K', icon: 'DollarSign', description: 'Major renovations' },
  { value: 'RANGE_100K_250K', label: '$100K - $250K', icon: 'DollarSign', description: 'Large-scale projects' },
  { value: 'OVER_250K', label: 'Over $250K', icon: 'DollarSign', description: 'Premium & new construction' },
]

export const TIMELINES: FunnelOption<FunnelTimeline>[] = [
  { value: 'ASAP', label: 'ASAP', icon: 'Zap', description: 'Ready to start immediately' },
  { value: 'ONE_TO_THREE_MONTHS', label: '1-3 Months', icon: 'Calendar', description: 'Starting soon' },
  { value: 'THREE_TO_SIX_MONTHS', label: '3-6 Months', icon: 'CalendarDays', description: 'Planning ahead' },
  { value: 'SIX_TO_TWELVE_MONTHS', label: '6-12 Months', icon: 'CalendarRange', description: 'Long-term planning' },
  { value: 'JUST_EXPLORING', label: 'Just Exploring', icon: 'Search', description: 'Gathering information' },
]

export const US_STATES = [
  { value: 'DC', label: 'District of Columbia' },
  { value: 'MD', label: 'Maryland' },
  { value: 'VA', label: 'Virginia' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
]
