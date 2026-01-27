/**
 * KEALEE COMMAND CENTER - WEATHER INTEGRATION
 * OpenWeatherMap API for weather-aware scheduling
 */

import axios from 'axios';

const WEATHER_API = axios.create({
  baseURL: 'https://api.openweathermap.org/data/2.5',
});

const API_KEY = process.env.OPENWEATHER_API_KEY!;

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

// Work conditions thresholds
const WORK_THRESHOLDS = {
  minTemp: 32,           // °F - below freezing
  maxTemp: 100,          // °F - extreme heat
  maxWind: 25,           // mph - high winds
  maxPrecipitation: 0.3, // probability (30%)
  minVisibility: 1,      // miles
};

// Trade-specific thresholds
const TRADE_THRESHOLDS: Record<string, Partial<typeof WORK_THRESHOLDS>> = {
  roofing: { maxWind: 15, maxPrecipitation: 0.1 },
  concrete: { minTemp: 40, maxTemp: 90, maxPrecipitation: 0.2 },
  painting: { minTemp: 50, maxTemp: 85, maxPrecipitation: 0.1 },
  framing: { maxWind: 20, maxPrecipitation: 0.4 },
  excavation: { maxPrecipitation: 0.5 },
  electrical: { maxPrecipitation: 0.2 },
  plumbing: { maxPrecipitation: 0.3 },
  hvac: { minTemp: 35, maxTemp: 95 },
};

/**
 * Get current weather conditions
 */
export async function getCurrentWeather(
  lat: number,
  lng: number
): Promise<WeatherConditions> {
  const response = await WEATHER_API.get('/weather', {
    params: {
      lat,
      lon: lng,
      units: 'imperial',
      appid: API_KEY,
    },
  });

  const data = response.data;

  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    windSpeed: data.wind.speed,
    windGust: data.wind.gust,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
    visibility: (data.visibility || 10000) / 1609.34, // Convert to miles
    clouds: data.clouds.all,
  };
}

/**
 * Get daily forecast for the next 7 days
 */
export async function getDailyForecast(
  lat: number,
  lng: number,
  days = 7,
  trade?: string
): Promise<DailyForecast[]> {
  const response = await WEATHER_API.get('/forecast', {
    params: {
      lat,
      lon: lng,
      units: 'imperial',
      appid: API_KEY,
    },
  });

  // Group by day
  const dailyData = new Map<string, typeof response.data.list>();

  for (const item of response.data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!dailyData.has(date)) {
      dailyData.set(date, []);
    }
    dailyData.get(date)!.push(item);
  }

  const forecasts: DailyForecast[] = [];
  const thresholds = trade
    ? { ...WORK_THRESHOLDS, ...TRADE_THRESHOLDS[trade.toLowerCase()] }
    : WORK_THRESHOLDS;

  for (const [dateStr, items] of dailyData) {
    if (forecasts.length >= days) break;

    const temps = items.map((i: { main: { temp: number } }) => i.main.temp);
    const winds = items.map((i: { wind: { speed: number } }) => i.wind.speed);
    const precips = items.map((i: { pop: number }) => i.pop || 0);
    const humidities = items.map((i: { main: { humidity: number } }) => i.main.humidity);

    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
    const maxWind = Math.max(...winds);
    const avgPrecipProb = precips.reduce((a: number, b: number) => a + b, 0) / precips.length;
    const avgHumidity = humidities.reduce((a: number, b: number) => a + b, 0) / humidities.length;

    // Get predominant conditions
    const midItem = items[Math.floor(items.length / 2)];
    const conditions = midItem.weather[0].main;

    // Calculate workability
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
    if (avgPrecipProb > thresholds.maxPrecipitation) {
      restrictions.push(`High precipitation probability (${Math.round(avgPrecipProb * 100)}%)`);
      workabilityScore -= 30;
    }

    workabilityScore = Math.max(0, workabilityScore);

    forecasts.push({
      date: new Date(dateStr),
      temp: { min: minTemp, max: maxTemp, avg: Math.round(avgTemp) },
      conditions,
      precipitation: avgPrecipProb,
      precipitationProbability: avgPrecipProb,
      windSpeed: maxWind,
      humidity: Math.round(avgHumidity),
      isWorkable: workabilityScore >= 60,
      workabilityScore,
      restrictions,
    });
  }

  return forecasts;
}

/**
 * Get hourly forecast for the next 48 hours
 */
export async function getHourlyForecast(
  lat: number,
  lng: number,
  hours = 48
): Promise<HourlyForecast[]> {
  const response = await WEATHER_API.get('/forecast', {
    params: {
      lat,
      lon: lng,
      units: 'imperial',
      appid: API_KEY,
    },
  });

  const forecasts: HourlyForecast[] = [];

  for (const item of response.data.list.slice(0, Math.ceil(hours / 3))) {
    const isWorkable =
      item.main.temp >= WORK_THRESHOLDS.minTemp &&
      item.main.temp <= WORK_THRESHOLDS.maxTemp &&
      item.wind.speed <= WORK_THRESHOLDS.maxWind &&
      (item.pop || 0) <= WORK_THRESHOLDS.maxPrecipitation;

    forecasts.push({
      time: new Date(item.dt * 1000),
      temp: item.main.temp,
      conditions: item.weather[0].main,
      precipitation: item.rain?.['3h'] || item.snow?.['3h'] || 0,
      precipitationProbability: item.pop || 0,
      windSpeed: item.wind.speed,
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
  const forecast = await getDailyForecast(lat, lng, 7, trade);
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
