import React, { useState } from 'react';
import { Copy, Check, LogIn, User as UserIcon, ShieldCheck, ShieldAlert, Clock, Bell } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from './JuspayLogo';
import { triggerHaptic, triggerSwitchSound, triggerConfirmSound } from '../utils/haptics';

export const Header: React.FC<{ onOpenNotifications: () => void }> = ({ onOpenNotifications }) => {
  const { 
    currentUser, 
    isAuthenticated, 
    stats, 
    showToast, 
    setIsAuthModalOpen,
    setActiveScreen,
    openKycModal,
    unreadNotificationCount,
    notifications
  } = useApp();
  const [copied, setCopied] = useState(false);

  // Dynamic KYC Status derived directly from user database record / state
  const rawKycStatus = String(currentUser?.kyc_status || 'NOT_SUBMITTED').trim().toUpperCase();
  const isKycVerified = rawKycStatus === 'VERIFIED' || rawKycStatus === 'APPROVED';
  const isKycPending = rawKycStatus === 'PENDING' || rawKycStatus === 'SUBMITTED' || rawKycStatus === 'UNDER_REVIEW';

  // Calculate active unread items (notifications + active SLA notices)
  const activeAnnouncements = (stats.global_announcements || []).filter(a => a.is_active);
  let readNoticeIds: string[] = [];
  try {
    const saved = localStorage.getItem('juspay_read_notice_ids');
    if (saved) readNoticeIds = JSON.parse(saved);
  } catch {}
  const unreadNoticeCount = activeAnnouncements.filter(a => !readNoticeIds.includes(a.id)).length;
  const userUnreadNotifs = notifications.filter(n => n.user_id === currentUser.id && !n.is_read).length;
  const totalUnreadCount = (unreadNotificationCount !== undefined ? unreadNotificationCount : userUnreadNotifs) + unreadNoticeCount;

  const copyUserId = () => {
    if (!isAuthenticated || currentUser.id === 'guest') {
      triggerSwitchSound();
      setIsAuthModalOpen(true);
      return;
    }
    triggerConfirmSound();
    navigator.clipboard.writeText(currentUser.referral_code || currentUser.id);
    setCopied(true);
    showToast(`Account ID ${currentUser.referral_code} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNotifs = () => {
    triggerSwitchSound();
    onOpenNotifications();
  };

  const handleProfileClick = () => {
    triggerSwitchSound();
    setActiveScreen('profile');
  };

  const handleKycClick = () => {
    triggerSwitchSound();
    if (openKycModal) openKycModal();
    else setActiveScreen('profile');
  };

  return (
    <header className="sticky top-0 z-30 bg-white px-4 py-2.5 border-b border-slate-200 shadow-xs">
      <div className="max-w-md mx-auto space-y-2">
        
        {/* Top Mini Trust Bar with Juspay Vault Logo & Live Status */}
        <div className="flex items-center justify-between text-[11px] text-slate-700 font-medium px-0.5 border-b border-slate-200 pb-1.5">
          <div className="flex items-center gap-1.5 text-emerald-950 font-bold juspay-logo-trigger cursor-pointer select-none active:scale-95 transition-transform" title="Juspay Vault">
            <JuspayLogo size={20} />
            <div className="flex items-center gap-1">
              <span className="tracking-tight text-slate-900 font-black">juspay</span>
              <span className="text-[10px] bg-slate-900 text-emerald-400 px-1.5 py-0.2 rounded font-black tracking-wider uppercase border border-slate-800">
                VAULT
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-extrabold text-[11px] text-slate-900">1 USDT = ₹{stats.realtime_exchange_rate || 109}</span>
            <span className="text-[9px] bg-emerald-100/90 text-emerald-950 px-1.5 py-0.5 rounded font-black border border-emerald-300">
              PEG
            </span>
          </div>
        </div>

        {/* Main User Identity & Actions Row */}
        <div className="flex items-center justify-between">
          
          {/* Left: Avatar & Verification Badge */}
          <div className="flex items-center gap-2.5">
            <div 
              onClick={handleProfileClick}
              className="relative cursor-pointer group hover:opacity-95 transition-all spring-press"
              title="Open Account Profile & Settings"
            >
              <div className={`w-9 h-9 rounded-full bg-slate-100 p-0.5 border ${isAuthenticated ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-300'} overflow-hidden flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                {isAuthenticated && currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-800">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isAuthenticated ? 'bg-emerald-600' : 'bg-slate-500'}`} />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                  {currentUser.username}
                </span>
                {isAuthenticated ? (
                  <div className="flex items-center gap-1">
                    {isKycVerified ? (
                      <span 
                        onClick={handleProfileClick}
                        className="px-1.5 py-0.2 bg-emerald-50 text-emerald-900 font-extrabold text-[8px] rounded border border-emerald-300 flex items-center gap-0.5 cursor-pointer shadow-2xs hover:bg-emerald-100 transition-colors spring-press"
                        title="KYC Verified"
                      >
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-700" />
                        <span>KYC VERIFIED</span>
                      </span>
                    ) : isKycPending ? (
                      <span 
                        onClick={handleKycClick}
                        className="px-1.5 py-0.2 bg-amber-50 text-amber-900 font-extrabold text-[8px] rounded border border-amber-300 flex items-center gap-0.5 cursor-pointer shadow-2xs hover:bg-amber-100 transition-colors spring-press"
                        title="KYC Pending Compliance Review - Tap to view status"
                      >
                        <Clock className="w-2.5 h-2.5 text-amber-700 animate-spin" />
                        <span>KYC PENDING</span>
                      </span>
                    ) : (
                      <span 
                        onClick={handleKycClick}
                        className="px-1.5 py-0.2 bg-orange-50 text-orange-900 font-extrabold text-[8px] rounded border border-orange-200 flex items-center gap-0.5 cursor-pointer shadow-2xs hover:bg-orange-100 transition-colors spring-press"
                        title="KYC Unverified - Tap to complete verification"
                      >
                        <ShieldAlert className="w-2.5 h-2.5 text-orange-600" />
                        <span>KYC UNVERIFIED</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 font-bold text-[9px] rounded-md border border-slate-200">
                    Guest Mode
                  </span>
                )}
              </div>

              {isAuthenticated ? (
                <button
                  onClick={copyUserId}
                  className="flex items-center gap-1 text-[11px] text-slate-700 hover:text-slate-950 transition-colors mt-0.5 font-medium cursor-pointer spring-press active:scale-95"
                >
                  <span>UID: <strong className="text-slate-900 font-mono font-bold">{currentUser.referral_code}</strong></span>
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-700" />
                  ) : (
                    <Copy className="w-3 h-3 text-slate-600" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setIsAuthModalOpen(true);
                  }}
                  className="text-[11px] text-emerald-800 hover:text-emerald-950 font-bold hover:underline mt-0.5 block cursor-pointer"
                >
                  Secure Login with Email OTP →
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions (Global Notifications / Notices Icon & Sign In) */}
          <div className="flex items-center gap-2">
            
            {/* Global Notifications & Notices Icon Button */}
            <button
              type="button"
              onClick={handleOpenNotifs}
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950 border border-slate-200 transition-all cursor-pointer shadow-2xs group active:scale-90 spring-press flex items-center justify-center"
              title="Official Notices & System Alerts"
              aria-label="View Notices & Notifications"
            >
              <Bell className="w-4 h-4 transition-transform group-hover:rotate-12 text-slate-700 group-hover:text-slate-950" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs border-2 border-white animate-pulse font-mono">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </button>

            {!isAuthenticated && (
              <button
                onClick={() => {
                  triggerHaptic('selection');
                  setIsAuthModalOpen(true);
                }}
                className="fintech-btn-emerald px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer spring-press active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
