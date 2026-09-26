import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Wallet, 
  ShieldCheck, 
  ShieldAlert,
  AlertCircle, 
  CheckCircle2,
  Plus,
  Lock,
  Clock,
  Info,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OtpVerificationModal } from '../components/OtpVerificationModal';
import { GatewayLogoBadge } from './ToolWalletScreen';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const WithdrawalScreen: React.FC = () => {
  const { 
    currentUser, 
    stats,
    isAuthenticated, 
    setIsAuthModalOpen, 
    userWallets, 
    paymentGateways,
    transactions,
    getAffiliateCommissions,
    submitWithdrawal, 
    sendEmailOTP,
    refreshUserProfile,
    setActiveScreen, 
    showToast,
    isKycGateModalOpen,
    setIsKycGateModalOpen,
    openKycModal
  } = useApp();

  const [amount, setAmount] = useState<string>('500');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    userWallets.length > 0 ? userWallets[0].id : ''
  );
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [modalDebugOtp, setModalDebugOtp] = useState<string | undefined>(undefined);
  const [modalApiError, setModalApiError] = useState<string | undefined>(undefined);

  // Freshly synchronize user profile and dynamic withdrawal status from PostgreSQL on mount
  useEffect(() => {
    if (isAuthenticated && currentUser.id !== 'guest') {
      refreshUserProfile().catch(() => {});
    }
  }, [isAuthenticated, currentUser.id]);

  // Check dynamically for active pending or processing withdrawal (Strictly 1 at a time rule)
  const activePendingWithdrawal = transactions.find(
    t => (String(t.user_id) === String(currentUser.id) || t.user_email === currentUser.email) &&
         (t.type === 'Withdrawal' || String(t.type).toUpperCase() === 'WITHDRAWAL') &&
         ['pending', 'processing', 'in_review'].includes(String(t.status).toLowerCase())
  );
  const hasActiveWithdrawal = Boolean(activePendingWithdrawal || currentUser.has_active_withdrawal);
  const activeOrderId = activePendingWithdrawal?.order_id || activePendingWithdrawal?.tx_id || activePendingWithdrawal?.id || currentUser.active_pending_order;
  const activeAmount = activePendingWithdrawal?.amount || activePendingWithdrawal?.amount_inr || currentUser.withdrawal_balance || 0;

  const parsedAmount = parseFloat(amount) || 0;
  const boundWallets = userWallets.filter(w => w.user_id === currentUser.id);

  const safeGateways = Array.isArray(paymentGateways) ? paymentGateways : [];
  const selectedWallet = boundWallets.find(w => w.id === selectedWalletId);
  const matchedGateway = selectedWallet 
    ? safeGateways.find(g => 
        g && (
          g.name.toLowerCase().includes(selectedWallet.provider_name.toLowerCase()) || 
          selectedWallet.provider_name.toLowerCase().includes(g.name.toLowerCase())
        )
      )
    : null;

  const minPayout = stats.min_withdraw || (matchedGateway?.min_payout_inr ?? matchedGateway?.payout_min ?? 500);
  const maxPayout = stats.max_withdraw || (matchedGateway?.max_payout_inr ?? matchedGateway?.payout_max ?? 200000);
  const withdrawFee = stats.withdraw_fee || stats.withdrawal_fee || 500;
  const userCards = Number(currentUser.usdt_cards_balance ?? currentUser.usdt_selling_cards ?? currentUser.selling_cards ?? 0);

  const handleInitiateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || currentUser.id === 'guest') {
      setIsAuthModalOpen(true);
      showToast('Please log in with email OTP to withdraw funds.');
      return;
    }

    const currentKycStatus = String(currentUser.kyc_status || 'NOT_SUBMITTED').toUpperCase();
    if (currentKycStatus !== 'VERIFIED') {
      setIsKycGateModalOpen(true);
      return;
    }

    if (hasActiveWithdrawal) {
      showToast(`You already have an active pending withdrawal (Order: ${activeOrderId || 'Active'}). Strictly 1 withdrawal at a time. Please wait for admin processing.`);
      return;
    }
    if (userCards < 1) {
      showToast('Insufficient USDT Selling Cards. At least 1 card is required to initiate a withdrawal');
      return;
    }
    if (boundWallets.length === 0) {
      showToast('Please link a payout account (UPI / Paytm / PhonePe) before withdrawing.');
      setActiveScreen('tool');
      return;
    }
    if (parsedAmount <= 0) {
      showToast('Please enter a valid withdrawal amount.');
      return;
    }
    if (parsedAmount < minPayout) {
      showToast(`Minimum withdrawal amount is ₹${minPayout.toLocaleString('en-IN')}.`);
      return;
    }
    if (parsedAmount > maxPayout) {
      showToast(`Maximum single withdrawal limit is ₹${maxPayout.toLocaleString('en-IN')}.`);
      return;
    }
    if (parsedAmount > Number(currentUser.vault_balance ?? 0)) {
      showToast('Withdrawal amount exceeds your available balance.');
      return;
    }

    triggerConfirmSound();
    setIsSendingOtp(true);
    try {
      // Send 6-digit OTP code to user's registered Gmail
      const res = await sendEmailOTP(currentUser.email, 'WITHDRAWAL');
      if (res.success) {
        setModalDebugOtp(undefined);
        setModalApiError(undefined);
        setIsOtpModalOpen(true);
      } else {
        showToast(res.message || 'Failed to dispatch withdrawal OTP.');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to dispatch withdrawal OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpVerified = async (verifiedCode: string) => {
    const pinOrOtp = currentUser.security_pin || verifiedCode;
    const res = await submitWithdrawal(parsedAmount, selectedWalletId, pinOrOtp);
    if (res.success) {
      triggerSuccessSound();
      setActiveScreen('home');
    } else {
      showToast(res.message);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-1">
        <button
          onClick={() => {
            triggerCancelSound();
            setActiveScreen('profile');
          }}
          className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-slate-700 shadow-xs border border-slate-200 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>Payout & Withdrawal</span>
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold text-[9px] rounded border border-blue-200">
              IMPS / UPI
            </span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">Direct settlement to verified banking & UPI tools</p>
        </div>
      </div>

      {/* Active Pending Notice Banner */}
      {hasActiveWithdrawal && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1.5 text-xs w-full">
            <div className="font-bold text-amber-950 flex items-center justify-between">
              <span className="text-sm font-extrabold">Withdrawal in Progress</span>
              <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-mono font-bold text-[10px] rounded">
                Processing
              </span>
            </div>
            <p className="text-amber-900 font-semibold text-xs">
              Order <span className="font-mono">#{activeOrderId || 'WTH-99896'}</span> is currently being verified.
            </p>
            <ul className="text-[11px] text-amber-800 space-y-1 pt-0.5 list-disc list-inside">
              <li>Estimated processing time: Under 1 hour</li>
              <li>For security, additional withdrawal requests are paused until your active payout is completed.</li>
              <li>Please ensure your linked payout account is active and verified to prevent delays.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Available Balance Card */}
      {(() => {
        const userTxs = transactions.filter(t => 
          String(t.user_id) === String(currentUser.id) || 
          String(t.userId) === String(currentUser.id) ||
          (t.user_email && currentUser.email && t.user_email.toLowerCase() === currentUser.email.toLowerCase())
        );

        const totalDeposits = userTxs
          .filter(t => (t.type === 'Deposit' || t.type === 'deposit') && ['completed', 'approved', 'successful', 'settled'].includes(String(t.status || '').toLowerCase()))
          .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0);

        const totalTaskRewards = userTxs
          .filter(t => {
            const typeStr = String(t.type || '').toLowerCase();
            const descStr = String(t.description || '').toLowerCase();
            const statusStr = String(t.status || '').toLowerCase();
            const isSettled = ['completed', 'approved', 'successful', 'settled'].includes(statusStr);
            if (!isSettled) return false;

            // Exclude team commissions, referrals, cashback and order claims from task rewards
            const isComm = typeStr.includes('commission') || typeStr.includes('referral') || descStr.includes('commission');
            const isCashback = typeStr.includes('cashback') || typeStr.includes('claim') || descStr.includes('cashback') || descStr.includes('claim');
            if (isComm || isCashback) return false;

            return (
              typeStr === 'bonus' || 
              typeStr === 'reward' || 
              typeStr === 'reward_redemption' || 
              typeStr === 'points_redemption' || 
              typeStr === 'points redeem' ||
              typeStr.includes('redeem') || 
              typeStr.includes('task') ||
              typeStr.includes('bonus') ||
              descStr.includes('redeemed') ||
              descStr.includes('points')
            );
          })
          .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0);

        const dynamicCommissions = getAffiliateCommissions(currentUser.id);
        const totalCommissions = Math.max(
          userTxs
            .filter(t => (
              t.type === 'commission' || 
              t.type === 'Referral Commission' || 
              t.type === 'REFERRAL_L1' ||
              t.type === 'REFERRAL_L2' ||
              t.type === 'REFERRAL_L3' ||
              t.tier === 'level_a' || 
              t.tier === 'level_b' || 
              t.tier === 'level_c' || 
              String(t.type).toLowerCase().includes('commission') || 
              String(t.type).toLowerCase().includes('referral') || 
              String(t.notes || '').toLowerCase().includes('commission') || 
              String(t.description || '').toLowerCase().includes('commission')
            ) && ['completed', 'approved', 'successful', 'settled'].includes(String(t.status || '').toLowerCase()))
            .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0),
          dynamicCommissions,
          Number(currentUser.total_commissions || 0),
          Number(currentUser.affiliate_commission_total || 0),
          Number(currentUser.commission_balance || 0),
          Number(currentUser.total_ref_earning || 0)
        );

        const totalCashback = userTxs
          .filter(t => {
            const typeStr = String(t.type || '').toLowerCase();
            const descStr = String(t.description || '').toLowerCase();
            const statusStr = String(t.status || '').toLowerCase();
            const isSettled = ['completed', 'approved', 'successful', 'settled'].includes(statusStr);
            if (!isSettled) return false;

            return (
              typeStr === 'claim' ||
              typeStr === 'cashback_reward' ||
              typeStr === 'cashback' ||
              typeStr === 'order_claim' ||
              typeStr.includes('cashback') ||
              typeStr.includes('claim') ||
              descStr.includes('cashback') ||
              descStr.includes('claimed')
            );
          })
          .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0);

        const totalWithdrawals = userTxs
          .filter(t => (t.type === 'Withdrawal' || t.type === 'withdrawal') && ['pending', 'processing', 'in_review', 'completed', 'approved', 'successful', 'settled'].includes(String(t.status || '').toLowerCase()))
          .reduce((sum, t) => sum + (Number(t.amount || t.amount_inr) || 0), 0);

        let computedVaultBalance = (totalDeposits + totalTaskRewards + totalCashback + totalCommissions) - totalWithdrawals;
        const rawInrVal = Number(currentUser.vault_balance ?? 0);

        // Authoritative balance is max of rawInrVal (backend ledger) and computedVaultBalance (frontend aggregation)
        const liveVaultBalance = (currentUser.vault_balance !== undefined && currentUser.vault_balance !== null && !isNaN(rawInrVal))
          ? (rawInrVal > 0 && Math.abs(rawInrVal - computedVaultBalance) < 0.01 ? rawInrVal : Math.max(rawInrVal, computedVaultBalance))
          : Math.max(0, computedVaultBalance);

        return (
          <div className="fintech-card p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wide">Available Vault Balance</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 mt-0.5 block tabular-nums">
                ₹{liveVaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <ArrowUpRight className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        );
      })()}

      {/* Slim Compact Selling Cards Banner & Fee Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="px-3 py-2 bg-gradient-to-r from-indigo-50/90 via-purple-50/40 to-indigo-50/60 border border-indigo-100/80 rounded-xl flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 border border-emerald-400">
              ₮
            </div>
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="text-[11px] font-bold text-slate-900 truncate">Cards:</span>
              <span className="font-mono text-[11px] font-black text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded-md">
                {userCards} Left
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveScreen('profile')}
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
          >
            <span>Claim Cards</span>
          </button>
        </div>

        <div className="px-3 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              ₹
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-800 block leading-tight">Withdrawal Processing Fee</span>
              <span className="text-xs font-mono font-extrabold text-amber-900">
                ₹{withdrawFee.toLocaleString('en-IN')} / payout
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
            Fixed Fee
          </span>
        </div>
      </div>

      {/* KYC Verification Gate Banner */}
      {String(currentUser.kyc_status || 'NOT_SUBMITTED').toUpperCase() !== 'VERIFIED' && (
        <div className={`p-4 rounded-2xl border ${
          String(currentUser.kyc_status || '').toUpperCase() === 'PENDING'
            ? 'bg-amber-50/90 border-amber-300 text-amber-900'
            : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED'
              ? 'bg-rose-50/90 border-rose-300 text-rose-900'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
        } space-y-3 shadow-xs`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              String(currentUser.kyc_status || '').toUpperCase() === 'PENDING'
                ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
                : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED'
                  ? 'bg-rose-100 text-rose-700 border-rose-300'
                  : 'bg-emerald-100 text-emerald-700 border-emerald-300'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black">
                {String(currentUser.kyc_status || '').toUpperCase() === 'PENDING'
                  ? 'Verification Under Review'
                  : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED'
                    ? 'Verification Incomplete'
                    : 'KYC Verification Required'}
              </h4>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {String(currentUser.kyc_status || '').toUpperCase() === 'PENDING'
                  ? 'Your identity documents are currently pending manual approval by our compliance desk. Withdrawals will unlock immediately after approval.'
                  : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED'
                    ? 'Your KYC was rejected. Please review your details and resubmit valid documents.'
                    : 'To protect your funds and comply with financial standards, you must complete identity verification before initiating payouts.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (String(currentUser.kyc_status || '').toUpperCase() === 'PENDING') {
                setIsKycGateModalOpen(true);
              } else {
                openKycModal();
              }
            }}
            className={`w-full py-2.5 rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer ${
              String(currentUser.kyc_status || '').toUpperCase() === 'PENDING'
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {String(currentUser.kyc_status || '').toUpperCase() === 'PENDING' 
              ? 'Got It' 
              : String(currentUser.kyc_status || '').toUpperCase() === 'REJECTED' 
                ? 'Re-verify KYC' 
                : 'Complete KYC Now'}
          </button>
        </div>
      )}

      {/* Withdrawal Form */}
      <form onSubmit={handleInitiateWithdrawal} className="fintech-card p-4 space-y-4">
        
        {/* Select Destination Wallet */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-900">
              Select Verified Payout Handle
            </label>
            <button
              type="button"
              onClick={() => setActiveScreen('tool')}
              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Link New Account</span>
            </button>
          </div>

          {boundWallets.length === 0 ? (
            <div className="fintech-card-soft p-3 rounded-xl border border-amber-200 text-center space-y-2">
              <p className="text-xs text-amber-900 font-semibold">No payout account linked yet</p>
              <p className="text-[11px] text-slate-600">Link your UPI ID, Paytm, or PhonePe account to receive withdrawals.</p>
              <button
                type="button"
                onClick={() => setActiveScreen('tool')}
                className="fintech-btn-primary px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Link Payout Account Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {boundWallets.map((wallet) => (
                <label
                  key={wallet.id}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedWalletId === wallet.id
                      ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payoutWallet"
                      value={wallet.id}
                      checked={selectedWalletId === wallet.id}
                      onChange={() => {
                        triggerSwitchSound();
                        setSelectedWalletId(wallet.id);
                      }}
                      disabled={hasActiveWithdrawal}
                      className="text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                    />
                    <GatewayLogoBadge
                      providerName={wallet.provider_name}
                      size="sm"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{wallet.provider_name}</span>
                      <span className="text-[11px] font-mono text-slate-600">{wallet.account_number}</span>
                      <span className="text-[10px] text-slate-500 block">Holder: {wallet.holder_name}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs font-bold text-slate-900 block mb-1">
            Withdrawal Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={hasActiveWithdrawal}
              placeholder="e.g. 500"
              min="50"
              className="w-full fintech-inset pl-8 pr-3.5 py-2.5 text-base font-bold font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-60 disabled:bg-slate-100"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 mt-2">
            {['500', '1000', '5000', '25000', '100000', '200000'].map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={hasActiveWithdrawal}
                onClick={() => {
                  triggerSwitchSound();
                  setAmount(preset);
                }}
                className={`py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  amount === preset
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          {/* Breakdown Card with Fee (Always Visible) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between items-center">
              <span>Withdrawal Amount:</span>
              <span className="font-mono font-bold text-slate-900">
                {parsedAmount > 0 ? `₹${parsedAmount.toLocaleString('en-IN')}` : '₹0 (Enter amount)'}
              </span>
            </div>
            <div className="flex justify-between items-center text-amber-700">
              <span>Withdrawal Processing Fee:</span>
              <span className="font-mono font-bold">- ₹{withdrawFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-emerald-800 pt-1.5 border-t border-slate-200">
              <span>Net Settlement Amount:</span>
              <span className="font-mono text-sm text-emerald-700">
                ₹{parsedAmount > 0 ? Math.max(0, parsedAmount - withdrawFee).toLocaleString('en-IN') : '0'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium mt-2 pt-1 border-t border-slate-100">
            <span>Withdrawal Limits & Fee:</span>
            <span className="font-mono font-bold text-slate-700">
              ₹{minPayout.toLocaleString('en-IN')} - ₹{maxPayout.toLocaleString('en-IN')} • Fee: ₹{withdrawFee}
            </span>
          </div>
        </div>

        {/* USDT Selling Cards Status Banner */}
        {userCards < 1 ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-bold text-rose-900 flex items-center justify-between">
                <span>Insufficient USDT Selling Cards (0 Owned)</span>
                <button
                  type="button"
                  onClick={() => setActiveScreen('profile')}
                  className="text-indigo-600 hover:text-indigo-800 underline font-extrabold cursor-pointer text-[11px]"
                >
                  Claim Cards →
                </button>
              </div>
              <p className="text-rose-700 leading-relaxed text-[11px]">
                At least 1 USDT Selling Card is required to initiate a withdrawal. Claim your free daily selling card from your Profile screen to proceed.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-emerald-950">USDT Selling Cards Available:</span>
            </div>
            <span className="px-2 py-0.5 bg-emerald-600 text-white font-mono font-black text-xs rounded-lg">
              {userCards} Owned
            </span>
          </div>
        )}

        {/* Institutional SLA Notice */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Settlement Policy & 2FA Security</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Payout requests are processed within 24 hours via automated IMPS / UPI bank rails. A 6-digit authorization code will be sent to your Gmail ({currentUser.email}) to verify this transfer.
          </p>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          whileHover={hasActiveWithdrawal || userCards < 1 || boundWallets.length === 0 ? {} : { scale: 1.01 }}
          whileTap={hasActiveWithdrawal || userCards < 1 || boundWallets.length === 0 ? {} : { scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          disabled={boundWallets.length === 0 || parsedAmount <= 0 || isSendingOtp || userCards < 1 || hasActiveWithdrawal}
          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 select-none shadow-xs transition-all ${
            hasActiveWithdrawal
              ? 'bg-amber-100 border border-amber-300 text-amber-900 cursor-not-allowed'
              : 'fintech-btn-emerald text-white cursor-pointer disabled:opacity-50'
          }`}
        >
          {hasActiveWithdrawal ? (
            <>
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Withdrawal Locked (Order #{activeOrderId || 'Active'} in Review)</span>
            </>
          ) : isSendingOtp ? (
            <>
              <Clock className="w-4 h-4 animate-spin" />
              <span>Sending Gmail OTP...</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Authorize Payout (Requires Gmail OTP)</span>
            </>
          )}
        </motion.button>

      </form>

      {/* Gmail OTP Verification Modal for Withdrawal */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        email={currentUser.email}
        purpose="WITHDRAWAL"
        title="Authorize Withdrawal"
        description={`A 6-digit security code has been sent to your Gmail to authorize payout of ₹${parsedAmount.toLocaleString('en-IN')}.`}
        initialDebugOtp={modalDebugOtp}
        initialApiError={modalApiError}
        additionalDetails={{
          amountINR: parsedAmount,
          accountLabel: selectedWallet ? `${selectedWallet.provider_name} (${selectedWallet.account_number})` : undefined
        }}
        onVerified={handleOtpVerified}
      />

    </div>
  );
};
