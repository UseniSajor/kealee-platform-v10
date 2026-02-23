/**
 * Jurisdiction Configuration Service
 * Manages fee schedules, permit types, review disciplines, business rules, and calendar
 */

import {createClient} from '@permits/src/lib/supabase/client';
import {FeeSchedule} from '@permits/src/services/permit-application/fee-calculator';

export interface PermitTypeConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  enabled: boolean;
  requiresReview: boolean;
  autoApprove?: boolean;
  requiredDocuments: string[];
  reviewDisciplines: string[];
  estimatedDays: number;
}

export interface ReviewDisciplineConfig {
  id: string;
  name: string;
  code: string;
  description?: string;
  enabled: boolean;
  required: boolean; // Always required for certain permit types
  autoAssign: boolean;
}

export interface InspectorZone {
  id: string;
  name: string;
  area: {
    type: 'Polygon';
    coordinates: number[][][];
  }; // GeoJSON
  inspectorIds: string[];
  specialties: string[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JSON condition
  action: 'AUTO_APPROVE' | 'EXPEDITE' | 'REQUIRE_REVIEW' | 'NOTIFY' | 'REJECT';
  priority: number;
  enabled: boolean;
}

export interface Holiday {
  id: string;
  name: string;
  date: Date;
  recurring: boolean;
  recurringPattern?: 'YEARLY' | 'MONTHLY' | 'WEEKLY';
}

export interface ClosurePeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  reason: string;
}

export class JurisdictionConfigurationService {
  /**
   * Update fee schedule
   */
  async updateFeeSchedule(
    jurisdictionId: string,
    feeSchedule: FeeSchedule
  ): Promise<void> {
    const supabase = createClient();

    await supabase
      .from('Jurisdiction')
      .update({feeSchedule})
      .eq('id', jurisdictionId);
  }

  /**
   * Get fee schedule
   */
  async getFeeSchedule(jurisdictionId: string): Promise<FeeSchedule | null> {
    const supabase = createClient();

    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('feeSchedule')
      .eq('id', jurisdictionId)
      .single();

    return jurisdiction?.feeSchedule as FeeSchedule || null;
  }

  /**
   * Configure permit types
   */
  async configurePermitTypes(
    jurisdictionId: string,
    permitTypes: PermitTypeConfig[]
  ): Promise<void> {
    const supabase = createClient();

    const settings: any = await this.getSettings(jurisdictionId);
    settings.permitTypes = permitTypes;

    await supabase
      .from('Jurisdiction')
      .update({settings})
      .eq('id', jurisdictionId);
  }

  /**
   * Get permit type configuration
   */
  async getPermitTypeConfig(
    jurisdictionId: string,
    permitType: string
  ): Promise<PermitTypeConfig | null> {
    const settings: any = await this.getSettings(jurisdictionId);
    const permitTypes: PermitTypeConfig[] = settings?.permitTypes || [];

    return permitTypes.find(pt => pt.code === permitType || pt.id === permitType) || null;
  }

  /**
   * Configure review disciplines
   */
  async configureReviewDisciplines(
    jurisdictionId: string,
    disciplines: ReviewDisciplineConfig[]
  ): Promise<void> {
    const supabase = createClient();

    const settings: any = await this.getSettings(jurisdictionId);
    settings.reviewDisciplines = disciplines;

    await supabase
      .from('Jurisdiction')
      .update({settings})
      .eq('id', jurisdictionId);
  }

  /**
   * Get review disciplines
   */
  async getReviewDisciplines(jurisdictionId: string): Promise<ReviewDisciplineConfig[]> {
    const settings: any = await this.getSettings(jurisdictionId);
    return settings?.reviewDisciplines || [];
  }

  /**
   * Create inspector zone
   */
  async createInspectorZone(
    jurisdictionId: string,
    zone: Omit<InspectorZone, 'id'>
  ): Promise<InspectorZone> {
    const supabase = createClient();

    const zoneWithId: InspectorZone = {
      ...zone,
      id: `zone-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    const settings: any = await this.getSettings(jurisdictionId);
    const zones: InspectorZone[] = settings?.inspectorZones || [];
    zones.push(zoneWithId);

    await supabase
      .from('Jurisdiction')
      .update({settings: {...settings, inspectorZones: zones}})
      .eq('id', jurisdictionId);

    return zoneWithId;
  }

  /**
   * Get inspector zones
   */
  async getInspectorZones(jurisdictionId: string): Promise<InspectorZone[]> {
    const settings: any = await this.getSettings(jurisdictionId);
    return settings?.inspectorZones || [];
  }

  /**
   * Find inspector zone for location
   */
  async findInspectorZone(
    jurisdictionId: string,
    location: {latitude: number; longitude: number}
  ): Promise<InspectorZone | null> {
    const zones = await this.getInspectorZones(jurisdictionId);

    // Check if point is within any zone polygon
    for (const zone of zones) {
      if (this.isPointInPolygon(location, zone.area.coordinates[0])) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Add business rule
   */
  async addBusinessRule(
    jurisdictionId: string,
    rule: Omit<BusinessRule, 'id'>
  ): Promise<BusinessRule> {
    const supabase = createClient();

    const ruleWithId: BusinessRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    const settings: any = await this.getSettings(jurisdictionId);
    const rules: BusinessRule[] = settings?.businessRules || [];
    rules.push(ruleWithId);

    // Sort by priority
    rules.sort((a, b) => b.priority - a.priority);

    await supabase
      .from('Jurisdiction')
      .update({settings: {...settings, businessRules: rules}})
      .eq('id', jurisdictionId);

    return ruleWithId;
  }

  /**
   * Get business rules
   */
  async getBusinessRules(jurisdictionId: string): Promise<BusinessRule[]> {
    const settings: any = await this.getSettings(jurisdictionId);
    return settings?.businessRules || [];
  }

  /**
   * Evaluate business rules for permit
   */
  async evaluateBusinessRules(
    jurisdictionId: string,
    permitData: {
      permitType: string;
      valuation: number;
      squareFootage?: number;
      expedited: boolean;
    }
  ): Promise<Array<{rule: BusinessRule; action: string}>> {
    const rules = await this.getBusinessRules(jurisdictionId);
    const activeRules = rules.filter(r => r.enabled);
    const matches: Array<{rule: BusinessRule; action: string}> = [];

    for (const rule of activeRules) {
      try {
        const condition = JSON.parse(rule.condition);
        if (this.evaluateCondition(condition, permitData)) {
          matches.push({rule, action: rule.action});
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return matches;
  }

  /**
   * Add holiday
   */
  async addHoliday(
    jurisdictionId: string,
    holiday: Omit<Holiday, 'id'>
  ): Promise<Holiday> {
    const supabase = createClient();

    const holidayWithId: Holiday = {
      ...holiday,
      id: `holiday-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    const settings: any = await this.getSettings(jurisdictionId);
    const holidays: Holiday[] = settings?.holidays || [];
    holidays.push(holidayWithId);

    await supabase
      .from('Jurisdiction')
      .update({settings: {...settings, holidays}})
      .eq('id', jurisdictionId);

    return holidayWithId;
  }

  /**
   * Get holidays
   */
  async getHolidays(jurisdictionId: string): Promise<Holiday[]> {
    const settings: any = await this.getSettings(jurisdictionId);
    return settings?.holidays || [];
  }

  /**
   * Add closure period
   */
  async addClosurePeriod(
    jurisdictionId: string,
    closure: Omit<ClosurePeriod, 'id'>
  ): Promise<ClosurePeriod> {
    const supabase = createClient();

    const closureWithId: ClosurePeriod = {
      ...closure,
      id: `closure-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    const settings: any = await this.getSettings(jurisdictionId);
    const closures: ClosurePeriod[] = settings?.closures || [];
    closures.push(closureWithId);

    await supabase
      .from('Jurisdiction')
      .update({settings: {...settings, closures}})
      .eq('id', jurisdictionId);

    return closureWithId;
  }

  /**
   * Get closure periods
   */
  async getClosurePeriods(jurisdictionId: string): Promise<ClosurePeriod[]> {
    const settings: any = await this.getSettings(jurisdictionId);
    return settings?.closures || [];
  }

  /**
   * Check if date is business day
   */
  async isBusinessDay(jurisdictionId: string, date: Date): Promise<boolean> {
    // Check if weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Check holidays
    const holidays = await this.getHolidays(jurisdictionId);
    const dateString = date.toISOString().split('T')[0];

    for (const holiday of holidays) {
      const holidayDate = new Date(holiday.date).toISOString().split('T')[0];
      if (holidayDate === dateString) {
        return false;
      }

      // Check recurring holidays
      if (holiday.recurring && holiday.recurringPattern === 'YEARLY') {
        const holidayMonth = new Date(holiday.date).getMonth();
        const holidayDay = new Date(holiday.date).getDate();
        if (date.getMonth() === holidayMonth && date.getDate() === holidayDay) {
          return false;
        }
      }
    }

    // Check closure periods
    const closures = await this.getClosurePeriods(jurisdictionId);
    for (const closure of closures) {
      const closureStart = new Date(closure.startDate);
      const closureEnd = new Date(closure.endDate);
      if (date >= closureStart && date <= closureEnd) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get settings
   */
  private async getSettings(jurisdictionId: string): Promise<any> {
    const supabase = createClient();

    const {data: jurisdiction} = await supabase
      .from('Jurisdiction')
      .select('settings')
      .eq('id', jurisdictionId)
      .single();

    return jurisdiction?.settings || {};
  }

  /**
   * Check if point is in polygon (Ray casting algorithm)
   */
  private isPointInPolygon(
    point: {latitude: number; longitude: number},
    polygon: number[][]
  ): boolean {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: any, data: any): boolean {
    // Simple condition evaluator
    // Supports: {field: 'permitType', operator: 'equals', value: 'BUILDING'}
    // or: {and: [{...}, {...}]}, {or: [{...}, {...}]}

    if (condition.and) {
      return condition.and.every((c: any) => this.evaluateCondition(c, data));
    }

    if (condition.or) {
      return condition.or.some((c: any) => this.evaluateCondition(c, data));
    }

    const field = condition.field;
    const operator = condition.operator;
    const value = condition.value;
    const dataValue = data[field];

    switch (operator) {
      case 'equals':
        return dataValue === value;
      case 'notEquals':
        return dataValue !== value;
      case 'greaterThan':
        return dataValue > value;
      case 'greaterThanOrEqual':
        return dataValue >= value;
      case 'lessThan':
        return dataValue < value;
      case 'lessThanOrEqual':
        return dataValue <= value;
      case 'contains':
        return String(dataValue).includes(String(value));
      default:
        return false;
    }
  }
}

// Singleton instance
export const jurisdictionConfigurationService = new JurisdictionConfigurationService();
