export interface WeatherRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number;
  city: string;
  country?: string;
  temp: number; // in Celsius
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number; // percentage (0 - 100)
  pressure: number; // hPa
  conditions: string; // e.g. "Clear", "Rain", "Clouds", "Snow"
  description: string; // e.g. "clear sky", "light rain"
  icon: string; // e.g. "01d", "10d"
  windSpeed: number; // m/s
  windDeg?: number;
  clouds?: number; // %
  source: 'OpenWeatherMap' | 'Manual' | 'Backfill';
  rowNumber?: number; // Row index in Google Sheets
}

export interface MonthlySummaryData {
  monthKey: string; // e.g. "2026-10"
  monthName: string; // e.g. "October 2026"
  year: number;
  month: number;
  totalDays: number;
  avgTemp: number;
  minTemp: number;
  maxTemp: number;
  avgHumidity: number;
  rainyDays: number;
  snowDays: number;
  clearDays: number;
  cloudyDays: number;
  dominantCondition: string;
  records: WeatherRecord[];
}

export interface SheetConfig {
  spreadsheetId: string | null;
  spreadsheetTitle: string;
  spreadsheetUrl: string | null;
  dailySheetName: string;
  summarySheetName: string;
  lastSyncedAt: number | null;
}

export interface FilterOptions {
  searchQuery: string;
  dateRange: 'all' | 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'custom';
  customStartDate: string;
  customEndDate: string;
  selectedMonth: string; // "all" or "YYYY-MM"
  conditions: string[]; // empty means all
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  sortBy: 'date-desc' | 'date-asc' | 'temp-desc' | 'temp-asc' | 'humidity-desc' | 'humidity-asc';
}

export interface OpenWeatherSettings {
  apiKey: string;
  city: string;
  countryCode: string;
  units: 'metric' | 'imperial';
  autoLogEnabled: boolean;
  autoLogIntervalHours: number; // 1, 3, 6, 12, 24
  lastAutoLogTimestamp: number | null;
}
