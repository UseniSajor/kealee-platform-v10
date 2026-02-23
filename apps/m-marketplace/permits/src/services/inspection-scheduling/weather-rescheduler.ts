/**
 * Weather-Dependent Rescheduling Service
 * Weather-dependent rescheduling for inspections
 */

import {createClient} from '@permits/src/lib/supabase/client';

export interface WeatherCondition {
  date: Date;
  condition: 'CLEAR' | 'CLOUDY' | 'RAIN' | 'SNOW' | 'STORM' | 'SEVERE';
  temperature?: number; // Fahrenheit
  windSpeed?: number; // mph
  precipitation?: number; // inches
  severeWeatherWarning?: boolean;
}

export interface WeatherRescheduleRule {
  inspectionType: string;
  weatherConditions: Array<{
    condition: WeatherCondition['condition'];
    maxPrecipitation?: number;
    minTemperature?: number;
    maxWindSpeed?: number;
    blockInspection: boolean;
  }>;
}

export interface RescheduleRecommendation {
  inspectionId: string;
  shouldReschedule: boolean;
  reason: string;
  recommendedDate?: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class WeatherReschedulerService {
  private rescheduleRules: WeatherRescheduleRule[] = [];

  constructor() {
    this.initializeRescheduleRules();
  }

  /**
   * Check weather and recommend rescheduling
   */
  async checkWeatherAndReschedule(
    inspectionId: string,
    scheduledDate: Date,
    inspectionType: string
  ): Promise<RescheduleRecommendation> {
    // Get weather forecast (in production, would call weather API)
    const weather = await this.getWeatherForecast(scheduledDate);

    if (!weather) {
      return {
        inspectionId,
        shouldReschedule: false,
        reason: 'Weather forecast not available',
        severity: 'LOW',
      };
    }

    // Find rule for inspection type
    const rule = this.rescheduleRules.find(r => r.inspectionType === inspectionType);

    if (!rule) {
      // No specific rule, use default
      return this.checkDefaultWeatherConditions(weather, inspectionId, scheduledDate);
    }

    // Check against rule
    for (const condition of rule.weatherConditions) {
      if (condition.condition !== weather.condition) {
        continue;
      }

      let shouldBlock = condition.blockInspection;

      // Check additional criteria
      if (condition.maxPrecipitation !== undefined && weather.precipitation !== undefined) {
        shouldBlock = shouldBlock || weather.precipitation > condition.maxPrecipitation;
      }

      if (condition.minTemperature !== undefined && weather.temperature !== undefined) {
        shouldBlock = shouldBlock || weather.temperature < condition.minTemperature;
      }

      if (condition.maxWindSpeed !== undefined && weather.windSpeed !== undefined) {
        shouldBlock = shouldBlock || weather.windSpeed > condition.maxWindSpeed;
      }

      if (shouldBlock) {
        // Find next suitable date
        const recommendedDate = await this.findNextSuitableDate(
          inspectionId,
          scheduledDate,
          inspectionType
        );

        return {
          inspectionId,
          shouldReschedule: true,
          reason: `Weather condition: ${weather.condition}. ${condition.blockInspection ? 'Inspection blocked' : 'May affect inspection quality'}`,
          recommendedDate,
          severity: condition.blockInspection ? 'CRITICAL' : 'MEDIUM',
        };
      }
    }

    return {
      inspectionId,
      shouldReschedule: false,
      reason: 'Weather conditions acceptable',
      severity: 'LOW',
    };
  }

  /**
   * Get weather forecast (mock - in production would call API)
   */
  private async getWeatherForecast(date: Date): Promise<WeatherCondition | null> {
    // In production, would call weather API (OpenWeatherMap, Weather.gov, etc.)
    // For now, return mock data
    return {
      date,
      condition: 'CLEAR',
      temperature: 70,
      windSpeed: 10,
      precipitation: 0,
      severeWeatherWarning: false,
    };
  }

  /**
   * Check default weather conditions
   */
  private checkDefaultWeatherConditions(
    weather: WeatherCondition,
    inspectionId: string,
    scheduledDate: Date
  ): RescheduleRecommendation {
    // Default: block severe weather
    if (weather.condition === 'STORM' || weather.condition === 'SEVERE') {
      return {
        inspectionId,
        shouldReschedule: true,
        reason: `Severe weather conditions: ${weather.condition}`,
        recommendedDate: this.addDays(scheduledDate, 1),
        severity: 'CRITICAL',
      };
    }

    // Block heavy rain/snow for most inspections
    if (weather.condition === 'RAIN' && weather.precipitation && weather.precipitation > 0.5) {
      return {
        inspectionId,
        shouldReschedule: true,
        reason: `Heavy precipitation expected: ${weather.precipitation.toFixed(2)} inches`,
        recommendedDate: this.addDays(scheduledDate, 1),
        severity: 'HIGH',
      };
    }

    if (weather.condition === 'SNOW' && weather.precipitation && weather.precipitation > 2) {
      return {
        inspectionId,
        shouldReschedule: true,
        reason: `Heavy snow expected: ${weather.precipitation.toFixed(2)} inches`,
        recommendedDate: this.addDays(scheduledDate, 1),
        severity: 'CRITICAL',
      };
    }

    return {
      inspectionId,
      shouldReschedule: false,
      reason: 'Weather conditions acceptable',
      severity: 'LOW',
    };
  }

  /**
   * Find next suitable date for rescheduling
   */
  private async findNextSuitableDate(
    inspectionId: string,
    originalDate: Date,
    inspectionType: string
  ): Promise<Date> {
    // Start from next day
    let candidateDate = this.addDays(originalDate, 1);

    // Check up to 7 days ahead
    for (let i = 0; i < 7; i++) {
      const weather = await this.getWeatherForecast(candidateDate);

      if (!weather) {
        continue;
      }

      // Check if weather is acceptable
      const check = await this.checkWeatherAndReschedule(
        inspectionId,
        candidateDate,
        inspectionType
      );

      if (!check.shouldReschedule) {
        return candidateDate;
      }

      candidateDate = this.addDays(candidateDate, 1);
    }

    // If no suitable date found, return original + 1 day
    return this.addDays(originalDate, 1);
  }

  /**
   * Reschedule inspection due to weather
   */
  async rescheduleInspection(
    inspectionId: string,
    newDate: Date,
    reason: string
  ): Promise<void> {
    const supabase = createClient();

    // Update inspection
    await supabase
      .from('Inspection')
      .update({
        scheduledDate: newDate.toISOString(),
        status: 'SCHEDULED',
        notes: `Rescheduled due to weather: ${reason}`,
      })
      .eq('id', inspectionId);

    // Send notifications (would be handled by notification service)
  }

  /**
   * Initialize reschedule rules
   */
  private initializeRescheduleRules() {
    this.rescheduleRules = [
      // Footing inspections - sensitive to precipitation
      {
        inspectionType: 'FOOTING',
        weatherConditions: [
          {
            condition: 'RAIN',
            maxPrecipitation: 0.1,
            blockInspection: true,
          },
          {
            condition: 'SNOW',
            blockInspection: true,
          },
          {
            condition: 'STORM',
            blockInspection: true,
          },
        ],
      },
      // Foundation inspections - similar to footing
      {
        inspectionType: 'FOUNDATION',
        weatherConditions: [
          {
            condition: 'RAIN',
            maxPrecipitation: 0.1,
            blockInspection: true,
          },
          {
            condition: 'SNOW',
            blockInspection: true,
          },
        ],
      },
      // Final inspections - can proceed in light rain
      {
        inspectionType: 'FINAL_BUILDING',
        weatherConditions: [
          {
            condition: 'RAIN',
            maxPrecipitation: 0.5,
            blockInspection: false,
          },
          {
            condition: 'STORM',
            blockInspection: true,
          },
        ],
      },
    ];
  }

  /**
   * Add days to date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

// Singleton instance
export const weatherReschedulerService = new WeatherReschedulerService();
