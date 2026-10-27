import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  PlusCircle,
  Link2,
  ExternalLink,
  Sparkles,
  Trash2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { SheetConfig } from '../types/weather';

interface SheetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SheetConfig;
  onCreateNewSheet: (title: string) => Promise<void>;
  onConnectExistingSheet: (idOrUrl: string) => Promise<void>;
  onSeedSampleData: () => Promise<void>;
  onClearSheetLogs: () => void;
  isLoading: boolean;
}

export const SheetSettingsModal: React.FC<SheetSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onCreateNewSheet,
  onConnectExistingSheet,
  onSeedSampleData,
  onClearSheetLogs,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'connect'>('create');
  const [newTitle, setNewTitle] = useState('SkyLog - Daily Weather Tracker');
  const [existingInput, setExistingInput] = useState('');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await onCreateNewSheet(newTitle);
      setStatusMessage({
        type: 'success',
        text: 'Google Sheet created successfully with Daily and Monthly tabs!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create Google Sheet.',
      });
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingInput.trim()) return;
    setStatusMessage(null);
    try {
      await onConnectExistingSheet(existingInput.trim());
      setStatusMessage({
        type: 'success',
        text: 'Connected to existing Google Sheet successfully!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to connect spreadsheet.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Google Sheets Integration
              </h3>
              <p className="text-xs text-slate-500">
                Manage your weather log spreadsheet destination
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

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Connection Status */}
          {config.spreadsheetId ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Spreadsheet
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                {config.spreadsheetTitle}
              </div>
              <div className="text-xs font-mono text-slate-500 truncate">
                ID: {config.spreadsheetId}
              </div>
              {config.spreadsheetUrl && (
                <a
                  href={config.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open directly in Google Sheets</span>
                </a>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
              No spreadsheet connected yet. Create a new one or connect an existing Google Sheet below.
            </div>
          )}

          {/* Switcher: Create vs Connect */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create New Sheet
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'connect'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Connect Existing Sheet
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Spreadsheet Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  placeholder="e.g. Daily Weather Log - London"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Will automatically generate &lsquo;Daily Weather Log&rsquo; and &lsquo;Monthly Summaries&rsquo; tabs with styled headers and formulas.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <PlusCircle className="w-4 h-4" />
                )}
                <span>Create Weather Spreadsheet</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Spreadsheet URL or ID
                </label>
                <input
                  type="text"
                  value={existingInput}
                  onChange={(e) => setExistingInput(e.target.value)}
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Paste the full Google Sheets link or the alphanumeric spreadsheet ID.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                <span>Connect Spreadsheet</span>
              </button>
            </form>
          )}

          {/* Quick Actions (Seed sample data / Clear logs) */}
          {config.spreadsheetId && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Spreadsheet Actions
              </span>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={onSeedSampleData}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Seed 30-Day Sample Data</span>
                </button>

                <button
                  type="button"
                  onClick={onClearSheetLogs}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear Daily Logs</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
