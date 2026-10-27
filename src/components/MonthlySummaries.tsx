import React, { useState } from 'react';
import {
  Calendar,
  TrendingUp,
  Droplets,
  CloudRain,
  Sun,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart3,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { MonthlySummaryData, WeatherRecord } from '../types/weather';
import { getWeatherIconUrl } from '../services/weather';

interface MonthlySummariesProps {
  summaries: MonthlySummaryData[];
  allRecords: WeatherRecord[];
  isCelsius: boolean;
  onSyncSummariesToSheet: () => Promise<void>;
  isSyncing: boolean;
  sheetUrl?: string | null;
}

export const MonthlySummaries: React.FC<MonthlySummariesProps> = ({
  summaries,
  allRecords,
  isCelsius,
  onSyncSummariesToSheet,
  isSyncing,
  sheetUrl,
}) => {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    summaries[0]?.monthKey || ''
  );
  const [syncSuccess, setSyncSuccess] = useState(false);

  const formatTemp = (celsius: number) => {
    if (isCelsius) return `${Math.round(celsius * 10) / 10}°C`;
    const f = (celsius * 9) / 5 + 32;
    return `${Math.round(f * 10) / 10}°F`;
  };

  const activeSummary =
    summaries.find((s) => s.monthKey === selectedMonthKey) || summaries[0];

  const handleSync = async () => {
    try {
      await onSyncSummariesToSheet();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  if (summaries.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          No Monthly Summaries Yet
        </h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Start logging daily weather data or click &ldquo;Seed 30-Day Sample Data&rdquo; in Spreadsheet Settings to instantly generate monthly summaries and interactive visualizations.
        </p>
      </div>
    );
  }

  // Calculate chart metrics
  const maxAvgTemp = Math.max(...summaries.map((s) => s.maxTemp), 30);
  const minAvgTemp = Math.min(...summaries.map((s) => s.minTemp), 0);
  const tempRange = Math.max(maxAvgTemp - minAvgTemp, 10);

  return (
    <div className="space-y-6">
      {/* Top Controls: Month Selector & Google Sheets Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Viewing Monthly Data
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonthKey || summaries[0]?.monthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="font-bold text-slate-900 dark:text-white bg-transparent text-lg focus:outline-none cursor-pointer"
              >
                {summaries.map((s) => (
                  <option key={s.monthKey} value={s.monthKey} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                    {s.monthName} ({s.totalDays} days logged)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View in Sheets</span>
            </a>
          )}

          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              syncSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing to Google Sheets...</span>
              </>
            ) : syncSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Sheets Tab Synced!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Sync &apos;Monthly Summaries&apos; Tab</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards for the active month */}
      {activeSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Temp
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {formatTemp(activeSummary.avgTemp)}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
              <span>Range:</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold">
                {formatTemp(activeSummary.minTemp)}
              </span>
              <span>to</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {formatTemp(activeSummary.maxTemp)}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Average Humidity
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeSummary.avgHumidity}%
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              {activeSummary.avgHumidity > 70
                ? 'High humidity levels'
                : activeSummary.avgHumidity < 40
                ? 'Dry climate condition'
                : 'Optimal comfort range'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Rain / Storm Days
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeSummary.rainyDays}{' '}
              <span className="text-sm font-normal text-slate-400">
                / {activeSummary.totalDays} days
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              {Math.round((activeSummary.rainyDays / activeSummary.totalDays) * 100)}% wet days
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dominant Weather
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {activeSummary.dominantCondition}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              {activeSummary.clearDays} sunny &bull; {activeSummary.cloudyDays} cloudy
            </div>
          </div>
        </div>
      )}

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Temperature Profile & Range */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Monthly Temperature Comparison
                </h4>
                <p className="text-xs text-slate-500">
                  Average, Minimum, and Maximum temperatures per month
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Avg
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-300" /> Range (Min-Max)
                </span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="mt-6 h-56 w-full flex items-end justify-between gap-3 px-2 pb-6 border-b border-slate-200 dark:border-slate-800 relative">
              {/* Horizontal Reference Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 pb-6">
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
                <div className="border-b border-dashed border-slate-400 w-full" />
              </div>

              {summaries.slice(0, 8).map((s) => {
                const isSelected = s.monthKey === (activeSummary?.monthKey || '');
                // Normalize heights
                const barBottomPercent = Math.max(
                  0,
                  ((s.minTemp - minAvgTemp) / tempRange) * 75
                );
                const barTopPercent = Math.min(
                  90,
                  ((s.maxTemp - minAvgTemp) / tempRange) * 85
                );
                const barHeightPercent = Math.max(12, barTopPercent - barBottomPercent);
                const avgPosPercent = ((s.avgTemp - minAvgTemp) / tempRange) * 80;

                return (
                  <div
                    key={s.monthKey}
                    onClick={() => setSelectedMonthKey(s.monthKey)}
                    className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[11px] rounded-lg px-2.5 py-1.5 shadow-xl pointer-events-none whitespace-nowrap">
                      <span className="font-bold">{s.monthName}</span>
                      <span>
                        Avg: {formatTemp(s.avgTemp)} ({formatTemp(s.minTemp)} - {formatTemp(s.maxTemp)})
                      </span>
                    </div>

                    {/* Range Pill */}
                    <div
                      className={`w-full max-w-[28px] rounded-xl transition-all relative flex items-center justify-center ${
                        isSelected
                          ? 'bg-gradient-to-t from-sky-400 to-indigo-500 shadow-md shadow-indigo-500/30'
                          : 'bg-slate-200 dark:bg-slate-700/60 group-hover:bg-slate-300 dark:group-hover:bg-slate-600'
                      }`}
                      style={{ height: `${barHeightPercent}%`, minHeight: '24px' }}
                    >
                      {/* Avg Point Marker */}
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 ${
                          isSelected
                            ? 'bg-white border-indigo-700 shadow-xs'
                            : 'bg-indigo-600 border-white dark:border-slate-800'
                        }`}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[11px] font-semibold mt-2 truncate w-full text-center ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.monthName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 text-right mt-2">
            Click any month bar to inspect day details
          </div>
        </div>

        {/* Chart 2: Average Humidity & Moisture Breakdown */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Monthly Humidity Profile (%)
                </h4>
                <p className="text-xs text-slate-500">
                  Average relative humidity percentage across recorded months
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>

            {/* Humidity Bars */}
            <div className="space-y-3.5 mt-5">
              {summaries.slice(0, 5).map((s) => {
                const isSelected = s.monthKey === (activeSummary?.monthKey || '');
                return (
                  <div
                    key={s.monthKey}
                    onClick={() => setSelectedMonthKey(s.monthKey)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-800 dark:text-slate-200">
                        {s.monthName}
                      </span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                        {s.avgHumidity}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${s.avgHumidity}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-4 flex items-center justify-between">
            <span>0% (Dry)</span>
            <span>50% (Comfort)</span>
            <span>100% (Saturated)</span>
          </div>
        </div>
      </div>

      {/* Selected Month: Day-by-Day Visual Grid */}
      {activeSummary && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Daily Breakdown: {activeSummary.monthName}
              </h4>
              <p className="text-xs text-slate-500">
                Visual timeline of all daily observations recorded for this month
              </p>
            </div>
            <div className="text-xs font-semibold text-slate-500">
              {activeSummary.records.length} days logged
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {activeSummary.records.map((r) => {
              const dayNum = parseInt(r.date.split('-')[2], 10);
              const dayName = new Date(r.date).toLocaleDateString('en-US', {
                weekday: 'short',
              });

              return (
                <div
                  key={r.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition-all hover:shadow-xs group"
                >
                  <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-medium">
                    <span>{dayName}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {dayNum}
                    </span>
                  </div>

                  <img
                    src={getWeatherIconUrl(r.icon)}
                    alt={r.conditions}
                    className="w-10 h-10 my-1 group-hover:scale-110 transition-transform"
                  />

                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {formatTemp(r.temp)}
                  </div>

                  <div className="text-[10px] text-slate-500 mt-1 capitalize truncate w-full">
                    {r.conditions}
                  </div>

                  <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium flex items-center gap-0.5 mt-0.5">
                    <Droplets className="w-2.5 h-2.5" />
                    <span>{r.humidity}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
