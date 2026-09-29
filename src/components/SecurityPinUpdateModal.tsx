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
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

interface SecurityPinUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SecurityPinUpdateModal: React.FC<SecurityPinUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, showToast, syncUserPin } = useApp();

  // Modal Step: 'verify' (Email OTP) | 'set_pin' (New PIN Entry) | 'success' (Confirmation)
  const [currentStep, setCurrentStep] = useState<'verify' | 'set_pin' | 'success'>('verify');

  // Step 1: OTP states
  const [otpCode, setOtpCode] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Verification Token issued by server upon valid OTP
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  // Step 2: New PIN states
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showNewPin, setShowNewPin] = useState<boolean>(false);
  const [showConfirmPin, setShowConfirmPin] = useState<boolean>(false);
  const [isUpdatingPin, setIsUpdatingPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Reset modal state upon opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('verify');
      setOtpCode('');
      setIsSendingOtp(false);
      setIsVerifyingOtp(false);
      setOtpError(null);
      setSimulatedCode(null);
      setVerificationToken(null);
      setNewPin('');
      setConfirmPin('');
      setShowNewPin(false);
      setShowConfirmPin(false);
      setIsUpdatingPin(false);
      setPinError(null);
    }
  }, [isOpen]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  if (!isOpen) return null;

  const userEmail = currentUser?.email || 'user@juspay.io';

  // Handler: Request OTP
  const handleSendOtp = async () => {
    if (otpCountdown > 0 || isSendingOtp) return;
    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': userEmail,
      };

      const res = await fetch('/api/user/security-pin/request-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmail,
          userId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsOtpSent(true);
        setOtpCountdown(60);
        showToast(`Verification code dispatched to ${userEmail}`);
        if (data.simulatedCode) {
          setSimulatedCode(data.simulatedCode);
        }
      } else {
        setOtpError(data.error || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err: any) {
      setOtpError('Network error connecting to verification server.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handler: Verify OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Please enter the complete 6-digit verification code.');
      return;
    }

    triggerConfirmSound();
    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const token = localStorage.getItem('juspay_auth_token') || localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        'x-user-id': String(currentUser?.id || ''),
        'x-user-email': userEmail,
      };

      const res = await fetch('/api/user/security-pin/verify-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: userEmail,
          userId: currentUser?.id,
          otp: cleanOtp
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        triggerSuccessSound();
        setVerificationToken(data.verificationToken);
        showToast('Email verified! You can now set your new Security PIN.');
        setCurrentStep('set_pin');
      } else {
        setOtpError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setOtpError('Network error during code verification.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handler: Save New PIN
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
      setCurrentStep('verify');
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
        'x-user-email': userEmail,
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
        // Sync to client-side state across tabs and local stores
        syncUserPin(userEmail, cleanNew);
        triggerSuccessSound();
        setCurrentStep('success');
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

        {/* Modal Header & Stepper */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Security PIN Management</h3>
              <p className="text-[11px] text-slate-500">2-Factor Authentication Protected</p>
            </div>
          </div>

          {/* Step Breadcrumb Indicator */}
          {currentStep !== 'success' && (
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
              <div className={`flex items-center gap-1 text-[11px] font-bold ${currentStep === 'verify' ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${currentStep === 'verify' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
                <span>Email OTP</span>
              </div>
              <div className="flex-1 h-0.5 bg-slate-200" />
              <div className={`flex items-center gap-1 text-[11px] font-bold ${currentStep === 'set_pin' ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${currentStep === 'set_pin' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
                <span>New 6-Digit PIN</span>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* STEP 1: EMAIL OTP VERIFICATION                           */}
        {/* ======================================================== */}
        {currentStep === 'verify' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Registered Email:</span>
                <span className="font-mono font-bold text-slate-900">{userEmail}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                For your security, a one-time verification passcode will be sent to your registered email to authorize this PIN change.
              </p>
            </div>

            {/* Error Message */}
            {otpError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-snug">{otpError}</span>
              </div>
            )}

            {/* Send OTP button & input row */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || otpCountdown > 0}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                    otpCountdown > 0
                      ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {isSendingOtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : otpCountdown > 0 ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                      <span>Resend in {otpCountdown}s</span>
                    </>
                  ) : isOtpSent ? (
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
              </div>

              {/* 6-Digit OTP Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-800">Enter 6-Digit OTP</label>
                  {simulatedCode && (
                    <button
                      type="button"
                      onClick={() => setOtpCode(simulatedCode)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Autofill: {simulatedCode}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center tracking-[10px] font-mono text-xl font-black fintech-inset py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl"
                  />
                  {otpCode.length === 6 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
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
                onClick={handleVerifyOtp}
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isVerifyingOtp ? (
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

        {/* ======================================================== */}
        {/* STEP 2: SET NEW 6-DIGIT PIN                              */}
        {/* ======================================================== */}
        {currentStep === 'set_pin' && (
          <form onSubmit={handleSaveNewPin} className="space-y-4">
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

            {/* New PIN */}
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

            {/* Confirm PIN */}
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
                  setCurrentStep('verify');
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

        {/* ======================================================== */}
        {/* STEP 3: SUCCESS CONFIRMATION                             */}
        {/* ======================================================== */}
        {currentStep === 'success' && (
          <div className="py-6 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">Security PIN Updated!</h4>
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
    </div>
  );
};
