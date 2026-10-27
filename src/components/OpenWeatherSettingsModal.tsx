import React, { useState } from 'react';
import {
  X,
  Key,
  MapPin,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { OpenWeatherSettings } from '../types/weather';
import { testOpenWeatherApiKey } from '../services/weather';

interface OpenWeatherSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OpenWeatherSettings;
  onSaveSettings: (settings: OpenWeatherSettings) => void;
}

const CITY_PRESETS = [
  'London',
  'New York',
  'Tokyo',
  'Paris',
  'Berlin',
  'Sydney',
  'San Francisco',
  'Toronto',
];

export const OpenWeatherSettingsModal: React.FC<OpenWeatherSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<OpenWeatherSettings>({ ...settings });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testOpenWeatherApiKey(formData.apiKey, formData.city);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Error testing API key.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                OpenWeatherMap & Automation
              </h3>
              <p className="text-xs text-slate-500">
                Configure live API credentials and automated scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                OpenWeatherMap API Key
              </label>
              <a
                href="https://home.openweathermap.org/api_keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Get a free key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter 32-character API key (e.g. 7f3b89...)"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !formData.apiKey.trim()}
                className="px-3.5 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 flex-shrink-0"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>Test</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mt-1">
              Leave blank to run in simulated live weather mode (no registration required).
            </p>
          </div>

          {/* City Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              City / Location to Monitor
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                placeholder="e.g. London, San Francisco, Tokyo"
                className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick city presets */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
              {CITY_PRESETS.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setFormData({ ...formData, city })}
                  className={`text-[11px] px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                    formData.city === city
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Units */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Temperature & Speed Units
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, units: 'metric' })}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  formData.units === 'metric'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Metric (°C, m/s)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, units: 'imperial' })}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  formData.units === 'imperial'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                Imperial (°F, mph)
              </button>
            </div>
          </div>

          {/* Automated Updates Schedule */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block">
                  Automated Updates
                </span>
                <span className="text-[11px] text-slate-500">
                  Automatically check and append daily weather to Google Sheet
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoLogEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, autoLogEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-indigo-600 cursor-pointer"
              />
            </div>

            {formData.autoLogEnabled && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Logging Interval</span>
                  </span>
                  <select
                    value={formData.autoLogIntervalHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        autoLogIntervalHours: parseInt(e.target.value, 10),
                      })
                    }
                    className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
                  >
                    <option value={1}>Every 1 hour</option>
                    <option value={6}>Every 6 hours</option>
                    <option value={12}>Every 12 hours</option>
                    <option value={24}>Once daily (24h)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
