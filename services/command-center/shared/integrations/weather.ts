/**
 * KEALEE COMMAND CENTER - WEATHER INTEGRATION
 * Open-Meteo API for weather-aware scheduling (free, no API key required)
 */

import axios from 'axios';

const WEATHER_API = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
});

// Common query params for imperial units
const UNIT_PARAMS = {
  temperature_unit: 'fahrenheit',
  wind_speed_unit: 'mph',
  precipitation_unit: 'inch',
  timezone: 'auto',
};

export interface WeatherConditions {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust?: number;
  description: string;
  icon: string;
  precipitation: number;
  visibility: number;
  clouds: number;
}

export interface DailyForecast {
  date: Date;
  temp: { min: number; max: number; avg: number };
  conditions: string;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  humidity: number;
  isWorkable: boolean;
  workabilityScore: number;
  restrictions: string[];
  weatherCode: number;
}

export interface HourlyForecast {
  time: Date;
  temp: number;
  conditions: string;
  precipitation: number;
  precipitationProbability: number;
  windSpeed: number;
  isWorkable: boolean;
}

// ============================================================================
// WMO WEATHER CODE MAPPING
// ============================================================================

/** Map WMO weather codes to human-readable conditions and icons */
function mapWeatherCode(code: number): { description: string; icon: string; conditions: string } {
  const mapping: Record<number, { description: string; icon: string; conditions: string }> = {
    0: { description: 'Clear sky', icon: '☀️', conditions: 'Clear' },
    1: { description: 'Mainly clear', icon: '🌤️', conditions: 'Clear' },
    2: { description: 'Partly cloudy', icon: '⛅', conditions: 'Clouds' },
    3: { description: 'Overcast', icon: '☁️', conditions: 'Clouds' },
    45: { description: 'Fog', icon: '🌫️', conditions: 'Fog' },
    48: { description: 'Depositing rime fog', icon: '🌫️', conditions: 'Fog' },
    51: { description: 'Light drizzle', icon: '🌦️', conditions: 'Drizzle' },
    53: { description: 'Moderate drizzle', icon: '🌦️', conditions: 'Drizzle' },
    55: { description: 'Dense drizzle', icon: '🌧️', conditions: 'Drizzle' },
    56: { description: 'Freezing drizzle', icon: '🌧️', conditions: 'Drizzle' },
    57: { description: 'Dense freezing drizzle', icon: '🌧️', conditions: 'Drizzle' },
    61: { description: 'Slight rain', icon: '🌦️', conditions: 'Rain' },
    63: { description: 'Moderate rain', icon: '🌧️', conditions: 'Rain' },
    65: { description: 'Heavy rain', icon: '🌧️', conditions: 'Rain' },
    66: { description: 'Freezing rain', icon: '🌧️', conditions: 'Rain' },
    67: { description: 'Heavy freezing rain', icon: '🌧️', conditions: 'Rain' },
    71: { description: 'Slight snow', icon: '🌨️', conditions: 'Snow' },
    73: { description: 'Moderate snow', icon: '🌨️', conditions: 'Snow' },
    75: { description: 'Heavy snow', icon: '❄️', conditions: 'Snow' },
    77: { description: 'Snow grains', icon: '❄️', conditions: 'Snow' },
    80: { description: 'Slight rain showers', icon: '🌦️', conditions: 'Rain' },
    81: { description: 'Moderate rain showers', icon: '🌧️', conditions: 'Rain' },
    82: { description: 'Violent rain showers', icon: '⛈️', conditions: 'Rain' },
    85: { description: 'Slight snow showers', icon: '🌨️', conditions: 'Snow' },
    86: { description: 'Heavy snow showers', icon: '❄️', conditions: 'Snow' },
    95: { description: 'Thunderstorm', icon: '⛈️', conditions: 'Thunderstorm' },
    96: { description: 'Thunderstorm with hail', icon: '⛈️', conditions: 'Thunderstorm' },
    99: { description: 'Thunderstorm with heavy hail', icon: '⛈️', conditions: 'Thunderstorm' },
  };

  return mapping[code] || { description: 'Unknown', icon: '❓', conditions: 'Unknown' };
}

/**
 * Derive precipitation probability from weather code (for current weather
 * where Open-Meteo doesn't provide a probability field).
 */
function precipProbFromCode(code: number): number {
  if (code === 0 || code === 1) return 0;
  if (code === 2 || code === 3) return 0.05;
  if (code >= 45 && code <= 48) return 0.1; // Fog
  if (code >= 51 && code <= 57) return 0.5; // Drizzle
  if (code >= 61 && code <= 67) return 0.7; // Rain
  if (code >= 71 && code <= 77) return 0.7; // Snow
  if (code >= 80 && code <= 82) return 0.6; // Rain showers
  if (code >= 85 && code <= 86) return 0.6; // Snow showers
  if (code >= 95) return 0.8; // Thunderstorm
  return 0.2;
}

// ============================================================================
// WORK THRESHOLDS
// ============================================================================

// Default work conditions thresholds
const WORK_THRESHOLDS = {
  minTemp: 32,           // °F - below freezing
  maxTemp: 100,          // °F - extreme heat
  maxWind: 25,           // mph - high winds
  maxPrecipitation: 0.3, // probability (30%)
  minVisibility: 1,      // miles
};

// Trade-specific thresholds — override defaults per trade
const TRADE_THRESHOLDS: Record<string, Partial<typeof WORK_THRESHOLDS>> = {
  // Exterior / height work — most weather-sensitive
  roofing: { maxWind: 15, maxPrecipitation: 0.1 },
  concrete: { minTemp: 40, maxTemp: 90, maxPrecipitation: 0.2 },
  painting: { minTemp: 50, maxTemp: 85, maxPrecipitation: 0.1 },
  framing: { maxWind: 20, maxPrecipitation: 0.4 },
  excavation: { maxPrecipitation: 0.5 },
  masonry: { minTemp: 40, maxTemp: 100, maxWind: 20, maxPrecipitation: 0.15 },
  crane_ops: { maxWind: 20, maxPrecipitation: 0.2 },
  landscaping: { maxPrecipitation: 0.4, minTemp: 35 },

  // MEP — moderate sensitivity
  electrical: { maxPrecipitation: 0.2 },
  plumbing: { maxPrecipitation: 0.3 },
  hvac: { minTemp: 35, maxTemp: 95 },

  // Interior trades — very weather-tolerant
  drywall: { minTemp: 40, maxPrecipitation: 0.9 },
  flooring: { minTemp: 45, maxPrecipitation: 0.9 },
  cabinetry: { minTemp: 40, maxPrecipitation: 0.9 },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get current weather conditions
 */
export async function getCurrentWeather(
  lat: number,
  lng: number
): Promise<WeatherConditions> {
  const response = await WEATHER_API.get('/forecast', {
    params: {
      latitude: lat,
      longitude: lng,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'wind_speed_10m',
        'wind_gusts_10m',
        'weather_code',
        'cloud_cover',
        'precipitation',
      ].join(','),
      ...UNIT_PARAMS,
    },
  });

  const current = response.data.current;
  const weatherInfo = mapWeatherCode(current.weather_code);

  return {
    temp: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    windGust: current.wind_gusts_10m,
    description: weatherInfo.description,
    icon: weatherInfo.icon,
    precipitation: current.precipitation || 0,
    visibility: 10, // Open-Meteo doesn't provide visibility in free tier — default 10 mi
    clouds: current.cloud_cover || 0,
  };
}

/**
 * Get daily forecast for the next N days (max 16)
 */
export async function getDailyForecast(
  lat: number,
  lng: number,
  days = 7,
  trade?: string
): Promise<DailyForecast[]> {
  const response = await WEATHER_API.get('/forecast', {
    params: {
      latitude: lat,
      longitude: lng,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_probability_max',
        'wind_speed_10m_max',
        'precipitation_sum',
        'weather_code',
      ].join(','),
      forecast_days: Math.min(days, 16),
      ...UNIT_PARAMS,
    },
  });

  const daily = response.data.daily;
  const thresholds = trade
    ? { ...WORK_THRESHOLDS, ...TRADE_THRESHOLDS[trade.toLowerCase()] }
    : WORK_THRESHOLDS;

  const forecasts: DailyForecast[] = [];

  for (let i = 0; i < daily.time.length && i < days; i++) {
    const minTemp = daily.temperature_2m_min[i];
    const maxTemp = daily.temperature_2m_max[i];
    const avgTemp = Math.round((minTemp + maxTemp) / 2);
    const maxWind = daily.wind_speed_10m_max[i];
    const precipProb = (daily.precipitation_probability_max[i] || 0) / 100; // Convert % → 0-1
    const precipSum = daily.precipitation_sum[i] || 0;
    const weatherCode = daily.weather_code[i];
    const weatherInfo = mapWeatherCode(weatherCode);

    // Calculate workability score
    const restrictions: string[] = [];
    let workabilityScore = 100;

    if (minTemp < thresholds.minTemp) {
      restrictions.push(`Temperature below ${thresholds.minTemp}°F`);
      workabilityScore -= 30;
    }
    if (maxTemp > thresholds.maxTemp) {
      restrictions.push(`Temperature above ${thresholds.maxTemp}°F`);
      workabilityScore -= 25;
    }
    if (maxWind > thresholds.maxWind) {
      restrictions.push(`Wind speed exceeds ${thresholds.maxWind} mph`);
      workabilityScore -= 25;
    }
    if (precipProb > thresholds.maxPrecipitation) {
      restrictions.push(`High precipitation probability (${Math.round(precipProb * 100)}%)`);
      workabilityScore -= 30;
    }

    workabilityScore = Math.max(0, workabilityScore);

    forecasts.push({
      date: new Date(daily.time[i]),
      temp: { min: minTemp, max: maxTemp, avg: avgTemp },
      conditions: weatherInfo.conditions,
      precipitation: precipSum,
      precipitationProbability: precipProb,
      windSpeed: maxWind,
      humidity: 0, // Open-Meteo daily doesn't include humidity — set 0
      isWorkable: workabilityScore >= 60,
      workabilityScore,
      restrictions,
      weatherCode,
    });
  }

  return forecasts;
}

/**
 * Get hourly forecast for the next N hours
 */
export async function getHourlyForecast(
  lat: number,
  lng: number,
  hours = 48
): Promise<HourlyForecast[]> {
  const forecastDays = Math.min(Math.ceil(hours / 24), 16);

  const response = await WEATHER_API.get('/forecast', {
    params: {
      latitude: lat,
      longitude: lng,
      hourly: [
        'temperature_2m',
        'precipitation_probability',
        'wind_speed_10m',
        'weather_code',
        'precipitation',
      ].join(','),
      forecast_days: forecastDays,
      ...UNIT_PARAMS,
    },
  });

  const hourly = response.data.hourly;
  const forecasts: HourlyForecast[] = [];

  for (let i = 0; i < hourly.time.length && i < hours; i++) {
    const temp = hourly.temperature_2m[i];
    const precipProb = (hourly.precipitation_probability[i] || 0) / 100;
    const windSpeed = hourly.wind_speed_10m[i];
    const weatherCode = hourly.weather_code[i];
    const weatherInfo = mapWeatherCode(weatherCode);

    const isWorkable =
      temp >= WORK_THRESHOLDS.minTemp &&
      temp <= WORK_THRESHOLDS.maxTemp &&
      windSpeed <= WORK_THRESHOLDS.maxWind &&
      precipProb <= WORK_THRESHOLDS.maxPrecipitation;

    forecasts.push({
      time: new Date(hourly.time[i]),
      temp,
      conditions: weatherInfo.conditions,
      precipitation: hourly.precipitation[i] || 0,
      precipitationProbability: precipProb,
      windSpeed,
      isWorkable,
    });
  }

  return forecasts;
}

/**
 * Check if specific date/time is workable
 */
export async function isWorkableTime(
  lat: number,
  lng: number,
  targetTime: Date,
  trade?: string
): Promise<{
  isWorkable: boolean;
  score: number;
  conditions: WeatherConditions | null;
  restrictions: string[];
}> {
  const forecast = await getDailyForecast(lat, lng, 14, trade);
  const targetDateStr = targetTime.toISOString().split('T')[0];

  const dayForecast = forecast.find(
    f => f.date.toISOString().split('T')[0] === targetDateStr
  );

  if (!dayForecast) {
    // Beyond forecast range, assume workable
    return {
      isWorkable: true,
      score: 70,
      conditions: null,
      restrictions: ['Weather data not available for this date'],
    };
  }

  return {
    isWorkable: dayForecast.isWorkable,
    score: dayForecast.workabilityScore,
    conditions: null,
    restrictions: dayForecast.restrictions,
  };
}

/**
 * Find next workable day
 */
export async function findNextWorkableDay(
  lat: number,
  lng: number,
  startDate: Date = new Date(),
  trade?: string,
  maxDays = 14
): Promise<Date | null> {
  const forecast = await getDailyForecast(lat, lng, maxDays, trade);

  for (const day of forecast) {
    if (day.date >= startDate && day.isWorkable) {
      return day.date;
    }
  }

  return null;
}

/**
 * Get weather forecast (alias for getDailyForecast for compatibility)
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  days = 7
): Promise<any> {
  const forecast = await getDailyForecast(lat, lon, days);
  // Return in OpenWeatherMap-like format for backward compatibility
  return {
    daily: forecast.map(f => ({
      dt: Math.floor(f.date.getTime() / 1000),
      temp: f.temp,
      pop: f.precipitationProbability,
      wind_speed: f.windSpeed,
      weather: [{ main: f.conditions }],
    })),
  };
}

/**
 * Get weather impact summary for a project schedule
 */
export async function getWeatherImpactSummary(
  lat: number,
  lng: number,
  scheduledDates: Date[],
  trade?: string
): Promise<{
  totalDays: number;
  workableDays: number;
  impactedDays: number;
  impactPercentage: number;
  daysAtRisk: Array<{
    date: Date;
    score: number;
    restrictions: string[];
  }>;
  recommendation: string;
}> {
  const forecast = await getDailyForecast(lat, lng, 14, trade);
  const forecastMap = new Map(
    forecast.map(f => [f.date.toISOString().split('T')[0], f])
  );

  let workableDays = 0;
  let impactedDays = 0;
  const daysAtRisk: Array<{
    date: Date;
    score: number;
    restrictions: string[];
  }> = [];

  for (const date of scheduledDates) {
    const dateStr = date.toISOString().split('T')[0];
    const dayForecast = forecastMap.get(dateStr);

    if (dayForecast) {
      if (dayForecast.isWorkable) {
        workableDays++;
      } else {
        impactedDays++;
        daysAtRisk.push({
          date,
          score: dayForecast.workabilityScore,
          restrictions: dayForecast.restrictions,
        });
      }
    }
  }

  const impactPercentage = scheduledDates.length > 0
    ? (impactedDays / scheduledDates.length) * 100
    : 0;

  let recommendation: string;
  if (impactPercentage === 0) {
    recommendation = 'Weather conditions favorable for all scheduled work.';
  } else if (impactPercentage < 20) {
    recommendation = 'Minor weather impacts expected. Consider flexible scheduling for affected days.';
  } else if (impactPercentage < 40) {
    recommendation = 'Moderate weather impacts. Plan alternative indoor work or reschedule some activities.';
  } else {
    recommendation = 'Significant weather impacts expected. Consider major schedule adjustments.';
  }

  return {
    totalDays: scheduledDates.length,
    workableDays,
    impactedDays,
    impactPercentage: Math.round(impactPercentage),
    daysAtRisk,
    recommendation,
  };
}

/**
 * Export trade thresholds for UI display
 */
export function getTradeThresholds(): Record<string, Partial<typeof WORK_THRESHOLDS>> {
  return { ...TRADE_THRESHOLDS };
}

/**
 * Export weather code mapper for UI display
 */
export { mapWeatherCode };
