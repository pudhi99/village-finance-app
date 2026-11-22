'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  ShieldCheck,
  PieChart,
  BarChart3,
  Coins,
  Wallet,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Percent,
  Award,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatINR } from '@/lib/utils';

export default function InvestmentsView({ investmentsData, onOpenAddInvestment }) {
  const [activeChartTab, setActiveChartTab] = useState('capital'); // 'capital' | 'profit_split' | 'weekly'
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  if (!investmentsData) return null;

  const {
    permanentInvestments = [],
    partnerSummary = [],
    safetyFundLog = [],
    financialMetrics,
    partnerEquity = [],
    weeklyTrends = [],
    kpis,
  } = investmentsData;

  // Fallback calculations if financialMetrics is null
  const totalCapitalFromLog = permanentInvestments.reduce((acc, item) => acc + item.amount, 0);
  const totalCapital = financialMetrics?.totalCapital || totalCapitalFromLog || 650000;

  const totalPortfolio = financialMetrics?.totalPortfolio || kpis?.totalPortfolio || 391300;
  const totalDisbursed = financialMetrics?.totalDisbursedPrincipal || Math.round(totalPortfolio * 0.792);
  const expectedProfit = financialMetrics?.expectedGrossProfit || kpis?.expectedGrossProfit || (totalPortfolio - totalDisbursed);
  const profitMarginPct = financialMetrics?.profitMarginPct || 20.8;

  const totalCollected = financialMetrics?.totalCollected || kpis?.totalCollected || 0;
  const realizedPrincipal = financialMetrics?.realizedPrincipal || Math.round(totalCollected * 0.792);
  const realizedProfit = financialMetrics?.realizedProfit || Math.round(totalCollected * 0.208);

  const totalDues = financialMetrics?.totalDues || kpis?.totalDues || 0;
  const pendingPrincipal = financialMetrics?.pendingPrincipal || Math.round(totalDues * 0.792);
  const pendingProfit = financialMetrics?.pendingProfit || Math.round(totalDues * 0.208);

  const bagBalance = financialMetrics?.bagBalance || kpis?.bagBalance || 5500;
  const recoveryPct = totalPortfolio > 0 ? ((totalCollected / totalPortfolio) * 100).toFixed(1) : '0.0';
  const deployedPct = totalCapital > 0 ? Math.min(100, Math.round((totalDisbursed / totalCapital) * 100)) : 48;

  // Partners equity fallback
  const partners = partnerEquity.length > 0 ? partnerEquity : [
    {
      name: 'సత్తిబాబు (Sattibabu)',
      invested: 400000,
      sharePct: '61.54%',
      shareRatio: 0.6154,
      realizedProfitShare: Math.round(realizedProfit * 0.6154),
      expectedProfitShare: Math.round(expectedProfit * 0.6154),
      totalValue: 400000 + Math.round(expectedProfit * 0.6154),
    },
    {
      name: 'పృధ్వి (Prudhvi)',
      invested: 250000,
      sharePct: '38.46%',
      shareRatio: 0.3846,
      realizedProfitShare: Math.round(realizedProfit * 0.3846),
      expectedProfitShare: Math.round(expectedProfit * 0.3846),
      totalValue: 250000 + Math.round(expectedProfit * 0.3846),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 pb-24 pt-1 animate-fadeIn">
      {/* Strategy Explainer Dialog / Modal */}
      {showStrategyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#0D1527] border border-amber-300 dark:border-amber-500/40 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  పద్దు ప్రకారం లాభాలు ఎప్పుడు తీసుకోవాలి? (Profit Withdrawal Strategy)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  నెలవారీ విత్‌డ్రా vs 6 నెలల (25 వారాల) సైకిల్ ముగింపు విశ్లేషణ
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 space-y-1">
                <div className="font-black text-rose-800 dark:text-rose-300 flex items-center space-x-1">
                  <span>❌ ఆప్షన్ A: నెలనెలా లాభాలు తీసుకోవడం (Monthly Withdrawals)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  25 వారాల స్కీమ్‌లో మొదటి 15 వారాల వరకు కస్టమర్లు కట్టేది దాదాపు 80% అసలు మాత్రమే.
                  మధ్యలోనే లాభాలను చేతికి తీసేసుకుంటే వ్యాపారంలో <strong>క్యాష్ కొరత (Liquidity Crunch)</strong> వస్తుంది.
                  ఎవరైనా 2-3 కస్టమర్లు ఆలస్యం చేసినా లేదా ఎగ్గొట్టినా, ముందే లాభాలు పంచుకోవడం వల్ల భాగస్వాములు మళ్లీ జేబులోంచి డబ్బులు వేయాల్సి వస్తుంది.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 space-y-1">
                <div className="font-black text-emerald-900 dark:text-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>⭐ ఆప్షన్ B: 6 నెలలకోసారి (25 వారాల సైకిల్ ముగిసాక) - రికమండెడ్!</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  25 వారాల రౌండ్ పూర్తయ్యేసరికి ప్రతి ఖాతా లెక్క తేలిపోతుంది. అసలు పెట్టుబడి (₹6,50,000) సురక్షితంగా వెనక్కి వస్తుంది.
                  మొండి బాకీలు పోగా మిగిలిన <strong>నికర లాభం (Net Profit)</strong> నూటికి నూరు శాతం ఖచ్చితంగా చేతికి వస్తుంది.
                  ఈ 6 నెలల పాటు వసూలైన డబ్బు మార్కెట్లో రొటేట్ అవ్వడం వల్ల క్యాపిటల్ వేగంగా పెరిగి లాభాలు గరిష్టమవుతాయి.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/15 border border-blue-300 dark:border-blue-500/40 space-y-1">
                <div className="font-black text-blue-900 dark:text-blue-200 flex items-center space-x-1">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>💡 ఆదర్శవంతమైన పద్ధతి (Smart Hybrid Formula):</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  1. రొటీన్ కలెక్షన్స్ డబ్బును బ్యాగ్‌లోనే ఉంచి నిరంతరం కొత్త కస్టమర్లకు రొటేట్ చేయండి.
                  <br />
                  2. అత్యవసర ఖర్చుల కోసం భాగస్వాములు అవసరమైతే చిన్న మొత్తాన్ని &apos;డ్రాయింగ్స్&apos; గా లెడ్జర్‌లో నమోదు చేసుకుని తీసుకోండి.
                  <br />
                  3. 25 వారాల సైకిల్ ముగిసిన వెంటనే పూర్తి ఆడిట్ చేసి, అసలు మూలధనాన్ని పక్కన పెట్టి, మిగిలిన నికర లాభాన్ని <strong>61.54% : 38.46%</strong> నిష్పత్తిలో ఒకేసారి డివిడెండ్‌గా పంచుకోండి!
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowStrategyModal(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                అర్థమైంది (Got it)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-950 via-[#0A2624] to-[#0D1527] rounded-2xl border border-teal-500/30 shadow-xl dark:shadow-[0_4px_30px_rgba(20,184,166,0.15)] p-4 sm:p-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
              <span>ఆర్థిక నిపుణుల సారాంశం (Capital & Profit Analytics)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              పెట్టుబడులు & లాభాల విశ్లేషణ
            </h2>
            <p className="text-xs sm:text-sm text-teal-200/90 mt-0.5 font-medium">
              శాశ్వత మూలధనం, అసలు రికవరీ, ఆర్జించిన లాభం & భాగస్వాముల వాటాల లెక్కలు
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={() => setShowStrategyModal(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>లాభాలు ఎప్పుడు తీసుకోవాలి?</span>
            </button>
            <button
              onClick={onOpenAddInvestment}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ పెట్టుబడి నమోదు</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Financial Intelligence KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Capital */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-all hover:border-teal-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              మొత్తం మూలధనం <span className="text-[10px] opacity-75">(Permanent Capital)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatINR(totalCapital)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold flex items-center space-x-1">
            <span>సత్తిబాబు: 61.5% • పృధ్వి: 38.5%</span>
          </div>
          <div className="mt-2 text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/15 p-1 rounded border border-teal-200 dark:border-teal-500/25">
            మార్కెట్లో అసలు: {formatINR(totalDisbursed)} ({deployedPct}%)
          </div>
        </div>

        {/* Card 2: Market Portfolio & Profit Margin */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              మార్కెట్ లోన్స్ <span className="text-[10px] opacity-75">(Total Portfolio)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
            {formatINR(totalPortfolio)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            అంచనా స్థూల లాభం: <strong className="text-emerald-700 dark:text-emerald-300">{formatINR(expectedProfit)}</strong>
          </div>
          <div className="mt-2 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 p-1 rounded border border-emerald-200 dark:border-emerald-500/25">
            లాభం మార్జిన్: {profitMarginPct}% (సగటున)
          </div>
        </div>

        {/* Card 3: Collected to Date & Realized Profit */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              ఇప్పటివరకు వసూళ్లు <span className="text-[10px] opacity-75">(Total Collected)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tight">
            {formatINR(totalCollected)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            రికవరీ: <strong className="text-blue-700 dark:text-blue-300">{recoveryPct}%</strong> పూర్తయింది
          </div>
          <div className="mt-2 text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/15 p-1 rounded border border-blue-200 dark:border-blue-500/25 flex justify-between">
            <span>అసలు: {formatINR(realizedPrincipal)}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black">లాభం: {formatINR(realizedProfit)}</span>
          </div>
        </div>

        {/* Card 4: Outstanding Dues & Pending Profit */}
        <div className="bg-white dark:bg-[#0D1527] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm relative overflow-hidden transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              రావలసిన బాకీ <span className="text-[10px] opacity-75">(Outstanding Dues)</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatINR(totalDues)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
            రావలసిన అసలు: <strong className="text-rose-600 dark:text-rose-300">{formatINR(pendingPrincipal)}</strong>
          </div>
          <div className="mt-2 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 p-1 rounded border border-amber-200 dark:border-amber-500/25">
            రాబోయే మిగిలిన లాభం: {formatINR(pendingProfit)}
          </div>
        </div>
      </div>

      {/* Visual Analytics & Business Charts Section */}
      <div className="bg-white dark:bg-[#0D1527] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              వ్యాపార గణాంకాల గ్రాఫ్‌లు (Visual Business Analytics)
            </h3>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-[#131C30] rounded-xl border border-slate-200 dark:border-white/[0.08] text-xs">
            <button
              onClick={() => setActiveChartTab('capital')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeChartTab === 'capital'
                  ? 'bg-emerald-500 text-slate-950 shadow font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📊 అసలు vs లాభం
            </button>
            <button
              onClick={() => setActiveChartTab('profit_split')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeChartTab === 'profit_split'
                  ? 'bg-emerald-500 text-slate-950 shadow font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🥧 భాగస్వాముల వాటా
            </button>
            <button
              onClick={() => setActiveChartTab('weekly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeChartTab === 'weekly'
                  ? 'bg-emerald-500 text-slate-950 shadow font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📈 వారం వారీ వసూళ్లు
            </button>
          </div>
        </div>

        {/* Tab 1: Principal vs Profit Breakdown */}
        {activeChartTab === 'capital' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-2">
            {/* Left: Donut Visual SVG */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-[#131C30]/60 rounded-2xl border border-slate-100 dark:border-white/[0.06]">
              <div className="relative w-44 h-44 flex items-center justify-center">
                {/* Native SVG Donut Chart */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Track */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-slate-200 dark:text-slate-800"
                  />
                  {/* Principal Circle (79.2%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#0D9488"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset="0"
                    className="transition-all duration-1000"
                  />
                  {/* Profit Circle (20.8%) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="14"
                    strokeDasharray="238.76"
                    strokeDashoffset="189.1"
                    className="transition-all duration-1000"
                  />
                </svg>
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">స్థూల లాభం</span>
                  <span className="text-xl font-black text-amber-700 dark:text-amber-400 leading-tight">
                    {profitMarginPct}%
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">మార్జిన్</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center space-x-4 mt-3 text-xs font-bold">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-teal-600" />
                  <span className="text-slate-700 dark:text-slate-300">అసలు (79.2%)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-slate-700 dark:text-slate-300">లాభం (20.8%)</span>
                </span>
              </div>
            </div>

            {/* Right: Detailed Metric Waterfall Breakdown */}
            <div className="lg:col-span-7 space-y-3.5">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                పోర్ట్‌ఫోలియో అసలు & లాభాల పంపిణీ స్టేటస్:
              </h4>

              {/* Principal Recovery Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">చేతికి ఇచ్చిన అసలు (Disbursed Principal):</span>
                  <span className="text-teal-700 dark:text-teal-300">{formatINR(totalDisbursed)} (100%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-[#131C30] rounded-full overflow-hidden flex border border-slate-200 dark:border-white/[0.06]">
                  <div
                    style={{ width: `${Math.min(100, Math.round((realizedPrincipal / totalDisbursed) * 100))}%` }}
                    className="bg-teal-600 h-full rounded-l-full shadow-sm"
                    title={`వసూలైన అసలు: ${formatINR(realizedPrincipal)}`}
                  />
                  <div
                    style={{ width: `${Math.max(0, 100 - Math.round((realizedPrincipal / totalDisbursed) * 100))}%` }}
                    className="bg-slate-300 dark:bg-slate-700 h-full"
                    title={`రావలసిన అసలు: ${formatINR(pendingPrincipal)}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>✅ రికవర్ అయిన అసలు: <strong className="text-teal-700 dark:text-teal-300 font-bold">{formatINR(realizedPrincipal)}</strong></span>
                  <span>⏳ ఇంకా రావాల్సిన అసలు: <strong className="text-rose-600 dark:text-rose-400 font-bold">{formatINR(pendingPrincipal)}</strong></span>
                </div>
              </div>

              {/* Profit Realization Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">అంచనా స్థూల లాభం (Expected Profit Pool):</span>
                  <span className="text-amber-700 dark:text-amber-400">{formatINR(expectedProfit)} (100%)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-[#131C30] rounded-full overflow-hidden flex border border-slate-200 dark:border-white/[0.06]">
                  <div
                    style={{ width: `${Math.min(100, Math.round((realizedProfit / expectedProfit) * 100))}%` }}
                    className="bg-amber-500 h-full rounded-l-full shadow-sm"
                    title={`ఆర్జించిన లాభం: ${formatINR(realizedProfit)}`}
                  />
                  <div
                    style={{ width: `${Math.max(0, 100 - Math.round((realizedProfit / expectedProfit) * 100))}%` }}
                    className="bg-slate-300 dark:bg-slate-700 h-full"
                    title={`రాబోయే లాభం: ${formatINR(pendingProfit)}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>💰 ఇప్పటివరకు వచ్చిన లాభం: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{formatINR(realizedProfit)}</strong></span>
                  <span>⏳ రాబోయే మిగిలిన లాభం: <strong className="text-amber-700 dark:text-amber-400 font-bold">{formatINR(pendingProfit)}</strong></span>
                </div>
              </div>

              {/* Capital Rotation Velocity Callout */}
              <div className="p-3 bg-teal-50/70 dark:bg-teal-500/10 rounded-xl border border-teal-200 dark:border-teal-500/25 flex items-start space-x-2 text-xs">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-900 dark:text-teal-200">మూలధన రొటేషన్ (Capital Rotation):</span>
                  <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                    వసూలైన ప్రతి రూపాయి తిరిగి కొత్త ఖాతాలకు రొటేట్ అవ్వడం వల్ల, ప్రారంభ మూలధనం (₹6.5L) నుండి ఇప్పటికే ₹{Math.round(totalCollected / 1000)}k రికవర్ అయ్యి బ్యాగ్‌లో మరియు మార్కెట్లో నిరంతరం తిరుగుతోంది.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Partner Equity & Profit Allocation */}
        {activeChartTab === 'profit_split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131C30]/70 border border-slate-200 dark:border-white/[0.08] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white font-black text-sm flex items-center justify-center shadow">
                      {partner.name.includes('సత్తిబాబు') ? 'స' : 'ప'}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {partner.name}
                      </h4>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                        శాశ్వత వాటా: {partner.sharePct}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-500/30">
                    పెట్టుబడి: {formatINR(partner.invested)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.06] text-center">
                  <div className="p-2 bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">ఇప్పటి లాభం</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {formatINR(partner.realizedProfitShare || Math.round(realizedProfit * (partner.shareRatio || 0.5)))}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">మొత్తం ఆశించిన లాభం</span>
                    <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400">
                      {formatINR(partner.expectedProfitShare)}
                    </span>
                  </div>
                  <div className="p-2 bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">మొత్తం పోర్ట్‌ఫోలియో</span>
                    <span className="text-xs sm:text-sm font-black text-teal-800 dark:text-teal-300">
                      {formatINR(partner.totalValue)}
                    </span>
                  </div>
                </div>

                {/* Partner Share Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>లాభాల రికవరీ పురోగతి:</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{recoveryPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${recoveryPct}%` }}
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Weekly Collections Velocity Graph */}
        {activeChartTab === 'weekly' && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
              <span>వారం వారీ కలెక్షన్స్ వెలాసిటీ (గ్రామాల వారీగా వసూళ్లు):</span>
              <span className="text-teal-700 dark:text-teal-400 font-black">మొత్తం: {formatINR(totalCollected)}</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-[#131C30]/60 rounded-2xl border border-slate-100 dark:border-white/[0.06] overflow-x-auto">
              {weeklyTrends.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">వారాల డేటా అందుబాటులో లేదు</p>
              ) : (
                <div className="flex items-end space-x-3 sm:space-x-4 min-w-[500px] h-48 pt-6 pb-2 px-2">
                  {(() => {
                    const maxAmount = Math.max(...weeklyTrends.map((t) => t.total || 1), 1000);
                    return weeklyTrends.map((wk, i) => {
                      const heightPct = Math.max(8, Math.round((wk.total / maxAmount) * 100));
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                          {/* Hover Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-slate-800 dark:text-white bg-white dark:bg-[#0D1527] px-2 py-0.5 rounded shadow border border-slate-200 dark:border-white/[0.1] mb-1 whitespace-nowrap">
                            {formatINR(wk.total)}
                          </div>

                          {/* Bar with gradient */}
                          <div className="w-full max-w-[42px] bg-slate-200 dark:bg-slate-700/60 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                            <div
                              style={{ height: `${heightPct}%` }}
                              className="w-full bg-gradient-to-t from-teal-600 via-emerald-500 to-teal-400 rounded-t-xl shadow-sm transition-all duration-700 group-hover:brightness-110"
                            />
                          </div>

                          {/* Label */}
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 mt-2 text-center truncate max-w-full">
                            {wk.header?.split(' ')?.[0] || `వ${i + 1}`}
                          </span>
                          <span className="text-[8px] text-slate-400 truncate">
                            {wk.header?.match(/\(([^)]+)\)/)?.[1] || ''}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Paddhu Profit Withdrawal Strategy Banner Card */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-[#0D1527] p-4 sm:p-5 rounded-2xl border border-amber-300 dark:border-amber-500/40 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/40">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-200">
              పద్దు వ్యూహాత్మక సలహా: లాభాలు 6 నెలలకోసారి (సైకిల్ ముగిసాక) తీసుకోవడమే ఎందుకు మేలు?
            </h4>
            <p className="text-xs text-amber-900/80 dark:text-amber-300/80 mt-0.5 font-medium leading-relaxed">
              25 వారాల పద్దులో మొదటి 15 వారాలు వసూలయ్యేది అసలు మాత్రమే. రౌండ్ చివరన లాభాలు పంచుకుంటే అసలు పెట్టుబడి సురక్షితంగా ఉంటుంది & లాభం గరిష్టమవుతుంది.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowStrategyModal(true)}
          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow shrink-0 active:scale-95 transition-all"
        >
          పూర్తి విశ్లేషణ చదవండి ➔
        </button>
      </div>

      {/* Permanent Investments & Safety Fund Tables (Side by Side on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Permanent Investments History */}
        <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden transition-colors flex flex-col justify-between">
          <div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#0A0F1D]/80 flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                శాశ్వత మూలధన చరిత్ర (Permanent Capital Log)
              </h3>
              <span className="text-xs font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/20 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-500/30">
                మొత్తం: {formatINR(totalCapital)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {permanentInvestments.map((inv, i) => (
                <div
                  key={i}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-[#131C30]/50 transition-colors flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#131C30] text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center border border-slate-200 dark:border-white/[0.06]">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{inv.partnerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{inv.date}</div>
                    </div>
                  </div>

                  <div className="font-black text-xs sm:text-sm text-emerald-700 dark:text-emerald-400">
                    +{formatINR(inv.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Temporary Safety Fund Memo Table */}
        {safetyFundLog.length > 0 && (
          <div className="bg-white dark:bg-[#0D1527] rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden transition-colors flex flex-col justify-between">
            <div>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-white/[0.06] bg-amber-50/60 dark:bg-amber-500/10 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h3 className="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                  తాత్కాలిక భద్రతా నిధి లాగ్ (Safety Fund Memo)
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {safetyFundLog.map((log, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{log.particulars}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{log.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        ఇన్: {formatINR(log.inflow)} | అవుట్: {formatINR(log.outflow)}
                      </div>
                      <div className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {log.netStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
