'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Banknote, Calendar, CheckCircle2, Sparkles } from 'lucide-react';
import { formatINR, parseNumber, isWeekApplicableForCustomer, getMonthlyDueSaturday, getMonthlyCustomerStatus } from '@/lib/utils';
import { getSchemeByFaceValue } from '@/lib/schemes';

export default function CollectionModal({
  isOpen,
  onClose,
  customer,
  weekColumns = [],
  sheetTitle,
  onSuccess,
}) {
  const [selectedWeekColIdx, setSelectedWeekColIdx] = useState(null);
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'UPI'
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer && weekColumns.length > 0) {
      // Find applicable weeks for this customer based on join date
      const applicableWeeks = weekColumns.filter((wk) => {
        const payment = customer.weeklyPayments?.find((p) => p.colIndex === wk.colIndex);
        return isWeekApplicableForCustomer(wk.header, customer.date, payment && payment.amount > 0);
      });

      // Default week: first unpaid applicable week, or the latest week column
      let defaultWeek = applicableWeeks.length > 0 ? applicableWeeks[0] : weekColumns[weekColumns.length - 1];
      for (const wk of applicableWeeks) {
        const payment = customer.weeklyPayments?.find((p) => p.colIndex === wk.colIndex);
        if (!payment || payment.amount === 0) {
          defaultWeek = wk;
          break;
        }
      }

      setSelectedWeekColIdx(defaultWeek.colIndex);

      // Default amount from loan scheme installment
      const scheme = getSchemeByFaceValue(customer.amount);
      const defaultInstallment = scheme?.installment || 500;
      setAmount(String(defaultInstallment));

      // Reset payment mode
      setPaymentMode('Cash');
      setError('');
    }
  }, [customer, weekColumns]);

  if (!isOpen || !customer) return null;

  const currentSelectedWeek = weekColumns.find(w => w.colIndex === selectedWeekColIdx);
  const existingPayment = customer.weeklyPayments?.find(p => p.colIndex === selectedWeekColIdx);

  const handleSave = async () => {
    if (selectedWeekColIdx === null) {
      setError('దయచేసి వాయిదా తేదీ/వారం ఎంచుకోండి (Please select a column)');
      return;
    }
    const numAmount = parseNumber(amount);
    if (numAmount <= 0) {
      setError('దయచేసి సరైన మొత్తం నమోదు చేయండి (Enter a valid amount)');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle,
          rowIndex: customer.rowIndex,
          colIndex: selectedWeekColIdx,
          amount: numAmount,
          paymentMode,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save collection');
      }

      onSuccess({
        rowIndex: customer.rowIndex,
        colIndex: selectedWeekColIdx,
        amount: numAmount,
        paymentMode,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 text-xs font-bold flex items-center justify-center">
                #{customer.sNo}
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {customer.isMonthly ? 'నెల వాయిదా నమోదు (Monthly Collection)' : 'వసూలు నమోదు (Record Collection)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {customer.nameTe} <span className="opacity-75">({customer.nameEn})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Customer Quick Stats Card */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 pb-1.5 border-b border-slate-200/60 dark:border-slate-700/60">
              <span>చేరిన తేదీ: <strong className="text-teal-700 dark:text-teal-300 font-bold">{customer.date}</strong></span>
              {customer.isMonthly ? (
                (() => {
                  const paidCount = customer.weeklyPayments?.filter((p) => p.amount > 0).length || 0;
                  const nextDue = getMonthlyDueSaturday(customer.date, paidCount + 1);
                  return (
                    <span className="text-purple-700 dark:text-purple-300 font-bold">
                      నెక్స్ట్ డ్యూ: {nextDue?.formatted} ({nextDue?.satOccurrence}వ శని)
                    </span>
                  );
                })()
              ) : (
                <span>25 వారాల స్కీమ్</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">మొత్తం స్కీమ్</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">{formatINR(customer.amount)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">వసూలైనది</span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{formatINR(customer.totalPaid)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">మిగిలిన బాకీ</span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{formatINR(customer.remainingDue)}</span>
              </div>
            </div>
          </div>

          {/* Select Week / Column */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {customer.isMonthly ? 'ఏ తేదీ/వారం కాలమ్‌లో నమోదు చేయాలి?' : 'వారం ఎంచుకోండి (Select Week Column):'}
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {weekColumns.map((wk) => {
                const isSelected = selectedWeekColIdx === wk.colIndex;
                const paidItem = customer.weeklyPayments?.find((p) => p.colIndex === wk.colIndex);
                const isPaid = paidItem && paidItem.amount > 0;
                const isApplicable = isWeekApplicableForCustomer(wk.header, customer.date, isPaid);

                return (
                  <button
                    key={wk.colIndex}
                    type="button"
                    onClick={() => {
                      setSelectedWeekColIdx(wk.colIndex);
                      if (paidItem && paidItem.amount > 0) {
                        setAmount(String(paidItem.amount));
                        setPaymentMode(paidItem.isUPI ? 'UPI' : 'Cash');
                      }
                    }}
                    className={`p-2 rounded-xl text-left text-xs transition-all relative border ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : isPaid
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                        : isApplicable
                        ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        : 'bg-slate-50/70 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 border-slate-200/60 dark:border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold truncate text-[11px]">{wk.header}</span>
                      {!isApplicable && !isPaid && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                          చేరకముందు
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'}`}>
                      {isPaid ? `₹${paidItem.amount} ${paidItem.isUPI ? '(UPI)' : ''}` : isApplicable ? 'చెల్లించలేదు (బాకీ)' : 'ఖాళీ'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Mode Toggle (Cash vs UPI) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              చెల్లింపు రకం (Payment Method):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('Cash')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                  paymentMode === 'Cash'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>నగదు (Cash)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('UPI')}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all ${
                  paymentMode === 'UPI'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>PhonePe / UPI</span>
              </button>
            </div>
          </div>

          {/* Amount Input & Fast Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              వసూలు మొత్తం (Installment Amount in ₹):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-lg text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[250, 500, 750, 1000, 1167, 2000].map((chipVal) => (
                <button
                  key={chipVal}
                  type="button"
                  onClick={() => setAmount(String(chipVal))}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform"
                >
                  ₹{chipVal}
                </button>
              ))}
              {customer.remainingDue > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(String(customer.remainingDue))}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800/60 active:scale-95 transition-transform"
                >
                  మిగిలిన మొత్తం (₹{customer.remainingDue})
                </button>
              )}
            </div>
          </div>

          {/* Existing payment alert */}
          {existingPayment && existingPayment.amount > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                ఈ కాలమ్‌లో ఇప్పటికే <span className="font-bold">₹{existingPayment.amount} {existingPayment.isUPI ? '(UPI)' : '(Cash)'}</span> నమోదు చేయబడింది. సేవ్ చేస్తే ఇది అప్డేట్ అవుతుంది.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            రద్దు (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <span>సేవ్ అవుతోంది...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>ఖాతాలో నమోదు (Save)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
