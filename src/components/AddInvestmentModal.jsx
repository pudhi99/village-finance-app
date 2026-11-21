'use client';

import React, { useState } from 'react';
import { X, TrendingUp, Check } from 'lucide-react';
import { getTodayDateStr } from '@/lib/utils';

export default function AddInvestmentModal({ isOpen, onClose, onSuccess }) {
  const [date, setDate] = useState(getTodayDateStr());
  const [partnerName, setPartnerName] = useState('సత్తిబాబు (Sattibabu)');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('దయచేసి సరైన పెట్టుబడి మొత్తం నమోదు చేయండి.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          partnerName,
          amount: num,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add investment');
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
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-800 text-white">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-base">కొత్త పెట్టుబడి (Add Capital)</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-700/60 hover:bg-teal-700 text-white flex items-center justify-center transition-colors"
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
              భాగస్వామి పేరు (Partner Name):
            </label>
            <select
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-teal-900 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800"
            >
              <option value="సత్తిబాబు (Sattibabu)">సత్తిబాబు (Sattibabu)</option>
              <option value="పృధ్వి (Prudhvi)">పృధ్వి (Prudhvi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              పెట్టుబడి మొత్తం (Investment Amount in ₹):
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50000"
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
                  <span>నమోదు చేయండి (Save)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
