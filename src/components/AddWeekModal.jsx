'use client';

import React, { useState } from 'react';
import { X, CalendarPlus, Check } from 'lucide-react';

export default function AddWeekModal({
  isOpen,
  onClose,
  sheetTitle,
  currentWeekCount = 6,
  onSuccess,
}) {
  const nextWeekNum = currentWeekCount + 1;
  const [weekNumber, setWeekNumber] = useState(String(nextWeekNum));

  // Compute next Saturday or format today
  const defaultDateStr = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const [dateStr, setDateStr] = useState(defaultDateStr());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const generatedHeader = `${weekNumber} (${dateStr})`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!weekNumber.trim() || !dateStr.trim()) {
      setError('దయచేసి వారం సంఖ్య మరియు తేదీ నమోదు చేయండి.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle,
          weekLabel: generatedHeader,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add week column');
      }

      onSuccess(generatedHeader);
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
            <CalendarPlus className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-base">కొత్త వారం కాలమ్ (Add Week)</h3>
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
              వారం సంఖ్య (Week Number):
            </label>
            <input
              type="text"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              placeholder="7"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              వారం తేదీ (Saturday Date - DD/MM/YY):
            </label>
            <input
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              placeholder="21/11/26"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Preview */}
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 rounded-xl text-xs text-teal-900 dark:text-teal-200">
            హెడర్ ప్రివ్యూ: <strong className="font-mono text-teal-800 dark:text-teal-300 font-bold">{generatedHeader}</strong>
            <p className="text-[11px] text-teal-700 dark:text-teal-400 mt-1">
              గూగుల్ షీట్‌లో రిమార్క్స్ కాలమ్ ముందు ఈ కొత్త వారం యాడ్ అవుతుంది.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
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
                <span>యాడ్ చేస్తోంది...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>వారం చేర్చండి (Add)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
