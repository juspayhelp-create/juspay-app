import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Coins, 
  Headphones, 
  KeyRound, 
  LogOut, 
  LogIn,
  User as UserIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Award,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getISTResetTimestamps, isClaimedInCurrentISTCycle, computeServerAnchoredCountdown } from '../utils/time';
import { KycVerificationCard } from '../components/KycVerificationCard';
import { SecurityPinUpdateModal } from '../components/SecurityPinUpdateModal';
import { UserGuideModal } from '../components/UserGuideModal';
import { 
  triggerHaptic, 
  triggerConfirmSound, 
  triggerCancelSound, 
  triggerSwitchSound, 
  triggerSuccessSound
} from '../utils/haptics';

export const ProfileScreen: React.FC<{ onOpenNotifications?: () => void }> = ({ onOpenNotifications }) => {
  const { 
    currentUser, 
    isAuthenticated,
    logout, 
    setActiveScreen, 
    updateSecurityPin, 
    claimSellingCard,
    claimSignupCards,
    claimCards,
    getAffiliateCommissions,
    showToast,
    setIsAuthModalOpen,
    isKycModalOpen,
    setIsKycModalOpen,
    triggerWithdrawalCheck
  } = useApp();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isClaimingCards, setIsClaimingCards] = useState(false);
  const [, setTimerTick] = useState(0);
  const [serverAnchor, setServerAnchor] = useState<{
    serverTimeUtcMs: number;
    nextResetUtcMs: number;
    receivedAtPerfNow: number;
    canClaimWelcome?: boolean;
    canClaimDaily?: boolean;
    alreadyClaimedToday?: boolean;
    cardsBalance?: number;
  } | null>(null);

  const fetchCardStatus = async () => {
    if (!isAuthenticated || currentUser.id === 'guest') return;
    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser.id),
        'x-user-email': currentUser.email,
      };
      const res = await fetch(`/api/cards/status?userId=${encodeURIComponent(currentUser.id)}&email=${encodeURIComponent(currentUser.email)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setServerAnchor({
            serverTimeUtcMs: data.server_time_utc_ms,
            nextResetUtcMs: data.next_reset_utc_ms,
            receivedAtPerfNow: performance.now(),
            canClaimWelcome: data.can_claim_welcome,
            canClaimDaily: data.can_claim_daily,
            alreadyClaimedToday: data.already_claimed_today,
            cardsBalance: data.usdt_cards_balance,
          });
        }
      }
    } catch {
      // fallback to local calculations
    }
  };

  useEffect(() => {
    fetchCardStatus();
  }, [isAuthenticated, currentUser.id]);

  // Live countdown ticker to dynamically update time remaining to 11:00 PM IST every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClaimCards = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    const alreadyClaimed = serverAnchor?.alreadyClaimedToday !== undefined
      ? serverAnchor.alreadyClaimedToday
      : isClaimedInCurrentISTCycle(currentUser.last_claim_cycle_epoch || currentUser.last_card_claimed_at || currentUser.last_card_claim_timestamp);
    const canClaimSignup = serverAnchor?.canClaimWelcome !== undefined
      ? serverAnchor.canClaimWelcome
      : !Boolean(currentUser.welcome_cards_claimed || currentUser.has_claimed_signup_cards || currentUser.signup_cards_claimed);

    if (!canClaimSignup && alreadyClaimed) {
      triggerHaptic('warning');
      const { countdownText } = computeServerAnchoredCountdown(serverAnchor);
      showToast(`USDT selling card already claimed for this daily cycle. The next card will unlock after the 11:00 PM IST nightly reset (in ${countdownText}).`);
      return;
    }

    triggerConfirmSound();
    triggerHaptic('medium');
    setIsClaimingCards(true);
    try {
      await claimCards();
      triggerSuccessSound();
      await fetchCardStatus();
    } catch {
      triggerHaptic('error');
    } finally {
      setIsClaimingCards(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      
      {/* Profile Info Header Card */}
      <div className="fintech-card p-5 relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-xl bg-slate-100 p-0.5 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
            {isAuthenticated && currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.username}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <UserIcon className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900 truncate">
                {currentUser.username}
              </h2>
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-bold text-[9px] rounded border border-emerald-200">
                    VIP {currentUser.points > 500 ? '2' : '1'}
                  </span>
                </div>
              ) : (
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 font-bold text-[9px] rounded">
                  Logged Out
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 truncate mt-0.5 font-mono">
              {isAuthenticated ? currentUser.email : 'Not logged in'}
            </p>

            <span className="text-[11px] text-slate-600 block mt-0.5">
              {isAuthenticated ? (
                <>Referral Code: <strong className="text-emerald-700 font-mono font-bold">{currentUser.referral_code}</strong></>
              ) : (
                <span>Sign in to manage vault</span>
              )}
            </span>
          </div>
        </div>

        {/* Quick Deposit & Withdrawal Button Bar */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveScreen('deposit');
            }}
            className="fintech-btn-emerald py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-xs spring-press"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit USDT</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              triggerWithdrawalCheck(() => setActiveScreen('withdraw'));
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer spring-press"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Withdraw Funds</span>
          </button>
        </div>
      </div>

      {/* 1. Asset Cards: Deposit, Withdraw, Commission */}
      <div className="grid grid-cols-3 gap-2.5">
        
        {/* Deposit Balance */}
        <div 
          onClick={() => {
            triggerHaptic('light');
            setActiveScreen('deposit');
          }}
          className="fintech-card p-3 text-center cursor-pointer hover:border-emerald-300 transition-all spring-press group"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-1 border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Deposit</span>
          <span className="text-xs font-extrabold font-mono text-slate-900 block mt-0.5 truncate tabular-nums">
            ₹{currentUser.deposit_balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
        </div>

        {/* Withdraw Balance */}
        <div 
          onClick={() => {
            triggerHaptic('light');
            triggerWithdrawalCheck(() => setActiveScreen('withdraw'));
          }}
          className="fintech-card p-3 text-center cursor-pointer hover:border-amber-300 transition-all spring-press group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-1 border border-amber-100 group-hover:bg-amber-100 transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Withdraw</span>
          <span className="text-xs font-extrabold font-mono text-slate-900 block mt-0.5 truncate tabular-nums">
            ₹{currentUser.withdrawal_balance.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
          </span>
        </div>

        {/* Commission Balance */}
        <div 
          onClick={() => {
            triggerHaptic('light');
            setActiveScreen('team');
          }}
          className="fintech-card p-3 text-center cursor-pointer hover:border-purple-300 transition-all spring-press group"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center mx-auto mb-1 border border-purple-100 group-hover:bg-purple-100 transition-colors">
            <Award className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Commission</span>
          <span className="text-xs font-extrabold font-mono text-purple-800 block mt-0.5 truncate tabular-nums">
            ₹{getAffiliateCommissions(currentUser.id).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

      </div>

      {/* Selling Cards System & Daily Claim Widget (11:00 PM IST Reset) */}
      {(() => {
        const { countdownText, shortCountdownText, msUntilReset, hoursUntil, minutesUntil } = computeServerAnchoredCountdown(serverAnchor);
        const isTimeExpired = msUntilReset <= 0;
        const canClaimSignup = serverAnchor?.canClaimWelcome !== undefined
          ? serverAnchor.canClaimWelcome
          : !Boolean(currentUser.welcome_cards_claimed || currentUser.has_claimed_signup_cards || currentUser.signup_cards_claimed);
        const rawAlreadyClaimed = serverAnchor?.alreadyClaimedToday !== undefined
          ? serverAnchor.alreadyClaimedToday
          : isClaimedInCurrentISTCycle(currentUser.last_claim_cycle_epoch || currentUser.last_card_claimed_at || currentUser.last_card_claim_timestamp);
        
        const alreadyClaimed = rawAlreadyClaimed && !isTimeExpired;
        const ownedCards = serverAnchor?.cardsBalance !== undefined
          ? serverAnchor.cardsBalance
          : Number(currentUser.usdt_cards_balance ?? currentUser.usdt_selling_cards ?? currentUser.selling_cards ?? 0);

        return (
          <div className="fintech-card p-4 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0 border border-emerald-400">
                ₮
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-900">USDT Selling Cards</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-black rounded-full">
                    {ownedCards} Owned
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {canClaimSignup 
                    ? 'Claim your 2 free USDT selling cards to start trading & withdrawing.'
                    : (alreadyClaimed
                        ? `Daily card claimed. Next claim window unlocks at 11:00 PM IST (in ${hoursUntil}h ${minutesUntil}m).`
                        : 'Required 1 card per USDT sale. Daily claim resets strictly at 11:00 PM IST.')}
                </p>
              </div>
            </div>

            <button
              onClick={handleClaimCards}
              disabled={(!canClaimSignup && alreadyClaimed) || isClaimingCards}
              className={`w-full sm:w-auto px-4 py-2 text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                (!canClaimSignup && alreadyClaimed) || isClaimingCards
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95 cursor-pointer'
              }`}
            >
              <span>
                {isClaimingCards 
                  ? 'Claiming...'
                  : canClaimSignup 
                    ? 'Claim USDT Selling Cards (+2)' 
                    : (alreadyClaimed ? `Locked (${countdownText})` : 'Claim Daily Card (+1)')}
              </span>
            </button>
          </div>
        );
      })()}

      {/* Indian Identity KYC Verification Card (Render ONLY if NOT_SUBMITTED, REJECTED, or PENDING; completely unmount when VERIFIED) */}
      {(String(currentUser.kyc_status || 'NOT_SUBMITTED').toUpperCase() !== 'VERIFIED' || isKycModalOpen) && (
        <KycVerificationCard 
          isOpen={isKycModalOpen} 
          onOpenChange={setIsKycModalOpen} 
          hideBannerWhenVerified={true}
        />
      )}

      {/* 2. Streamlined Services & Security Grid (6 Key Utility Modules in balanced 3x2 grid) */}
      <div className="fintech-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
            Platform Security & Services
          </span>
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Vault Desk</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          
          {/* 1. Wallet / Payouts */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setActiveScreen('tool');
            }}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-emerald-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition-transform">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">Payout Tools</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">UPI & Bank</span>
          </button>

          {/* 2. Integral / Rewards */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setActiveScreen('task');
            }}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-amber-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">Integral Hub</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Daily Rewards</span>
          </button>

          {/* 3. Identity KYC Shortcut */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setIsKycModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-emerald-700 flex items-center justify-center mb-1.5 border border-emerald-300 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">KYC Status</span>
            <span className="text-[9px] font-black text-emerald-700 mt-0.5">
              {currentUser.kyc_status === 'VERIFIED' ? 'Verified' : currentUser.kyc_status === 'PENDING' ? 'In Review' : 'Verify'}
            </span>
          </button>

          {/* 4. 24/7 Desk */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setActiveScreen('service');
            }}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-blue-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">24/7 Desk</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Live Help</span>
          </button>

          {/* 5. Security PIN */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setIsPinModalOpen(true);
            }}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-teal-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">Security PIN</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Update PIN</span>
          </button>

          {/* 6. User Guide */}
          <button
            onClick={() => {
              triggerSwitchSound();
              setIsTutorialOpen(true);
            }}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center group transition-all active:scale-95 cursor-pointer spring-press shadow-2xs"
          >
            <div className="w-9 h-9 rounded-xl bg-white shadow-xs text-purple-700 flex items-center justify-center mb-1.5 border border-slate-200 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">User Guide</span>
            <span className="text-[9px] text-slate-500 font-medium mt-0.5">Rules & FAQ</span>
          </button>

        </div>
      </div>

      {/* 3. Footer: Session Actions & Clearance Access */}
      <div className="pt-2 text-center space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {isAuthenticated ? (
            <button
              id="logout-btn"
              onClick={() => {
                triggerCancelSound();
                logout();
              }}
              className="fintech-card px-4 py-2.5 text-xs font-bold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs rounded-xl spring-press"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Session</span>
            </button>
          ) : (
            <button
              id="login-profile-btn"
              onClick={() => {
                triggerSwitchSound();
                setIsAuthModalOpen(true);
              }}
              className="fintech-card px-4 py-2.5 text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:bg-emerald-50 border border-emerald-200 inline-flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-xs rounded-xl spring-press"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In with Email OTP</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-500 font-medium select-none">
          <span>juspay Institutional Client • </span>
          <span className="font-mono text-slate-700 font-bold">
            v1.2.3
          </span>
        </div>
      </div>

      {/* Security PIN Change Modal with Email OTP Verification */}
      <SecurityPinUpdateModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)}
        onUpdatePin={updateSecurityPin}
      />

      {/* Complete Platform & Earning User Guide Walkthrough Modal */}
      <UserGuideModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

    </div>
  );
};
