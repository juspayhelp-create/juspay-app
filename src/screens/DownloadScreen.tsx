import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Globe, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Cpu, 
  Coins, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowLeft, 
  Zap, 
  Radio, 
  BookOpen,
  Info,
  Layers,
  TrendingUp,
  Percent,
  CreditCard,
  Shield,
  Clock,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from '../components/JuspayLogo';

interface DownloadScreenProps {
  onBack?: () => void;
  initialTab?: 'about' | 'download' | 'guidelines';
}

export const DownloadScreen: React.FC<DownloadScreenProps> = ({ onBack, initialTab = 'about' }) => {
  const { setActiveScreen, stats, showToast, currentUser, isAuthenticated, openKycModal } = useApp();
  const [activeTab, setActiveTab] = useState<'about' | 'download' | 'guidelines'>(initialTab);
  const [copiedHash, setCopiedHash] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const sha256Checksum = '8f3b4c7e2d9a1f05e6b7c8d9a0f1e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9';
  const downloadUrl = '/downloads/app-release.apk';

  const handleCopyChecksum = () => {
    navigator.clipboard.writeText(sha256Checksum);
    setCopiedHash(true);
    showToast('SHA-256 checksum copied to clipboard');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadClick = () => {
    setIsDownloading(true);
    showToast('Initiating APK package download...');
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', 'juspay-vault-v1.2.3.apk');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  const liquidityCorridors = [
    {
      country: 'United Arab Emirates',
      currency: 'AED',
      code: 'UAE',
      flag: '🇦🇪',
      pair: 'USDT/AED',
      rate: '3.6725',
      hub: 'DIFC OTC Prime Gateway',
      spread: '0.08%',
      depth: '$48.5M',
      latency: '180ms',
      status: 'High Depth'
    },
    {
      country: 'Saudi Arabia',
      currency: 'SAR',
      code: 'KSA',
      flag: '🇸🇦',
      pair: 'USDT/SAR',
      rate: '3.7510',
      hub: 'Riyadh Liquidity Corridor',
      spread: '0.11%',
      depth: '$35.2M',
      latency: '210ms',
      status: 'Sub-second Routing'
    },
    {
      country: 'Kuwait',
      currency: 'KWD',
      code: 'KWT',
      flag: '🇰🇼',
      pair: 'USDT/KWD',
      rate: '0.3075',
      hub: 'Kuwait City Institutional Pool',
      spread: '0.06%',
      depth: '$22.8M',
      latency: '195ms',
      status: 'Ultra-Deep Desk'
    },
    {
      country: 'India OTC Corridors',
      currency: 'INR',
      code: 'IND',
      flag: '🇮🇳',
      pair: 'USDT/INR',
      rate: `₹${stats.realtime_exchange_rate || 109}.00`,
      hub: 'UPI / IMPS Fast Settlement',
      spread: '0.00% Zero-Slippage',
      depth: '$64.0M',
      latency: '120ms',
      status: 'Deep Liquidity Matching'
    },
    {
      country: 'Qatar',
      currency: 'QAR',
      code: 'QAT',
      flag: '🇶🇦',
      pair: 'USDT/QAR',
      rate: '3.6415',
      hub: 'Doha Cross-Border Engine',
      spread: '0.09%',
      depth: '$19.4M',
      latency: '220ms',
      status: 'Active'
    },
    {
      country: 'Oman & Bahrain',
      currency: 'OMR / BHD',
      code: 'GCC',
      flag: '🇴🇲',
      pair: 'USDT/OMR',
      rate: '0.3850',
      hub: 'Gulf Union Clearing Desk',
      spread: '0.12%',
      depth: '$14.1M',
      latency: '240ms',
      status: 'Active'
    }
  ];

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200">
        <button
          onClick={() => {
            if (onBack) onBack();
            else setActiveScreen('home');
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </button>

        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>Juspay Institutional Portal</span>
        </div>
      </div>

      {/* Navigation Switcher Tabs */}
      <div className="flex p-1 bg-slate-200/80 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'about'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>About Us</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('download')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'download'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Download App</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('guidelines')}
          className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'guidelines'
              ? 'bg-white text-indigo-950 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Guidelines & Terms</span>
        </button>
      </div>

      {/* TAB 1: ABOUT US */}
      {activeTab === 'about' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Welcome to Juspay Vault Hero */}
          <div className="fintech-card p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>OFFICIAL INSTITUTIONAL PLATFORM</span>
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-white font-['Space_Grotesk']">
                  Welcome to Juspay Vault
                </h1>
                <h2 className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-wide">
                  Cross-Border OTC Liquidity & High-Yield Settlement Infrastructure
                </h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1">
                Juspay Vault connects Indian digital asset sellers directly to institutional-grade, cross-border liquidity pools. Traditional domestic P2P exchanges frequently constrain sellers with low rates, slow execution, and volatile counterparty risks. Juspay bridges domestic USDT volume directly into premium regional OTC and express corridors—maximizing margins on every single dollar liquidated.
              </p>
            </div>
          </div>

          {/* How We Deliver Above-Market USDT Rates */}
          <div className="fintech-card p-5 space-y-4 bg-white border border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 font-['Space_Grotesk']">
                  How We Deliver Above-Market USDT Rates
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Real-time supply-and-demand imbalance capture & automated routing
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              We monitor real-time supply-and-demand imbalances across multiple high-volume trading hubs, including:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌍</span>
                  <h4 className="text-xs font-extrabold text-slate-900">The Gulf Region</h4>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  UAE, Saudi Arabia, Kuwait, Qatar, and Oman
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇮🇳</span>
                  <h4 className="text-xs font-extrabold text-slate-900">India OTC Corridors</h4>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Real-time deep liquidity matching
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 leading-relaxed space-y-2">
              <p>
                When demand spikes and local fiat supply tightens in any of these territories, the pricing spread surges. Our algorithmic corridor engine identifies whichever regional desk is paying the highest premium at that exact moment. By placing pooled USDT volume into these high-value corridors, we capture significantly higher exit rates than standard domestic exchanges offer.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900">
                    Clear 70/30 Profit Allocation
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  On every fulfilled arbitrage cycle, our agency retains a transparent 30% performance fee, crediting the full remaining 70% surplus profit directly to your balance.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-black text-slate-900">
                    Instant Fiat Settlements
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-8">
                  Liquidated assets clear into local currency payouts (IMPS / UPI) with verified counterparty integrity and zero slippage.
                </p>
              </div>
            </div>
          </div>

          {/* The USDT Selling Card Protocol */}
          <div className="fintech-card p-5 space-y-4 bg-white border border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4 text-indigo-700" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 font-['Space_Grotesk']">
                  The USDT Selling Card Protocol
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Systemic reserve protection, fair pacing & orderly matching
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To manage liquidity pacing, maintain fair distribution, and protect systemic reserves, liquidation access operates on the USDT Selling Card standard:
            </p>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-extrabold text-slate-900">Daily Card Entitlement</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Active verified users receive 1 USDT Selling Card per day during dedicated operational claim windows.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-extrabold text-slate-900">Mandatory Liquidation Access</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  A valid Selling Card is required to initiate liquidation and trigger withdrawal settlements.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-extrabold text-slate-900">Paced Execution</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  This daily allocation mechanism prevents sudden liquidity drain, ensures stable order matching across overseas desks, and guarantees that every participant gets fair, systematic market access.
                </p>
              </div>
            </div>

            {/* Switch to Download CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('download')}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Ready to Start? Download App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Regional Corridors Grid */}
          <div className="fintech-card p-4 space-y-3 bg-white border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-black text-slate-900">Active High-Volume Corridors</h3>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Clearing Desks
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {liquidityCorridors.map((c, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{c.flag}</span>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">{c.country}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{c.hub}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {c.spread}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DOWNLOAD / GET THE APP */}
      {activeTab === 'download' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          {/* Main Download Hero */}
          <div className="fintech-card p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                <Smartphone className="w-3 h-3 text-emerald-400" />
                <span>OFFICIAL MOBILE RELEASE</span>
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-white font-['Space_Grotesk'] leading-snug">
                  Take Institutional Arbitrage Anywhere: Download the Juspay App
                </h1>
                <h2 className="text-xs font-bold text-emerald-400 mt-1 uppercase tracking-wide">
                  Sell USDT at global peak rates directly from your mobile device.
                </h2>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                The Juspay Vault mobile portal provides real-time access to cross-border OTC order matching, instant deposits, daily card claims, and immediate local fiat withdrawals.
              </p>

              {/* Quick Build Specs */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-center">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Build Version</span>
                  <span className="text-xs font-mono font-bold text-white">v1.2.3 Release</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Compatibility</span>
                  <span className="text-xs font-bold text-white">Android 8.0+</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Package Size</span>
                  <span className="text-xs font-mono font-bold text-emerald-400">18.4 MB</span>
                </div>
              </div>

              {/* Download APK Action Button */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadClick}
                  disabled={isDownloading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Downloading APK Package...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download Android APK (Direct)</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>SSL Encrypted • Malware Scanned</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyChecksum}
                    className="flex items-center gap-1 text-slate-300 hover:text-white font-mono cursor-pointer"
                    title="Copy SHA-256 Checksum"
                  >
                    <span>SHA-256: 8f3b...e8f9</span>
                    {copiedHash ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features */}
          <div className="fintech-card p-5 space-y-3.5 bg-white border border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-sm font-black text-slate-900 font-['Space_Grotesk']">
                Key Features
              </h2>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900">Algorithmic Corridor Routing</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Automated tracking routes your USDT to whichever market pays best—Kuwait, UAE, Saudi Arabia, Qatar, Oman, or domestic express desks.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-teal-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900">Real-Time Vault Ledgering</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Deposit TRC20 or BEP20 USDT directly into secure escrow vaults with zero conversion friction.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900">Transparent Performance Sharing</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Enjoy top-tier liquidation pricing while the platform handles routing and risk management for a flat 30% profit share.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900">Daily Card Management</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Track your unlock timers, claim daily USDT Selling Cards, and authorize payouts with a simple 6-digit security PIN.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900">Rapid Local Payouts</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Direct settlement to registered accounts via secure banking rails and instant payment gateways.
                </p>
              </div>
            </div>
          </div>

          {/* How to Get Started in 3 Steps */}
          <div className="fintech-card p-5 space-y-4 bg-white border border-slate-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4 text-teal-700" />
              </div>
              <h2 className="text-sm font-black text-slate-900 font-['Space_Grotesk']">
                How to Get Started in 3 Steps
              </h2>
            </div>

            <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
              
              {/* Step 1 */}
              <div className="relative pl-10">
                <div className="absolute left-3 -translate-x-1/2 top-1 w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-md ring-4 ring-white">
                  1
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hover:border-emerald-300 transition-colors">
                  <h3 className="text-xs font-black text-slate-900">Download & Register</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Install the app and create your account using email verification and your secure 6-digit PIN.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative pl-10">
                <div className="absolute left-3 -translate-x-1/2 top-1 w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-md ring-4 ring-white">
                  2
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hover:border-teal-300 transition-colors">
                  <h3 className="text-xs font-black text-slate-900">Claim Your Daily Card & Deposit</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Check your dashboard timer to claim your daily USDT Selling Card, then stage your USDT into your secure vault.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative pl-10">
                <div className="absolute left-3 -translate-x-1/2 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md ring-4 ring-white">
                  3
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 hover:border-indigo-300 transition-colors">
                  <h3 className="text-xs font-black text-slate-900">Execute & Withdraw</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Authorize the settlement when corridor spreads peak, review your earnings breakdown, and initiate immediate withdrawal to your preferred payout method.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 2-Step Android Unknown Sources Helper */}
          <div className="fintech-card p-4 space-y-2.5 bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900">Android Installation Tip</h3>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When opening the APK, tap <strong>Settings</strong> & toggle <strong>"Allow from this source"</strong> if prompted. In Samsung One UI / Xiaomi MIUI, grant permissions under <em>Special App Access &gt; Install Unknown Apps</em>.
            </p>
          </div>

        </div>
      )}

      {/* TAB 3: GUIDELINES & TERMS */}
      {activeTab === 'guidelines' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          
          <div className="fintech-card p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                <FileText className="w-3 h-3 text-indigo-400" />
                <span>LEGAL, COMPLIANCE & PROTOCOL STANDARDS</span>
              </div>
              <h1 className="text-lg font-black tracking-tight text-white font-['Space_Grotesk']">
                Institutional Guidelines & Terms of Service
              </h1>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rules governing cross-border OTC matching, 70/30 profit distributions, daily selling card quotas, mandatory KYC identity verification, and withdrawal clearance protocols.
              </p>
            </div>
          </div>

          {/* CRITICAL COMPLIANCE NOTICE: MANDATORY KYC FOR WITHDRAWALS */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 via-red-50/60 to-amber-50 border border-rose-300/80 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-rose-900 font-black text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="uppercase tracking-wider">Mandatory Compliance Policy</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-black text-rose-950 flex items-center gap-1.5">
                <span>Without KYC Verification, Withdrawals Cannot Be Processed</span>
              </h4>
              <p className="text-xs text-rose-900/90 leading-relaxed">
                In strict adherence to international Anti-Money Laundering (AML) regulations, FIU protocols, and institutional security mandates, <strong>all withdrawal operations (INR payouts via IMPS/NEFT/UPI and external crypto withdrawals) require an approved KYC verification.</strong> Any withdrawal request initiated on an unverified or pending account is automatically placed on compliance hold until full identity verification is approved.
              </p>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-rose-200/70">
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-slate-600">Your KYC Status:</span>
                {String(currentUser?.kyc_status || '').toUpperCase() === 'VERIFIED' ? (
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-mono text-[10px]">
                    VERIFIED
                  </span>
                ) : String(currentUser?.kyc_status || '').toUpperCase() === 'PENDING' ? (
                  <span className="px-2 py-0.5 bg-amber-500 text-white rounded font-mono text-[10px]">
                    PENDING REVIEW
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-mono text-[10px]">
                    NOT VERIFIED
                  </span>
                )}
              </div>

              {String(currentUser?.kyc_status || '').toUpperCase() !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated || currentUser?.id === 'guest') {
                      setActiveScreen('auth');
                    } else {
                      openKycModal();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black shadow-xs cursor-pointer transition-colors flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Complete KYC Now</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Section 1: OTC Corridor Settlement Rules */}
          <div className="fintech-card p-4 space-y-2.5 bg-white border border-slate-200">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">1</span>
              <span>OTC Corridor Settlement & Routing Rules</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Juspay Vault aggregates digital assets for cross-border liquidity execution. All routed orders are matched automatically against real-time bid-ask spreads across regional clearing desks (including UAE, Saudi Arabia, Kuwait, Qatar, Oman, and India). Exchange rates reflect live institutional liquidity premiums.
            </p>
          </div>

          {/* Section 2: 70/30 Profit Allocation Formula */}
          <div className="fintech-card p-4 space-y-2.5 bg-white border border-slate-200">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">2</span>
              <span>70/30 Transparent Profit Allocation</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              On every completed arbitrage cycle, the platform retains a 30% performance fee to cover routing, liquidity provider fees, and operational infrastructure. The user receives 70% of the surplus yield directly into their available balance with zero hidden deductions.
            </p>
          </div>

          {/* Section 3: USDT Selling Card Protocol & Fair Distribution */}
          <div className="fintech-card p-4 space-y-2.5 bg-white border border-slate-200">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">3</span>
              <span>USDT Selling Card Protocol & Daily Quota</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Liquidation requires an active USDT Selling Card. Verified users receive 1 entitlement per day during scheduled claim cycles. Selling Cards guarantee orderly liquidation pacing, preventing liquidity drain and protecting market depth across international desks.
            </p>
          </div>

          {/* Section 4: Mandatory Identity KYC Verification & Step-by-Step Instructions */}
          <div className="fintech-card p-4 space-y-3 bg-white border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">4</span>
                <span>Mandatory Identity KYC Verification & Withdrawal Clearance</span>
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Mandatory
              </span>
            </div>

            <div className="pl-6 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Identity verification (KYC) is a non-negotiable security requirement. <strong>Withdrawal processing cannot and will not be executed without an approved KYC status.</strong> This protocol guarantees that funds are disbursed exclusively to legitimate account owners and prevents financial fraud.
              </p>

              {/* Step-by-Step Walkthrough */}
              <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200/90 space-y-2.5">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>How to Complete Your KYC Verification:</span>
                </h4>
                
                <div className="space-y-2 text-[11px] text-slate-700">
                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">1</span>
                    <div>
                      <strong className="text-slate-900">Access the Verification Portal:</strong> Go to the <strong>Profile</strong> screen and tap the <strong>"Identity KYC"</strong> banner or select the <strong>"KYC Status"</strong> icon in the Platform Security & Services grid.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">2</span>
                    <div>
                      <strong className="text-slate-900">Enter Legal Personal Details:</strong> Input your legal full name exactly as it appears on your government-issued ID and bank account. Enter your date of birth, contact number, and residential address.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">3</span>
                    <div>
                      <strong className="text-slate-900">Select Government Document:</strong> Choose your document type:
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-600">
                        <li><strong>Aadhaar Card:</strong> 12-digit Unique Identification Number.</li>
                        <li><strong>PAN Card:</strong> 10-character Permanent Account Number.</li>
                        <li><strong>Passport:</strong> Valid international travel passport.</li>
                        <li><strong>Voter ID Card:</strong> Official Election Commission EPIC number.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">4</span>
                    <div>
                      <strong className="text-slate-900">Upload Clear Document Scans:</strong> Upload clear, unblurred photographs of both the front and back of your identity document. Ensure all four corners are visible, text is crisp, and there is no flash reflection or digital distortion.
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">5</span>
                    <div>
                      <strong className="text-slate-900">Submit for Compliance Audit:</strong> Tap <strong>"Submit Verification"</strong>. Our 24/7 compliance team and automated verification gateway review submissions in real-time (typical approval turnaround is 15 to 45 minutes).
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[9px] shrink-0 mt-0.5">6</span>
                    <div>
                      <strong className="text-slate-900">Instant Approval & Payout Activation:</strong> Once approved, your profile receives the green <strong>KYC VERIFIED</strong> badge. Unrestricted withdrawals via IMPS, UPI, and crypto are immediately unlocked with zero delay.
                    </div>
                  </div>
                </div>
              </div>

              {/* Crucial KYC Withdrawal Rules */}
              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Important KYC & Withdrawal Clearance Rules:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Without KYC, Withdrawals Cannot Be Processed:</strong> Any withdrawal order created on an account with KYC status `NOT_SUBMITTED`, `PENDING`, or `REJECTED` will be held in custody. Settlement rails will not release payouts until verification is confirmed.</li>
                  <li><strong>Beneficiary Name Matching:</strong> The bank account holder name or UPI beneficiary must match the verified legal name on your KYC document. Third-party withdrawals are strictly prohibited to prevent financial fraud.</li>
                  <li><strong>One Account Per Legal Identity:</strong> A government document can only be registered to a single Juspay Vault account. Duplicate identity submissions across multiple accounts will trigger account suspension.</li>
                  <li><strong>Handling Rejections:</strong> In case of rejection (due to blurry photos or typo in document number), users can immediately view the audit note and resubmit their documents directly in the portal.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 5: Security PIN & Credential Protection */}
          <div className="fintech-card p-4 space-y-2.5 bg-white border border-slate-200">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">5</span>
              <span>Security PIN Authorization & Zero-Log Custody</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              All withdrawals and critical account changes require explicit authorization via your 6-digit security PIN and email OTP verification. Users are solely responsible for maintaining the confidentiality of their PIN and email credentials. Platform architecture employs zero-log storage for PIN hashes.
            </p>
          </div>

          {/* Section 6: Risk Disclosure & Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2 text-amber-950">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Digital Asset Risk Disclosure</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Virtual asset operations carry market variance. Payout timelines for fiat settlements depend on banking rails (IMPS / UPI) and network confirmations. By using the platform, users agree to adhere to applicable digital asset and taxation guidelines in their respective jurisdictions.
            </p>
          </div>

          {/* Legal Entity Details Card */}
          <div className="fintech-card p-4 bg-slate-900 text-slate-200 space-y-3 border border-slate-800">
            <div className="flex items-center gap-2 text-white font-black text-xs">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Registered Corporate Entity</span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-1">
              <p><strong>Entity:</strong> Juspay Institutional FinTech Ltd.</p>
              <p><strong>CIN:</strong> U72200KA2012PTC065184 • <strong>CR:</strong> 1010-849201</p>
              <p><strong>HQ:</strong> St. Marks Road, Central Business District, Bengaluru 560001, India.</p>
              <p><strong>Regional Hub:</strong> DIFC Gate Precinct 4, Level 5, Dubai, United Arab Emirates.</p>
            </div>
          </div>

        </div>
      )}

      {/* Institutional Legal & Support Footer */}
      <div className="pt-2 text-center text-[10px] text-slate-400 space-y-1">
        <p>© 2026 Juspay Institutional Vault. Cross-Border Liquidity & High-Yield Infrastructure.</p>
      </div>

    </div>
  );
};

export default DownloadScreen;
