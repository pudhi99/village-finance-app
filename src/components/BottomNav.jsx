'use client';

import React from 'react';
import { LayoutDashboard, MapPin, Building, BookOpen, TrendingUp } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange }) {
  const navItems = [
    {
      id: 'dashboard',
      labelTe: 'డాష్‌బోర్డ్',
      labelEn: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'edurlanka',
      labelTe: 'ఎదుర్లంక',
      labelEn: 'Edurlanka',
      icon: MapPin,
    },
    {
      id: 'kothapalli',
      labelTe: 'కొత్తపల్లి',
      labelEn: 'Kothapalli',
      icon: Building,
    },
    {
      id: 'ledger',
      labelTe: 'ఖాతా లెక్కలు',
      labelEn: 'Ledger',
      icon: BookOpen,
    },
    {
      id: 'investments',
      labelTe: 'పెట్టుబడులు',
      labelEn: 'Investments',
      icon: TrendingUp,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0F1D]/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.08] px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] safe-area-bottom transition-colors">
      <div className="grid grid-cols-5 gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-800 dark:text-emerald-300 font-extrabold bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] scale-[1.03]'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 mb-0.5 transition-transform ${
                  isActive ? 'stroke-[2.5px] text-emerald-700 dark:text-emerald-300' : 'stroke-[1.75px]'
                }`}
              />
              <span className="text-[10px] tracking-tight leading-none truncate max-w-full">
                {item.labelTe}
              </span>
              <span className="text-[8px] opacity-75 tracking-tight leading-none mt-0.5 truncate max-w-full">
                {item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
