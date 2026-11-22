'use client';

import React from 'react';
import { TrendingUp, Plus, ShieldCheck } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function InvestmentsView({ investmentsData, onOpenAddInvestment }) {
  if (!investmentsData) return null;

  const { permanentInvestments = [], partnerSummary = [], safetyFundLog = [] } = investmentsData;

  const totalCapital = permanentInvestments.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="space-y-4 pb-24 pt-1 animate-fadeIn">
      {/* Header & Add Button */}
      <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 sm:p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                పెట్టుబడుల వివరాలు <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">(Investments & Equity)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                భాగస్వాముల మూలధనం & వాటాల లెక్కలు
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddInvestment}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950/30 active:scale-95 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ పెట్టుబడి నమోదు (Add Capital)</span>
          </button>
        </div>

        {/* Partner Equity Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          {partnerSummary.map((partner, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#131C30]/80 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {partner.partnerName.includes('సత్తిబాబు') ? 'స' : 'ప'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{partner.partnerName}</h4>
                  <span className="text-xs text-slate-500 dark:text-slate-400">మొత్తం పెట్టుబడి</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-teal-800 dark:text-teal-300">
                  {formatINR(partner.totalInvestment)}
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                  {partner.sharePercentage} వాటా
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop 2-Column Split: Safety Fund Log & Permanent Investments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Temporary Safety Fund Memo Table */}
        {safetyFundLog.length > 0 && (
          <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden transition-colors flex flex-col justify-between">
            <div>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-amber-50/60 dark:bg-amber-500/10 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  తాత్కాలిక భద్రతా నిధి లాగ్ (Safety Fund Memo)
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {safetyFundLog.map((log, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{log.particulars}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{log.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        ఇన్: {formatINR(log.inflow)} | అవుట్: {formatINR(log.outflow)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {log.netStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Permanent Investments History */}
        <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden transition-colors flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0A0F1D]/80 flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                పెట్టుబడుల చరిత్ర (Permanent Investment Log)
              </h3>
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-500/30">
                మొత్తం: {formatINR(totalCapital)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {permanentInvestments.map((inv, i) => (
                <div
                  key={i}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-[#131C30]/50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center border border-slate-200 dark:border-white/[0.06]">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{inv.partnerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{inv.date}</div>
                    </div>
                  </div>

                  <div className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                    +{formatINR(inv.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
