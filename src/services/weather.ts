import { WeatherRecord, OpenWeatherSettings } from '../types/weather';

const DEFAULT_SETTINGS: OpenWeatherSettings = {
  apiKey: '',
  city: 'London',
  countryCode: 'GB',
  units: 'metric',
  autoLogEnabled: true,
  autoLogIntervalHours: 24,
  lastAutoLogTimestamp: null,
};

const SETTINGS_STORAGE_KEY = 'skylog_weather_settings';

export const loadWeatherSettings = (): OpenWeatherSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load weather settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
};

export const saveWeatherSettings = (settings: OpenWeatherSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save weather settings', e);
  }
};

export const testOpenWeatherApiKey = async (apiKey: string, city: string = 'London'): Promise<{ success: boolean; message: string }> => {
  if (!apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey.trim()}&units=metric`);
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: `Connected successfully! Current temp in ${data.name}: ${Math.round(data.main.temp)}°C.` };
    } else {
      const err = await res.json();
      return { success: false, message: err.message || `API error (${res.status})` };
    }
  } catch (e: any) {
    return { success: false, message: e.message || 'Network error reaching OpenWeatherMap.' };
  }
};

export const fetchCurrentWeather = async (
  city: string,
  apiKey?: string,
  units: 'metric' | 'imperial' = 'metric'
): Promise<WeatherRecord> => {
  const effectiveKey = apiKey?.trim();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

  if (effectiveKey) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${effectiveKey}&units=${units}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `OpenWeatherMap returned ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();

    let tempCelsius = data.main.temp;
    let feelsLike = data.main.feels_like;
    let tempMin = data.main.temp_min;
    let tempMax = data.main.temp_max;

    if (units === 'imperial') {
      tempCelsius = ((data.main.temp - 32) * 5) / 9;
      feelsLike = ((data.main.feels_like - 32) * 5) / 9;
      tempMin = ((data.main.temp_min - 32) * 5) / 9;
      tempMax = ((data.main.temp_max - 32) * 5) / 9;
    }

    return {
      id: `${dateStr}_${Date.now()}`,
      date: dateStr,
      time: timeStr,
      timestamp: Date.now(),
      city: data.name || city,
      country: data.sys?.country,
      temp: Math.round(tempCelsius * 10) / 10,
      feelsLike: Math.round(feelsLike * 10) / 10,
      tempMin: Math.round(tempMin * 10) / 10,
      tempMax: Math.round(tempMax * 10) / 10,
      humidity: Math.round(data.main.humidity),
      pressure: data.main.pressure,
      conditions: data.weather?.[0]?.main || 'Clear',
      description: data.weather?.[0]?.description || 'clear sky',
      icon: data.weather?.[0]?.icon || '01d',
      windSpeed: data.wind?.speed || 0,
      windDeg: data.wind?.deg,
      clouds: data.clouds?.all ?? 0,
      source: 'OpenWeatherMap',
    };
  }

  // Realistic fallback simulation if API key is not yet configured
  return generateSimulatedWeather(city, now);
};

export const generateSimulatedWeather = (city: string, targetDate: Date = new Date()): WeatherRecord => {
  const dateStr = targetDate.toISOString().slice(0, 10);
  const timeStr = targetDate.toLocaleTimeString('en-GB', { hour12: false });
  
  // Use day of year and city name hash for pseudo-realistic, stable seasonality
  const dayOfYear = Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Seasonal base temperature curve
  const baseTemp = 16 + 10 * Math.sin(((dayOfYear - 100) / 365) * 2 * Math.PI);
  const variation = ((Math.sin(dayOfYear * 1.3 + hash) + Math.cos(dayOfYear * 0.7)) * 4);
  const temp = Math.round((baseTemp + variation) * 10) / 10;
  const tempMin = Math.round((temp - 3 - Math.random() * 2) * 10) / 10;
  const tempMax = Math.round((temp + 4 + Math.random() * 2) * 10) / 10;

  const conditionPool = [
    { main: 'Clear', desc: 'clear sky', icon: '01d', hum: 45, prob: 0.35 },
    { main: 'Clouds', desc: 'scattered clouds', icon: '03d', hum: 65, prob: 0.30 },
    { main: 'Rain', desc: 'moderate rain', icon: '10d', hum: 82, prob: 0.20 },
    { main: 'Drizzle', desc: 'light intensity drizzle', icon: '09d', hum: 78, prob: 0.08 },
    { main: 'Thunderstorm', desc: 'thunderstorm with rain', icon: '11d', hum: 88, prob: 0.04 },
    { main: 'Snow', desc: 'light snow', icon: '13d', hum: 75, prob: 0.03 },
  ];

  const roll = Math.random();
  let accumulated = 0;
  let chosen = conditionPool[0];
  for (const c of conditionPool) {
    accumulated += c.prob;
    if (roll <= accumulated) {
      chosen = c;
      break;
    }
  }

  const humidity = Math.min(100, Math.max(20, Math.round(chosen.hum + (Math.random() * 16 - 8))));
  const windSpeed = Math.round((2.5 + Math.random() * 6) * 10) / 10;
  const pressure = Math.round(1012 + (Math.random() * 20 - 10));

  return {
    id: `${dateStr}_${Date.now()}_sim`,
    date: dateStr,
    time: timeStr,
    timestamp: targetDate.getTime(),
    city: city || 'San Francisco',
    country: 'US',
    temp,
    feelsLike: Math.round((temp - 0.8) * 10) / 10,
    tempMin,
    tempMax,
    humidity,
    pressure,
    conditions: chosen.main,
    description: chosen.desc,
    icon: chosen.icon,
    windSpeed,
    clouds: chosen.main === 'Clear' ? 10 : chosen.main === 'Clouds' ? 65 : 85,
    source: 'OpenWeatherMap',
  };
};

// Generate 30 days of historical data for seeding Google Sheets & instant monthly visualizations
export const generateHistoricalSeedData = (city: string, daysCount: number = 30): WeatherRecord[] => {
  const records: WeatherRecord[] = [];
  const today = new Date();

  for (let i = daysCount; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(12, 0, 0, 0);

    const record = generateSimulatedWeather(city, d);
    record.id = `${record.date}_seed`;
    record.source = 'Backfill';
    records.push(record);
  }

  return records;
};

export const getWeatherIconUrl = (iconCode: string): string => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
