/**
 * Sensor Data Analysis for AI Integration
 *
 * Provides sensor context to the predictive engine (APP-11) and
 * smart scheduler (APP-12) for environment-aware risk assessment
 * and schedule optimization.
 *
 * Usage (within daily risk analysis job):
 *   import { buildSensorContext, buildSchedulerContext } from '@kealee/automation/sensor-analysis';
 *
 *   const sensorPrompt = await buildSensorContext(projectId, apiBase);
 *   // Append to AI risk analysis prompt
 *
 *   const schedulerPrompt = await buildSchedulerContext(projectId, apiBase, weatherForecast);
 *   // Feed into APP-12 Smart Scheduler
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SensorAnalysisData {
  projectId: string;
  sensors: SensorSnapshot[];
  alertSummary: string;
}

export interface SensorSnapshot {
  deviceId: string;
  name: string;
  type: string;
  location: string;
  unit: string;
  avg24h: number;
  min24h: number;
  max24h: number;
  current: number;
  alertCount24h: number;
  thresholdAbove?: number;
  thresholdBelow?: number;
  status: string;
}

export interface WeatherForecast {
  date: string;
  conditions: string;    // "Rain", "Clear", "Snow"
  highTemp: number;
  lowTemp: number;
  humidity: number;
  precipChance: number;
  windSpeed: number;
}

export interface SchedulerRecommendation {
  taskName: string;
  currentDate: string;
  recommendedDate?: string;
  action: 'proceed' | 'postpone' | 'monitor';
  reason: string;
  confidence: number;
  sensorFactors: string[];
}

// ============================================================================
// SENSOR IMPACT KNOWLEDGE
// ============================================================================

/**
 * Domain knowledge: how sensor readings affect construction operations.
 * Used to generate contextual AI prompts and schedule recommendations.
 */
const IMPACT_RULES: Record<string, {
  highImpact: string[];
  lowImpact: string[];
  trades: string[];
  thresholds: { warning: number; critical: number; direction: 'above' | 'below' };
}> = {
  humidity: {
    highImpact: [
      'Drywall taping/finishing fails to cure properly above 60% RH',
      'Paint adhesion problems above 70% RH — blistering, peeling risk',
      'Adhesive-applied flooring may delaminate above 65% RH',
      'Mold growth risk increases significantly above 60% RH for 48+ hours',
      'Wood swelling and warping above 55% RH in conditioned spaces',
    ],
    lowImpact: [
      'Concrete curing may crack below 30% RH — needs moist curing',
      'Static electricity risk below 25% RH near electronics',
    ],
    trades: ['Drywall', 'Painting', 'Flooring', 'Carpentry', 'Finishing'],
    thresholds: { warning: 65, critical: 80, direction: 'above' },
  },
  temperature: {
    highImpact: [
      'Concrete pouring should not occur below 40°F — slows hydration',
      'Pipe freeze risk below 32°F in uninsulated areas',
      'Adhesive performance degrades below 50°F for most products',
      'HVAC commissioning requires stable temperature range',
    ],
    lowImpact: [
      'Heat stress risk for workers above 95°F — OSHA requirements',
      'Thermal expansion of materials above 100°F can affect fit',
    ],
    trades: ['Concrete', 'Plumbing', 'HVAC', 'Flooring', 'General Labor'],
    thresholds: { warning: 35, critical: 28, direction: 'below' },
  },
  noise: {
    highImpact: [
      'OSHA requires hearing protection above 85 dB for 8+ hours',
      'Local noise ordinances typically restrict above 80 dB before 7am/after 6pm',
      'Sustained noise above 90 dB requires engineering controls',
    ],
    lowImpact: [],
    trades: ['Demolition', 'Concrete', 'Framing', 'General Labor'],
    thresholds: { warning: 80, critical: 95, direction: 'above' },
  },
  vibration: {
    highImpact: [
      'Excessive vibration can damage fresh concrete (within 24h of pour)',
      'Adjacent structure monitoring required above 0.5 in/s PPV',
      'Precision installation work (countertops, tile) affected by vibration',
    ],
    lowImpact: [],
    trades: ['Concrete', 'Demolition', 'Tile', 'Countertops'],
    thresholds: { warning: 0.3, critical: 0.5, direction: 'above' },
  },
  water_leak: {
    highImpact: [
      'Immediate response required — water intrusion damages framing, insulation, electrical',
      'Mold remediation needed within 24-48 hours of water exposure',
      'Finished spaces require complete dry-out before repairs',
    ],
    lowImpact: [],
    trades: ['Plumbing', 'Remediation', 'Electrical', 'General'],
    thresholds: { warning: 0.5, critical: 1, direction: 'above' },
  },
  air_quality: {
    highImpact: [
      'VOC levels above 500 ppb require ventilation before occupancy',
      'CO levels above 35 ppm dangerous — evacuate and ventilate',
      'Dust levels affect HVAC filter life and worker respiratory health',
    ],
    lowImpact: [],
    trades: ['Painting', 'Flooring', 'HVAC', 'General Labor'],
    thresholds: { warning: 300, critical: 500, direction: 'above' },
  },
  motion: {
    highImpact: [
      'After-hours motion in secured areas may indicate unauthorized access',
      'Motion patterns help track crew activity and site utilization',
    ],
    lowImpact: [],
    trades: ['Security', 'General'],
    thresholds: { warning: 1, critical: 1, direction: 'above' },
  },
};

// ============================================================================
// CONTEXT BUILDERS
// ============================================================================

/**
 * Build a sensor context prompt section for AI risk analysis.
 * Fetches 24h sensor data from the API and formats it for LLM consumption.
 */
export async function buildSensorContext(
  projectId: string,
  apiBase: string
): Promise<string> {
  let analysis: SensorAnalysisData;

  try {
    const res = await fetch(`${apiBase}/api/v1/sensors/project/${projectId}/analysis`);
    if (!res.ok) return ''; // No sensor data available
    analysis = await res.json();
  } catch {
    return ''; // API not reachable
  }

  if (!analysis.sensors || analysis.sensors.length === 0) {
    return ''; // No sensors on this project
  }

  const lines: string[] = [
    `\n## Jobsite Sensor Data (Last 24 Hours)\n`,
  ];

  for (const sensor of analysis.sensors) {
    const rules = IMPACT_RULES[sensor.type];
    const unit = sensor.unit || '';

    lines.push(`### ${sensor.name} (${sensor.location})`);
    lines.push(`- Type: ${sensor.type}`);
    lines.push(`- Current: ${sensor.current}${unit}`);
    lines.push(`- 24h Average: ${sensor.avg24h}${unit}`);
    lines.push(`- 24h Range: ${sensor.min24h}${unit} – ${sensor.max24h}${unit}`);

    if (sensor.thresholdAbove !== undefined) {
      lines.push(`- Alert threshold (high): ${sensor.thresholdAbove}${unit}`);
    }
    if (sensor.thresholdBelow !== undefined) {
      lines.push(`- Alert threshold (low): ${sensor.thresholdBelow}${unit}`);
    }
    if (sensor.alertCount24h > 0) {
      lines.push(`- ⚠️ ${sensor.alertCount24h} threshold alerts in last 24h`);
    }
    lines.push(`- Device status: ${sensor.status}`);

    // Add domain knowledge
    if (rules) {
      const relevantImpacts: string[] = [];

      // Check if current values trigger any impact rules
      if (rules.thresholds.direction === 'above' && sensor.max24h > rules.thresholds.warning) {
        relevantImpacts.push(...rules.highImpact);
      } else if (rules.thresholds.direction === 'below' && sensor.min24h < rules.thresholds.warning) {
        relevantImpacts.push(...rules.highImpact);
      }

      if (relevantImpacts.length > 0) {
        lines.push(`\n**Construction impact considerations:**`);
        for (const impact of relevantImpacts) {
          lines.push(`  - ${impact}`);
        }
        lines.push(`  - Affected trades: ${rules.trades.join(', ')}`);
      }
    }

    lines.push('');
  }

  if (analysis.alertSummary && analysis.alertSummary !== 'No sensor alerts in the last 24 hours') {
    lines.push(`### Alert Summary`);
    lines.push(analysis.alertSummary);
    lines.push('');
  }

  lines.push(`Consider these environmental conditions when predicting risks,`);
  lines.push(`scheduling work, and assessing quality outcomes.\n`);

  return lines.join('\n');
}

/**
 * Build scheduler context that combines sensor data with weather forecast.
 * Returns specific task postponement recommendations.
 */
export async function buildSchedulerContext(
  projectId: string,
  apiBase: string,
  weatherForecast?: WeatherForecast
): Promise<{
  prompt: string;
  recommendations: SchedulerRecommendation[];
}> {
  let analysis: SensorAnalysisData;

  try {
    const res = await fetch(`${apiBase}/api/v1/sensors/project/${projectId}/analysis`);
    if (!res.ok) return { prompt: '', recommendations: [] };
    analysis = await res.json();
  } catch {
    return { prompt: '', recommendations: [] };
  }

  if (!analysis.sensors || analysis.sensors.length === 0) {
    return { prompt: '', recommendations: [] };
  }

  const recommendations: SchedulerRecommendation[] = [];
  const lines: string[] = [];

  // Analyze each sensor for schedule impact
  for (const sensor of analysis.sensors) {
    const rules = IMPACT_RULES[sensor.type];
    if (!rules) continue;

    const isAboveWarning = rules.thresholds.direction === 'above'
      && sensor.current > rules.thresholds.warning;
    const isBelowWarning = rules.thresholds.direction === 'below'
      && sensor.current < rules.thresholds.warning;

    if (isAboveWarning || isBelowWarning) {
      for (const trade of rules.trades) {
        recommendations.push({
          taskName: `${trade} work in ${sensor.location}`,
          currentDate: new Date().toISOString().split('T')[0],
          action: sensor.current > (rules.thresholds.critical || 999) ||
                  sensor.current < (rules.thresholds.critical || -999)
            ? 'postpone'
            : 'monitor',
          reason: `${sensor.name} reading ${sensor.current}${sensor.unit} ` +
                  `(threshold: ${isAboveWarning ? rules.thresholds.warning : rules.thresholds.warning}${sensor.unit}). ` +
                  rules.highImpact[0],
          confidence: sensor.alertCount24h > 3 ? 0.9 : 0.7,
          sensorFactors: [`${sensor.type}: ${sensor.current}${sensor.unit}`],
        });
      }
    }
  }

  // Build combined weather + sensor prompt
  if (weatherForecast) {
    lines.push(`\n## Environment Context for Scheduling\n`);
    lines.push(`### Weather Forecast (${weatherForecast.date})`);
    lines.push(`- Conditions: ${weatherForecast.conditions}`);
    lines.push(`- Temperature: ${weatherForecast.lowTemp}°F – ${weatherForecast.highTemp}°F`);
    lines.push(`- Humidity: ${weatherForecast.humidity}%`);
    lines.push(`- Precipitation chance: ${weatherForecast.precipChance}%`);
    lines.push(`- Wind: ${weatherForecast.windSpeed} mph`);
    lines.push('');

    // Cross-reference weather with sensor data
    const humiditySensors = analysis.sensors.filter((s) => s.type === 'humidity');
    const tempSensors = analysis.sensors.filter((s) => s.type === 'temperature');

    if (humiditySensors.length > 0 && weatherForecast.humidity > 60) {
      const avgHumidity = humiditySensors.reduce((s, h) => s + h.current, 0) / humiditySensors.length;
      lines.push(`### Combined Risk: Humidity`);
      lines.push(`Current indoor humidity average: ${avgHumidity.toFixed(0)}% RH`);
      lines.push(`Tomorrow's forecast humidity: ${weatherForecast.humidity}%`);
      if (avgHumidity > 55 && weatherForecast.humidity > 60) {
        lines.push(`⚠️ Indoor humidity already elevated and rain/high humidity forecast.`);
        lines.push(`Recommend postponing humidity-sensitive work (drywall finishing, painting, flooring).`);

        // Add specific recommendations
        for (const trade of ['Drywall', 'Painting', 'Flooring']) {
          recommendations.push({
            taskName: `${trade} work`,
            currentDate: weatherForecast.date,
            action: 'postpone',
            reason: `Indoor humidity ${avgHumidity.toFixed(0)}% RH already elevated, ` +
                    `combined with ${weatherForecast.humidity}% humidity forecast. ` +
                    `Risk of adhesion failures and curing issues.`,
            confidence: 0.85,
            sensorFactors: [
              `Indoor humidity: ${avgHumidity.toFixed(0)}% RH`,
              `Forecast humidity: ${weatherForecast.humidity}%`,
              `Precipitation chance: ${weatherForecast.precipChance}%`,
            ],
          });
        }
      }
      lines.push('');
    }

    if (tempSensors.length > 0 && weatherForecast.lowTemp < 40) {
      const minTemp = Math.min(...tempSensors.map((t) => t.min24h));
      lines.push(`### Combined Risk: Temperature`);
      lines.push(`Current indoor minimum: ${minTemp}°F`);
      lines.push(`Tomorrow's forecast low: ${weatherForecast.lowTemp}°F`);
      if (minTemp < 50 || weatherForecast.lowTemp < 35) {
        lines.push(`⚠️ Cold temperatures may affect concrete curing, pipe integrity, and adhesives.`);

        recommendations.push({
          taskName: 'Concrete work',
          currentDate: weatherForecast.date,
          action: weatherForecast.lowTemp < 32 ? 'postpone' : 'monitor',
          reason: `Indoor temp min ${minTemp}°F, forecast low ${weatherForecast.lowTemp}°F. ` +
                  `Concrete hydration slows significantly below 40°F.`,
          confidence: weatherForecast.lowTemp < 32 ? 0.95 : 0.7,
          sensorFactors: [
            `Indoor temp min: ${minTemp}°F`,
            `Forecast low: ${weatherForecast.lowTemp}°F`,
          ],
        });
      }
      lines.push('');
    }
  }

  // Sensor-only context
  lines.push(`### Current Sensor Readings\n`);
  for (const sensor of analysis.sensors) {
    lines.push(`- ${sensor.name} (${sensor.location}): ${sensor.current}${sensor.unit} ` +
               `(avg ${sensor.avg24h}${sensor.unit}, range ${sensor.min24h}–${sensor.max24h}${sensor.unit})`);
  }

  return {
    prompt: lines.join('\n'),
    recommendations: deduplicateRecommendations(recommendations),
  };
}

/**
 * Format sensor data as a concise text block for notification messages.
 * Used when sending alerts to PMs via SMS/email.
 */
export function formatSensorAlertMessage(
  deviceName: string,
  sensorType: string,
  location: string,
  value: number,
  unit: string,
  threshold: number,
  alertType: 'above_threshold' | 'below_threshold' | 'rate_of_change' | 'offline'
): string {
  const rules = IMPACT_RULES[sensorType];
  const impact = rules?.highImpact[0] || '';

  switch (alertType) {
    case 'above_threshold':
      return `🔴 SENSOR ALERT: ${deviceName} at ${location} reading ${value}${unit} (threshold: ${threshold}${unit}). ${impact}`;
    case 'below_threshold':
      return `🔵 SENSOR ALERT: ${deviceName} at ${location} reading ${value}${unit} (min threshold: ${threshold}${unit}). ${impact}`;
    case 'rate_of_change':
      return `⚡ SENSOR ALERT: ${deviceName} at ${location} changing rapidly — ${value}${unit}/hr. Check for environmental issues.`;
    case 'offline':
      return `⚪ SENSOR OFFLINE: ${deviceName} at ${location} has stopped reporting. Check device or battery.`;
    default:
      return `📡 SENSOR: ${deviceName} at ${location} — ${value}${unit}`;
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function deduplicateRecommendations(
  recs: SchedulerRecommendation[]
): SchedulerRecommendation[] {
  const seen = new Map<string, SchedulerRecommendation>();

  for (const rec of recs) {
    const key = `${rec.taskName}:${rec.currentDate}`;
    const existing = seen.get(key);

    if (!existing || rec.confidence > existing.confidence) {
      // Merge sensor factors
      if (existing) {
        rec.sensorFactors = [...new Set([...existing.sensorFactors, ...rec.sensorFactors])];
      }
      seen.set(key, rec);
    }
  }

  return Array.from(seen.values());
}
