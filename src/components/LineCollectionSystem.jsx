'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Navigation,
  MapPin,
  Compass,
  Play,
  Square,
  Phone,
  Banknote,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Sparkles,
  RefreshCw,
  LocateFixed,
  Map as MapIcon,
  List,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Zap
} from 'lucide-react';
import {
  formatINR,
  extractCoordinates,
  calculateDistanceMeters,
  formatDistance,
  getMonthlyCustomerStatus,
  isWeekApplicableForCustomer,
  getSaturdayDateInfo,
  resolveSaturdayWeekHeader
} from '@/lib/utils';
import { getSchemeByFaceValue } from '@/lib/schemes';

export default function LineCollectionSystem({
  edurlankaData,
  kothapalliData,
  onOpenCollection,
  onRefresh,
  onViewPhoto,
}) {
  // Line Active Session State (Saturday Live Line)
  const [isLineActive, setIsLineActive] = useState(false);
  const [activeLineWeek, setActiveLineWeek] = useState(null); // e.g. "7 (21/11/26)" or "8 (28/11/26)"
  const [lineStartedAt, setLineStartedAt] = useState(null);
  const [showSaturdayConfirmModal, setShowSaturdayConfirmModal] = useState(false);
  const [isCreatingWeekCol, setIsCreatingWeekCol] = useState(false);

  // Line Tracking & GPS State
  const [isTracking, setIsTracking] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const watchIdRef = useRef(null);

  // Filters & View Mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [villageFilter, setVillageFilter] = useState('all'); // 'all' | 'edurlanka' | 'kothapalli'
  const [radiusFilter, setRadiusFilter] = useState('all'); // 'all' | 50 | 100 | 250 | 500
  const [typeFilter, setTypeFilter] = useState('due_only'); // 'due_only' | 'all' | 'all_gps' | 'weekly' | 'monthly_due' | 'promised' | 'collected' | 'no_gps'
  const [searchQuery, setSearchQuery] = useState('');
  const [mapFilterMode, setMapFilterMode] = useState('all_pinned'); // 'all_pinned' | 'due_only'

  // Follow-up notes & local state (Promised to pay in 2-4 hrs)
  const [followUps, setFollowUps] = useState({});
  const [quickActionLoading, setQuickActionLoading] = useState({});
  const [pinningLoading, setPinningLoading] = useState({});
  const [toast, setToast] = useState('');

  // Load saved follow-ups and line session from localStorage
  useEffect(() => {
    try {
      const savedFollowUps = localStorage.getItem('village_line_followups');
      if (savedFollowUps) setFollowUps(JSON.parse(savedFollowUps));

      const savedTracking = localStorage.getItem('village_line_is_tracking');
      if (savedTracking === 'true') {
        startTracking();
      }

      const savedActive = localStorage.getItem('village_line_is_active');
      const savedWeek = localStorage.getItem('village_line_active_week');
      const savedStartedAt = localStorage.getItem('village_line_started_at');
      if (savedActive === 'true' && savedWeek) {
        setIsLineActive(true);
        setActiveLineWeek(savedWeek);
        setLineStartedAt(savedStartedAt);
      }
    } catch (e) {
      console.error('Error loading saved line state:', e);
    }
  }, []);

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Start Saturday Line Button Click (Checks if today is Saturday)
  const handleStartLineClick = () => {
    const { isSaturday } = getSaturdayDateInfo();
    if (!isSaturday) {
      // Not Saturday. Show confirmation modal so user can test if desired.
      setShowSaturdayConfirmModal(true);
      return;
    }
    executeStartLineSession();
  };

  // Execute Line Session Start (creates column if needed, activates session)
  const executeStartLineSession = async () => {
    setShowSaturdayConfirmModal(false);
    setIsCreatingWeekCol(true);

    try {
      // 1. Inspect existing week columns from both villages
      const allWeekCols = [
        ...(edurlankaData?.weekColumns || []),
        ...(kothapalliData?.weekColumns || []),
      ];

      // 2. Resolve Saturday date and week header
      const resolved = resolveSaturdayWeekHeader(allWeekCols);

      // 3. If column for this Saturday does not exist yet, create it in both village sheets!
      if (resolved.isNew) {
        const res = await fetch('/api/week', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sheetTitle: 'all',
            weekLabel: resolved.header,
          }),
        });
        const resData = await res.json();
        if (!resData.success) {
          throw new Error(resData.error || 'Failed to create new Saturday week column');
        }
        if (onRefresh) await onRefresh();
      }

      // 4. Activate Line Session
      setIsLineActive(true);
      setActiveLineWeek(resolved.header);
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setLineStartedAt(timeStr);

      localStorage.setItem('village_line_is_active', 'true');
      localStorage.setItem('village_line_active_week', resolved.header);
      localStorage.setItem('village_line_started_at', timeStr);

      // Start GPS
      startTracking();
      showToastMsg(`శనివారం కలెక్షన్ లైన్ ప్రారంభమైంది (${resolved.header})! 🚀`);
    } catch (err) {
      console.error('Error starting line session:', err);
      alert('లైన్ ప్రారంభించడంలో లోపం: ' + err.message);
    } finally {
      setIsCreatingWeekCol(false);
    }
  };

  // Conclude Saturday Line Session
  const handleEndLineSession = () => {
    if (!confirm('ఈ రోజు శనివారం కలెక్షన్ లైన్ ముగించాలనుకుంటున్నారా?')) return;
    setIsLineActive(false);
    setActiveLineWeek(null);
    setLineStartedAt(null);
    localStorage.removeItem('village_line_is_active');
    localStorage.removeItem('village_line_active_week');
    localStorage.removeItem('village_line_started_at');
    showToastMsg('శనివారం లైన్ విజయవంతంగా ముగిసింది! ✅');
  };

  // Start live GPS tracking (HTML5 Geolocation watchPosition - 100% Free)
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError('మీ బ్రౌజర్‌లో GPS సపోర్ట్ లేదు (Geolocation not supported).');
      return;
    }

    setGpsError('');
    setIsTracking(true);
    localStorage.setItem('village_line_is_tracking', 'true');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setGpsAccuracy(Math.round(accuracy));
        setGpsError('');
      },
      (err) => {
        console.warn('GPS Watch error:', err);
        setGpsError('లొకేషన్ అనుమతి (GPS Permission) ఇవ్వండి లేదా GPS ఆన్ చేయండి.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      }
    );
  }, []);

  // Stop live GPS tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    localStorage.removeItem('village_line_is_tracking');
  }, []);

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Save follow-up promise (e.g. "2-3 గంటల్లో ఇస్తా")
  const handleMarkFollowUp = (customerKey, note = '2-3 గంటల్లో వేస్తా') => {
    const updated = {
      ...followUps,
      [customerKey]: {
        note,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'promised',
      },
    };
    setFollowUps(updated);
    try {
      localStorage.setItem('village_line_followups', JSON.stringify(updated));
    } catch (e) {}
    showToastMsg('తర్వాత కాల్ చేయాల్సిన లిస్ట్‌లో చేర్చబడింది ⏳');
  };

  // Remove follow-up
  const handleRemoveFollowUp = (customerKey) => {
    const updated = { ...followUps };
    delete updated[customerKey];
    setFollowUps(updated);
    try {
      localStorage.setItem('village_line_followups', JSON.stringify(updated));
    } catch (e) {}
  };

  // Pin Current GPS Location for customer lacking coordinates (1-click field GPS update)
  const handlePinCurrentLocation = async (customer, sheetTitle) => {
    if (!userCoords) {
      alert('దయచేసి ముందుగా GPS ప్రారంభించండి (Please enable GPS first).');
      return;
    }

    const key = `${sheetTitle}_${customer.rowIndex}`;
    setPinningLoading((prev) => ({ ...prev, [key]: true }));

    const formattedCoord = `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}`;

    try {
      const res = await fetch('/api/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle,
          rowIndex: customer.rowIndex,
          updates: {
            gpsLocation: formattedCoord,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToastMsg(`లొకేషన్ విజయవంతంగా పిన్ చేయబడింది: #${customer.sNo} ${customer.nameTe}`);
        if (onRefresh) onRefresh();
      } else {
        alert('లొకేషన్ సేవ్ చేయడంలో లోపం: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error saving GPS: ' + err.message);
    } finally {
      setPinningLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // One-Tap Fast Collection (Record ₹500 or standard monthly installment in 1-click)
  const handleOneTapCollection = async (customer, sheetTitle, weekColumns, paymentMode = 'Cash') => {
    const key = `${sheetTitle}_${customer.rowIndex}`;

    // Calculate installment amount
    const scheme = getSchemeByFaceValue(customer.amount);
    let installmentAmt = scheme?.installment || 500;
    if (customer.isMonthly) {
      installmentAmt = customer.amount === 14000 ? 1400 : 2100;
    }

    // Determine target week column index:
    // If Saturday Line is active, target the active Saturday column!
    let targetColIndex = null;
    if (isLineActive && activeLineWeek) {
      const activeCol = (weekColumns || []).find((wk) => wk.header === activeLineWeek);
      if (activeCol) {
        targetColIndex = activeCol.colIndex;
      }
    }

    if (targetColIndex === null) {
      const applicableWeeks = (weekColumns || []).filter((wk) => {
        const p = customer.weeklyPayments?.find((pay) => pay.colIndex === wk.colIndex);
        return isWeekApplicableForCustomer(wk.header, customer.date, p && p.amount > 0);
      });

      for (const wk of applicableWeeks) {
        const p = customer.weeklyPayments?.find((pay) => pay.colIndex === wk.colIndex);
        if (!p || p.amount === 0) {
          targetColIndex = wk.colIndex;
          break;
        }
      }

      if (targetColIndex === null) {
        targetColIndex = weekColumns?.[weekColumns.length - 1]?.colIndex;
      }
    }

    if (targetColIndex === null || targetColIndex === undefined) {
      onOpenCollection(customer, sheetTitle);
      return;
    }

    setQuickActionLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const res = await fetch('/api/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetTitle,
          rowIndex: customer.rowIndex,
          colIndex: targetColIndex,
          amount: installmentAmt,
          paymentMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToastMsg(`₹${installmentAmt} వసూలు విజయవంతంగా నమోదైంది (${paymentMode})! ✅`);
        handleRemoveFollowUp(key);
        if (onRefresh) onRefresh();
      } else {
        alert('వసూలు నమోదులో లోపం: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error recording collection: ' + err.message);
    } finally {
      setQuickActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Open custom collection modal targeting active Saturday column if line is active
  const handleOpenCustomCollection = (customer, sheetTitle, weekColumns) => {
    let targetColIndex = null;
    if (isLineActive && activeLineWeek) {
      const activeCol = (weekColumns || []).find((wk) => wk.header === activeLineWeek);
      if (activeCol) {
        targetColIndex = activeCol.colIndex;
      }
    }
    onOpenCollection(customer, sheetTitle, targetColIndex);
  };

  // Compile unified list of customers across villages with GPS distance
  const processedCustomers = useMemo(() => {
    const list = [];

    const processVillage = (vData, sheetName, vLabel) => {
      if (!vData || !vData.customers) return;
      const weekCols = vData.weekColumns || [];

      vData.customers.forEach((cust) => {
        if (cust.isStruckOut) return; // skip completed

        const customerKey = `${sheetName}_${cust.rowIndex}`;
        const coords = extractCoordinates(cust.gpsLocation);
        let distanceMeters = null;

        if (userCoords && coords) {
          distanceMeters = calculateDistanceMeters(
            userCoords.lat,
            userCoords.lng,
            coords.lat,
            coords.lng
          );
        }

        // Scheme & Due calculation
        const scheme = getSchemeByFaceValue(cust.amount);
        let dueAmount = scheme?.installment || 500;
        if (cust.isMonthly) {
          dueAmount = cust.amount === 14000 ? 1400 : 2100;
        }

        const followUp = followUps[customerKey];
        const isPromised = !!followUp;

        // Check if customer paid in the active Saturday column
        let todayPayment = null;
        let todayPaidAmount = 0;
        let todayPaymentMode = 'Cash';
        let isCollectedToday = false;

        if (isLineActive && activeLineWeek) {
          todayPayment = (cust.weeklyPayments || []).find((p) => p.weekHeader === activeLineWeek);
          if (todayPayment && todayPayment.amount > 0) {
            todayPaidAmount = todayPayment.amount;
            todayPaymentMode = todayPayment.isUPI ? 'UPI' : 'నగదు';
            isCollectedToday = true;
          }
        }

        let isDueToday = false;
        let dueBadgeText = '';

        if (isLineActive) {
          // DURING ACTIVE SATURDAY LINE:
          // Status is based on TODAY'S collection progress!
          if (cust.remainingDue <= 0 && !isCollectedToday) {
            isDueToday = false;
            dueBadgeText = 'మొత్తం పూర్తయింది';
          } else if (isCollectedToday) {
            isDueToday = false;
            dueBadgeText = `✅ ఈ రోజు వసూలైంది (₹${todayPaidAmount})`;
          } else if (isPromised) {
            isDueToday = true;
            dueBadgeText = `⏱ తర్వాత ఇస్తామన్నారు (${followUp.note})`;
          } else {
            isDueToday = cust.remainingDue > 0;
            if (cust.isMonthly) {
              const st = getMonthlyCustomerStatus(cust, 20261121);
              dueBadgeText = st?.badgeTe || 'నెల శనివారం బాకీ';
            } else {
              dueBadgeText = 'ఈ వారం వసూలు చేయాలి';
            }
          }
        } else {
          // BEFORE LINE IS STARTED (Normal overview mode):
          if (cust.isMonthly) {
            const st = getMonthlyCustomerStatus(cust, 20261121);
            isDueToday = cust.remainingDue > 0 && (st?.isDueThisSaturday || false);
            dueBadgeText = cust.remainingDue <= 0 ? 'మొత్తం పూర్తయింది' : (st?.badgeTe || 'నెల స్కీమ్');
          } else {
            const applicable = (cust.weeklyPayments || []).filter((p) =>
              isWeekApplicableForCustomer(p.weekHeader, cust.date, p.amount > 0)
            );
            const hasUnpaid = applicable.some((p) => p.amount === 0) || applicable.length === 0;
            isDueToday = cust.remainingDue > 0 && hasUnpaid;
            const paidWeeks = applicable.filter((p) => p.amount > 0).length;
            if (cust.remainingDue <= 0) {
              dueBadgeText = 'మొత్తం పూర్తయింది';
            } else if (!isDueToday) {
              dueBadgeText = `${paidWeeks}వ వారం వరకు చెల్లించారు`;
            } else {
              dueBadgeText = `${paidWeeks + 1}వ వారం బాకీ`;
            }
          }
        }

        const isCollected = isLineActive ? isCollectedToday : (cust.remainingDue <= 0 || !isDueToday);

        list.push({
          ...cust,
          customerKey,
          sheetTitle: sheetName,
          villageLabel: vLabel,
          weekColumns: weekCols,
          coords,
          hasGPS: !!coords,
          distanceMeters,
          isDueToday,
          dueBadgeText,
          dueAmount,
          followUp,
          isPromised,
          isCollected,
          isCollectedToday,
          todayPaidAmount,
          todayPaymentMode,
        });
      });
    };

    if (villageFilter === 'all' || villageFilter === 'edurlanka') {
      processVillage(edurlankaData, 'ఎదుర్లంక (Edurlanka)', 'ఎదుర్లంక');
    }
    if (villageFilter === 'all' || villageFilter === 'kothapalli') {
      processVillage(kothapalliData, 'కొత్తపల్లి (Kothapalli)', 'కొత్తపల్లి');
    }

    // Sort by distance if userCoords available
    list.sort((a, b) => {
      if (a.distanceMeters !== null && b.distanceMeters !== null) {
        return a.distanceMeters - b.distanceMeters;
      }
      if (a.distanceMeters !== null) return -1;
      if (b.distanceMeters !== null) return 1;
      return a.sNo - b.sNo;
    });

    return list;
  }, [edurlankaData, kothapalliData, villageFilter, userCoords, followUps, isLineActive, activeLineWeek]);

  // Filter processed customers
  const filteredCustomers = useMemo(() => {
    return processedCustomers.filter((c) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.nameTe?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q);
        const matchSNo = String(c.sNo) === q;
        const matchPhone = c.phone?.includes(q);
        const matchColony = c.colony?.toLowerCase().includes(q);
        if (!matchName && !matchSNo && !matchPhone && !matchColony) return false;
      }

      // 2. Radius Filter (when GPS active and distance available)
      if (radiusFilter !== 'all') {
        const maxDist = Number(radiusFilter);
        if (c.distanceMeters === null || c.distanceMeters > maxDist) return false;
      }

      // 3. Type Filter
      if (isLineActive) {
        if (typeFilter === 'due_only') {
          return c.isDueToday && !c.isCollectedToday && !c.isPromised;
        }
        if (typeFilter === 'collected') {
          return c.isCollectedToday;
        }
        if (typeFilter === 'promised') {
          return c.isPromised && !c.isCollectedToday;
        }
        if (typeFilter === 'all_gps') {
          return c.hasGPS;
        }
        if (typeFilter === 'no_gps') {
          return !c.hasGPS;
        }
        return true;
      }

      // Normal mode (before line starts):
      if (typeFilter === 'due_only') {
        return c.isDueToday && !c.isPromised;
      }
      if (typeFilter === 'all_gps') {
        return c.hasGPS;
      }
      if (typeFilter === 'weekly') {
        return !c.isMonthly && c.isDueToday;
      }
      if (typeFilter === 'monthly_due') {
        return c.isMonthly && c.isDueToday;
      }
      if (typeFilter === 'promised') {
        return c.isPromised;
      }
      if (typeFilter === 'collected') {
        return c.isCollected;
      }
      if (typeFilter === 'no_gps') {
        return !c.hasGPS;
      }

      return true;
    });
  }, [processedCustomers, searchQuery, radiusFilter, typeFilter, isLineActive]);

  // Dedicated Map customer list (shows all customers who have GPS, with optional due-only filter)
  const mapCustomers = useMemo(() => {
    return processedCustomers.filter((c) => {
      if (!c.hasGPS) return false;

      // search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.nameTe?.toLowerCase().includes(q) || c.nameEn?.toLowerCase().includes(q);
        const matchSNo = String(c.sNo) === q;
        const matchPhone = c.phone?.includes(q);
        const matchColony = c.colony?.toLowerCase().includes(q);
        if (!matchName && !matchSNo && !matchPhone && !matchColony) return false;
      }

      // radius filter
      if (radiusFilter !== 'all') {
        const maxDist = Number(radiusFilter);
        if (c.distanceMeters === null || c.distanceMeters > maxDist) return false;
      }

      // map filter toggle
      if (mapFilterMode === 'due_only') {
        if (isLineActive) {
          return c.isDueToday && !c.isCollectedToday;
        }
        return c.isDueToday;
      }

      return true;
    });
  }, [processedCustomers, searchQuery, radiusFilter, mapFilterMode, isLineActive]);

  // Counts for top chips
  const counts = useMemo(() => {
    if (isLineActive) {
      const todayCollected = processedCustomers.filter((c) => c.isCollectedToday);
      const todayCollectedCount = todayCollected.length;
      const todayCollectedTotal = todayCollected.reduce((sum, c) => sum + (c.todayPaidAmount || 0), 0);
      const todayPromisedCount = processedCustomers.filter((c) => c.isPromised && !c.isCollectedToday).length;
      const todayPendingCount = processedCustomers.filter((c) => c.isDueToday && !c.isCollectedToday && !c.isPromised).length;
      const withGpsCount = processedCustomers.filter((c) => c.hasGPS).length;
      const noGpsCount = processedCustomers.filter((c) => !c.hasGPS).length;
      const within100m = processedCustomers.filter((c) => c.distanceMeters !== null && c.distanceMeters <= 100).length;

      return {
        totalDue: todayPendingCount,
        weeklyDue: processedCustomers.filter((c) => !c.isMonthly && c.isDueToday && !c.isCollectedToday).length,
        monthlyDue: processedCustomers.filter((c) => c.isMonthly && c.isDueToday && !c.isCollectedToday).length,
        promisedCount: todayPromisedCount,
        todayCollectedCount,
        todayCollectedTotal,
        todayPendingCount,
        withGpsCount,
        noGpsCount,
        within100m,
      };
    }

    const totalDue = processedCustomers.filter((c) => c.isDueToday).length;
    const weeklyDue = processedCustomers.filter((c) => !c.isMonthly && c.isDueToday).length;
    const monthlyDue = processedCustomers.filter((c) => c.isMonthly && c.isDueToday).length;
    const promisedCount = Object.keys(followUps).length;
    const withGpsCount = processedCustomers.filter((c) => c.hasGPS).length;
    const noGpsCount = processedCustomers.filter((c) => !c.hasGPS).length;
    const within100m = processedCustomers.filter((c) => c.distanceMeters !== null && c.distanceMeters <= 100).length;

    return {
      totalDue,
      weeklyDue,
      monthlyDue,
      promisedCount,
      todayCollectedCount: 0,
      todayCollectedTotal: 0,
      todayPendingCount: totalDue,
      withGpsCount,
      noGpsCount,
      within100m,
    };
  }, [processedCustomers, followUps, isLineActive]);

  return (
    <div className="space-y-4 pb-24 pt-1 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-bold border border-emerald-600 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Saturday Confirmation Modal for Non-Saturday testing */}
      {showSaturdayConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0D1527] border border-amber-300 dark:border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  శనివారం కలెక్షన్ లైన్ (Saturday Line)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                  ఈ లైన్ శనివారం కలెక్షన్ల కోసం రూపొందించబడింది. ఈ రోజు శనివారం కాదు.
                  <br />
                  మీరు టెస్టింగ్ కోసం ఈ రోజు శనివారంగా భావించి లైన్ ప్రారంభించాలనుకుంటున్నారా?
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold mt-2 bg-amber-50 dark:bg-amber-500/15 p-2 rounded-lg border border-amber-200 dark:border-amber-500/30">
                  ⚡ ప్రారంభించగానే ఈ శనివారం డేట్‌తో షీట్‌లో కాలమ్ సిద్ధమవుతుంది, వసూళ్లన్నీ ఆ కాలంలో నమోదవుతాయి.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowSaturdayConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                రద్దు చేయి (Cancel)
              </button>
              <button
                type="button"
                onClick={executeStartLineSession}
                disabled={isCreatingWeekCol}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/20 active:scale-95 transition-all flex items-center space-x-1.5"
              >
                {isCreatingWeekCol ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>కాలమ్ తయారవుతోంది...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>టెస్టింగ్ లైన్ ప్రారంభించు ➔</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Line Control Bar */}
      {isLineActive ? (
        /* ACTIVE SATURDAY LINE SESSION BANNER */
        <div className="bg-gradient-to-r from-[#0E1E38] via-[#0A2624] to-[#0D1527] rounded-2xl p-4 sm:p-5 border border-emerald-500/40 shadow-xl dark:shadow-[0_4px_30px_rgba(16,185,129,0.2)] text-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
                <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center space-x-2">
                  <span>లైవ్ శనివారం లైన్ రన్ అవుతోంది</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                    {activeLineWeek}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-teal-200/90 mt-1 font-medium flex flex-wrap items-center gap-2">
                <span className="flex items-center space-x-1 text-emerald-300 font-bold">
                  <LocateFixed className="w-3.5 h-3.5 animate-spin" />
                  <span>GPS యాక్టివ్ ±{gpsAccuracy || 5}m</span>
                </span>
                <span>• ప్రారంభ సమయం: {lineStartedAt || 'ఈ రోజు'}</span>
                {counts.within100m > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30 font-bold">
                    చుట్టూ 100 మీటర్లలో {counts.within100m} ఖాతాలు ఉన్నాయి!
                  </span>
                )}
              </p>
            </div>

            {/* Action buttons: View Switcher + End Line */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 bg-black/40 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    viewMode === 'list'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>రాడార్ లిస్ట్</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    viewMode === 'map'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>లైవ్ మ్యాప్</span>
                </button>
              </div>

              {/* End Line Button */}
              <button
                onClick={handleEndLineSession}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/40 flex items-center space-x-1.5 active:scale-95 transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>లైన్ ముగించు (End)</span>
              </button>
            </div>
          </div>

          {/* Live Metric Summary Chips for Today's Saturday Line */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/[0.1] text-xs">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-teal-300 font-bold block">ఈ రోజు వసూలు:</span>
              <span className="text-base font-black text-emerald-400">
                {formatINR(counts.todayCollectedTotal)}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-semibold">
                ({counts.todayCollectedCount} ఖాతాలు)
              </span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-amber-300 font-bold block">ఇంకా వసూలు కావాల్సినవి:</span>
              <span className="text-base font-black text-amber-400">
                {counts.todayPendingCount}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-semibold">ఖాతాలు</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-purple-300 font-bold block">తర్వాత రమ్మన్నవి:</span>
              <span className="text-base font-black text-purple-400">
                {counts.promisedCount}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-semibold">ఖాతాలు</span>
            </div>
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/[0.08]">
              <span className="text-[10px] text-blue-300 font-bold block">లైన్ ప్రగతి:</span>
              <span className="text-base font-black text-white">
                {counts.todayCollectedCount + counts.todayPendingCount > 0
                  ? Math.round(
                      (counts.todayCollectedCount / (counts.todayCollectedCount + counts.todayPendingCount)) * 100
                    )
                  : 0}
                %
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-semibold">పూర్తయింది</span>
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL OVERVIEW HERO BAR (Before Line Starts) */
        <div className="bg-gradient-to-r from-[#0E1E38] via-[#0D2826] to-[#0A0F1D] rounded-2xl p-4 sm:p-5 border border-teal-500/30 shadow-xl dark:shadow-[0_4px_30px_rgba(20,184,166,0.15)] text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isTracking
                      ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse'
                      : 'bg-slate-500'
                  }`}
                />
                <h2 className="text-lg sm:text-xl font-black tracking-tight flex items-center space-x-2">
                  <span>లైన్ కలెక్షన్స్ & లైవ్ GPS రాడార్</span>
                </h2>
              </div>
              <p className="text-xs text-teal-200/90 mt-1 font-medium">
                {isTracking ? (
                  <span className="flex items-center space-x-1.5 text-emerald-300 font-bold">
                    <LocateFixed className="w-3.5 h-3.5 animate-spin" />
                    <span>GPS యాక్టివ్ • ఖచ్చితత్వం: ±{gpsAccuracy || 5} మీటర్లు</span>
                    {counts.within100m > 0 && (
                      <span className="ml-2 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        చుట్టూ 100 మీటర్లలో {counts.within100m} ఖాతాలు ఉన్నాయి!
                      </span>
                    )}
                  </span>
                ) : (
                  <span>శనివారం లైన్ ప్రారంభించడానికి &apos;శనివారం లైన్ ప్రారంభించు&apos; క్లిక్ చేయండి</span>
                )}
              </p>
              {gpsError && (
                <p className="text-[11px] text-amber-300 bg-amber-950/60 p-1.5 rounded-lg border border-amber-800/60 mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{gpsError}</span>
                </p>
              )}
            </div>

            {/* Action buttons: Start line + View Switcher */}
            <div className="flex items-center space-x-2 self-start sm:self-auto">
              {/* View Mode Toggle */}
              <div className="flex items-center p-0.5 bg-black/40 rounded-xl border border-white/[0.08]">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    viewMode === 'list'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>రాడార్ లిస్ట్</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-all ${
                    viewMode === 'map'
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>లైవ్ మ్యాప్</span>
                </button>
              </div>

              {/* Start Saturday Line Button */}
              <button
                onClick={handleStartLineClick}
                disabled={isCreatingWeekCol}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex items-center space-x-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                {isCreatingWeekCol ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>సిద్ధమవుతోంది...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>శనివారం లైన్ ప్రారంభించు</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promised Follow-Up Bar (లైన్ చివరలో కాల్ చేయాల్సినవి) */}
      {counts.promisedCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/40 rounded-2xl p-3.5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-950 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
              <span className="font-black text-xs sm:text-sm">
                లైన్ చివరలో కాల్ చేయాల్సినవి ({counts.promisedCount} ఖాతాలు - 2-3 గంటల్లో వేస్తామన్నారు)
              </span>
            </div>
            <button
              onClick={() => setTypeFilter('promised')}
              className="text-[11px] font-bold text-amber-800 dark:text-amber-300 underline"
            >
              వీరిని మాత్రమే చూపించు ➔
            </button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {processedCustomers
              .filter((c) => c.isPromised)
              .map((c) => (
                <div
                  key={c.customerKey}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#131C30] border border-amber-300 dark:border-amber-500/40 shrink-0 flex items-center space-x-2 shadow-sm"
                >
                  <div>
                    <div className="font-black text-slate-900 dark:text-white leading-tight">
                      #{c.sNo} {c.nameTe}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold leading-tight mt-0.5">
                      {c.followUp.note} ({c.followUp.time})
                    </div>
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-500/30"
                      title="కాల్ చేయండి"
                    >
                      <Phone className="w-3.5 h-3.5 fill-current" />
                    </a>
                  )}
                  <button
                    onClick={() => handleOneTapCollection(c, c.sheetTitle, c.weekColumns, 'Cash')}
                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black"
                  >
                    వసూలు
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter Bar & Distance Selector */}
      <div className="space-y-2 sticky top-[57px] z-30 bg-slate-100/95 dark:bg-[#060911]/90 backdrop-blur-xl py-2 -mx-2 px-2 transition-colors">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="సమీపంలో ఉన్న ఖాతాదారుని పేరు లేదా నంబర్ వెతకండి..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.08] text-xs sm:text-sm font-semibold bg-white dark:bg-[#0D1527] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 shadow-sm placeholder:text-slate-400"
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

        {/* Village & Radius Quick Selector */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
          {/* Village Filter */}
          <div className="flex items-center space-x-1 bg-white dark:bg-[#0D1527] p-1 rounded-xl border border-slate-200 dark:border-white/[0.08]">
            <button
              onClick={() => setVillageFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                villageFilter === 'all'
                  ? 'bg-teal-700 dark:bg-emerald-500/25 text-white dark:text-emerald-200'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              అన్నీ
            </button>
            <button
              onClick={() => setVillageFilter('edurlanka')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                villageFilter === 'edurlanka'
                  ? 'bg-teal-700 dark:bg-emerald-500/25 text-white dark:text-emerald-200'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ఎదుర్లంక
            </button>
            <button
              onClick={() => setVillageFilter('kothapalli')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                villageFilter === 'kothapalli'
                  ? 'bg-teal-700 dark:bg-emerald-500/25 text-white dark:text-emerald-200'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              కొత్తపల్లి
            </button>
          </div>

          {/* Distance Radius */}
          {userCoords && (
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold shrink-0">పరిధి:</span>
              {['all', '50', '100', '250', '500'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusFilter(r)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    radiusFilter === r
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                  }`}
                >
                  {r === 'all' ? 'అన్నీ' : `${r}m`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due & Scheme Type Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {isLineActive ? (
            <>
              <button
                onClick={() => setTypeFilter('due_only')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all border ${
                  typeFilter === 'due_only'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-950/20'
                    : 'bg-white dark:bg-[#0D1527] text-amber-700 dark:text-amber-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                🔥 ఇంకా వసూలు కావాల్సినవి ({counts.todayPendingCount})
              </button>
              <button
                onClick={() => setTypeFilter('collected')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all border ${
                  typeFilter === 'collected'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                    : 'bg-white dark:bg-[#0D1527] text-emerald-700 dark:text-emerald-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                ✅ ఈ రోజు వసూలైనవి ({counts.todayCollectedCount})
              </button>
              <button
                onClick={() => setTypeFilter('promised')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'promised'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-purple-700 dark:text-purple-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                ⏱ తర్వాత రమ్మన్నవి ({counts.promisedCount})
              </button>
              <button
                onClick={() => setTypeFilter('all_gps')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'all_gps'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-blue-700 dark:text-blue-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                📍 లొకేషన్ ఉన్నవారు ({counts.withGpsCount})
              </button>
              <button
                onClick={() => setTypeFilter('no_gps')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'no_gps'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                లొకేషన్ లేనివి ({counts.noGpsCount})
              </button>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'all'
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                అన్ని ఖాతాలు
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setTypeFilter('due_only')}
                className={`px-3 py-1.5 rounded-xl font-black whitespace-nowrap transition-all border ${
                  typeFilter === 'due_only'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20'
                    : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                🔥 బాకీ ఉన్నవారు ({counts.totalDue})
              </button>
              <button
                onClick={() => setTypeFilter('weekly')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'weekly'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-teal-700 dark:text-teal-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                వారం బాకీ ({counts.weeklyDue})
              </button>
              <button
                onClick={() => setTypeFilter('monthly_due')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'monthly_due'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-amber-700 dark:text-amber-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                నెల శనివారం బాకీ ({counts.monthlyDue})
              </button>
              <button
                onClick={() => setTypeFilter('promised')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'promised'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-purple-700 dark:text-purple-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                తర్వాత ఇస్తామన్నవి ({counts.promisedCount})
              </button>
              <button
                onClick={() => setTypeFilter('all_gps')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'all_gps'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-blue-700 dark:text-blue-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                📍 లొకేషన్ ఉన్నవారు ({counts.withGpsCount})
              </button>
              <button
                onClick={() => setTypeFilter('no_gps')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'no_gps'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                లొకేషన్ లేనివి ({counts.noGpsCount})
              </button>
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${
                  typeFilter === 'all'
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white dark:bg-[#0D1527] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                అన్ని ఖాతాలు
              </button>
            </>
          )}
        </div>
      </div>

      {/* MAP VIEW (Option 2 - OpenStreetMap with Leaflet) */}
      {viewMode === 'map' ? (
        <div className="space-y-2">
          {/* Map Top Switch: All Pinned vs Due Only */}
          <div className="flex items-center justify-between bg-white dark:bg-[#0D1527] p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <span>మ్యాప్‌లో చూపించాల్సినవి:</span>
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setMapFilterMode('all_pinned')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  mapFilterMode === 'all_pinned'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-300'
                }`}
              >
                📍 అందరి ఇళ్లు ({counts.withGpsCount})
              </button>
              <button
                onClick={() => setMapFilterMode('due_only')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                  mapFilterMode === 'due_only'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-300'
                }`}
              >
                🔥 కేవలం బాకీ ఉన్నవారు
              </button>
            </div>
          </div>

          <InteractiveLeafletMap
            userCoords={userCoords}
            customers={mapCustomers}
            villageFilter={villageFilter}
            isLineActive={isLineActive}
            onOneTapCollection={handleOneTapCollection}
            onMarkFollowUp={handleMarkFollowUp}
            onOpenCollection={onOpenCollection}
          />
        </div>
      ) : (
        /* RADAR LIST VIEW (Option 1 - Default & Primary) */
        <div className="space-y-3">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white dark:bg-[#0D1527] p-8 rounded-2xl border border-slate-200 dark:border-white/[0.08] text-center space-y-2">
              <Compass className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                ఈ ఫిల్టర్‌లో ఎవరూ లేరు (No customers in this range)
              </p>
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setRadiusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold underline"
              >
                ఫిల్టర్లు రీసెట్ చేయండి
              </button>
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isActionBusy = !!quickActionLoading[c.customerKey];
              const isPinBusy = !!pinningLoading[c.customerKey];

              return (
                <div
                  key={c.customerKey}
                  className={`bg-white dark:bg-[#0D1527] rounded-2xl border transition-all overflow-hidden ${
                    c.isPromised
                      ? 'border-purple-300 dark:border-purple-500/40 shadow-md shadow-purple-950/20'
                      : c.isMonthly && c.isDueToday
                      ? 'border-amber-300 dark:border-amber-500/40 shadow-sm'
                      : c.isDueToday
                      ? 'border-emerald-300 dark:border-emerald-500/30 shadow-sm'
                      : 'border-slate-200 dark:border-white/[0.08] opacity-80'
                  }`}
                >
                  <div className="p-4">
                    {/* Top Row: S.No, Name, Distance & Due Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          #{c.sNo}
                        </span>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">
                              {c.nameTe}
                            </h3>
                            {c.nameEn && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                ({c.nameEn})
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {/* Village & Colony */}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-[#131C30] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                              {c.villageLabel} {c.colony ? `• ${c.colony}` : ''}
                            </span>

                            {/* Live Distance Pill */}
                            {c.distanceMeters !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center space-x-1 ${
                                  c.distanceMeters <= 50
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-soft-pulse'
                                    : c.distanceMeters <= 150
                                    ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                                    : 'bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                }`}
                              >
                                <Navigation className="w-2.5 h-2.5 fill-current" />
                                <span>{formatDistance(c.distanceMeters)}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-[#131C30] text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                                లొకేషన్ లేదు
                              </span>
                            )}

                            {/* Scheme Due Badge */}
                            {c.isMonthly ? (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                  c.isDueToday
                                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 border-amber-400 dark:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                    : 'bg-purple-50 dark:bg-purple-500/15 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-500/30'
                                }`}
                              >
                                🔔 {c.dueBadgeText}
                              </span>
                            ) : (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                                  c.isDueToday
                                    ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/40'
                                    : 'bg-slate-100 dark:bg-[#131C30] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/[0.06]'
                                }`}
                              >
                                {c.dueBadgeText}
                              </span>
                            )}

                            {/* Follow-up / Promised Pill */}
                            {c.isPromised && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 dark:bg-purple-500/25 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-500/50 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{c.followUp.note} ({c.followUp.time})</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Phone call button */}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          title={`కాల్ చేయండి: ${c.phone}`}
                          className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-sm"
                        >
                          <Phone className="w-4 h-4 fill-emerald-600 dark:fill-emerald-400 text-emerald-600 dark:text-emerald-400" />
                        </a>
                      )}
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between mt-3 p-2.5 bg-slate-50 dark:bg-[#131C30]/70 rounded-xl border border-slate-100 dark:border-white/[0.06] text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">వాయిదా మొత్తం:</span>
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                          {formatINR(c.dueAmount)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">మిగిలిన బాకీ:</span>
                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {formatINR(c.remainingDue)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">మొత్తం స్కీమ్:</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                          {formatINR(c.amount)}
                        </span>
                      </div>
                    </div>

                    {/* RAPID ACTION BUTTONS */}
                    {isLineActive && c.isCollectedToday ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl mt-3 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>ఈ రోజు వసూలైంది: {formatINR(c.todayPaidAmount)} ({c.todayPaymentMode})</span>
                        </span>
                        <button
                          onClick={() => handleOpenCustomCollection(c, c.sheetTitle, c.weekColumns)}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline"
                        >
                          సవరించు ➔
                        </button>
                      </div>
                    ) : !isLineActive && c.remainingDue <= 0 ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl mt-3 text-xs">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>ఈ ఖాతా పూర్తిగా చెల్లించబడింది (No Dues)</span>
                        </span>
                        <button
                          onClick={() => handleOpenCustomCollection(c, c.sheetTitle, c.weekColumns)}
                          className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline"
                        >
                          వివరాలు చూడండి ➔
                        </button>
                      </div>
                    ) : !isLineActive && !c.isDueToday ? (
                      <div className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-[#131C30] border border-slate-200 dark:border-white/[0.08] rounded-xl mt-3 text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>ఈ వారం వాయిదా చెల్లించారు</span>
                        </span>
                        <button
                          onClick={() => handleOpenCustomCollection(c, c.sheetTitle, c.weekColumns)}
                          className="text-[11px] font-bold text-teal-600 dark:text-teal-400 underline"
                        >
                          ముందస్తు వసూలు ➔
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {/* 1. Fast Cash Collection */}
                        <button
                          onClick={() => handleOneTapCollection(c, c.sheetTitle, c.weekColumns, 'Cash')}
                          disabled={isActionBusy}
                          className="py-2 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950/30 flex items-center justify-center space-x-1 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{formatINR(c.dueAmount)} నగదు</span>
                        </button>

                        {/* 2. Fast UPI Collection */}
                        <button
                          onClick={() => handleOneTapCollection(c, c.sheetTitle, c.weekColumns, 'UPI')}
                          disabled={isActionBusy}
                          className="py-2 px-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md shadow-blue-950/30 flex items-center justify-center space-x-1 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{formatINR(c.dueAmount)} UPI</span>
                        </button>

                        {/* 3. Promised in 2-4 hours */}
                        <button
                          onClick={() => handleMarkFollowUp(c.customerKey, '2-3 గంటల్లో వేస్తా')}
                          className="py-2 px-2.5 bg-purple-100 dark:bg-purple-500/20 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-900 dark:text-purple-200 font-black text-xs rounded-xl border border-purple-300 dark:border-purple-500/40 flex items-center justify-center space-x-1 active:scale-95 transition-all"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>తర్వాత వేస్తా</span>
                        </button>

                        {/* 4. More Options / Custom Amount */}
                        <button
                          onClick={() => handleOpenCustomCollection(c, c.sheetTitle, c.weekColumns)}
                          className="py-2 px-2.5 bg-slate-100 dark:bg-[#131C30] hover:bg-slate-200 dark:hover:bg-[#1A2642] text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-white/[0.08] flex items-center justify-center space-x-1 active:scale-95 transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>కస్టమ్ మొత్తం ➔</span>
                        </button>
                      </div>
                    )}

                    {/* Secondary Row: Pin GPS & Google Maps Directions */}
                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                      {!c.hasGPS ? (
                        <button
                          onClick={() => handlePinCurrentLocation(c, c.sheetTitle)}
                          disabled={isPinBusy}
                          className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 dark:text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/40 flex items-center space-x-1 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <MapPin className="w-3 h-3 text-amber-500" />
                          <span>{isPinBusy ? 'సేవ్ అవుతోంది...' : '📍 ఇక్కడే లొకేషన్ పిన్ చేయి'}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>GPS సేవ్ అయి ఉంది</span>
                        </span>
                      )}

                      {/* Google Maps Directions */}
                      {c.coords && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${c.coords.lat},${c.coords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        >
                          <Compass className="w-3 h-3" />
                          <span>మ్యాప్స్ డైరెక్షన్స్ (Navigate)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Interactive Leaflet Map Subcomponent (Option 2 - 100% Free OpenStreetMap)
 */
function InteractiveLeafletMap({
  userCoords,
  customers,
  villageFilter,
  isLineActive,
  onOneTapCollection,
  onMarkFollowUp,
  onOpenCollection,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const hasInitialFittedRef = useRef(false);
  const [isLeafletReady, setIsLeafletReady] = useState(false);

  // Reset auto-fit flag when user explicitly switches village
  useEffect(() => {
    hasInitialFittedRef.current = false;
  }, [villageFilter]);

  // Dynamically inject Leaflet CSS & JS from unpkg (Zero build overhead, 100% free)
  useEffect(() => {
    if (window.L) {
      setIsLeafletReady(true);
      return;
    }

    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setIsLeafletReady(true);
      document.body.appendChild(script);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const L = window.L;
    const defaultCenter = userCoords
      ? [userCoords.lat, userCoords.lng]
      : [16.5165, 82.1388]; // Approximate Edurlanka/Kothapalli coordinates

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: userCoords ? 17 : 15,
      zoomControl: true,
    });

    // OpenStreetMap standard tile layer (100% free, no API keys)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isLeafletReady]);

  // Update User Live Blue Dot Marker (does NOT reset map center or zoom)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !userCoords) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="position: absolute; inset: -6px; background: rgba(59, 130, 246, 0.4); border-radius: 9999px; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: absolute; inset: 0; background: #2563EB; border: 3px solid #FFFFFF; border-radius: 9999px; box-shadow: 0 0 10px rgba(37,99,235,0.8);"></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong style="font-size:12px;">📍 మీ ప్రస్తుత లొకేషన్ (Your Location)</strong>');
    }
  }, [isLeafletReady, userCoords]);

  // Recenter to user's current GPS location
  const handleRecenterToUser = () => {
    if (!mapInstanceRef.current || !userCoords) return;
    mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 17, {
      duration: 1,
    });
  };

  // Fit all pins in view
  const handleFitAllPins = () => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const validPoints = customers.filter((c) => c.coords).map((c) => [c.coords.lat, c.coords.lng]);
    if (userCoords) validPoints.push([userCoords.lat, userCoords.lng]);
    if (validPoints.length > 0) {
      try {
        const bounds = L.latLngBounds(validPoints);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      } catch (e) {}
    }
  };

  // Update Customer Pins on Map (NEVER resets user zoom/pan unless initial load)
  useEffect(() => {
    if (!isLeafletReady || !mapInstanceRef.current || !markersGroupRef.current) return;

    const L = window.L;
    const group = markersGroupRef.current;
    group.clearLayers();

    customers.forEach((c) => {
      if (!c.coords) return;

      // Color coding:
      // When isLineActive:
      //   - If collected today: Gray (#64748B) with '✓'
      //   - If promised: Purple (#9333EA) with '⏱'
      //   - If monthly due: Amber (#F59E0B) with `#${c.sNo}`
      //   - If weekly due: Emerald (#10B981) with `#${c.sNo}`
      //   - If remainingDue <= 0: Gray (#64748B) with '✓'
      // When !isLineActive:
      //   - If promised: Purple (#9333EA)
      //   - If monthly due: Amber (#F59E0B)
      //   - If fully paid (remainingDue <= 0) or !isDueToday: Gray (#64748B) with '✓'
      //   - Else weekly due: Emerald (#10B981) with `#${c.sNo}`
      let pinColor = '#10B981';
      let pinText = `#${c.sNo}`;

      if (isLineActive) {
        if (c.isCollectedToday) {
          pinColor = '#64748B';
          pinText = '✓';
        } else if (c.isPromised) {
          pinColor = '#9333EA';
          pinText = '⏱';
        } else if (c.isMonthly && c.isDueToday) {
          pinColor = '#F59E0B';
        } else if (c.remainingDue <= 0) {
          pinColor = '#64748B';
          pinText = '✓';
        }
      } else {
        if (c.isPromised) {
          pinColor = '#9333EA';
        } else if (c.isMonthly && c.isDueToday) {
          pinColor = '#F59E0B';
        } else if (c.remainingDue <= 0 || !c.isDueToday) {
          pinColor = '#64748B';
          pinText = '✓';
        }
      }

      const customPin = L.divIcon({
        className: 'custom-customer-pin',
        html: `
          <div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 9999px; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 900; font-size: ${pinText === '✓' ? '13px' : '10px'}; font-family: sans-serif;">
            ${pinText}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      let statusHtml = '';
      if (isLineActive) {
        if (c.isCollectedToday) {
          statusHtml = `<div style="font-size: 11px; font-weight: 800; color: #059669; margin: 4px 0;">✅ ఈ రోజు వసూలైంది: ₹${c.todayPaidAmount} (${c.todayPaymentMode})</div>`;
        } else if (c.isPromised) {
          statusHtml = `<div style="font-size: 11px; font-weight: 800; color: #9333EA; margin: 4px 0;">⏱ తర్వాత ఇస్తామన్నారు (${c.followUp?.note || '2-3 గంటల్లో'})</div>`;
        } else if (c.remainingDue <= 0) {
          statusHtml = '<div style="font-size: 11px; font-weight: 800; color: #059669; margin: 4px 0;">✅ పూర్తయిన ఖాతా (బాకీ లేదు)</div>';
        } else {
          statusHtml = `<div style="font-size: 12px; font-weight: 800; color: #E11D48; margin: 4px 0;">బాకీ: ₹${c.dueAmount} (${c.dueBadgeText})</div>`;
        }
      } else {
        statusHtml =
          c.remainingDue <= 0
            ? '<div style="font-size: 11px; font-weight: 800; color: #059669; margin: 4px 0;">✅ పూర్తిగా చెల్లించారు (Paid in Full)</div>'
            : !c.isDueToday
            ? '<div style="font-size: 11px; font-weight: 800; color: #059669; margin: 4px 0;">✅ ఈ వారం వసూలైంది</div>'
            : `<div style="font-size: 12px; font-weight: 800; color: #E11D48; margin: 4px 0;">బాకీ: ₹${c.dueAmount} (${c.dueBadgeText})</div>`;
      }

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 175px; padding: 2px;">
          <div style="font-weight: 900; font-size: 13px; color: #0F172A;">#${c.sNo} ${c.nameTe}</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 2px;">${c.villageLabel} ${c.colony ? '• ' + c.colony : ''}</div>
          ${statusHtml}
          ${c.distanceMeters !== null ? `<div style="font-size: 10px; font-weight: 700; color: #2563EB;">దూరం: ${formatDistance(c.distanceMeters)}</div>` : ''}
          <div style="margin-top: 8px; display: flex; gap: 4px;">
            ${c.phone ? `<a href="tel:${c.phone}" style="flex: 1; background: #059669; color: white; text-align: center; font-weight: bold; font-size: 11px; padding: 5px 6px; border-radius: 8px; text-decoration: none;">📞 కాల్</a>` : ''}
            <a href="https://www.google.com/maps/dir/?api=1&destination=${c.coords.lat},${c.coords.lng}" target="_blank" rel="noreferrer" style="flex: 1; background: #2563EB; color: white; text-align: center; font-weight: bold; font-size: 11px; padding: 5px 6px; border-radius: 8px; text-decoration: none;">🧭 రూట్</a>
          </div>
        </div>
      `;

      L.marker([c.coords.lat, c.coords.lng], { icon: customPin })
        .addTo(group)
        .bindPopup(popupHtml);
    });

    // Auto-fit bounds ONLY on initial load or village change, NEVER during active user zooming/panning
    if (!hasInitialFittedRef.current && customers.some((c) => c.coords)) {
      const validPoints = customers.filter((c) => c.coords).map((c) => [c.coords.lat, c.coords.lng]);
      if (userCoords) validPoints.push([userCoords.lat, userCoords.lng]);
      if (validPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(validPoints);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
          hasInitialFittedRef.current = true;
        } catch (e) {}
      }
    }
  }, [isLeafletReady, customers, isLineActive]);

  return (
    <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden p-2 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5 px-2 pt-1 text-xs">
        <span className="font-black text-slate-800 dark:text-white flex items-center space-x-1.5">
          <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span>ఓపెన్‌స్ట్రీట్‌మ్యాప్ (OpenStreetMap Live)</span>
        </span>

        {/* Legend */}
        <div className="flex items-center space-x-2 text-[10px] font-bold">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">వారం</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-600 dark:text-slate-300">నెల</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
            <span className="text-slate-600 dark:text-slate-300">తర్వాత</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-600 dark:text-slate-300">{isLineActive ? 'వసూలైంది' : 'పూర్తయింది'}</span>
          </span>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.06] relative z-10"
      >
        {/* Floating Controls: Recenter to My GPS & Fit All Pins */}
        <div className="absolute right-3 bottom-6 z-[500] flex flex-col space-y-2">
          {userCoords && (
            <button
              onClick={handleRecenterToUser}
              title="నా ప్రస్తుత లొకేషన్‌కి రీ-సెంటర్ చేయి (Recenter to My Location)"
              className="w-10 h-10 rounded-xl bg-white dark:bg-[#0D1527] text-blue-600 dark:text-blue-400 shadow-xl border border-slate-200 dark:border-white/[0.1] flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-90 transition-all"
            >
              <LocateFixed className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={handleFitAllPins}
            title="అందరి ఇళ్లూ ఫ్రేమ్ చేయి (Fit All Pinned Houses)"
            className="w-10 h-10 rounded-xl bg-white dark:bg-[#0D1527] text-emerald-600 dark:text-emerald-400 shadow-xl border border-slate-200 dark:border-white/[0.1] flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/30 active:scale-90 transition-all"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>

        {!isLeafletReady && (
          <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-[#131C30] text-slate-500 font-bold text-xs space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>మ్యాప్ లోడ్ అవుతోంది (Loading Free Map)...</span>
          </div>
        )}
      </div>
    </div>
  );
}
