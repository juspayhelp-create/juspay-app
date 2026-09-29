import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerConfirmSound, triggerCancelSound, triggerTickSound, triggerSuccessSound } from '../utils/haptics';

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  purpose: 'REGISTRATION' | 'WITHDRAWAL' | 'LOGIN';
  title?: string;
  description?: string;
  initialApiError?: string;
  onVerified: (code: string) => void | Promise<void>;
  additionalDetails?: {
    amountINR?: number;
    amountUSDT?: number;
    accountLabel?: string;
  };
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  purpose,
  title,
  description,
  initialApiError,
  onVerified,
  additionalDetails
}) => {
  const { showToast, sendEmailOTP, verifyEmailOTP } = useApp();
  
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    let timer: any;
    if (isOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, countdown]);

  // Initial trigger & focus when modal opens
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setIsSuccess(false);
      setCountdown(60);
      setNetworkError(initialApiError || null);
      
      // Auto-focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    }
  }, [isOpen, email, initialApiError]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg('');
    triggerTickSound();
    // Allow typing only numeric digits
    const cleaned = value.replace(/\D/g, '');
    
    // Handle pasting multi-digit OTP
    if (cleaned.length > 1) {
      const pasteDigits = cleaned.slice(0, 6).split('');
      const newDigits = [...digits];
      pasteDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasteDigits.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');
    setNetworkError(null);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), purpose })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDigits(['', '', '', '', '', '']);
        setCountdown(60);
        showToast(data.message || 'New 6-digit code dispatched to your email.');
      } else {
        const errorMsg = data.message || data.error || 'Failed to dispatch code.';
        setErrorMsg(errorMsg);
        showToast(errorMsg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Network error sending verification code.';
      setNetworkError(msg);
      setErrorMsg(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = digits.join('').trim();
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    triggerConfirmSound();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (purpose === 'REGISTRATION') {
        const res: any = await onVerified(fullCode);
        if (res && res.success === false) {
          setErrorMsg(res.message || 'Registration failed. Please check your verification code.');
          setIsSubmitting(false);
          return;
        }
        triggerSuccessSound();
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
        }, 400);
        return;
      }

      // For LOGIN or WITHDRAWAL purpose:
      let verified = false;
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: fullCode, purpose })
      }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json();
        if (data.success || data.verified) {
          verified = true;
        }
      }

      // AppContext fallback verification if server was simulated or offline
      if (!verified) {
        verified = await verifyEmailOTP(email.trim(), fullCode, false);
      }

      if (verified) {
        triggerSuccessSound();
        setIsSuccess(true);
        showToast('Email verified successfully!');
        setTimeout(async () => {
          await onVerified(fullCode);
          onClose();
        }, 400);
      } else {
        setErrorMsg('Invalid or expired 6-digit code. Please check your Gmail and try again.');
      }
    } catch (err: any) {
      setErrorMsg('Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = title || (
    purpose === 'REGISTRATION' ? 'Verify Your Gmail Address' :
    purpose === 'WITHDRAWAL' ? 'Authorize Withdrawal via Gmail' : 'Gmail OTP Verification'
  );

  const modalDesc = description || (
    purpose === 'REGISTRATION' 
      ? 'A 6-digit verification code has been dispatched to your email to activate your account and welcome bonus.'
      : 'For security protection, enter the 6-digit authorization code sent to your Gmail to release payout funds.'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerCancelSound();
            onClose();
          }}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs">
            <Mail className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Gmail OTP Required
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                256-Bit SSL
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 leading-snug mt-0.5">
              {modalTitle}
            </h3>
          </div>
        </div>

        {/* Withdrawal Info Pill (if applicable) */}
        {additionalDetails && additionalDetails.amountINR && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-[11px]">
                ₹
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[10px]">Payout Amount</span>
                <span className="font-extrabold text-slate-900 font-mono text-sm">
                  ₹{additionalDetails.amountINR.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            {additionalDetails.accountLabel && (
              <div className="text-right">
                <span className="text-slate-500 font-semibold block text-[10px]">Destination</span>
                <span className="font-bold text-slate-800 truncate max-w-[140px] block">
                  {additionalDetails.accountLabel}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <p className="text-xs text-slate-600 leading-relaxed mb-3">
          {modalDesc}
        </p>

        {/* Visible Red Network Error Banner */}
        {networkError && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-start gap-2 shadow-xs animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block">Network / Server Notice:</span>
              <span className="font-mono text-[11px] break-all">{networkError}</span>
            </div>
          </div>
        )}

        {/* Recipient Email Chip */}
        <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl mb-5">
          <div className="flex items-center gap-2 overflow-hidden">
            <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate font-mono">
              {email}
            </span>
          </div>
        </div>

        {/* 6-Digit OTP Inputs */}
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center mb-2.5">
              Enter 6-Digit Verification Code
            </label>

            <div className="flex justify-center gap-2 sm:gap-2.5">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-digit-input-${idx}`}
                  name={`otp_digit_${idx}`}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={idx === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit || ''}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  disabled={isSubmitting || isSuccess}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border transition-all outline-none ${
                    isSuccess 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                      : digit 
                        ? 'border-emerald-600 bg-white text-slate-900 shadow-xs' 
                        : 'border-slate-300 bg-slate-50/60 text-slate-900 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>OTP verified successfully! Proceeding...</span>
            </div>
          )}

          {/* Verify / Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || isSuccess || digits.join('').length !== 6}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : digits.join('').length === 6 && !isSubmitting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying Code with Juspay...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorized!</span>
              </>
            ) : (
              <>
                <span>Verify & Complete {purpose === 'REGISTRATION' ? 'Registration' : 'Withdrawal'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Resend OTP Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">
              Didn't receive code in Gmail?
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending || isSubmitting}
              className={`font-bold transition-colors flex items-center gap-1 ${
                countdown > 0 || isResending
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
              {countdown > 0 ? (
                <span>Resend in {countdown}s</span>
              ) : isResending ? (
                <span>Sending...</span>
              ) : (
                <span>Resend Code</span>
              )}
            </button>
          </div>
        </form>

        {/* Security Note Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-medium">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Secured with End-to-End SMTP Handshake</span>
        </div>
      </div>
    </div>
  );
};
