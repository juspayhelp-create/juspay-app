import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  Users, 
  Gift,
  Eye, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from '../components/JuspayLogo';
import { formatISTTimestamp } from '../utils/time';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound } from '../utils/haptics';

interface HomeScreenProps {
  onOpenNotifications?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const { 
    currentUser, 
    isAuthenticated,
    transactions, 
    stats, 
    getAffiliateCommissions,
    setActiveScreen, 
    setIsAuthModalOpen,
    showToast,
    refreshUserProfile,
    triggerWithdrawalCheck
  } = useApp();

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedTx, setCopiedTx] = useState<string | null>(null);

  useEffect(() => {
    refreshUserProfile?.();
  }, []);

  useEffect(() => {
    if (isDetailModalOpen) {
      refreshUserProfile?.();
    }
  }, [isDetailModalOpen]);

  // User transactions
  const userTxs = transactions
    .filter(t => {
      if (!t) return false;
      const matchId = (t.user_id && String(t.user_id) === String(currentUser?.id)) || (t.userId && String(t.userId) === String(currentUser?.id));
      const matchEmail = t.user_email && currentUser?.email && t.user_email.toLowerCase() === currentUser.email.toLowerCase();
      if (currentUser?.id && currentUser?.id !== 'guest') {
        return matchId || matchEmail;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.createdAt || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.createdAt || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  const recentTxs = userTxs.slice(0, 5);

  const totalPaidWithdrawals = userTxs
    .filter(t => t.type === 'Withdrawal' && ['completed', 'approved', 'successful', 'settled'].includes(String(t.status || '').toLowerCase()))
    .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0);

  const totalInflowAmount = Number(
    currentUser?.total_inflow ??
    currentUser?.deposit_balance ??
    currentUser?.total_deposit ??
    userTxs
      .filter(t => (t.type === 'Deposit' || t.type === 'deposit') && ['completed', 'approved', 'successful', 'settled'].includes(String(t.status || '').toLowerCase()))
      .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0)
  );

  const filteredModalTxs = filterType === 'all' 
    ? userTxs 
    : userTxs.filter(t => t.type.toLowerCase() === filterType.toLowerCase());

  const handleCopyTx = (txId: string) => {
    triggerConfirmSound();
    navigator.clipboard.writeText(txId);
    setCopiedTx(txId);
    showToast(`Transaction reference #${txId} copied`);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (['completed', 'approved', 'successful', 'settled'].includes(s)) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          <span>Settled</span>
        </span>
      );
    }
    if (['pending', 'processing', 'in_review'].includes(s)) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
          <Clock className="w-3 h-3 text-amber-700" />
          <span>Processing</span>
        </span>
      );
    }
    if (['rejected', 'failed', 'cancelled'].includes(s)) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-900 border border-rose-300 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-700" />
          <span>Failed</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-800 border border-slate-200">
        {status}
      </span>
    );
  };

  const affiliateEarningsSum = typeof getAffiliateCommissions === 'function'
    ? (typeof getAffiliateCommissions(currentUser?.id) === 'number'
        ? (getAffiliateCommissions(currentUser?.id) as number)
        : (Array.isArray(getAffiliateCommissions(currentUser?.id))
            ? (getAffiliateCommissions(currentUser?.id) as any[]).reduce((acc, curr) => acc + (Number(curr.amount || curr.amount_inr) || 0), 0)
            : 0))
    : 0;
  const totalCommissions = Number(currentUser?.total_commissions ?? currentUser?.total_ref_earning ?? affiliateEarningsSum ?? 0);

  const liveInrBalance = Math.max(0, Number(
    currentUser?.vault_balance ?? 
    currentUser?.available_balance ?? 
    currentUser?.inr_balance ?? 
    ((currentUser?.wallet_balance || 0) * (stats.realtime_exchange_rate || 109)) ?? 
    0
  ));

  const tradingVolume = Number(
    currentUser?.sell_balance ??
    currentUser?.total_turnover ??
    liveInrBalance
  );

  const effectiveRate = Number(stats.realtime_exchange_rate || 109);
  const usdtEquivalent = effectiveRate > 0 ? (liveInrBalance / effectiveRate).toFixed(2) : '0.00';

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      
      {/* 1. Live Notice / Announcement Bar */}
      {stats.sla_banner_enabled !== false && (() => {
        const activeAnnouncements = (stats.global_announcements || []).filter(a => a.is_active);
        const marqueeText = activeAnnouncements.length > 0
          ? activeAnnouncements.map(a => `${a.badge ? `[${a.badge}] ` : ''}${a.message}`).join('   •••   ')
          : (stats.global_announcement || 'Official Settlement Gateway: Guaranteed Fixed 1 USDT = 109 INR • 24/7 Fast Payouts & Automated Settlements.');
        const badgeLabel = stats.sla_badge_text || 'SLA NOTICE';

        return (
          <div className="bg-slate-900 text-slate-100 rounded-xl px-3.5 py-2.5 border border-slate-800 flex items-center gap-2.5 overflow-hidden shadow-xs">
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-[10px] shrink-0 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{badgeLabel}</span>
            </div>
            <div className="overflow-hidden w-full whitespace-nowrap">
              <div className="animate-marquee text-slate-200 font-semibold text-[11px]">
                {marqueeText}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Guest Mode Banner when Logged Out */}
      {!isAuthenticated && (
        <div className="fintech-card p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-300 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs border border-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">Sign in to Access Your Vault</p>
              <p className="text-[11px] text-slate-700 font-medium truncate">Authenticate with Email OTP to trade and withdraw funds.</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="fintech-btn-emerald px-3.5 py-2 text-white text-xs font-bold rounded-lg flex-shrink-0 cursor-pointer shadow-xs"
          >
            Sign In
          </button>
        </div>
      )}

      {/* 2. Dark Navy Hero Card ("TOTAL AVAILABLE VAULT") */}
      <div className="fintech-card-navy p-5 relative overflow-hidden space-y-4">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0f_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0f_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />
        <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none transform rotate-12 scale-125">
          <JuspayLogo size={140} />
        </div>
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <JuspayLogo size={20} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  TOTAL AVAILABLE VAULT
                </span>
              </div>
            </div>
            
            <button
              onClick={() => {
                triggerSwitchSound();
                setIsDetailModalOpen(true);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-300" />
              <span>Statement</span>
            </button>
          </div>

          {/* Primary INR Balance */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-400">₹</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono tabular-nums">
              {liveInrBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>

          {/* Peg Equivalence Tag */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-mono font-bold">
              ≈ {usdtEquivalent} USDT
            </span>
            <span className="text-[10px] font-black bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-600">
              Fixed 1:{stats.realtime_exchange_rate || 109} Peg
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <motion.button
              id="hero-deposit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => {
                triggerSwitchSound();
                setActiveScreen('deposit');
              }}
              className="py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer border border-emerald-400 select-none"
            >
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5] text-slate-950" />
              <span>Deposit USDT</span>
            </motion.button>

            <motion.button
              id="hero-withdraw-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => {
                triggerSwitchSound();
                triggerWithdrawalCheck(() => setActiveScreen('withdraw'));
              }}
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer select-none"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Withdraw INR</span>
            </motion.button>
          </div>

          {/* Sub-Metrics: Commissions & Trading Volume */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wider truncate">
                COMMISSIONS
              </span>
              <strong className="text-xs font-extrabold font-mono text-amber-300 truncate block">
                ₹{totalCommissions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/60 text-right">
              <span className="text-[9px] text-slate-400 block font-extrabold uppercase tracking-wider truncate">
                TRADING VOLUME
              </span>
              <strong className="text-xs font-extrabold font-mono text-emerald-400 truncate block">
                ₹{tradingVolume.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Inflow / Outflow Split Row */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="fintech-card p-3 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>TOTAL INFLOW</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1">
            <strong className="text-sm font-black font-mono text-slate-900 block">
              ₹{totalInflowAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <span className="text-[9px] text-slate-500">Verified Deposits</span>
          </div>
        </div>

        <div className="fintech-card p-3 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>PAID WITHDRAWAL</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="mt-1">
            <strong className="text-sm font-black font-mono text-slate-900 block">
              ₹{Number(currentUser?.total_paid_withdrawals ?? totalPaidWithdrawals ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <span className="text-[9px] text-emerald-700 font-semibold">Settled to Bank / UPI</span>
          </div>
        </div>
      </div>

      {/* 4. Quick Service Actions 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        
        {/* Action 1: Deposit USDT */}
        <button
          type="button"
          onClick={() => {
            triggerSwitchSound();
            setActiveScreen('deposit');
          }}
          className="fintech-card p-3.5 text-left group hover:border-emerald-400 transition-all cursor-pointer shadow-xs bg-white spring-press hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300">
              ₹{stats.realtime_exchange_rate || 109}.00
            </span>
          </div>
          <span className="text-xs font-black text-slate-900 block leading-tight">Deposit USDT</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">TRC20 & BEP20 Networks</span>
        </button>

        {/* Action 2: Withdraw INR */}
        <button
          type="button"
          onClick={() => {
            triggerSwitchSound();
            triggerWithdrawalCheck(() => setActiveScreen('withdraw'));
          }}
          className="fintech-card p-3.5 text-left group hover:border-emerald-400 transition-all cursor-pointer shadow-xs bg-white spring-press hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">
              UPI / IMPS
            </span>
          </div>
          <span className="text-xs font-black text-slate-900 block leading-tight">Withdraw INR</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Instant Bank Settlement</span>
        </button>

        {/* Action 3: Task Rewards */}
        <button
          type="button"
          onClick={() => {
            triggerSwitchSound();
            setActiveScreen('task');
          }}
          className="fintech-card p-3.5 text-left group hover:border-amber-400 transition-all cursor-pointer shadow-xs bg-white spring-press hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Gift className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
              +₹6,300 Cash
            </span>
          </div>
          <span className="text-xs font-black text-slate-900 block leading-tight">Task Rewards</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Claim Cash & Points</span>
        </button>

        {/* Action 4: Affiliate Team */}
        <button
          type="button"
          onClick={() => {
            triggerSwitchSound();
            setActiveScreen('team');
          }}
          className="fintech-card p-3.5 text-left group hover:border-blue-400 transition-all cursor-pointer shadow-xs bg-white spring-press hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-extrabold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded border border-blue-300">
              3-Tier System
            </span>
          </div>
          <span className="text-xs font-black text-slate-900 block leading-tight">Affiliate Team</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Earn Multi-Level Rebates</span>
        </button>
      </div>

      {/* 5. Recent Vault Activity Feed */}
      <div className="fintech-card p-4 space-y-3 bg-white border border-slate-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-700" />
            <span>Recent Vault History</span>
          </h3>
          <button
            onClick={() => setIsDetailModalOpen(true)}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            <span>Full Statement</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTxs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-600">
              <p className="font-semibold text-slate-800">No recent settlements on record</p>
              <p className="text-[11px] text-slate-600 mt-0.5">Your confirmed deposits and withdrawals will appear here.</p>
            </div>
          ) : (
            recentTxs.map((tx) => (
              <div key={tx.id || tx.order_id || Math.random()} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    tx.type === 'Deposit' || tx.type === 'deposit'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : tx.type === 'Withdrawal' || tx.type === 'withdrawal'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {tx.type === 'Deposit' || tx.type === 'deposit' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : tx.type === 'Withdrawal' || tx.type === 'withdrawal' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Gift className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 capitalize">{tx.type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        #{String(tx.order_id || tx.tx_id || tx.id).slice(-6)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {formatISTTimestamp(tx.created_at || tx.createdAt || tx.timestamp)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <span className={`font-mono font-black text-xs block ${
                    tx.type === 'Withdrawal' || tx.type === 'withdrawal' ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {tx.type === 'Withdrawal' || tx.type === 'withdrawal' ? '-' : '+'}₹{Number(tx.amount || tx.amount_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div>{getStatusBadge(tx.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Statement Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 max-h-[85vh] flex flex-col border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <JuspayLogo size={22} />
                <h3 className="font-black text-base text-slate-900">Vault Settlement Statement</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  triggerCancelSound();
                  setIsDetailModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 shrink-0 overflow-x-auto">
              {['all', 'deposit', 'withdrawal', 'commission', 'bonus'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    triggerSwitchSound();
                    setFilterType(f);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                    filterType === f
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100 text-xs">
              {filteredModalTxs.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  No transaction records found for filter "{filterType}"
                </div>
              ) : (
                filteredModalTxs.map((tx) => (
                  <div key={tx.id || tx.order_id || Math.random()} className="pt-2.5 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">{tx.type}</span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono">
                        Ref: #{String(tx.order_id || tx.tx_id || tx.id)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {formatISTTimestamp(tx.created_at || tx.createdAt || tx.timestamp)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        ₹{Number(tx.amount || tx.amount_inr || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {tx.amount_usdt && (
                        <span className="text-[10px] text-slate-500 font-mono block">
                          ≈ {Number(tx.amount_usdt).toFixed(2)} USDT
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerCancelSound();
                setIsDetailModalOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs shrink-0 cursor-pointer"
            >
              Close Statement
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomeScreen;
