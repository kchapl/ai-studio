import React from 'react';
import { User } from 'firebase/auth';
import { CloudSun, ExternalLink, RefreshCw, FileSpreadsheet, Settings, LogOut, CheckCircle2 } from 'lucide-react';
import { SheetConfig } from '../types/weather';

interface HeaderProps {
  user: User | null;
  sheetConfig: SheetConfig;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefreshData: () => void;
  onOpenSheetSettings: () => void;
  onOpenWeatherSettings: () => void;
  autoLogEnabled: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  sheetConfig,
  isSyncing,
  onSignIn,
  onSignOut,
  onRefreshData,
  onOpenSheetSettings,
  onOpenWeatherSettings,
  autoLogEnabled,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                SkyLog
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                Sheets Edition
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Daily Weather Logger & Analytics for Google Sheets
            </p>
          </div>
        </div>

        {/* Center / Connected Sheet Status */}
        {sheetConfig.spreadsheetId && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="max-w-[200px] truncate font-medium text-slate-800 dark:text-slate-200">
              {sheetConfig.spreadsheetTitle || 'Weather Spreadsheet'}
            </span>
            {sheetConfig.spreadsheetUrl && (
              <a
                href={sheetConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in Google Sheets"
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center ml-1 p-0.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {autoLogEnabled && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 pl-2 border-l border-slate-300 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Auto-Log On
              </span>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <>
              {sheetConfig.spreadsheetId && (
                <button
                  onClick={onRefreshData}
                  disabled={isSyncing}
                  title="Refresh & sync from Google Sheets"
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
                </button>
              )}

              <button
                onClick={onOpenSheetSettings}
                title="Spreadsheet Settings"
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenWeatherSettings}
                title="OpenWeather & Automation Settings"
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                  {user.displayName || 'Google User'}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign out"
                className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
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
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
