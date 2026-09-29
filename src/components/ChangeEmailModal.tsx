import React, { useState, useEffect } from 'react';
import {
  Mail,
  KeyRound,
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

interface ChangeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangeEmailModal: React.FC<ChangeEmailModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, showToast, refreshUserProfile } = useApp();

  // Step 1: 'input' (New Email & Security PIN) | Step 2: 'verify' (OTP) | 'success'
  const [currentStep, setCurrentStep] = useState<'input' | 'verify' | 'success'>('input');

  // Step 1 Form States
  const [newEmail, setNewEmail] = useState<string>('');
  const [securityPin, setSecurityPin] = useState<string>('');
  const [showSecurityPin, setShowSecurityPin] = useState<boolean>(false);
  const [isSendingRequest, setIsSendingRequest] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Step 2 Form States
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Reset modal state upon opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('input');
      setNewEmail('');
      setSecurityPin('');
      setShowSecurityPin(false);
      setIsSendingRequest(false);
      setRequestError(null);
      setOtpCode('');
      setOtpCountdown(0);
      setIsVerifyingOtp(false);
      setVerifyError(null);
    }
  }, [isOpen]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  if (!isOpen) return null;

  const currentEmail = currentUser?.email || '';

  // Handler: Request Email Change & Send OTP
  const handleRequestEmailChange = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSendingRequest) return;

    setRequestError(null);
    const cleanNewEmail = newEmail.trim().toLowerCase();
    const cleanPin = securityPin.trim();

    // Validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanNewEmail || !emailRegex.test(cleanNewEmail)) {
      triggerHaptic('error');
      setRequestError('Please enter a valid new email address.');
      return;
    }

    if (cleanNewEmail === currentEmail.toLowerCase()) {
      triggerHaptic('error');
      setRequestError('New email address must be different from your current email.');
      return;
    }

    if (!cleanPin || cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      triggerHaptic('error');
      setRequestError('Security PIN must be exactly 6 numeric digits.');
      return;
    }

    triggerConfirmSound();
    triggerHaptic('medium');
    setIsSendingRequest(true);

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
        setCurrentStep('verify');
        setOtpCountdown(60);
        setVerifyError(null);
        showToast(data.message || `Verification code sent to ${cleanNewEmail}`);
      } else {
        triggerHaptic('error');
        setRequestError(data.error || 'Failed to send verification code. Please try again.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setRequestError('Network error connecting to verification server. Please try again.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  // Handler: Resend OTP
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isSendingRequest) return;
    await handleRequestEmailChange();
  };

  // Handler: Verify OTP and finalize email change
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isVerifyingOtp) return;

    setVerifyError(null);
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      triggerHaptic('error');
      setVerifyError('Please enter the 6-digit verification code.');
      return;
    }

    triggerConfirmSound();
    triggerHaptic('medium');
    setIsVerifyingOtp(true);

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

        // Store new auth token & updated user record
        if (data.token) {
          localStorage.setItem('juspay_auth_token', data.token);
          localStorage.setItem('auth_token', data.token);
        }
        localStorage.setItem('juspay_active_user', JSON.stringify(data.user));
        localStorage.setItem('currentUser', JSON.stringify(data.user));

        setCurrentStep('success');
        showToast('Email address updated successfully!');

        // Refresh global user state
        try {
          await refreshUserProfile();
        } catch (_) {}

        if (onSuccess) {
          onSuccess();
        }

        // Auto close after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2200);
      } else {
        triggerHaptic('error');
        setVerifyError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      triggerHaptic('error');
      setVerifyError('Network error verifying code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Update Email Address</h3>
              <p className="text-[11px] text-slate-300 font-medium">
                {currentStep === 'input' && 'Step 1: Security Authorization'}
                {currentStep === 'verify' && 'Step 2: OTP Verification'}
                {currentStep === 'success' && 'Email Successfully Updated'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">

          {/* STEP 1: Input New Email & Security PIN */}
          {currentStep === 'input' && (
            <form onSubmit={handleRequestEmailChange} className="space-y-4">
              
              {/* Current Email Display */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Current Email
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                      {currentEmail}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              {/* Error Notice */}
              {requestError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{requestError}</span>
                </div>
              )}

              {/* New Email Address Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>New Email Address</span>
                  <span className="text-[10px] font-normal text-slate-400">OTP code will be sent here</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      if (requestError) setRequestError(null);
                    }}
                    placeholder="Enter your new email address"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                    required
                    autoFocus
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* 6-Digit Security PIN Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Security PIN (6 Digits)</span>
                  <span className="text-[10px] font-normal text-slate-400">Your current account PIN</span>
                </label>
                <div className="relative">
                  <input
                    type={showSecurityPin ? 'text' : 'password'}
                    value={securityPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setSecurityPin(val);
                      if (requestError) setRequestError(null);
                    }}
                    placeholder="••••••"
                    maxLength={6}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-slate-900 placeholder:text-slate-400 tracking-widest focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowSecurityPin(!showSecurityPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showSecurityPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Information Notice */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-start gap-2 text-[11px] text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  For institutional security, a 6-digit verification code will be dispatched directly to your new email address.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerCancelSound();
                    onClose();
                  }}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingRequest || !newEmail || securityPin.length !== 6}
                  className={`w-2/3 py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
                    isSendingRequest || !newEmail || securityPin.length !== 6
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                  }`}
                >
                  {isSendingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter 6-Digit OTP sent to new email */}
          {currentStep === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              
              {/* Destination Email Info Card */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                      Code Sent To
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                      {newEmail}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerSwitchSound();
                    setCurrentStep('input');
                  }}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                >
                  Edit
                </button>
              </div>

              {/* Verification Error Notice */}
              {verifyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* 6-Digit OTP Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Enter 6-Digit Verification Code</span>
                  <span className="text-[10px] font-normal text-slate-400">Valid for 10 minutes</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(val);
                      if (verifyError) setVerifyError(null);
                    }}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-slate-900 tracking-widest placeholder:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                    required
                    autoFocus
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Resend OTP Bar */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    triggerSwitchSound();
                    setCurrentStep('input');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={otpCountdown > 0 || isSendingRequest}
                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    otpCountdown > 0 || isSendingRequest
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-emerald-700 hover:text-emerald-900'
                  }`}
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isSendingRequest ? 'animate-spin' : ''}`} />
                  <span>{otpCountdown > 0 ? `Resend code (${otpCountdown}s)` : 'Resend Code'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    triggerCancelSound();
                    onClose();
                  }}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpCode.length !== 6}
                  className={`w-2/3 py-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all ${
                    isVerifyingOtp || otpCode.length !== 6
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 cursor-pointer'
                  }`}
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating Email...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Update Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {currentStep === 'success' && (
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">Email Address Updated!</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Your account is now linked to <strong className="font-mono text-slate-800">{newEmail}</strong>. A fresh session has been synchronized.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    triggerConfirmSound();
                    onClose();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
