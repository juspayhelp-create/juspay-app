import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCcw, 
  Loader2, 
  X,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  triggerConfirmSound, 
  triggerCancelSound, 
  triggerSwitchSound, 
  triggerSuccessSound,
  triggerHaptic
} from '../utils/haptics';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: 'pin' | 'email';
}

export const SecurityPinUpdateModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'pin'
}) => {
  const { currentUser, showToast, syncUserPin, refreshUserProfile } = useApp();

  // Active Security Operation Tab: 'pin' | 'email'
  const [activeTab, setActiveTab] = useState<'pin' | 'email'>('pin');

  // ==========================================
  // TAB 1: PIN UPDATE STATES & STEPPER
  // ==========================================
  const [pinStep, setPinStep] = useState<'verify' | 'set_pin' | 'success'>('verify');
  const [pinOtpCode, setPinOtpCode] = useState<string>('');
  const [isSendingPinOtp, setIsSendingPinOtp] = useState<boolean>(false);
  const [pinOtpCountdown, setPinOtpCountdown] = useState<number>(0);
  const [isPinOtpSent, setIsPinOtpSent] = useState<boolean>(false);
  const [isVerifyingPinOtp, setIsVerifyingPinOtp] = useState<boolean>(false);
  const [pinOtpError, setPinOtpError] = useState<string | null>(null);
  const [simulatedPinCode, setSimulatedPinCode] = useState<string | null>(null);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // ==========================================
  // TAB 2: EMAIL UPDATE STATES & STEPPER
  // ==========================================
  const [emailStep, setEmailStep] = useState<'input' | 'verify' | 'success'>('input');
  const [newEmail, setNewEmail] = useState<string>('');
  const [authSecurityPin, setAuthSecurityPin] = useState<string>('');
  const [showAuthSecurityPin, setShowAuthSecurityPin] = useState<boolean>(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState<boolean>(false);
  const [emailOtpCountdown, setEmailOtpCountdown] = useState<number>(0);
  const [emailRequestError, setEmailRequestError] = useState<string | null>(null);
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState<boolean>(false);
  const [emailVerifyError, setEmailVerifyError] = useState<string | null>(null);
  const [simulatedEmailCode, setSimulatedEmailCode] = useState<string | null>(null);

  // Reset modal state upon opening
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);

      // Reset PIN states
      setPinStep('verify');
      setPinOtpCode('');
      setIsSendingPinOtp(false);
      setIsVerifyingPinOtp(false);
      setPinOtpError(null);
      setSimulatedPinCode(null);
      setVerificationToken(null);
      setNewPin('');
      setConfirmPin('');
      setShowNewPin(false);
      setShowConfirmPin(false);
      setIsUpdatingPin(false);
      setPinError(null);

      // Reset Email states
      setEmailStep('input');
      setNewEmail('');
      setAuthSecurityPin('');
      setShowAuthSecurityPin(false);
      setIsSendingEmailOtp(false);
      setEmailRequestError(null);
      setEmailOtpCode('');
      setEmailOtpCountdown(0);
      setIsVerifyingEmailOtp(false);
      setEmailVerifyError(null);
      setSimulatedEmailCode(null);
    }
  }, [isOpen, initialTab]);

  // Timers for countdowns
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (pinOtpCountdown > 0) {
      timer = setInterval(() => {
        setPinOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pinOtpCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailOtpCountdown > 0) {
      timer = setInterval(() => {
        setEmailOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailOtpCountdown]);

  if (!isOpen) return null;

  const currentEmail = currentUser?.email || 'user@juspay.io';

  // ==========================================
  // TAB 1 HANDLERS: PIN UPDATE
  // ==========================================
  const handleSendPinOtp = async () => {
    if (pinOtpCountdown > 0 || isSendingPinOtp) return;
    setIsSendingPinOtp(true);
    setPinOtpError(null);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': currentEmail,
      };

      const res = await fetch('/api/user/security-pin/request-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: currentEmail,
          userId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsPinOtpSent(true);
        setPinOtpCountdown(60);
        showToast(`Verification code dispatched to ${currentEmail}`);
        if (data.simulatedCode) {
          setSimulatedPinCode(data.simulatedCode);
        }
      } else {
        setPinOtpError(data.error || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err: any) {
      setPinOtpError('Network error connecting to verification server.');
    } finally {
      setIsSendingPinOtp(false);
    }
  };

  const handleVerifyPinOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = pinOtpCode.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setPinOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    triggerConfirmSound();
    setIsVerifyingPinOtp(true);
    setPinOtpError(null);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': currentEmail,
      };

      const res = await fetch('/api/user/security-pin/verify-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: currentEmail,
          userId: currentUser?.id,
          otp: cleanOtp
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerSuccessSound();
        setVerificationToken(data.verificationToken);
        showToast('Email verified! You can now set your new Security PIN.');
        setPinStep('set_pin');
      } else {
        setPinOtpError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setPinOtpError('Network error during code verification.');
    } finally {
      setIsVerifyingPinOtp(false);
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmPin.trim();

    if (cleanNew.length !== 6 || !/^\d{6}$/.test(cleanNew)) {
      setPinError('Security PIN must be exactly 6 numeric digits.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setPinError('New PIN and Confirm PIN do not match.');
      return;
    }

    if (!verificationToken) {
      setPinError('OTP session is missing or expired. Please verify OTP again.');
      setPinStep('verify');
      return;
    }

    triggerConfirmSound();
    setIsUpdatingPin(true);
    setPinError(null);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': currentEmail,
      };

      const res = await fetch('/api/user/security-pin/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          verificationToken,
          newPin: cleanNew,
          confirmPin: cleanConfirm
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        syncUserPin(currentEmail, cleanNew);
        triggerSuccessSound();
        setPinStep('success');
        showToast('Security PIN updated successfully!');
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        setPinError(data.error || 'Failed to update Security PIN.');
      }
    } catch (err: any) {
      setPinError('Network error updating Security PIN.');
    } finally {
      setIsUpdatingPin(false);
    }
  };

  // ==========================================
  // TAB 2 HANDLERS: EMAIL ID UPDATE
  // ==========================================
  const handleRequestEmailChange = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSendingEmailOtp) return;

    setEmailRequestError(null);
    const cleanNewEmail = newEmail.trim().toLowerCase();
    const cleanPin = authSecurityPin.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanNewEmail || !emailRegex.test(cleanNewEmail)) {
      triggerHaptic('error');
      setEmailRequestError('Please enter a valid new email address.');
      return;
    }

    if (cleanNewEmail === currentEmail.toLowerCase()) {
      triggerHaptic('error');
      setEmailRequestError('New email address must be different from your current email.');
      return;
    }

    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      triggerHaptic('error');
      setEmailRequestError('Security PIN must be exactly 6 numeric digits.');
      return;
    }

    triggerConfirmSound();
    triggerHaptic('medium');
    setIsSendingEmailOtp(true);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': currentEmail
      };

      const res = await fetch('/api/user/request-email-change', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          newEmail: cleanNewEmail,
          securityPin: cleanPin
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        triggerSuccessSound();
        triggerHaptic('success');
        setEmailStep('verify');
        setEmailOtpCountdown(60);
        setEmailVerifyError(null);
        if (data.simulatedCode) {
          setSimulatedEmailCode(data.simulatedCode);
        }
        showToast(data.message || `Verification code sent to ${cleanNewEmail}`);
      } else {
        triggerHaptic('error');
        setEmailRequestError(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setEmailRequestError('Network error connecting to verification server. Please try again.');
    } finally {
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailChangeOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingEmailOtp) return;

    setEmailVerifyError(null);
    const cleanOtp = emailOtpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      triggerHaptic('error');
      setEmailVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    triggerConfirmSound();
    triggerHaptic('medium');
    setIsVerifyingEmailOtp(true);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': currentEmail
      };

      const res = await fetch('/api/user/verify-email-change', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          otp: cleanOtp
        })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        triggerSuccessSound();
        triggerHaptic('success');

        if (data.token) {
          localStorage.setItem('juspay_auth_token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        localStorage.setItem('juspay_active_user', JSON.stringify(data.user));
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        setEmailStep('success');
        showToast('Email address updated successfully!');

        try {
          await refreshUserProfile();
        } catch (_) {}

        if (onSuccess) onSuccess();

        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        triggerHaptic('error');
        setEmailVerifyError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setEmailVerifyError('Network error verifying code. Please try again.');
    } finally {
      setIsVerifyingEmailOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm fintech-card p-5 shadow-2xl border border-slate-200 relative space-y-4">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerCancelSound();
            onClose();
          }}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Account Security</h3>
              <p className="text-[11px] text-slate-500 font-medium">Manage Security PIN & Email ID</p>
            </div>
          </div>

          {/* Security Tabs Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mt-2.5">
            <button
              type="button"
              onClick={() => {
                triggerSwitchSound();
                setActiveTab('pin');
              }}
              className={`py-1.5 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'pin'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-teal-600" />
              <span>Security PIN</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerSwitchSound();
                setActiveTab('email');
              }}
              className={`py-1.5 text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              <span>Update Email</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: SECURITY PIN MANAGEMENT                           */}
        {/* ======================================================== */}
        {activeTab === 'pin' && (
          <div className="space-y-4">
            
            {/* Step Breadcrumb */}
            {pinStep !== 'success' && (
              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <div className={`flex items-center gap-1 text-[11px] font-bold ${pinStep === 'verify' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${pinStep === 'verify' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    1
                  </span>
                  <span>Email OTP</span>
                </div>
                <div className="flex-1 h-0.5 bg-slate-200" />
                <div className={`flex items-center gap-1 text-[11px] font-bold ${pinStep === 'set_pin' ? 'text-emerald-700' : 'text-slate-400'}`}>
                  <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${pinStep === 'set_pin' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    2
                  </span>
                  <span>New 6-Digit PIN</span>
                </div>
              </div>
            )}

            {/* PIN Step 1: Verify OTP */}
            {pinStep === 'verify' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Registered Email:</span>
                    <span className="font-mono font-bold text-slate-900 truncate max-w-[170px]">{currentEmail}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    A one-time verification passcode will be sent to your registered email to authorize this PIN change.
                  </p>
                </div>

                {pinOtpError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-snug">{pinOtpError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleSendPinOtp}
                    disabled={isSendingPinOtp || pinOtpCountdown > 0}
                    className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                      pinOtpCountdown > 0
                        ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isSendingPinOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : pinOtpCountdown > 0 ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        <span>Resend in {pinOtpCountdown}s</span>
                      </>
                    ) : isPinOtpSent ? (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Resend OTP Code</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Send OTP to Email</span>
                      </>
                    )}
                  </button>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-800">Enter 6-Digit OTP</label>
                      {simulatedPinCode && (
                        <button
                          type="button"
                          onClick={() => setPinOtpCode(simulatedPinCode)}
                          className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                        >
                          Autofill: {simulatedPinCode}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={pinOtpCode}
                        onChange={e => setPinOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full text-center tracking-[10px] font-mono text-xl font-black fintech-inset py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl"
                      />
                      {pinOtpCode.length === 6 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerCancelSound();
                      onClose();
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyPinOtp}
                    disabled={isVerifyingPinOtp || pinOtpCode.length !== 6}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isVerifyingPinOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify OTP</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PIN Step 2: Set New PIN */}
            {pinStep === 'set_pin' && (
              <form onSubmit={handleSaveNewPin} className="space-y-3.5">
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center gap-2 text-emerald-900 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Identity verified. Enter your new 6-digit numeric PIN below.</span>
                </div>

                {pinError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-snug">{pinError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    New 6-Digit PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6 digits"
                      className="w-full text-center tracking-[10px] font-mono text-lg font-black fintech-inset py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPin(!showNewPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Confirm New PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPin ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter 6 digits"
                      className="w-full text-center tracking-[10px] font-mono text-lg font-black fintech-inset py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPin(!showConfirmPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPin && confirmPin && newPin === confirmPin && (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>PINs match</span>
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerCancelSound();
                      setPinStep('verify');
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPin || newPin.length !== 6 || confirmPin.length !== 6 || newPin !== confirmPin}
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isUpdatingPin ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating PIN...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Save New PIN</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* PIN Step 3: Success */}
            {pinStep === 'success' && (
              <div className="py-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Security PIN Updated!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your new 6-digit PIN has been saved securely to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: UPDATE EMAIL ID OPTION                            */}
        {/* ======================================================== */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            
            {/* Step 1: Input New Email & Security PIN */}
            {emailStep === 'input' && (
              <form onSubmit={handleRequestEmailChange} className="space-y-3.5">
                
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Current Email
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 truncate block max-w-[200px]">
                      {currentEmail}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>

                {emailRequestError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-snug">{emailRequestError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>New Email ID</span>
                    <span className="text-[10px] font-normal text-slate-400">OTP code will be sent here</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={e => {
                        setNewEmail(e.target.value);
                        if (emailRequestError) setEmailRequestError(null);
                      }}
                      placeholder="Enter new email address"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      required
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Security PIN (6 Digits)</span>
                    <span className="text-[10px] font-normal text-slate-400">Authorize change</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showAuthSecurityPin ? 'text' : 'password'}
                      value={authSecurityPin}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setAuthSecurityPin(val);
                        if (emailRequestError) setEmailRequestError(null);
                      }}
                      placeholder="••••••"
                      maxLength={6}
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowAuthSecurityPin(!showAuthSecurityPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAuthSecurityPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerCancelSound();
                      onClose();
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmailOtp || !newEmail || authSecurityPin.length !== 6}
                    className={`flex-1 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                      isSendingEmailOtp || !newEmail || authSecurityPin.length !== 6
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                    }`}
                  >
                    {isSendingEmailOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Verify OTP sent to new email */}
            {emailStep === 'verify' && (
              <form onSubmit={handleVerifyEmailChangeOtp} className="space-y-3.5">
                
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Code Sent To
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 truncate block max-w-[190px]">
                      {newEmail}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      triggerSwitchSound();
                      setEmailStep('input');
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {simulatedEmailCode && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                    <span className="text-[11px] text-amber-800 font-medium">
                      Test OTP Code: <strong className="font-mono text-xs font-bold text-amber-900">{simulatedEmailCode}</strong>
                    </span>
                  </div>
                )}

                {emailVerifyError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span className="leading-snug">{emailVerifyError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Enter 6-Digit Verification Code</span>
                    <span className="text-[10px] font-normal text-slate-400">Valid 10 mins</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={emailOtpCode}
                      onChange={e => {
                        setEmailOtpCode(e.target.value.replace(/\D/g, ''));
                        if (emailVerifyError) setEmailVerifyError(null);
                      }}
                      placeholder="••••••"
                      className="w-full text-center tracking-[10px] font-mono text-xl font-black fintech-inset py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerSwitchSound();
                      setEmailStep('input');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestEmailChange}
                    disabled={emailOtpCountdown > 0 || isSendingEmailOtp}
                    className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${
                      emailOtpCountdown > 0 || isSendingEmailOtp
                        ? 'text-slate-400 cursor-not-allowed'
                        : 'text-emerald-700 hover:text-emerald-900'
                    }`}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isSendingEmailOtp ? 'animate-spin' : ''}`} />
                    <span>{emailOtpCountdown > 0 ? `Resend (${emailOtpCountdown}s)` : 'Resend Code'}</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      triggerCancelSound();
                      onClose();
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingEmailOtp || emailOtpCode.length !== 6}
                    className={`flex-1 py-2.5 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                      isVerifyingEmailOtp || emailOtpCode.length !== 6
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                    }`}
                  >
                    {isVerifyingEmailOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Email Success Confirmation */}
            {emailStep === 'success' && (
              <div className="py-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Email ID Updated!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your account is now linked to <strong className="font-mono text-slate-800">{newEmail}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
