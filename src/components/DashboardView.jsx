'use client';

import React from 'react';
import {
  Wallet,
  Coins,
  TrendingUp,
  Award,
  MapPin,
  Building,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function DashboardView({ data, onNavigate, onOpenAddCustomer }) {
  if (!data) return null;

  const { kpis, villages, partnerEquity, weeklyTrends } = data;

  return (
    <div className="space-y-5 pb-20 pt-2 animate-fadeIn">
      {/* Welcome & Quick Action Bar */}
      <div className="bg-gradient-to-r from-teal-900 via-[#0C2D2B] to-[#0A0F1D] border border-teal-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-xl dark:shadow-[0_4px_30px_rgba(20,184,166,0.15)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                <span>గ్రామాల వసూళ్ల లైవ్ సారాంశం (Live Portfolio Sync)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                శనివారం వసూళ్ల డాష్‌బోర్డ్
              </h2>
              <p className="text-xs sm:text-sm text-teal-200/90 mt-0.5 font-medium">
                ఎదుర్లంక & కొత్తపల్లి మైక్రోఫైనాన్స్ లెక్కల వివరాలు
              </p>
            </div>
            <button
              onClick={() => onOpenAddCustomer('ఎదుర్లంక (Edurlanka)')}
              className="self-start sm:self-auto px-4 py-2.5 bg-white dark:bg-emerald-500 text-teal-950 dark:text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:bg-teal-50 dark:hover:bg-emerald-400 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <span>+ కొత్త ఖాతా చేర్చండి</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Bag Balance */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              బ్యాగ్ నిల్వ <span className="text-[10px] opacity-75">(Bag Balance)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight drop-shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            {formatINR(kpis.bagBalance)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1 font-semibold">
            <span>చేతిలో ఉన్న క్యాష్</span>
          </div>
        </div>

        {/* Market Dues */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all hover:border-rose-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              మార్కెట్ బాకీలు <span className="text-[10px] opacity-75">(Active Dues)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.15)]">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight drop-shadow-[0_0_12px_rgba(244,63,94,0.15)]">
            {formatINR(kpis.totalDues)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            రావలసిన మిగిలిన వసూళ్లు
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all hover:border-teal-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              మొత్తం వసూళ్లు <span className="text-[10px] opacity-75">(Collected)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(20,184,166,0.15)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-teal-700 dark:text-teal-300 tracking-tight drop-shadow-[0_0_12px_rgba(20,184,166,0.15)]">
            {formatINR(kpis.totalCollected)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            మొత్తం {kpis.activeBorrowersCount} ఖాతాల నుండి
          </div>
        </div>

        {/* Expected Gross Profit */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              అంచనా లాభం <span className="text-[10px] opacity-75">(Gross Profit)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.15)]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            {formatINR(kpis.expectedGrossProfit)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            మొత్తం వ్యాపార ఆస్తి {formatINR(kpis.totalPortfolio)}
          </div>
        </div>
      </div>

      {/* Village Recovery Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Edurlanka */}
        <div className="bg-white dark:bg-[#0D1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  ఎదుర్లంక <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">(Edurlanka)</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {villages.edurlanka.count} యాక్టివ్ ఖాతాలు (Borrowers)
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('edurlanka')}
              className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-500/15 border border-teal-200 dark:border-teal-500/30 hover:bg-teal-100 transition-colors"
            >
              <span>వివరాలు</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 my-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">రికవరీ శాతం (Recovery)</span>
              <span className="text-teal-700 dark:text-teal-300 font-black">{villages.edurlanka.recoveryRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#131C30] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                style={{ width: `${Math.min(100, villages.edurlanka.recoveryRate)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">మొత్తం లోన్స్</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{formatINR(villages.edurlanka.portfolio)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">వసూలైనది</span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{formatINR(villages.edurlanka.collected)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">బాకీ</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">{formatINR(villages.edurlanka.dues)}</span>
            </div>
          </div>
        </div>

        {/* Kothapalli */}
        <div className="bg-white dark:bg-[#0D1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  కొత్తపల్లి <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">(Kothapalli)</span>
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  {villages.kothapalli.count} యాక్టివ్ ఖాతాలు (Borrowers)
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigate('kothapalli')}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 transition-colors"
            >
              <span>వివరాలు</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5 my-3">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">రికవరీ శాతం (Recovery)</span>
              <span className="text-emerald-700 dark:text-emerald-300 font-black">{villages.kothapalli.recoveryRate}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-[#131C30] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                style={{ width: `${Math.min(100, villages.kothapalli.recoveryRate)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-center">
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">మొత్తం లోన్స్</span>
              <span className="text-xs font-black text-slate-800 dark:text-white">{formatINR(villages.kothapalli.portfolio)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">వసూలైనది</span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{formatINR(villages.kothapalli.collected)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">బాకీ</span>
              <span className="text-xs font-black text-rose-600 dark:text-rose-400">{formatINR(villages.kothapalli.dues)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Equity & Profit Distribution */}
      <div className="bg-white dark:bg-[#0D1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              భాగస్వామ్య విభజన <span className="text-xs font-medium text-slate-500 dark:text-slate-400">(Partner Equity & Profit Split)</span>
            </h3>
          </div>
          <button
            onClick={() => onNavigate('investments')}
            className="text-xs font-bold text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-white flex items-center space-x-1"
          >
            <span>పెట్టుబడుల వివరాలు</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {partnerEquity.map((partner) => (
            <div
              key={partner.name}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#131C30]/80 border border-slate-200 dark:border-white/[0.06] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white text-sm">{partner.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                  {partner.sharePct} వాటా
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-center">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">పెట్టుబడి</span>
                  <span className="text-xs font-black text-slate-800 dark:text-white">{formatINR(partner.invested)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">అంచనా లాభం వాటా</span>
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{formatINR(partner.expectedProfitShare)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">మొత్తం విలువ</span>
                  <span className="text-xs font-black text-teal-800 dark:text-teal-300">{formatINR(partner.totalValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Collections Trend */}
      {weeklyTrends && weeklyTrends.length > 0 && (
        <div className="bg-white dark:bg-[#0D1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-colors">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              వారం వారీ వసూళ్ల ట్రెండ్ <span className="text-xs font-medium text-slate-500 dark:text-slate-400">(Weekly Collection History)</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#131C30] text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-white/[0.08]">
                  <th className="py-2.5 px-3 font-bold">వారం (Week)</th>
                  <th className="py-2.5 px-3 font-bold text-right">ఎదుర్లంక (Edurlanka)</th>
                  <th className="py-2.5 px-3 font-bold text-right">కొత్తపల్లి (Kothapalli)</th>
                  <th className="py-2.5 px-3 font-bold text-right text-teal-800 dark:text-teal-300">మొత్తం (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {weeklyTrends.map((trend, i) => (
                  <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-[#131C30]/50 transition-colors">
                    <td className="py-2.5 px-3 font-black text-slate-800 dark:text-white">{trend.header}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatINR(trend.edurlanka)}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">{formatINR(trend.kothapalli)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-teal-800 dark:text-teal-300">{formatINR(trend.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
