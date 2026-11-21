'use client';

import React, { useState } from 'react';
import { X, BookPlus, Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { getTodayDateStr } from '@/lib/utils';

export default function AddLedgerModal({ isOpen, onClose, onSuccess }) {
  const [date, setDate] = useState(getTodayDateStr());
  const [particulars, setParticulars] = useState('');
  const [type, setType] = useState('credit'); // 'credit' (Inflow) | 'debit' (Outflow)
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!particulars.trim()) {
      setError('దయచేసి వివరాలు నమోదు చేయండి (Enter particulars)');
      return;
    }
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('దయచేసి సరైన మొత్తం నమోదు చేయండి (Enter valid amount)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          particulars: particulars.trim(),
          credit: type === 'credit' ? num : 0,
          debit: type === 'debit' ? num : 0,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add ledger entry');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-800 text-white">
          <div className="flex items-center space-x-2">
            <BookPlus className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-base">కొత్త ఖర్చు/ఇన్ఫ్లో (New Entry)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              తేదీ (Date):
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="DD-MM-YY"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ట్రాన్సాక్షన్ రకం (Entry Type):
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('credit')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'credit'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>ఇన్ / క్రెడిట్ (In)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('debit')}
                className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                  type === 'debit'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>అవుట్ / ఖర్చు (Out)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              వివరాలు (Particulars):
            </label>
            <input
              type="text"
              value={particulars}
              onChange={(e) => setParticulars(e.target.value)}
              placeholder="ఉదా: ఖర్చు (Expense), వసూలు, లేదా వివరణ"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {['ఖర్చు (Expense)', 'వసూలు (Collection)', 'పెట్టుబడి (Capital)', 'తాత్కాలిక సేఫ్టీ డిపాజిట్'].map(
                (quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setParticulars(quick)}
                    className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    {quick}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              మొత్తం (Amount in ₹):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              రద్దు (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>నమోదు చేస్తోంది...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ఖాతాలో నమోదు (Save)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
