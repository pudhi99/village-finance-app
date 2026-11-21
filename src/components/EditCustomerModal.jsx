'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, Camera, Image as ImageIcon, ExternalLink, Check, Loader2, AlertCircle } from 'lucide-react';

export default function EditCustomerModal({
  isOpen,
  onClose,
  customer,
  sheetTitle,
  onSuccess,
}) {
  const [phone, setPhone] = useState('');
  const [colony, setColony] = useState('');
  const [paymentType, setPaymentType] = useState('');
  const [remarks, setRemarks] = useState('');
  const [gpsLocation, setGpsLocation] = useState('');
  const [cardPhoto, setCardPhoto] = useState('');
  const [housePhoto, setHousePhoto] = useState('');

  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [isUploadingCard, setIsUploadingCard] = useState(false);
  const [isUploadingHouse, setIsUploadingHouse] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    if (customer) {
      setPhone(customer.phone || '');
      setColony(customer.colony || '');
      setPaymentType(customer.paymentType || '');
      setRemarks(customer.remarks || '');
      setGpsLocation(customer.gpsLocation || '');
      setCardPhoto(customer.cardPhoto || '');
      setHousePhoto(customer.housePhoto || '');
      setError('');
      setInfoMsg('');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  // Live GPS capture via browser navigator.geolocation
  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setError('మీ బ్రౌజర్‌లో GPS సౌకర్యం లేదు (Geolocation is not supported by your browser)');
      return;
    }

    setIsCapturingGPS(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const gmapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        setGpsLocation(gmapsUrl);
        setIsCapturingGPS(false);
        setInfoMsg(`GPS విజయవంతంగా లభించింది: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      (err) => {
        setIsCapturingGPS(false);
        setError(`GPS లొకేషన్ పొందడం విఫలమైంది: ${err.message}. దయచేసి మొబైల్ లొకేషన్ పర్మిషన్ ఆన్ చేయండి.`);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  // Upload image handler
  const handleUploadPhoto = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'card') setIsUploadingCard(true);
    else setIsUploadingHouse(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `${customer.sNo}_${type}`);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Upload failed');
      }

      const fileUrl = json.webViewLink || json.directLink;
      if (type === 'card') {
        setCardPhoto(fileUrl);
      } else {
        setHousePhoto(fileUrl);
      }

      if (json.url) {
        setInfoMsg('ఫోటో Cloudinary కు విజయవంతంగా అప్‌లోడ్ అయ్యింది! (Uploaded to Cloudinary)');
      } else {
        setInfoMsg('ఫోటో విజయవంతంగా సేవ్ అయ్యింది! (Photo saved successfully)');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (type === 'card') setIsUploadingCard(false);
      else setIsUploadingHouse(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle,
          rowIndex: customer.rowIndex,
          updates: {
            phone,
            colony,
            paymentType,
            remarks,
            gpsLocation,
            cardPhoto,
            housePhoto,
          },
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to update customer');
      }

      onSuccess({
        rowIndex: customer.rowIndex,
        updates: { phone, colony, paymentType, remarks, gpsLocation, cardPhoto, housePhoto },
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-800 text-white">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-slate-700 text-teal-400 text-xs font-bold flex items-center justify-center">
                #{customer.sNo}
              </span>
              <h3 className="font-bold text-base">ఖాతా సవరణ (Edit Customer & Photos)</h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {customer.nameTe} <span className="opacity-75">({customer.nameEn})</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Phone & Colony */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ఫోన్ నంబర్ (Phone):
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                కాలనీ (Colony):
              </label>
              <input
                type="text"
                value={colony}
                onChange={(e) => setColony(e.target.value)}
                placeholder="జగన్ / MD / ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ఇతర వివరాలు / రిమార్క్స్ (Remarks):
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ష్యూరిటీ, ఫోన్ చేయాలి, Struck out, మొదలైనవి"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* GPS Location Section */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900 dark:text-blue-300">
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>GPS లొకేషన్ (Google Maps Location)</span>
              </div>
              <button
                type="button"
                onClick={handleCaptureGPS}
                disabled={isCapturingGPS}
                className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg active:scale-95 transition-transform flex items-center space-x-1 disabled:opacity-50"
              >
                {isCapturingGPS ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>GPS వెతుకుతోంది...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>లైవ్ GPS తీసుకోండి</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={gpsLocation}
                onChange={(e) => setGpsLocation(e.target.value)}
                placeholder="https://maps.google.com/?q=lat,lng"
                className="flex-1 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800/60 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              {gpsLocation && (
                <a
                  href={gpsLocation.startsWith('http') ? gpsLocation : `https://maps.google.com/?q=${encodeURIComponent(gpsLocation)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-blue-100 dark:bg-blue-900/60 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-lg font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>ఓపెన్</span>
                </a>
              )}
            </div>
          </div>

          {/* Card Photo Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <ImageIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>కార్డ్ ఫోటో (Card Photo)</span>
              </div>
              <label className="cursor-pointer px-2.5 py-1 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg active:scale-95 transition-transform flex items-center space-x-1">
                {isUploadingCard ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingCard ? 'అప్‌లోడ్...' : 'ఫోటో తీయండి / ఎంచుకోండి'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadPhoto(e, 'card')}
                  disabled={isUploadingCard}
                />
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={cardPhoto}
                onChange={(e) => setCardPhoto(e.target.value)}
                placeholder="Cloudinary లేదా ఇమేజ్ లింక్"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              {cardPhoto && (
                <a
                  href={cardPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs rounded-lg font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>చూడండి</span>
                </a>
              )}
            </div>
          </div>

          {/* House Photo Section */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 dark:text-white">
                <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>ఇంటి ఫోటో (House Photo)</span>
              </div>
              <label className="cursor-pointer px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg active:scale-95 transition-transform flex items-center space-x-1">
                {isUploadingHouse ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <span>{isUploadingHouse ? 'అప్‌లోడ్...' : 'ఫోటో తీయండి / ఎంచుకోండి'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadPhoto(e, 'house')}
                  disabled={isUploadingHouse}
                />
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={housePhoto}
                onChange={(e) => setHousePhoto(e.target.value)}
                placeholder="Cloudinary లేదా ఇమేజ్ లింక్"
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
              {housePhoto && (
                <a
                  href={housePhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs rounded-lg font-bold flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>చూడండి</span>
                </a>
              )}
            </div>
          </div>

          {infoMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              {infoMsg}
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              రద్దు (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {isSaving ? (
                <span>సేవ్ అవుతోంది...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>వివరాలు సేవ్ చేయండి (Save)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
