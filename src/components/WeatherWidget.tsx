import React, { useState } from 'react';
import {
  CloudSun,
  Droplets,
  Wind,
  Compass,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  Key,
  Clock,
  Sparkles,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { WeatherRecord, OpenWeatherSettings } from '../types/weather';
import { getWeatherIconUrl } from '../services/weather';

interface WeatherWidgetProps {
  currentWeather: WeatherRecord | null;
  settings: OpenWeatherSettings;
  isLogging: boolean;
  onLogCurrentWeather: () => void;
  onOpenManualModal: () => void;
  onOpenSettingsModal: () => void;
  hasSheetConnected: boolean;
  lastLoggedDate?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  currentWeather,
  settings,
  isLogging,
  onLogCurrentWeather,
  onOpenManualModal,
  onOpenSettingsModal,
  hasSheetConnected,
  lastLoggedDate,
}) => {
  const isCelsius = settings.units === 'metric';
  const tempUnit = isCelsius ? '°C' : '°F';
  const speedUnit = isCelsius ? 'm/s' : 'mph';

  const formatTemp = (celsius: number) => {
    if (isCelsius) return Math.round(celsius);
    return Math.round((celsius * 9) / 5 + 32);
  };

  const isTodayAlreadyLogged =
    lastLoggedDate &&
    new Date().toISOString().slice(0, 10) === lastLoggedDate;

  return (
    <div className="bg-gradient-to-br from-sky-600 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden">
      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-sky-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: Current Weather Details */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
              <MapPin className="w-3.5 h-3.5 text-sky-300" />
              {currentWeather?.city || settings.city}
              {currentWeather?.country ? `, ${currentWeather.country}` : ''}
            </span>

            {settings.apiKey ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/25 text-emerald-200 border border-emerald-400/30">
                <CheckCircle className="w-3 h-3 text-emerald-300" />
                OpenWeatherMap Live
              </span>
            ) : (
              <button
                onClick={onOpenSettingsModal}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/20 text-amber-200 border border-amber-300/30 hover:bg-amber-400/30 transition-colors cursor-pointer"
              >
                <Key className="w-3 h-3 text-amber-300" />
                OpenWeather API Key (Demo Mode Active)
              </button>
            )}

            <span className="text-xs text-sky-200/80 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {currentWeather?.time || 'Live'}
            </span>
          </div>

          <div className="flex items-center gap-5 sm:gap-8">
            <div className="flex items-baseline">
              <span className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-xs">
                {currentWeather ? formatTemp(currentWeather.temp) : '--'}
              </span>
              <span className="text-2xl sm:text-3xl font-light text-sky-200 ml-1">
                {tempUnit}
              </span>
            </div>

            {currentWeather && (
              <div className="flex items-center gap-3">
                <img
                  src={getWeatherIconUrl(currentWeather.icon)}
                  alt={currentWeather.description}
                  className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md"
                />
                <div>
                  <div className="text-xl sm:text-2xl font-bold capitalize">
                    {currentWeather.conditions}
                  </div>
                  <div className="text-xs sm:text-sm text-sky-200/90 capitalize font-medium">
                    {currentWeather.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics (Min, Max, Humidity, Wind) */}
          {currentWeather && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-200">
                  <ArrowDown className="w-4 h-4 text-sky-300" />
                </div>
                <div>
                  <div className="text-[11px] text-sky-200/70 font-medium">Min / Max</div>
                  <div className="text-sm font-semibold">
                    {formatTemp(currentWeather.tempMin)}° / {formatTemp(currentWeather.tempMax)}°
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-200">
                  <Droplets className="w-4 h-4 text-cyan-300" />
                </div>
                <div>
                  <div className="text-[11px] text-sky-200/70 font-medium">Humidity</div>
                  <div className="text-sm font-semibold">{currentWeather.humidity}%</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-200">
                  <Wind className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <div className="text-[11px] text-sky-200/70 font-medium">Wind Speed</div>
                  <div className="text-sm font-semibold">
                    {currentWeather.windSpeed} {speedUnit}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sky-200">
                  <Compass className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <div className="text-[11px] text-sky-200/70 font-medium">Barometer</div>
                  <div className="text-sm font-semibold">{currentWeather.pressure} hPa</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[220px]">
          <button
            onClick={onLogCurrentWeather}
            disabled={isLogging || !hasSheetConnected}
            className={`w-full px-5 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
              !hasSheetConnected
                ? 'bg-slate-800/80 text-slate-400 border border-slate-700 cursor-not-allowed'
                : isTodayAlreadyLogged
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/30'
                : 'bg-white hover:bg-sky-50 text-slate-900 shadow-white/10'
            }`}
          >
            {isLogging ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900/40 border-t-slate-900 rounded-full animate-spin" />
                <span>Writing to Google Sheets...</span>
              </>
            ) : isTodayAlreadyLogged ? (
              <>
                <CheckCircle className="w-4 h-4 text-slate-900" />
                <span>Update Today's Log</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <span>Log Today's Weather</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenManualModal}
            disabled={!hasSheetConnected}
            className="w-full px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/15 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Custom / Past Date Entry</span>
          </button>

          {!hasSheetConnected && (
            <p className="text-[11px] text-sky-200/80 text-center font-medium mt-1">
              Connect or create a Google Sheet to begin logging
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
