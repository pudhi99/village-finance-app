'use client';

import React from 'react';
import { X, Moon, Sun, Monitor, Settings, Database, Cloud, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, currentTheme, onThemeChange }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#0D1527] w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-white/[0.08] overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between bg-slate-50 dark:bg-[#0A0F1D]/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base">
                సెట్టింగ్స్ (Settings)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">యాప్ ప్రాధాన్యతలు & డిజైన్</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-[#131C30] text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#1A2642] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Theme Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              థీమ్ మోడ్ ఎంచుకోండి (Appearance Mode):
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => onThemeChange('light')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  currentTheme === 'light'
                    ? 'bg-teal-50 border-teal-600 text-teal-900 shadow-sm'
                    : 'bg-white dark:bg-[#131C30] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2642]'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-1.5">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold">లైట్ మోడ్</span>
                <span className="text-[10px] opacity-75">Light Mode</span>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  currentTheme === 'dark'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-white dark:bg-[#131C30] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1A2642]'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-1.5">
                  <Moon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black">డార్క్ మోడ్ (Vev)</span>
                <span className="text-[10px] opacity-75">Dark Mode</span>
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#131C30]/80 rounded-xl border border-slate-200 dark:border-white/[0.06] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span>Google Sheets:</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Live Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>Cloudinary Storage:</span>
              </span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Cards & houses</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50 dark:bg-[#0A0F1D]/80">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 active:scale-95 transition-all text-center"
          >
            పూర్తయింది (Done)
          </button>
        </div>
      </div>
    </div>
  );
}
