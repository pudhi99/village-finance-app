'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import DashboardView from '@/components/DashboardView';
import VillageView from '@/components/VillageView';
import LedgerView from '@/components/LedgerView';
import InvestmentsView from '@/components/InvestmentsView';
import CollectionModal from '@/components/CollectionModal';
import AddCustomerModal from '@/components/AddCustomerModal';
import EditCustomerModal from '@/components/EditCustomerModal';
import AddWeekModal from '@/components/AddWeekModal';
import AddLedgerModal from '@/components/AddLedgerModal';
import AddInvestmentModal from '@/components/AddInvestmentModal';
import PhotoViewerModal from '@/components/PhotoViewerModal';
import SettingsModal from '@/components/SettingsModal';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState('light');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [edurlankaData, setEdurlankaData] = useState(null);
  const [kothapalliData, setKothapalliData] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [investmentsData, setInvestmentsData] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [collectionModalState, setCollectionModalState] = useState({
    isOpen: false,
    customer: null,
    sheetTitle: '',
  });

  const [addCustomerModalState, setAddCustomerModalState] = useState({
    isOpen: false,
    currentVillage: 'ఎదుర్లంక (Edurlanka)',
    existingMaxSNo: 0,
  });

  const [editCustomerModalState, setEditCustomerModalState] = useState({
    isOpen: false,
    customer: null,
    sheetTitle: '',
  });

  const [addWeekModalState, setAddWeekModalState] = useState({
    isOpen: false,
    sheetTitle: 'ఎదుర్లంక (Edurlanka)',
    currentWeekCount: 6,
  });

  const [isAddLedgerOpen, setIsAddLedgerOpen] = useState(false);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);

  const [photoViewerState, setPhotoViewerState] = useState({
    isOpen: false,
    title: '',
    photoUrl: '',
  });

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    handleThemeChange(nextTheme);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Fetch all initial data
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMessage('');

    try {
      const [dashRes, edurRes, kothaRes, ledgRes, invRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/village?name=ఎదుర్లంక (Edurlanka)'),
        fetch('/api/village?name=కొత్తపల్లి (Kothapalli)'),
        fetch('/api/ledger'),
        fetch('/api/investments'),
      ]);

      const [dashJson, edurJson, kothaJson, ledgJson, invJson] = await Promise.all([
        dashRes.json(),
        edurRes.json(),
        kothaRes.json(),
        ledgRes.json(),
        invRes.json(),
      ]);

      if (dashJson.success) setDashboardData(dashJson.data);
      if (edurJson.success) setEdurlankaData(edurJson.data);
      if (kothaJson.success) setKothapalliData(kothaJson.data);
      if (ledgJson.success) setLedgerData(ledgJson.data);
      if (invJson.success) setInvestmentsData(invJson.data);

      if (!dashJson.success && dashJson.error) {
        throw new Error(dashJson.error);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setErrorMessage(err.message || 'గూగుల్ షీట్స్ నుండి డేటా పొందడం విఫలమైంది');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Modal handlers
  const handleOpenCollection = (customer, sheetTitle) => {
    setCollectionModalState({
      isOpen: true,
      customer,
      sheetTitle,
    });
  };

  const handleOpenEditCustomer = (customer, sheetTitle) => {
    setEditCustomerModalState({
      isOpen: true,
      customer,
      sheetTitle,
    });
  };

  const handleOpenAddCustomer = (villageTitle) => {
    const targetVillage = villageTitle || (activeTab === 'kothapalli' ? 'కొత్తపల్లి (Kothapalli)' : 'ఎదుర్లంక (Edurlanka)');
    const vData = targetVillage.includes('కొత్తపల్లి') ? kothapalliData : edurlankaData;
    let maxSNo = 0;
    if (vData && vData.customers) {
      vData.customers.forEach((c) => {
        const num = parseInt(c.sNo, 10);
        if (!isNaN(num) && num > maxSNo) maxSNo = num;
      });
    }

    setAddCustomerModalState({
      isOpen: true,
      currentVillage: targetVillage,
      existingMaxSNo: maxSNo,
    });
  };

  const handleOpenAddWeek = (sheetTitle, count) => {
    setAddWeekModalState({
      isOpen: true,
      sheetTitle,
      currentWeekCount: count || 6,
    });
  };

  const handleViewPhoto = (photoUrl, title) => {
    setPhotoViewerState({
      isOpen: true,
      title,
      photoUrl,
    });
  };

  // Optimistic collection update
  const handleCollectionSuccess = ({ rowIndex, colIndex, amount, paymentMode }) => {
    showToast(`వసూలు విజయవంతంగా సేవ్ అయ్యింది: ₹${amount} ${paymentMode === 'UPI' ? '(UPI)' : ''}`);
    // Refresh live data in background
    loadAllData(true);
  };

  // Customer added success
  const handleCustomerAddedSuccess = ({ village, sNo, nameTe }) => {
    showToast(`కొత్త ఖాతా విజయవంతంగా చేర్చబడింది: #${sNo} ${nameTe}`);
    loadAllData(true);
  };

  // Customer updated success
  const handleCustomerUpdatedSuccess = () => {
    showToast('ఖాతా వివరాలు విజయవంతంగా అప్‌డేట్ అయ్యాయి');
    loadAllData(true);
  };

  // Week added success
  const handleWeekAddedSuccess = (weekLabel) => {
    showToast(`కొత్త వారం కాలమ్ చేర్చబడింది: ${weekLabel}`);
    loadAllData(true);
  };

  // Ledger entry success
  const handleLedgerSuccess = () => {
    showToast('ఖాతా లెక్కల ఎంట్రీ విజయవంతంగా నమోదైంది');
    loadAllData(true);
  };

  // Investment added success
  const handleInvestmentSuccess = () => {
    showToast('పెట్టుబడి ఎంట్రీ విజయవంతంగా నమోదైంది');
    loadAllData(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-[#060911] text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-teal-500 selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-xs font-bold border border-emerald-700 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        bagBalance={dashboardData?.kpis?.bagBalance}
        onRefresh={() => loadAllData(true)}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentTheme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-4 pt-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <Loader2 className="w-8 h-8 text-teal-700 dark:text-teal-400 animate-spin" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              గూగుల్ షీట్స్ & క్లౌడ్‌నరీ డేటా లోడ్ అవుతోంది...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm text-center my-6 space-y-3 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">డేటా పొందడంలో లోపం</h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800/60">
              {errorMessage}
            </p>
            <button
              onClick={() => loadAllData()}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow active:scale-95 transition-all"
            >
              మళ్లీ ప్రయత్నించండి (Retry)
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                data={dashboardData}
                onNavigate={setActiveTab}
                onOpenAddCustomer={handleOpenAddCustomer}
              />
            )}

            {activeTab === 'edurlanka' && (
              <VillageView
                villageData={edurlankaData}
                onOpenCollection={handleOpenCollection}
                onOpenEditCustomer={handleOpenEditCustomer}
                onOpenAddCustomer={handleOpenAddCustomer}
                onOpenAddWeek={handleOpenAddWeek}
                onViewPhoto={handleViewPhoto}
              />
            )}

            {activeTab === 'kothapalli' && (
              <VillageView
                villageData={kothapalliData}
                onOpenCollection={handleOpenCollection}
                onOpenEditCustomer={handleOpenEditCustomer}
                onOpenAddCustomer={handleOpenAddCustomer}
                onOpenAddWeek={handleOpenAddWeek}
                onViewPhoto={handleViewPhoto}
              />
            )}

            {activeTab === 'ledger' && (
              <LedgerView
                ledgerData={ledgerData}
                onOpenAddLedger={() => setIsAddLedgerOpen(true)}
              />
            )}

            {activeTab === 'investments' && (
              <InvestmentsView
                investmentsData={investmentsData}
                onOpenAddInvestment={() => setIsAddInvestmentOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Modals */}
      <CollectionModal
        isOpen={collectionModalState.isOpen}
        onClose={() => setCollectionModalState({ isOpen: false, customer: null, sheetTitle: '' })}
        customer={collectionModalState.customer}
        sheetTitle={collectionModalState.sheetTitle}
        weekColumns={
          collectionModalState.sheetTitle?.includes('కొత్తపల్లి')
            ? kothapalliData?.weekColumns
            : edurlankaData?.weekColumns
        }
        onSuccess={handleCollectionSuccess}
      />

      <AddCustomerModal
        isOpen={addCustomerModalState.isOpen}
        onClose={() => setAddCustomerModalState({ isOpen: false, currentVillage: '', existingMaxSNo: 0 })}
        currentVillage={addCustomerModalState.currentVillage}
        existingMaxSNo={addCustomerModalState.existingMaxSNo}
        onSuccess={handleCustomerAddedSuccess}
      />

      <EditCustomerModal
        isOpen={editCustomerModalState.isOpen}
        onClose={() => setEditCustomerModalState({ isOpen: false, customer: null, sheetTitle: '' })}
        customer={editCustomerModalState.customer}
        sheetTitle={editCustomerModalState.sheetTitle}
        onSuccess={handleCustomerUpdatedSuccess}
      />

      <AddWeekModal
        isOpen={addWeekModalState.isOpen}
        onClose={() => setAddWeekModalState({ isOpen: false, sheetTitle: '', currentWeekCount: 6 })}
        sheetTitle={addWeekModalState.sheetTitle}
        currentWeekCount={addWeekModalState.currentWeekCount}
        onSuccess={handleWeekAddedSuccess}
      />

      <AddLedgerModal
        isOpen={isAddLedgerOpen}
        onClose={() => setIsAddLedgerOpen(false)}
        onSuccess={handleLedgerSuccess}
      />

      <AddInvestmentModal
        isOpen={isAddInvestmentOpen}
        onClose={() => setIsAddInvestmentOpen(false)}
        onSuccess={handleInvestmentSuccess}
      />

      <PhotoViewerModal
        isOpen={photoViewerState.isOpen}
        onClose={() => setPhotoViewerState({ isOpen: false, title: '', photoUrl: '' })}
        title={photoViewerState.title}
        photoUrl={photoViewerState.photoUrl}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}
