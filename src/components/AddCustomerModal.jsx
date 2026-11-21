'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, Sparkles } from 'lucide-react';
import { LOAN_SCHEMES, getSchemeByFaceValue } from '@/lib/schemes';
import { formatINR, getTodayDateStr } from '@/lib/utils';

export default function AddCustomerModal({
  isOpen,
  onClose,
  currentVillage,
  existingMaxSNo = 0,
  onSuccess,
}) {
  const [village, setVillage] = useState(currentVillage || 'ఎదుర్లంక (Edurlanka)');
  const [date, setDate] = useState(getTodayDateStr());
  const [sNo, setSNo] = useState(String(existingMaxSNo + 1));
  const [nameTe, setNameTe] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [selectedSchemeAmount, setSelectedSchemeAmount] = useState(12500);
  const [phone, setPhone] = useState('');
  const [colony, setColony] = useState('');
  const [paymentType, setPaymentType] = useState('వారం (Weekly)');
  const [suretySNo, setSuretySNo] = useState('');
  const [customRemarks, setCustomRemarks] = useState('');
  const [phoneReminder, setPhoneReminder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setVillage(currentVillage || 'ఎదుర్లంక (Edurlanka)');
      setDate(getTodayDateStr());
      setSNo(String(existingMaxSNo + 1));
      setNameTe('');
      setNameEn('');
      setSelectedSchemeAmount(12500);
      setPhone('');
      setColony('');
      setPaymentType('వారం (Weekly)');
      setSuretySNo('');
      setCustomRemarks('');
      setPhoneReminder(false);
      setError('');
    }
  }, [isOpen, currentVillage, existingMaxSNo]);

  if (!isOpen) return null;

  const currentScheme = getSchemeByFaceValue(selectedSchemeAmount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nameTe.trim() && !nameEn.trim()) {
      setError('దయచేసి ఆసామీ పేరు నమోదు చేయండి (Please enter customer name)');
      return;
    }

    // Assemble remarks: e.g. "ష్యూరిటీ: 20 (Surety: 20), ఫోన్ చేయాలి, ..."
    const remarksParts = [];
    if (suretySNo.trim()) {
      remarksParts.push(`ష్యూరిటీ: ${suretySNo.trim()} (Surety: ${suretySNo.trim()})`);
    }
    if (phoneReminder) {
      remarksParts.push('ఫోన్ చేయాలి');
    }
    if (customRemarks.trim()) {
      remarksParts.push(customRemarks.trim());
    }
    const finalRemarks = remarksParts.join(', ');

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle: village,
          customerData: {
            date,
            sNo,
            nameTe: nameTe.trim(),
            nameEn: nameEn.trim(),
            amount: selectedSchemeAmount,
            phone: phone.trim(),
            colony: colony.trim(),
            paymentType: paymentType.includes('నెల') ? 'నెల (Monthly)' : '',
            remarks: finalRemarks,
            gpsLocation: '',
            cardPhoto: '',
            housePhoto: '',
          },
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to add customer');
      }

      onSuccess({
        village,
        sNo,
        nameTe,
        nameEn,
        amount: selectedSchemeAmount,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-teal-800 text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-700/80 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">కొత్త ఖాతా చేర్చండి (Add New Customer)</h3>
              <p className="text-xs text-teal-200">గూగుల్ షీట్‌లో ఆటోమేటిక్‌గా రో యాడ్ అవుతుంది</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-teal-700/60 hover:bg-teal-700 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Village & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                గ్రామం (Village):
              </label>
              <select
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="ఎదుర్లంక (Edurlanka)">ఎదుర్లంక (Edurlanka)</option>
                <option value="కొత్తపల్లి (Kothapalli)">కొత్తపల్లి (Kothapalli)</option>
              </select>
            </div>
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
          </div>

          {/* S.No & Scheme */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                వ.సం. (S.No.):
              </label>
              <input
                type="text"
                value={sNo}
                onChange={(e) => setSNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                స్కీమ్ మొత్తం (Scheme Face Value):
              </label>
              <select
                value={selectedSchemeAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedSchemeAmount(val);
                  if (val === 14000) {
                    setPaymentType('నెల (Monthly)');
                  } else {
                    setPaymentType('వారం (Weekly)');
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-teal-800 dark:text-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800"
              >
                {LOAN_SCHEMES.map((scheme) => (
                  <option key={scheme.faceValue} value={scheme.faceValue}>
                    {scheme.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheme Live Preview Banner */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                చేతికి ఇచ్చేది: <strong className="text-emerald-800 dark:text-emerald-300">{formatINR(currentScheme.disbursed)}</strong>
              </span>
            </div>
            <div>
              వాయిదా: <strong className="text-emerald-800 dark:text-emerald-300">{formatINR(currentScheme.installment)}</strong> / {currentScheme.type === 'monthly' ? 'నెల' : 'వారం'}
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ఆసామీ పేరు (Telugu Name): *
              </label>
              <input
                type="text"
                value={nameTe}
                onChange={(e) => setNameTe(e.target.value)}
                placeholder="ఉదా: కురుపూడి నాగమణి"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                English Transliteration:
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Kurupudi Nagamani"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Phone & Colony */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ఫోన్ నంబర్ (10-Digit Mobile):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                కాలనీ (Colony):
              </label>
              <div className="flex space-x-1.5">
                <input
                  type="text"
                  value={colony}
                  onChange={(e) => setColony(e.target.value)}
                  placeholder="జగన్ / MD / ఇతరులు"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setColony('జగన్')}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  జగన్
                </button>
                <button
                  type="button"
                  onClick={() => setColony('MD')}
                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  MD
                </button>
              </div>
            </div>
          </div>

          {/* Payment Type & Surety */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                పేమెంట్ విధానం (Payment Type):
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="వారం (Weekly)">వారం (25 Weeks Scheme)</option>
                <option value="నెల (Monthly)">నెల (Monthly Scheme)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ష్యూరిటీ వ.సం. (Surety S.No.):
              </label>
              <input
                type="text"
                value={suretySNo}
                onChange={(e) => setSuretySNo(e.target.value)}
                placeholder="ఉదా: 17 లేదా 24"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Remarks & Phone Reminder Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                ఇతర వివరాలు / రిమార్క్స్ (Remarks):
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={phoneReminder}
                  onChange={(e) => setPhoneReminder(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                />
                <span>🔔 ఫోన్ చేయాలి (Reminder)</span>
              </label>
            </div>
            <input
              type="text"
              value={customRemarks}
              onChange={(e) => setCustomRemarks(e.target.value)}
              placeholder="ఉదా: హోటల్, కిరాణా షాప్, తాజా ఖాతా మొదలైనవి"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              రద్దు (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-700/20 active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>చేర్చుతోంది...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>ఖాతా నమోదు (Create Customer)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
