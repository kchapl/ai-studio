import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  Trash2,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Cloud,
  Snowflake,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { WeatherRecord, FilterOptions } from '../types/weather';
import { getWeatherIconUrl } from '../services/weather';

interface DailyLogDashboardProps {
  records: WeatherRecord[];
  isCelsius: boolean;
  onDeleteRecord: (record: WeatherRecord) => void;
  sheetUrl?: string | null;
}

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  dateRange: 'all',
  customStartDate: '',
  customEndDate: '',
  selectedMonth: 'all',
  conditions: [],
  tempMin: -50,
  tempMax: 60,
  humidityMin: 0,
  humidityMax: 100,
  sortBy: 'date-desc',
};

const CONDITION_PRESETS = [
  { label: 'Clear', icon: Sun, color: 'text-amber-500' },
  { label: 'Clouds', icon: Cloud, color: 'text-slate-400' },
  { label: 'Rain', icon: CloudRain, color: 'text-blue-500' },
  { label: 'Drizzle', icon: CloudRain, color: 'text-cyan-500' },
  { label: 'Snow', icon: Snowflake, color: 'text-sky-300' },
  { label: 'Thunderstorm', icon: Zap, color: 'text-purple-500' },
];

export const DailyLogDashboard: React.FC<DailyLogDashboardProps> = ({
  records,
  isCelsius,
  onDeleteRecord,
  sheetUrl,
}) => {
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const formatTemp = (celsius: number) => {
    if (isCelsius) return `${Math.round(celsius * 10) / 10}°C`;
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f * 10) / 10}°F`;
  };

  const handleToggleCondition = (cond: string) => {
    setFilters((prev) => {
      const exists = prev.conditions.includes(cond);
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.filter((c) => c !== cond)
          : [...prev.conditions, cond],
      };
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchQuery.trim() !== '' ||
      filters.dateRange !== 'all' ||
      filters.conditions.length > 0 ||
      filters.tempMin > -50 ||
      filters.tempMax < 60 ||
      filters.humidityMin > 0 ||
      filters.humidityMax < 100 ||
      filters.sortBy !== 'date-desc'
    );
  }, [filters]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();

    return records.filter((r) => {
      // Search query (date, city, conditions, description)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matches =
          r.date.includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.conditions.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Date range
      if (filters.dateRange === 'today') {
        if (r.date !== todayStr) return false;
      } else if (filters.dateRange === 'last7') {
        const diffDays =
          (now.getTime() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (filters.dateRange === 'last30') {
        const diffDays =
          (now.getTime() - new Date(r.date).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 30) return false;
      } else if (filters.dateRange === 'thisMonth') {
        const currentMonthKey = todayStr.slice(0, 7);
        if (!r.date.startsWith(currentMonthKey)) return false;
      } else if (filters.dateRange === 'custom') {
        if (filters.customStartDate && r.date < filters.customStartDate) return false;
        if (filters.customEndDate && r.date > filters.customEndDate) return false;
      }

      // Condition filters
      if (filters.conditions.length > 0) {
        const matchesCond = filters.conditions.some((c) =>
          r.conditions.toLowerCase().includes(c.toLowerCase())
        );
        if (!matchesCond) return false;
      }

      // Temperature
      if (r.temp < filters.tempMin || r.temp > filters.tempMax) {
        return false;
      }

      // Humidity
      if (r.humidity < filters.humidityMin || r.humidity > filters.humidityMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'date-desc') return b.date.localeCompare(a.date);
      if (filters.sortBy === 'date-asc') return a.date.localeCompare(b.date);
      if (filters.sortBy === 'temp-desc') return b.temp - a.temp;
      if (filters.sortBy === 'temp-asc') return a.temp - b.temp;
      if (filters.sortBy === 'humidity-desc') return b.humidity - a.humidity;
      if (filters.sortBy === 'humidity-asc') return a.humidity - b.humidity;
      return 0;
    });
  }, [records, filters]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  // Aggregate stats of filtered results
  const filteredStats = useMemo(() => {
    if (filteredRecords.length === 0) return null;
    const avgTemp =
      filteredRecords.reduce((acc, r) => acc + r.temp, 0) / filteredRecords.length;
    const avgHum =
      filteredRecords.reduce((acc, r) => acc + r.humidity, 0) /
      filteredRecords.length;
    return {
      count: filteredRecords.length,
      avgTemp: Math.round(avgTemp * 10) / 10,
      avgHum: Math.round(avgHum),
    };
  }, [filteredRecords]);

  // CSV Export helper
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;
    const headers = [
      'Date',
      'Time',
      'City',
      'Temperature (C)',
      'Feels Like (C)',
      'Min Temp (C)',
      'Max Temp (C)',
      'Humidity (%)',
      'Conditions',
      'Description',
      'Wind Speed (m/s)',
      'Pressure (hPa)',
      'Source',
    ];
    const rows = filteredRecords.map((r) => [
      r.date,
      r.time,
      `"${r.city}"`,
      r.temp,
      r.feelsLike,
      r.tempMin,
      r.tempMax,
      r.humidity,
      `"${r.conditions}"`,
      `"${r.description}"`,
      r.windSpeed,
      r.pressure,
      r.source,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `weather_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Search & Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by date (YYYY-MM-DD), condition, city, description..."
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Quick Controls: Filter toggle, Sort, Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                isFilterPanelOpen || hasActiveFilters
                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-sky-500" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={filters.sortBy}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value as any }));
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl focus:outline-none cursor-pointer"
              >
                <option value="date-desc">Newest Date First</option>
                <option value="date-asc">Oldest Date First</option>
                <option value="temp-desc">Highest Temperature</option>
                <option value="temp-asc">Lowest Temperature</option>
                <option value="humidity-desc">Highest Humidity</option>
                <option value="humidity-asc">Lowest Humidity</option>
              </select>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
              title="Export filtered records to CSV"
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                title="Reset all filters"
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Condition Filter Quick Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs font-medium text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Conditions:
          </span>
          {CONDITION_PRESETS.map((cp) => {
            const isSelected = filters.conditions.includes(cp.label);
            const IconComp = cp.icon;
            return (
              <button
                key={cp.label}
                onClick={() => handleToggleCondition(cp.label)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <IconComp className={`w-3 h-3 ${isSelected ? 'text-white' : cp.color}`} />
                <span>{cp.label}</span>
              </button>
            );
          })}
        </div>

        {/* Collapsible Extended Filters (Date Range, Sliders) */}
        {isFilterPanelOpen && (
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Date Range
              </label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {(
                  [
                    ['all', 'All Time'],
                    ['today', 'Today'],
                    ['last7', 'Last 7D'],
                    ['last30', 'Last 30D'],
                    ['thisMonth', 'This Month'],
                    ['custom', 'Custom'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, dateRange: key }));
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      filters.dateRange === key
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {filters.dateRange === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, customStartDate: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-1/2 p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, customEndDate: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-1/2 p-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Temperature Range Filter */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Temperature Threshold
                </label>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {formatTemp(filters.tempMin)} to {formatTemp(filters.tempMax)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-8">Min</span>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    value={filters.tempMin}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, tempMin: parseInt(e.target.value, 10) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-sky-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-8">Max</span>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    value={filters.tempMax}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, tempMax: parseInt(e.target.value, 10) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Humidity Range Filter */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Humidity Range
                </label>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                  {filters.humidityMin}% - {filters.humidityMax}%
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-8">Min</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.humidityMin}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, humidityMin: parseInt(e.target.value, 10) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 w-8">Max</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.humidityMax}
                    onChange={(e) => {
                      setFilters((p) => ({ ...p, humidityMax: parseInt(e.target.value, 10) }));
                      setCurrentPage(1);
                    }}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtered Summary Status Ribbon */}
      {filteredStats && (
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-2">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredRecords.length}</strong> of{' '}
            {records.length} daily logs
            {hasActiveFilters && ' (filtered)'}
          </div>
          <div className="flex items-center gap-4">
            <span>
              Avg Temp: <strong className="text-indigo-600 dark:text-indigo-400">{formatTemp(filteredStats.avgTemp)}</strong>
            </span>
            <span>
              Avg Humidity: <strong className="text-cyan-600 dark:text-cyan-400">{filteredStats.avgHum}%</strong>
            </span>
          </div>
        </div>
      )}

      {/* Daily Records List / Table */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No matching daily weather records
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, clearing the condition filters, or log today&apos;s weather above.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/40 rounded-xl transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">City</th>
                  <th className="py-3.5 px-4">Temperature</th>
                  <th className="py-3.5 px-4">Humidity</th>
                  <th className="py-3.5 px-4">General Conditions</th>
                  <th className="py-3.5 px-4">Wind & Pressure</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {paginatedRecords.map((r) => {
                  const dayName = new Date(r.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                  });

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.date}
                        </div>
                        <div className="text-xs text-slate-400">
                          {dayName} &bull; {r.time || '12:00'}
                        </div>
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {r.city}
                        </span>
                      </td>

                      {/* Temperature */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 dark:text-white text-base">
                          {formatTemp(r.temp)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Min {formatTemp(r.tempMin)} &bull; Max {formatTemp(r.tempMax)}
                        </div>
                      </td>

                      {/* Humidity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-cyan-600 dark:text-cyan-400">
                            {r.humidity}%
                          </span>
                        </div>
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full"
                            style={{ width: `${r.humidity}%` }}
                          />
                        </div>
                      </td>

                      {/* Conditions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={getWeatherIconUrl(r.icon)}
                            alt={r.conditions}
                            className="w-7 h-7"
                          />
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {r.conditions}
                            </div>
                            <div className="text-xs text-slate-400 capitalize">
                              {r.description}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Wind & Pressure */}
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        <div>{r.windSpeed} m/s wind</div>
                        <div className="text-slate-400">{r.pressure} hPa</div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                            r.source === 'OpenWeatherMap'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : r.source === 'Manual'
                              ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {r.source}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteRecord(r)}
                          title="Delete entry from sheet"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
            {paginatedRecords.map((r) => (
              <div key={r.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-base">
                      {r.date}
                    </div>
                    <div className="text-xs text-slate-400">
                      {r.city} &bull; {r.time || '12:00'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <img
                      src={getWeatherIconUrl(r.icon)}
                      alt={r.conditions}
                      className="w-10 h-10"
                    />
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                        {formatTemp(r.temp)}
                      </div>
                      <div className="text-[11px] text-cyan-600 font-semibold">
                        {r.humidity}% hum
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                      {r.conditions} ({r.description})
                    </span>
                  </div>

                  <button
                    onClick={() => onDeleteRecord(r)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
                {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
