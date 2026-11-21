'use client';

import React from 'react';
import { RefreshCw, Layers, Moon, Sun, Settings } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function Header({
  bagBalance,
  onRefresh,
  isRefreshing,
  activeTab,
  onTabChange,
  currentTheme,
  onToggleTheme,
  onOpenSettings,
}) {
  const tabs = [
    { id: 'dashboard', labelTe: 'డాష్‌బోర్డ్', labelEn: 'Dashboard' },
    { id: 'edurlanka', labelTe: 'ఎదుర్లంక', labelEn: 'Edurlanka' },
    { id: 'kothapalli', labelTe: 'కొత్తపల్లి', labelEn: 'Kothapalli' },
    { id: 'ledger', labelTe: 'ఖాతా లెక్కలు', labelEn: 'Ledger' },
    { id: 'investments', labelTe: 'పెట్టుబడులు', labelEn: 'Investments' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* App Title & Bag Balance */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                గ్రామాల వసూళ్లు
              </h1>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
                / Village Collections
              </span>
            </div>
            {bagBalance !== undefined && (
              <div className="flex items-center space-x-1 mt-0.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">బ్యాగ్ నిల్వ:</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                  {formatINR(bagBalance)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-200 shadow-sm border border-slate-200/80 dark:border-slate-600'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
                }`}
              >
                <span>{tab.labelTe}</span>
                <span className="text-[10px] opacity-75 ml-1">({tab.labelEn})</span>
              </button>
            );
          })}
        </nav>

        {/* Action buttons (Theme Toggle, Settings, Refresh) */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Theme Quick Switcher */}
          <button
            onClick={onToggleTheme}
            title={currentTheme === 'dark' ? 'లైట్ మోడ్ (Light Mode)' : 'డార్క్ మోడ్ (Dark Mode)'}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            {currentTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="సెట్టింగ్స్ (Settings)"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="డేటా రిఫ్రెష్ (Sync with Google Sheets)"
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">రిఫ్రెష్ (Sync)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
