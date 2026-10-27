import React, { useState } from 'react';
import { X, Calendar, Droplets, Thermometer, CloudSun } from 'lucide-react';
import { WeatherRecord } from '../types/weather';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRecord: (record: WeatherRecord) => Promise<void>;
  defaultCity: string;
  isCelsius: boolean;
  isLoading: boolean;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({
  isOpen,
  onClose,
  onAddRecord,
  defaultCity,
  isCelsius,
  isLoading,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTime);
  const [city, setCity] = useState(defaultCity || 'London');
  const [temp, setTemp] = useState('20');
  const [tempMin, setTempMin] = useState('16');
  const [tempMax, setTempMax] = useState('23');
  const [humidity, setHumidity] = useState('60');
  const [conditions, setConditions] = useState('Clear');
  const [description, setDescription] = useState('clear sky');
  const [windSpeed, setWindSpeed] = useState('3.5');
  const [pressure, setPressure] = useState('1013');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempNum = parseFloat(temp) || 0;
    const minNum = parseFloat(tempMin) || tempNum - 3;
    const maxNum = parseFloat(tempMax) || tempNum + 3;

    // Convert from F to C if input is in imperial
    const cTemp = isCelsius ? tempNum : ((tempNum - 32) * 5) / 9;
    const cMin = isCelsius ? minNum : ((minNum - 32) * 5) / 9;
    const cMax = isCelsius ? maxNum : ((maxNum - 32) * 5) / 9;

    let icon = '01d';
    const condLower = conditions.toLowerCase();
    if (condLower.includes('rain')) icon = '10d';
    else if (condLower.includes('drizzle')) icon = '09d';
    else if (condLower.includes('cloud')) icon = '03d';
    else if (condLower.includes('thunder')) icon = '11d';
    else if (condLower.includes('snow')) icon = '13d';

    const record: WeatherRecord = {
      id: `${date}_${Date.now()}_manual`,
      date,
      time,
      timestamp: new Date(`${date}T${time}`).getTime() || Date.now(),
      city: city.trim(),
      temp: Math.round(cTemp * 10) / 10,
      feelsLike: Math.round(cTemp * 10) / 10,
      tempMin: Math.round(cMin * 10) / 10,
      tempMax: Math.round(cMax * 10) / 10,
      humidity: Math.min(100, Math.max(0, parseInt(humidity, 10) || 50)),
      pressure: parseInt(pressure, 10) || 1013,
      conditions,
      description,
      icon,
      windSpeed: parseFloat(windSpeed) || 0,
      source: 'Manual',
    };

    await onAddRecord(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Manual Weather Observation Entry
              </h3>
              <p className="text-xs text-slate-500">
                Record or backfill a specific date to Google Sheets
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observation Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time
              </label>
              <input
                type="time"
                step="1"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              City
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          {/* Temperature row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Temp ({isCelsius ? '°C' : '°F'})
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Min Temp
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={tempMin}
                onChange={(e) => setTempMin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Temp
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={tempMax}
                onChange={(e) => setTempMax(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          {/* Humidity & Conditions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Humidity (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                required
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={conditions}
                onChange={(e) => {
                  setConditions(e.target.value);
                  setDescription(`${e.target.value.toLowerCase()} sky`);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="Clear">Clear</option>
                <option value="Clouds">Clouds</option>
                <option value="Rain">Rain</option>
                <option value="Drizzle">Drizzle</option>
                <option value="Thunderstorm">Thunderstorm</option>
                <option value="Snow">Snow</option>
                <option value="Mist">Mist / Fog</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Append to Google Sheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
