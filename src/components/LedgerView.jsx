'use client';

import React from 'react';
import { BookOpen, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function LedgerView({ ledgerData, onOpenAddLedger }) {
  if (!ledgerData) return null;

  const { summary, transactions = [] } = ledgerData;

  return (
    <div className="space-y-4 pb-24 pt-1 animate-fadeIn">
      {/* Header & Add Button */}
      <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200/90 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] p-4 sm:p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                ఖాతా లెక్కలు <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">(Ledger Reconciliation)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                క్యాష్ ఇన్ఫ్లో, అవుట్ఫ్లో & బ్యాగ్ నిల్వ రికార్డులు
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddLedger}
            className="px-3.5 py-2 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950/30 active:scale-95 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ కొత్త ఎంట్రీ (Add Transaction)</span>
          </button>
        </div>

        {/* 5 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-center">
          <div className="p-2.5 bg-slate-50 dark:bg-[#131C30] rounded-xl border border-slate-200 dark:border-white/[0.06]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">మొత్తం పెట్టుబడి</span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
              {formatINR(summary.totalCapitalAdded)}
            </span>
          </div>
          <div className="p-2.5 bg-blue-50/70 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/25">
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block">సేఫ్టీ డిపాజిట్</span>
            <span className="text-xs sm:text-sm font-black text-blue-800 dark:text-blue-200">
              {formatINR(summary.safetyFundInflow)}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/25">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">మొత్తం వసూళ్లు</span>
            <span className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">
              {formatINR(summary.totalCollections)}
            </span>
          </div>
          <div className="p-2.5 bg-rose-50/70 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/25">
            <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold block">మొత్తం ఖర్చులు</span>
            <span className="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-300">
              {formatINR(summary.totalExpensesAndReturns)}
            </span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2.5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-md shadow-emerald-950/30">
            <span className="text-[10px] text-emerald-100 font-bold block">బ్యాగ్ నిల్వ (Closing)</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {formatINR(summary.closingBagBalance)}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0A0F1D]/80 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
            లావాదేవీల రికార్డులు (Chronological Transactions - {transactions.length})
          </h3>
        </div>

        {/* Mobile-friendly cards & desktop table */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
          {transactions.map((txn, i) => {
            const isCredit = txn.credit > 0;
            const isDebit = txn.debit > 0;

            return (
              <div
                key={i}
                className="p-3.5 hover:bg-slate-50/80 dark:hover:bg-[#131C30]/50 transition-colors flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit
                        ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : isDebit
                        ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        : 'bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">{txn.particulars}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{txn.date}</div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`font-black text-xs sm:text-sm ${
                      isCredit
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : isDebit
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {isCredit ? `+${formatINR(txn.credit)}` : isDebit ? `-${formatINR(txn.debit)}` : '₹0'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    నిల్వ: {formatINR(txn.balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
