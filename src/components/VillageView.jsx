'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Phone,
  MapPin,
  Camera,
  Edit,
  Plus,
  CalendarPlus,
  Bell,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Banknote,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
} from 'lucide-react';
import {
  formatINR,
  isWeekApplicableForCustomer,
  getMonthlyDueSaturday,
  getMonthlyCustomerStatus,
} from '@/lib/utils';
import { getSchemeByFaceValue } from '@/lib/schemes';

export default function VillageView({
  villageData,
  onOpenCollection,
  onOpenEditCustomer,
  onOpenAddCustomer,
  onOpenAddWeek,
  onViewPhoto,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'weekly' | 'monthly' | 'monthly_due' | 'reminder' | 'inactive'
  const [colonyFilter, setColonyFilter] = useState('all'); // 'all' | 'జగన్' | 'MD' | other

  if (!villageData) return null;

  const { sheetTitle, weekColumns = [], customers = [] } = villageData;

  // Extract unique colonies
  const uniqueColonies = useMemo(() => {
    const set = new Set();
    customers.forEach((c) => {
      if (c.colony) set.add(c.colony);
    });
    return Array.from(set);
  }, [customers]);

  // Compute active totals & counts
  const stats = useMemo(() => {
    const active = customers.filter((c) => !c.isStruckOut);
    const inactive = customers.filter((c) => c.isStruckOut);
    const portfolio = active.reduce((acc, c) => acc + c.amount, 0);
    const collected = active.reduce((acc, c) => acc + c.totalPaid, 0);
    const dues = active.reduce((acc, c) => acc + c.remainingDue, 0);
    const reminderCount = active.filter((c) => c.hasPhoneReminder).length;
    const rate = portfolio > 0 ? ((collected / portfolio) * 100).toFixed(1) : 0;

    // Monthly borrowers due this Saturday
    const monthlyDueCount = active.filter((c) => {
      if (!c.isMonthly || c.remainingDue <= 0) return false;
      const st = getMonthlyCustomerStatus(c, 20261121);
      return st && st.isDueThisSaturday;
    }).length;

    return {
      count: active.length,
      inactiveCount: inactive.length,
      portfolio,
      collected,
      dues,
      reminderCount,
      monthlyDueCount,
      rate,
    };
  }, [customers]);

  // Filter customers - by default HIDE struck-out / inactive accounts!
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return customers.filter((c) => {
      // 1. By default, completely HIDE struck-out accounts (మట్టపర్తి రాంబాబు, etc.)
      // Only show them if user explicitly selected 'inactive' filter
      if (c.isStruckOut && filterType !== 'inactive') {
        return false;
      }
      if (!c.isStruckOut && filterType === 'inactive') {
        return false;
      }

      // 2. Search matching: nameTe, nameEn, sNo, phone, surety, remarks
      if (q) {
        const matchesName =
          c.nameTe.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          String(c.sNo).includes(q) ||
          c.phone.includes(q) ||
          c.surety.toLowerCase().includes(q) ||
          c.remarks.toLowerCase().includes(q);
        if (!matchesName) return false;
      }

      // 3. Filter by type
      if (filterType === 'weekly' && c.isMonthly) return false;
      if (filterType === 'monthly' && !c.isMonthly) return false;
      if (filterType === 'monthly_due') {
        if (!c.isMonthly || c.remainingDue <= 0) return false;
        const st = getMonthlyCustomerStatus(c, 20261121);
        if (!st || !st.isDueThisSaturday) return false;
      }
      if (filterType === 'reminder' && !c.hasPhoneReminder) return false;

      // 4. Colony filter
      if (colonyFilter !== 'all' && c.colony !== colonyFilter) return false;

      return true;
    });
  }, [customers, searchQuery, filterType, colonyFilter]);

  return (
    <div className="space-y-4 pb-24 pt-1 animate-fadeIn">
      {/* Top Village Header & Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm p-4 sm:p-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {sheetTitle}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              యాక్టివ్ ఖాతాలు: <strong className="text-teal-700 dark:text-teal-300">{stats.count}</strong>
              {stats.inactiveCount > 0 && (
                <span className="opacity-75 ml-1.5">(ముగిసినవి: {stats.inactiveCount})</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenAddWeek(sheetTitle, weekColumns.length)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center space-x-1"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span>+ వారం (Add Week)</span>
            </button>
            <button
              onClick={() => onOpenAddCustomer(sheetTitle)}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>+ కొత్త ఖాతా (Add Customer)</span>
            </button>
          </div>
        </div>

        {/* 4 Stats Chips */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">మొత్తం లోన్స్</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{formatINR(stats.portfolio)}</span>
          </div>
          <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">వసూలైనది</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">{formatINR(stats.collected)}</span>
          </div>
          <div className="p-2 bg-rose-50/60 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-800/50">
            <span className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold block">మార్కెట్ బాకీ</span>
            <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-300">{formatINR(stats.dues)}</span>
          </div>
          <div className="p-2 bg-teal-50/60 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-800/50">
            <span className="text-[10px] text-teal-700 dark:text-teal-300 font-semibold block">రికవరీ శాతం</span>
            <span className="text-xs sm:text-sm font-bold text-teal-800 dark:text-teal-200">{stats.rate}%</span>
          </div>
        </div>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="space-y-2 sticky top-[57px] z-30 bg-slate-100/95 dark:bg-[#0B0F19]/95 backdrop-blur-md py-2 -mx-2 px-2 transition-colors">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="పేరు, వ.సం., ఫోన్, లేదా ష్యూరిటీ నంబర్ వెతకండి..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent shadow-sm placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700"
            >
              ×
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              filterType === 'all'
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            యాక్టివ్ ఖాతాలు ({stats.count})
          </button>
          <button
            onClick={() => setFilterType('weekly')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              filterType === 'weekly'
                ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            వారం స్కీమ్
          </button>
          <button
            onClick={() => setFilterType('monthly')}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
              filterType === 'monthly'
                ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            నెల స్కీమ్
          </button>
          {stats.monthlyDueCount > 0 && (
            <button
              onClick={() => setFilterType(filterType === 'monthly_due' ? 'all' : 'monthly_due')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center space-x-1 ${
                filterType === 'monthly_due'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700/80 animate-pulse'
              }`}
            >
              <Bell className="w-3.5 h-3.5 fill-current" />
              <span>ఈ వారం నెల డ్యూ ({stats.monthlyDueCount})</span>
            </button>
          )}
          {stats.reminderCount > 0 && (
            <button
              onClick={() => setFilterType('reminder')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center space-x-1 ${
                filterType === 'reminder'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
              }`}
            >
              <Bell className="w-3.5 h-3.5 fill-current" />
              <span>ఫోన్ చేయాలి ({stats.reminderCount})</span>
            </button>
          )}

          {/* Inactive accounts toggle pill */}
          {stats.inactiveCount > 0 && (
            <button
              onClick={() => setFilterType(filterType === 'inactive' ? 'all' : 'inactive')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                filterType === 'inactive'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white border-slate-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              ముగిసినవి ({stats.inactiveCount})
            </button>
          )}

          {/* Colony pills */}
          {uniqueColonies.length > 0 && (
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setColonyFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  colonyFilter === 'all'
                    ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-700'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                అన్ని కాలనీలు
              </button>
              {uniqueColonies.map((col) => (
                <button
                  key={col}
                  onClick={() => setColonyFilter(col)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                    colonyFilter === col
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Count Info */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400 font-semibold">
        <span>చూపిస్తున్న ఖాతాలు: {filteredCustomers.length}</span>
        {searchQuery && (
          <span className="text-teal-700 dark:text-teal-400">&quot;{searchQuery}&quot; కోసం ఫలితాలు</span>
        )}
      </div>

      {/* Customer Cards List */}
      <div className="space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">ఖాతాలు కనపడలేదు (No customers match)</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setColonyFilter('all');
              }}
              className="text-xs text-teal-700 dark:text-teal-400 font-bold underline"
            >
              ఫిల్టర్లను రీసెట్ చేయండి
            </button>
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const scheme = getSchemeByFaceValue(cust.amount);

            // Monthly installments calculation
            const monthlyPaidPayments = cust.isMonthly
              ? (cust.weeklyPayments || []).filter((p) => p.amount > 0)
              : [];
            const standardMonthsCount = cust.amount === 14000 ? 12 : 6;
            const displayMonthsCount = Math.max(standardMonthsCount, monthlyPaidPayments.length + 1);

            return (
              <div
                key={cust.rowIndex}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden ${
                  cust.isStruckOut
                    ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md'
                }`}
              >
                {/* Card Top Row: S.No, Name, Badges */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      {/* S.No Badge */}
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                          cust.isStruckOut
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            : 'bg-teal-700 text-white shadow-sm'
                        }`}
                      >
                        #{cust.sNo}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3
                            className={`font-black text-base tracking-tight leading-tight ${
                              cust.isStruckOut ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {cust.nameTe}
                          </h3>
                          {cust.nameEn && (
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              ({cust.nameEn})
                            </span>
                          )}
                        </div>

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {cust.colony && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {cust.colony} కాలనీ
                            </span>
                          )}
                          {cust.isMonthly ? (
                            (() => {
                              const st = getMonthlyCustomerStatus(cust, 20261121);
                              return (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${
                                    st?.type === 'due_this_saturday'
                                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 animate-pulse'
                                      : st?.type === 'overdue'
                                      ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                                      : 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                                  }`}
                                >
                                  <span>{st?.badgeTe || 'నెల స్కీమ్'}</span>
                                </span>
                              );
                            })()
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60">
                              25 వారాల స్కీమ్
                            </span>
                          )}

                          {cust.hasPhoneReminder && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/80 flex items-center space-x-1 animate-pulse">
                              <Bell className="w-3 h-3 fill-amber-700 text-amber-700 dark:text-amber-400" />
                              <span>ఫోన్ చేయాలి (P)</span>
                            </span>
                          )}

                          {cust.isStruckOut && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                              ఖాతా ముగిసింది (Struck out)
                            </span>
                          )}

                          {cust.surety && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                              ష్యూరిటీ: #{cust.surety}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Call Button */}
                    {cust.phone ? (
                      <a
                        href={`tel:${cust.phone}`}
                        title={`Call ${cust.phone}`}
                        className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
                      >
                        <Phone className="w-4 h-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
                      </a>
                    ) : (
                      <button
                        onClick={() => onOpenEditCustomer(cust, sheetTitle)}
                        title="ఫోన్ నంబర్ జోడించండి"
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Financial Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 mt-3.5 p-2.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">మొత్తం స్కీమ్</span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {formatINR(cust.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">వసూలైనది</span>
                      <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {formatINR(cust.totalPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">మిగిలిన బాకీ</span>
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          cust.remainingDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {formatINR(cust.remainingDue)}
                      </span>
                    </div>
                  </div>

                  {/* INSTALLMENT BOXES: Differentiated for Monthly vs. Weekly! */}
                  {cust.isMonthly ? (
                    /* MONTHLY SCHEME BOXES (With Exact Saturday Dates & Due Status) */
                    (() => {
                      const status = getMonthlyCustomerStatus(cust, 20261121);

                      return (
                        <div className="mt-3 p-3 bg-purple-50/40 dark:bg-purple-950/20 rounded-2xl border border-purple-100 dark:border-purple-900/40 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                            <div className="flex items-center space-x-1.5 font-bold text-purple-950 dark:text-purple-200">
                              <Calendar className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                              <span>నెలవారీ వాయిదాలు (చేరిన తేదీ: {cust.date}):</span>
                            </div>
                            <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-lg self-start sm:self-auto">
                              {monthlyPaidPayments.length} / {standardMonthsCount} నెలలు వసూలయ్యాయి
                            </div>
                          </div>

                          {/* Current Saturday Status Banner */}
                          {status && cust.remainingDue > 0 && (
                            <div
                              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                status.type === 'due_this_saturday'
                                  ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 font-bold'
                                  : status.type === 'overdue'
                                  ? 'bg-rose-100/90 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-100 font-bold'
                                  : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                {status.type === 'due_this_saturday' ? (
                                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 fill-current animate-bounce" />
                                ) : status.type === 'overdue' ? (
                                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                                ) : (
                                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                                <div>
                                  <span className="font-bold block leading-tight">{status.badgeTe}</span>
                                  <span className="text-[10px] opacity-75 font-normal">
                                    {status.type === 'not_due'
                                      ? 'నెల పొద్దు కాబట్టి ఈ శనివారం వీరి వద్ద వసూలు చేయనవసరం లేదు.'
                                      : 'శనివారం లైనులో భాగంగా ఈ వాయిదా వసూలు చేయాలి.'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => onOpenCollection(cust, sheetTitle)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-sm active:scale-95 transition-all ${
                                  status.isDueThisSaturday
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {status.buttonText}
                              </button>
                            </div>
                          )}

                          {/* 6 Month Boxes with Exact Saturday Dates */}
                          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                            {Array.from({ length: displayMonthsCount }).map((_, mIdx) => {
                              const isPaid = mIdx < monthlyPaidPayments.length;
                              const payment = isPaid ? monthlyPaidPayments[mIdx] : null;
                              const isNextDue = mIdx === monthlyPaidPayments.length && cust.remainingDue > 0;
                              const mDue = getMonthlyDueSaturday(cust.date, mIdx + 1);

                              if (isPaid) {
                                return (
                                  <div
                                    key={mIdx}
                                    className="px-2.5 py-1.5 rounded-xl border shrink-0 text-center bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200 font-bold"
                                  >
                                    <div className="text-[9px] text-emerald-700 dark:text-emerald-300 leading-tight font-black">
                                      {mIdx + 1}వ నెల
                                    </div>
                                    <div className="text-[8px] text-emerald-600 dark:text-emerald-400 leading-none mt-0.5 font-medium">
                                      {mDue?.short || ''} ({mDue?.satOccurrence}వ శని)
                                    </div>
                                    <div className="text-xs font-black mt-1 leading-tight flex items-center justify-center space-x-0.5">
                                      <span>₹{payment.amount}</span>
                                      {payment.isUPI && (
                                        <span className="text-[8px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 rounded">UPI</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              if (isNextDue) {
                                return (
                                  <button
                                    key={mIdx}
                                    onClick={() => onOpenCollection(cust, sheetTitle)}
                                    className={`px-2.5 py-1.5 rounded-xl border shrink-0 text-center font-bold active:scale-95 transition-all shadow-sm ${
                                      status?.type === 'due_this_saturday'
                                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200 animate-pulse hover:bg-amber-100'
                                        : status?.type === 'overdue'
                                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 hover:bg-rose-100'
                                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                                    }`}
                                  >
                                    <div className="text-[9px] opacity-80 leading-tight font-black">
                                      {mIdx + 1}వ నెల
                                    </div>
                                    <div className="text-[8px] opacity-75 leading-none mt-0.5 font-medium">
                                      {mDue?.short || ''} ({mDue?.satOccurrence}వ శని)
                                    </div>
                                    <div className="text-xs font-bold mt-1 leading-tight text-amber-800 dark:text-amber-200">
                                      వసూలు ➔
                                    </div>
                                  </button>
                                );
                              }

                              // Future months
                              return (
                                <div
                                  key={mIdx}
                                  className="px-2.5 py-1.5 rounded-xl border shrink-0 text-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-medium"
                                >
                                  <div className="text-[9px] leading-tight font-semibold">{mIdx + 1}వ నెల</div>
                                  <div className="text-[8px] opacity-60 leading-none mt-0.5">{mDue?.short || ''} ({mDue?.satOccurrence}వ శని)</div>
                                  <div className="text-xs mt-1 leading-tight">-</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    /* WEEKLY SCHEME BOXES (Filtered & Numbered from Customer's 1st Week) */
                    (() => {
                      const applicableWeeklyPayments = (cust.weeklyPayments || []).filter((p) =>
                        isWeekApplicableForCustomer(p.weekHeader, cust.date, p.amount > 0)
                      );

                      if (applicableWeeklyPayments.length === 0) {
                        return (
                          <div className="mt-3 flex items-center justify-between p-2.5 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800/60 text-xs">
                            <div className="flex items-center space-x-2">
                              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                              <div>
                                <span className="font-bold text-teal-900 dark:text-teal-200">
                                  తాజా ఖాతా (చేరిన తేదీ: {cust.date})
                                </span>
                                <p className="text-[11px] text-teal-700 dark:text-teal-400">
                                  వచ్చే వారం నుంచి 1వ వాయిదా వసూలు ప్రారంభమవుతుంది
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => onOpenCollection(cust, sheetTitle)}
                              className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-bold shrink-0 shadow-sm active:scale-95 transition-all"
                            >
                              ముందస్తు వసూలు ➔
                            </button>
                          </div>
                        );
                      }

                      const paidCount = applicableWeeklyPayments.filter((p) => p.amount > 0).length;

                      return (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1.5 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center space-x-1">
                              <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                              <span>వారం వాయిదాలు (చేరిన తేదీ: {cust.date}):</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                              {paidCount} / {applicableWeeklyPayments.length} వసూలయ్యాయి
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                            {applicableWeeklyPayments.map((p, idx) => {
                              const isPaid = p.amount > 0;
                              return (
                                <button
                                  key={p.colIndex || idx}
                                  onClick={() => onOpenCollection(cust, sheetTitle)}
                                  className={`px-2.5 py-1.5 rounded-xl shrink-0 border text-center transition-all ${
                                    isPaid
                                      ? p.isUPI
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800 font-bold'
                                        : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 font-bold'
                                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/80 font-bold animate-pulse hover:bg-amber-100'
                                  }`}
                                >
                                  <div className="text-[9px] text-slate-700 dark:text-slate-200 leading-tight font-black">
                                    {idx + 1}వ వారం
                                  </div>
                                  <div className="text-[8px] text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                                    {p.weekHeader.match(/\(([^)]+)\)/)?.[1] || p.weekHeader.split(' ')[0]}
                                  </div>
                                  <div className="leading-tight mt-1 font-bold">
                                    {isPaid ? `₹${p.amount} ${p.isUPI ? '(UPI)' : ''}` : 'బాకీ ➔'}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}

                  {/* Remarks preview if present */}
                  {cust.remarks && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 truncate">
                      <strong className="text-slate-700 dark:text-slate-300">రిమార్క్స్:</strong> {cust.remarks}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 transition-colors">
                  {/* Photo & GPS indicator pills */}
                  <div className="flex items-center space-x-1.5">
                    {cust.gpsLocation && (
                      <a
                        href={
                          cust.gpsLocation.startsWith('http')
                            ? cust.gpsLocation
                            : `https://maps.google.com/?q=${encodeURIComponent(cust.gpsLocation)}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        title="Google Maps లో లొకేషన్ చూడండి"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                        <span className="hidden sm:inline">మ్యాప్</span>
                      </a>
                    )}

                    {cust.cardPhoto && (
                      <button
                        onClick={() =>
                          onViewPhoto(
                            cust.cardPhoto,
                            `కార్డ్ ఫోటో - ${cust.nameTe} (#${cust.sNo})`
                          )
                        }
                        className="p-1.5 bg-teal-100 dark:bg-teal-900/60 hover:bg-teal-200 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        title="కార్డ్ ఫోటో చూడండి"
                      >
                        <Camera className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                        <span className="hidden sm:inline">కార్డ్</span>
                      </button>
                    )}

                    {cust.housePhoto && (
                      <button
                        onClick={() =>
                          onViewPhoto(
                            cust.housePhoto,
                            `ఇంటి ఫోటో - ${cust.nameTe} (#${cust.sNo})`
                          )
                        }
                        className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        title="ఇంటి ఫోటో చూడండి"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span className="hidden sm:inline">ఇల్లు</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenEditCustomer(cust, sheetTitle)}
                      className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center space-x-1"
                      title="ఫోటో, GPS లేదా వివరాలు సవరించండి"
                    >
                      <Edit className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                      <span className="hidden sm:inline">సవరణ/GPS</span>
                    </button>
                  </div>

                  {/* Primary One-Tap Collection Button */}
                  {!cust.isStruckOut && (
                    <button
                      onClick={() => onOpenCollection(cust, sheetTitle)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center space-x-1"
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>{cust.isMonthly ? 'నెల వాయిదా నమోదు' : 'వసూలు నమోదు'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
