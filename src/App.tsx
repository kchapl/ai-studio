/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  CloudSun,
  FileSpreadsheet,
  BarChart3,
  ListFilter,
  Sparkles,
  AlertCircle,
  ExternalLink,
  PlusCircle,
  CheckCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  getCurrentUser,
  getAccessToken,
} from './services/auth';
import {
  WeatherRecord,
  MonthlySummaryData,
  SheetConfig,
  OpenWeatherSettings,
} from './types/weather';
import {
  loadWeatherSettings,
  saveWeatherSettings,
  fetchCurrentWeather,
  generateHistoricalSeedData,
} from './services/weather';
import {
  loadSheetConfig,
  saveSheetConfig,
  createWeatherSpreadsheet,
  connectExistingSpreadsheet,
  fetchWeatherRecordsFromSheet,
  appendWeatherRecordToSheet,
  batchAppendRecordsToSheet,
  calculateMonthlySummaries,
  syncMonthlySummariesToSheet,
  clearSheetDailyLogs,
} from './services/sheets';
import { Header } from './components/Header';
import { WeatherWidget } from './components/WeatherWidget';
import { DailyLogDashboard } from './components/DailyLogDashboard';
import { MonthlySummaries } from './components/MonthlySummaries';
import { SheetSettingsModal } from './components/SheetSettingsModal';
import { OpenWeatherSettingsModal } from './components/OpenWeatherSettingsModal';
import { ManualLogModal } from './components/ManualLogModal';
import { ConfirmationModal } from './components/ConfirmationModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // App State
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(loadSheetConfig());
  const [weatherSettings, setWeatherSettings] = useState<OpenWeatherSettings>(loadWeatherSettings());
  const [currentWeather, setCurrentWeather] = useState<WeatherRecord | null>(null);
  const [records, setRecords] = useState<WeatherRecord[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummaryData[]>([]);

  // Navigation Tabs: 'daily' | 'monthly'
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');

  // Loading & status flags
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Destructive Confirmation Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    detail?: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setNeedsAuth(false);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Live Weather for widget
  const refreshLiveWeather = useCallback(async () => {
    try {
      const data = await fetchCurrentWeather(
        weatherSettings.city,
        weatherSettings.apiKey,
        weatherSettings.units
      );
      setCurrentWeather(data);
    } catch (e: any) {
      console.warn('Weather fetch warning:', e);
    }
  }, [weatherSettings.city, weatherSettings.apiKey, weatherSettings.units]);

  useEffect(() => {
    refreshLiveWeather();
  }, [refreshLiveWeather]);

  // Sync / Read from Google Sheets
  const syncWithSheet = useCallback(
    async (configToUse?: SheetConfig) => {
      const activeConfig = configToUse || sheetConfig;
      if (!activeConfig.spreadsheetId) return;

      setIsSyncing(true);
      try {
        const sheetRows = await fetchWeatherRecordsFromSheet(
          activeConfig.spreadsheetId,
          activeConfig.dailySheetName
        );
        setRecords(sheetRows);
        const summaries = calculateMonthlySummaries(sheetRows);
        setMonthlySummaries(summaries);
        notify(
          `Synced ${sheetRows.length} daily logs from Google Sheet.`,
          'success'
        );
      } catch (err: any) {
        console.error('Error syncing from Google Sheets:', err);
        notify(
          err.message || 'Failed to sync with Google Sheet. Try re-signing in.',
          'error'
        );
      } finally {
        setIsSyncing(false);
      }
    },
    [sheetConfig]
  );

  // Load records on initial auth
  useEffect(() => {
    if (user && token && sheetConfig.spreadsheetId) {
      syncWithSheet();
    }
  }, [user, token, sheetConfig.spreadsheetId, syncWithSheet]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      setIsAuthLoading(true);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        setNeedsAuth(false);
        notify(`Welcome back, ${res.user.displayName || 'User'}!`, 'success');
      }
    } catch (e: any) {
      notify(e.message || 'Google sign-in failed.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    notify('Signed out successfully.', 'info');
  };

  // Create a brand new Google Sheet
  const handleCreateNewSheet = async (title: string) => {
    const newConfig = await createWeatherSpreadsheet(title);
    setSheetConfig(newConfig);
    setRecords([]);
    setMonthlySummaries([]);
    notify('Created new Google Sheet with daily and monthly tabs!', 'success');
  };

  // Connect existing Google Sheet
  const handleConnectExistingSheet = async (idOrUrl: string) => {
    const updatedConfig = await connectExistingSpreadsheet(idOrUrl);
    setSheetConfig(updatedConfig);
    await syncWithSheet(updatedConfig);
    notify('Connected to Google Sheet successfully!', 'success');
  };

  // Log today's live weather to Google Sheets
  const handleLogCurrentWeather = async () => {
    if (!sheetConfig.spreadsheetId) {
      setIsSheetModalOpen(true);
      return;
    }

    setIsLogging(true);
    try {
      // Ensure we have freshest observation
      const record =
        currentWeather ||
        (await fetchCurrentWeather(
          weatherSettings.city,
          weatherSettings.apiKey,
          weatherSettings.units
        ));

      await appendWeatherRecordToSheet(
        sheetConfig.spreadsheetId,
        record,
        sheetConfig.dailySheetName
      );

      // Prepend to local records & recalculate summaries
      const updatedRecords = [record, ...records.filter((r) => r.date !== record.date)];
      setRecords(updatedRecords);
      const summaries = calculateMonthlySummaries(updatedRecords);
      setMonthlySummaries(summaries);

      // Update monthly summaries tab in Google Sheets
      await syncMonthlySummariesToSheet(
        sheetConfig.spreadsheetId,
        summaries,
        sheetConfig.summarySheetName
      );

      notify(`Logged ${record.date} weather to Google Sheets!`, 'success');
    } catch (err: any) {
      console.error(err);
      notify(err.message || 'Failed to append weather record to Google Sheet.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  // Manually add record
  const handleManualAddRecord = async (record: WeatherRecord) => {
    if (!sheetConfig.spreadsheetId) {
      notify('Please connect a Google Sheet first.', 'error');
      return;
    }

    try {
      await appendWeatherRecordToSheet(
        sheetConfig.spreadsheetId,
        record,
        sheetConfig.dailySheetName
      );
      const updated = [record, ...records];
      setRecords(updated);
      const summaries = calculateMonthlySummaries(updated);
      setMonthlySummaries(summaries);
      notify(`Appended record for ${record.date} to Google Sheets.`, 'success');
    } catch (e: any) {
      notify(e.message || 'Failed to append record to Google Sheets.', 'error');
    }
  };

  // Seed 30-Day sample data
  const handleSeedSampleData = async () => {
    if (!sheetConfig.spreadsheetId) return;

    try {
      setIsSyncing(true);
      const seedRecords = generateHistoricalSeedData(weatherSettings.city, 30);
      await batchAppendRecordsToSheet(
        sheetConfig.spreadsheetId,
        seedRecords,
        sheetConfig.dailySheetName
      );

      const allCombined = [...seedRecords, ...records];
      setRecords(allCombined);
      const summaries = calculateMonthlySummaries(allCombined);
      setMonthlySummaries(summaries);

      // Sync summary tab
      await syncMonthlySummariesToSheet(
        sheetConfig.spreadsheetId,
        summaries,
        sheetConfig.summarySheetName
      );

      setIsSheetModalOpen(false);
      notify(
        'Successfully seeded 30 days of historical weather data and updated monthly summaries!',
        'success'
      );
    } catch (e: any) {
      notify(e.message || 'Failed to seed sample data.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Explicit confirmation before destructive sheet clear
  const promptClearSheetLogs = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Clear All Daily Logs from Google Sheet?',
      message:
        'This will permanently delete all daily weather observation rows from the "Daily Weather Log" tab in your connected Google Sheet. This action cannot be undone.',
      detail: `Affected Spreadsheet: "${sheetConfig.spreadsheetTitle}" (${records.length} records)`,
      confirmLabel: 'Clear All Daily Logs',
      onConfirm: async () => {
        if (!sheetConfig.spreadsheetId) return;
        try {
          await clearSheetDailyLogs(
            sheetConfig.spreadsheetId,
            sheetConfig.dailySheetName
          );
          setRecords([]);
          setMonthlySummaries([]);
          // Also clear summary tab
          await syncMonthlySummariesToSheet(
            sheetConfig.spreadsheetId,
            [],
            sheetConfig.summarySheetName
          );
          notify('All daily weather records cleared from Google Sheet.', 'info');
        } catch (e: any) {
          notify(e.message || 'Failed to clear sheet rows.', 'error');
        } finally {
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete single record prompt
  const promptDeleteRecord = (record: WeatherRecord) => {
    setConfirmModalConfig({
      isOpen: true,
      title: `Delete Log for ${record.date}?`,
      message: `Are you sure you want to remove the weather log for ${record.date} in ${record.city}?`,
      detail: `Date: ${record.date} | Temp: ${record.temp}°C | Humidity: ${record.humidity}%`,
      confirmLabel: 'Delete Entry',
      onConfirm: () => {
        const remaining = records.filter((r) => r.id !== record.id);
        setRecords(remaining);
        const summaries = calculateMonthlySummaries(remaining);
        setMonthlySummaries(summaries);
        notify(`Deleted record for ${record.date}.`, 'info');
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Sync Monthly summaries tab to Google Sheet
  const handleSyncSummariesToSheet = async () => {
    if (!sheetConfig.spreadsheetId) return;
    await syncMonthlySummariesToSheet(
      sheetConfig.spreadsheetId,
      monthlySummaries,
      sheetConfig.summarySheetName
    );
    notify('Updated "Monthly Summaries" tab in Google Sheets!', 'success');
  };

  // Save weather settings
  const handleSaveWeatherSettings = (newSettings: OpenWeatherSettings) => {
    setWeatherSettings(newSettings);
    saveWeatherSettings(newSettings);
    notify('Weather settings saved.', 'success');
  };

  // Automated background scheduler ticker
  useEffect(() => {
    if (!weatherSettings.autoLogEnabled || !sheetConfig.spreadsheetId || !token) {
      return;
    }

    const intervalMinutes = 30; // Check interval periodically
    const timer = setInterval(() => {
      const now = Date.now();
      const last = weatherSettings.lastAutoLogTimestamp || 0;
      const intervalMs = weatherSettings.autoLogIntervalHours * 60 * 60 * 1000;

      if (now - last >= intervalMs) {
        console.log('Automated weather check triggered');
        handleLogCurrentWeather();
        const updated = { ...weatherSettings, lastAutoLogTimestamp: now };
        setWeatherSettings(updated);
        saveWeatherSettings(updated);
      }
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(timer);
  }, [weatherSettings, sheetConfig.spreadsheetId, token]);

  const lastLoggedDate = records[0]?.date;
  const isCelsius = weatherSettings.units === 'metric';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation & Status */}
      <Header
        user={user}
        sheetConfig={sheetConfig}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onRefreshData={() => syncWithSheet()}
        onOpenSheetSettings={() => setIsSheetModalOpen(true)}
        onOpenWeatherSettings={() => setIsWeatherModalOpen(true)}
        autoLogEnabled={weatherSettings.autoLogEnabled}
      />

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold backdrop-blur-md border ${
              notification.type === 'success'
                ? 'bg-emerald-900/90 text-emerald-100 border-emerald-500/30'
                : notification.type === 'error'
                ? 'bg-rose-900/90 text-rose-100 border-rose-500/30'
                : 'bg-slate-900/90 text-slate-100 border-slate-700/50'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Onboarding State if Not Authenticated */}
        {!user && !isAuthLoading && (
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-sky-950 rounded-3xl p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-6 relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto text-sky-300 border border-white/20">
                <CloudSun className="w-9 h-9" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Automated Daily Weather Logging to Google Sheets
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Log daily temperatures, humidity levels, and conditions directly to a Google Spreadsheet. Generate monthly summaries and responsive charts powered by the OpenWeatherMap API.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleSignIn}
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 hover:bg-sky-50 font-bold text-sm shadow-xl flex items-center gap-3 transition-transform hover:scale-105 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                  <span>Sign in with Google to Connect Sheets</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left border-t border-white/10 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1">Daily Log Row per Day</div>
                  <div>Columns for temperature, humidity, conditions, wind, and timestamps.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1">Monthly Summaries Tab</div>
                  <div>Aggregated KPI tables and interactive temperature & humidity charts.</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1">OpenWeatherMap Live</div>
                  <div>Automated updates and seamless multi-city support.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Weather Widget */}
        <WeatherWidget
          currentWeather={currentWeather}
          settings={weatherSettings}
          isLogging={isLogging}
          onLogCurrentWeather={handleLogCurrentWeather}
          onOpenManualModal={() => setIsManualModalOpen(true)}
          onOpenSettingsModal={() => setIsWeatherModalOpen(true)}
          hasSheetConnected={!!sheetConfig.spreadsheetId}
          lastLoggedDate={lastLoggedDate}
        />

        {/* Setup Banner if Authenticated but no Spreadsheet Connected */}
        {user && !sheetConfig.spreadsheetId && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Connect or Create a Google Sheet
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  SkyLog needs a target spreadsheet to store your daily weather rows and generate the monthly summaries tab.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsSheetModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Weather Sheet</span>
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Tabs & Content */}
        <div className="space-y-4">
          {/* Tab Navigation Pill Bar */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'daily'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Daily Weather Log</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                  {records.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('monthly')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Monthly Summaries & Charts</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                  {monthlySummaries.length}
                </span>
              </button>
            </div>

            {/* Quick Actions Right */}
            {sheetConfig.spreadsheetUrl && (
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Google Sheets</span>
              </a>
            )}
          </div>

          {/* Active Tab View */}
          {activeTab === 'daily' ? (
            <DailyLogDashboard
              records={records}
              isCelsius={isCelsius}
              onDeleteRecord={promptDeleteRecord}
              sheetUrl={sheetConfig.spreadsheetUrl}
            />
          ) : (
            <MonthlySummaries
              summaries={monthlySummaries}
              allRecords={records}
              isCelsius={isCelsius}
              onSyncSummariesToSheet={handleSyncSummariesToSheet}
              isSyncing={isSyncing}
              sheetUrl={sheetConfig.spreadsheetUrl}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <SheetSettingsModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        config={sheetConfig}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={handleConnectExistingSheet}
        onSeedSampleData={handleSeedSampleData}
        onClearSheetLogs={promptClearSheetLogs}
        isLoading={isSyncing}
      />

      <OpenWeatherSettingsModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        settings={weatherSettings}
        onSaveSettings={handleSaveWeatherSettings}
      />

      <ManualLogModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddRecord={handleManualAddRecord}
        defaultCity={weatherSettings.city}
        isCelsius={isCelsius}
        isLoading={isLogging}
      />

      {/* Confirmation Modal for Destructive Operations */}
      <ConfirmationModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        detail={confirmModalConfig.detail}
        confirmLabel={confirmModalConfig.confirmLabel}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
}
