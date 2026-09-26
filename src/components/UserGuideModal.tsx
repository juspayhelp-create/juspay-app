import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Users, 
  Gift, 
  CreditCard, 
  KeyRound, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  ChevronRight, 
  Zap, 
  Coins, 
  Building2, 
  ShieldAlert,
  Award,
  DollarSign,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from './JuspayLogo';
import { triggerHaptic, triggerSwitchSound, triggerCancelSound } from '../utils/haptics';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const { stats, currentUser, isAuthenticated, setActiveScreen, openKycModal, setIsAuthModalOpen } = useApp();
  const [activeTab, setActiveTab] = useState<'overview' | 'earn' | 'signup' | 'deposit' | 'kyc' | 'tools' | 'withdraw' | 'faq'>('overview');

  if (!isOpen) return null;

  const pegRate = stats.realtime_exchange_rate || 109;
  const directRate = stats.direct_referral_rate || 4.0;
  const indirectRate = stats.indirect_referral_rate || 2.0;
  const l3Rate = stats.level_3_referral_rate || 1.0;

  const navigateTo = (screen: any) => {
    triggerHaptic('selection');
    onClose();
    setActiveScreen(screen);
  };

  const handleTabChange = (tabId: any) => {
    triggerSwitchSound();
    setActiveTab(tabId);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL TOP HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between sticky top-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-inner">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <JuspayLogo size={18} />
                  <span className="text-sm font-black tracking-tight text-white">juspay</span>
                  <span className="text-[9px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                    VAULT
                  </span>
                </div>
                <span className="text-[10px] bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                  User & Earning Guide
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Master complete platform features, daily earnings, deposit & fast withdrawals
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2 spring-press"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HORIZONTAL TAB NAVIGATION */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
          {[
            { id: 'overview', label: '🚀 Overview', badge: 'Start' },
            { id: 'earn', label: '💰 How to Earn', badge: 'High Yield' },
            { id: 'signup', label: '📝 Sign Up & PIN' },
            { id: 'deposit', label: '📥 Deposit USDT', badge: `₹${pegRate}` },
            { id: 'kyc', label: '🛡️ Identity KYC' },
            { id: 'tools', label: '💳 Payout Tools' },
            { id: 'withdraw', label: '💸 Withdrawals' },
            { id: 'faq', label: '❓ Rules & FAQ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 spring-press ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MODAL BODY CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-700 text-xs leading-relaxed">

          {/* ==================== TAB 1: OVERVIEW ==================== */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Highlight Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 text-white border border-emerald-800/40 relative overflow-hidden shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      Institutional Liquidity Network
                    </div>
                    <h3 className="text-base font-black text-white tracking-tight">
                      Welcome to Juspay Vault Liquidity Platform
                    </h3>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Juspay Vault connects global cryptocurrency liquidity with Indian domestic UPI / IMPS banking rails. Users earn guaranteed daily profits through pegged USDT arbitrage, daily selling card claims, and multi-level affiliate commissions.
                    </p>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Peg Rate</span>
                    <span className="text-2xl font-black font-mono text-white">1 USDT</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono block">= ₹{pegRate} INR</span>
                  </div>
                </div>
              </div>

              {/* 6-Step Quick Road Map */}
              <div className="fintech-card p-4 space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Your 6-Step Success Roadmap
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Sign Up with Email OTP</strong>
                      <span className="text-slate-500 text-[11px]">Register and set your 6-digit transaction Security PIN for vault protection.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Claim 2 Welcome Cards</strong>
                      <span className="text-slate-500 text-[11px]">Instantly receive 2 free USDT Selling Cards upon account registration.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Verify Identity (KYC)</strong>
                      <span className="text-slate-500 text-[11px]">Upload Aadhaar, PAN, DL, or Passport for high limit instant approvals.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Deposit USDT (TRC20 / BEP20)</strong>
                      <span className="text-slate-500 text-[11px]">Convert USDT at locked 1 USDT = ₹{pegRate} with zero gas/conversion fees.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Bind Payout UPI / Tools</strong>
                      <span className="text-slate-500 text-[11px]">Add GooglePay, Paytm, PhonePe, or Bank for seamless payouts.</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">6</div>
                    <div>
                      <strong className="text-slate-900 text-xs block">Fast Direct Withdrawals</strong>
                      <span className="text-slate-500 text-[11px]">Withdraw your principal + profit directly to your Indian bank or UPI within SLA.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setActiveTab('earn')}
                  className="fintech-btn-emerald flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Explore All Earning Methods</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* ==================== TAB 2: HOW TO EARN ==================== */}
          {activeTab === 'earn' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-700" />
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">4 Core Income Streams</h4>
                    <p className="text-[11px] text-emerald-800">Combine all streams to maximize your daily income.</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-full">
                  Zero Loss Model
                </span>
              </div>

              {/* Stream 1: USDT Selling Cards */}
              <div className="fintech-card p-4 space-y-2 border-l-4 border-l-emerald-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                      1
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">USDT Selling Cards & Daily Free Claims</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-[10px] border border-emerald-200">
                    Highest Yield
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  USDT Selling Cards authorize automated algorithmic liquidity orders. When an order matches, your USDT is sold at prime institutional rates, yielding immediate cash returns credited straight to your withdrawable balance.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">🎁 Welcome Gift (+2 Cards):</strong>
                    <span className="text-slate-600">Every new user can claim 2 free USDT selling cards immediately on the Profile page.</span>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <strong className="text-slate-900 block">⏰ Daily Reset (+1 Card):</strong>
                    <span className="text-slate-600">Claim 1 free card every 24 hours. The claim resets nightly at <strong>11:00 PM IST sharp</strong>.</span>
                  </div>
                </div>
              </div>

              {/* Stream 2: Pegged Arbitrage Return */}
              <div className="fintech-card p-4 space-y-2 border-l-4 border-l-blue-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                      2
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">Guaranteed 1 USDT = ₹{pegRate} Peg Arbitrage</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-extrabold text-[10px] border border-blue-200">
                    Guaranteed Rate
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Standard crypto P2P markets fluctuate between ₹88 - ₹92. On Juspay Vault, your deposit is pegged at an institutional premium rate of <strong>₹{pegRate} per 1 USDT</strong>. You pocket the premium difference automatically on every deposit with 0% fee.
                </p>
              </div>

              {/* Stream 3: 3-Tier Multi-Level Affiliate Referral Program */}
              <div className="fintech-card p-4 space-y-2 border-l-4 border-l-purple-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-black text-xs flex items-center justify-center">
                      3
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">Automated 3-Tier Affiliate Commission</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-extrabold text-[10px] border border-purple-200">
                    Passive Income
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Share your unique Referral Code / Link with friends and trading groups. Earn continuous real-time commissions across 3 levels:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-[10px] text-purple-700 font-bold block uppercase">Level A (Direct)</span>
                    <span className="text-base font-black text-purple-900 font-mono">{directRate}%</span>
                    <span className="text-[9px] text-purple-600 block mt-0.5">Direct Invites</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-[10px] text-purple-700 font-bold block uppercase">Level B (Indirect)</span>
                    <span className="text-base font-black text-purple-900 font-mono">{indirectRate}%</span>
                    <span className="text-[9px] text-purple-600 block mt-0.5">Friends' Invites</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
                    <span className="text-[10px] text-purple-700 font-bold block uppercase">Level C (Extended)</span>
                    <span className="text-base font-black text-purple-900 font-mono">{l3Rate}%</span>
                    <span className="text-[9px] text-purple-600 block mt-0.5">Sub-network</span>
                  </div>
                </div>
              </div>

              {/* Stream 4: Daily Tasks & Integral Rewards */}
              <div className="fintech-card p-4 space-y-2 border-l-4 border-l-teal-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 font-black text-xs flex items-center justify-center">
                      4
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">Integral Points & VIP Level Boosts</h4>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-extrabold text-[10px] border border-teal-200">
                    VIP Perks
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Earn Integral Points on every transaction and daily task check-in. Accumulate points to climb from VIP 1 to VIP 5, unlocking reduced processing times and higher payout throughput.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => navigateTo('deposit')}
                  className="fintech-btn-emerald flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Start with USDT Deposit</span>
                </button>
                <button
                  onClick={() => navigateTo('team')}
                  className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Invite Friends</span>
                </button>
              </div>

            </div>
          )}

          {/* ==================== TAB 3: SIGN UP & PIN ==================== */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="fintech-card p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Sign Up & Security PIN Setup
                </h4>

                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">1. Email OTP Login:</strong>
                    <p className="text-slate-600 text-xs">
                      Enter your valid email address and click "Send OTP". A 6-digit verification code will be sent to your inbox. Enter the OTP to securely sign in without passwords.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">2. Referral Code Binding:</strong>
                    <p className="text-slate-600 text-xs">
                      If you were invited by an agent or partner, enter their 6-digit referral code upon signup to bind into their institutional team network.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">3. 6-Digit Transaction Security PIN:</strong>
                    <p className="text-slate-600 text-xs">
                      Your 6-digit PIN is strictly required for all withdrawals and sensitive vault operations. Never share your PIN with anyone. You can update or reset your PIN anytime via email OTP from the Profile settings.
                    </p>
                  </div>
                </div>
              </div>

              {!isAuthenticated && (
                <button
                  onClick={() => {
                    onClose();
                    setIsAuthModalOpen(true);
                  }}
                  className="fintech-btn-emerald w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>Sign Up / Log In Now</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* ==================== TAB 4: DEPOSIT USDT ==================== */}
          {activeTab === 'deposit' && (
            <div className="space-y-4">
              <div className="fintech-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    How to Deposit USDT
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-300">
                    1 USDT = ₹{pegRate}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">Step 1: Select Crypto Network</strong>
                    <p className="text-slate-600 text-xs">
                      Choose between <strong>USDT-TRC20 (Tron)</strong> or <strong>USDT-BEP20 (BNB Smart Chain)</strong>. Both networks offer low gas fees and ultra-fast blockchain confirmations.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">Step 2: Copy Vault Address or Scan QR</strong>
                    <p className="text-slate-600 text-xs">
                      Open your crypto wallet (Binance, Trust Wallet, OKX, Bybit, KuCoin, or Bitget). Scan the dynamic QR code or copy your designated deposit address.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">Step 3: Instant Automatic Conversion</strong>
                    <p className="text-slate-600 text-xs">
                      Once network confirmation occurs (usually 1-3 minutes), your USDT is automatically converted at ₹{pegRate}/USDT and credited directly to your deposit balance with zero manual approval wait times.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Important:</strong> Only send USDT to the matched network address (e.g. TRC20 to TRC20). Sending unsupported coins may lead to permanent loss.
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigateTo('deposit')}
                className="fintech-btn-emerald w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Go to Deposit Screen</span>
              </button>
            </div>
          )}

          {/* ==================== TAB 5: IDENTITY KYC ==================== */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <div className="fintech-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Indian Government Identity KYC
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold">
                    Status: {currentUser.kyc_status || 'UNVERIFIED'}
                  </span>
                </div>

                <p className="text-slate-600 text-xs">
                  Completing KYC unlocks institutional transaction limits, unrestricted daily withdrawals, and full access to high-volume order matching.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    🪪 Aadhaar Card
                    <span className="text-[10px] text-slate-500 font-normal block">Front + Back</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    💳 PAN Card
                    <span className="text-[10px] text-slate-500 font-normal block">Front Side</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    🚗 Driving License
                    <span className="text-[10px] text-slate-500 font-normal block">Front Side</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                    🛂 Passport
                    <span className="text-[10px] text-slate-500 font-normal block">Bio + Address</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Clear Photos:</strong> Ensure all 4 corners are visible with no glare or blur. Supported files: PNG, JPG, JPEG, PDF (max 5MB).</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Exact Name Match:</strong> Full Name entered in the form must match your official ID document.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Review Turnaround:</strong> Compliance audits take between 2 - 4 business hours. You can monitor the dynamic badge in the top header.</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  openKycModal();
                }}
                className="fintech-btn-emerald w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open KYC Verification Form</span>
              </button>
            </div>
          )}

          {/* ==================== TAB 6: PAYOUT TOOLS & UPI ==================== */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <div className="fintech-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    Binding Payment & Merchant Tools
                  </h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 font-extrabold text-[10px] border border-emerald-200">
                    Instant Payouts
                  </span>
                </div>

                <p className="text-slate-600 text-xs">
                  Bind your payout accounts to receive lightning-fast domestic withdrawals. Juspay Vault supports all major Indian payment gateways:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">Google Pay</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">PhonePe</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">Paytm</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">BharatPe</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">Freecharge</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">IndusPay</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">Navi UPI</div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">Bank IMPS/NEFT</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <strong className="text-slate-900 text-xs block">💡 Fast Payout Tip</strong>
                  <p className="text-slate-600 text-[11px]">
                    You can bind multiple UPI IDs and bank accounts to easily switch payout destinations when initiating withdrawals.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigateTo('tool')}
                className="fintech-btn-emerald w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Wallet className="w-4 h-4" />
                <span>Manage Payout Tools</span>
              </button>
            </div>
          )}

          {/* ==================== TAB 7: WITHDRAWALS ==================== */}
          {activeTab === 'withdraw' && (
            <div className="space-y-4">
              <div className="fintech-card p-4 space-y-3">
                <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  Instant Withdrawals & Settlement SLA
                </h4>

                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">1. Minimum & Maximum Limits:</strong>
                    <p className="text-slate-600 text-xs">
                      Withdrawal limits are displayed directly on the Withdraw screen. Institutional and verified KYC accounts enjoy higher daily transaction volume.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">2. 6-Digit PIN Authorization:</strong>
                    <p className="text-slate-600 text-xs">
                      To prevent unauthorized transfers, every withdrawal requires entering your 6-digit transaction Security PIN.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 text-xs block mb-1">3. Settlement SLA & Banking Rails:</strong>
                    <p className="text-slate-600 text-xs">
                      Withdrawals are routed via 24/7 automated UPI / IMPS fast rails. Normal processing time is between 5 to 30 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigateTo('withdraw')}
                className="fintech-btn-emerald w-full py-2.5 rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Go to Withdrawal Screen</span>
              </button>
            </div>
          )}

          {/* ==================== TAB 8: FAQ & RULES ==================== */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 text-xs block flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  When does the daily card claim reset?
                </strong>
                <p className="text-slate-600 text-[11px]">
                  The daily USDT Selling Card claim cycle resets every night at <strong>11:00 PM IST sharp</strong>. Make sure to claim your free daily card each cycle.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 text-xs block flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Is there any fee for depositing or withdrawing?
                </strong>
                <p className="text-slate-600 text-[11px]">
                  USDT deposits are completely 0% fee with guaranteed locked peg rates. Standard withdrawal processing fees (if applicable) are transparently displayed before PIN confirmation.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 text-xs block flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  How do affiliate referral commissions work?
                </strong>
                <p className="text-slate-600 text-[11px]">
                  Whenever any user registered under your referral code deposits or sells USDT, commissions ({directRate}% Level A, {indirectRate}% Level B, {l3Rate}% Level C) are immediately credited to your commission wallet and can be withdrawn directly.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 text-xs block flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  What should I do if my KYC is rejected?
                </strong>
                <p className="text-slate-600 text-[11px]">
                  If rejected, check the specific rejection reason displayed on your profile card (e.g. blurry image or mismatched name). Fix the issue and re-submit your photos anytime for immediate re-audit.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 text-xs block flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Need direct assistance?
                </strong>
                <p className="text-slate-600 text-[11px]">
                  Our 24/7 dedicated customer service desk is accessible via the "24/7 Desk" button on the profile page and bottom navigation.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-medium">
            <span>juspay Vault Protocol • v1.2.3</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
