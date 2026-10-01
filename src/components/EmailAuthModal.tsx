import React, { useState, useEffect } from 'react';
import { Mail, Shield, CheckCircle, ArrowRight, RefreshCw, X, KeyRound } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from './JuspayLogo';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerTickSound, triggerSuccessSound } from '../utils/haptics';

interface EmailAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const EmailAuthModal: React.FC<EmailAuthModalProps> = ({ isOpen, onClose }) => {
  const { isAuthModalOpen, setIsAuthModalOpen, sendEmailOTP, verifyEmailOTP, pendingOTP, showToast, currentUser, openForgotPinModal, stats } = useApp();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [isSending, setIsSending] = useState(false);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  const showModal = isOpen !== undefined ? isOpen : isAuthModalOpen;
  const handleClose = () => {
    triggerCancelSound();
    if (onClose) onClose();
    else setIsAuthModalOpen(false);
  };

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!showModal) return null;

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }
    triggerConfirmSound();
    setIsSending(true);
    const res = await sendEmailOTP(email);
    setIsSending(false);

    if (res.success) {
      triggerSuccessSound();
      if (res.code) {
        setSimulatedCode(res.code);
      } else {
        setSimulatedCode(null);
      }
      setStep('otp');
      setCountdown(60);
      showToast(res.message || 'OTP sent successfully!');
    } else {
      showToast(res.message || 'Failed to send OTP.');
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      showToast('Please enter all 6 digits of the OTP.');
      return;
    }
    triggerConfirmSound();
    setIsSending(true);
    const ok = await verifyEmailOTP(email.trim().toLowerCase(), otpCode.trim());
    setIsSending(false);

    if (ok) {
      triggerSuccessSound();
      setStep('email');
      setEmail('');
      setOtpCode('');
      setSimulatedCode(null);
      showToast('Authentication successful!');
      if (onClose) onClose();
      else setIsAuthModalOpen(false);
    } else {
      showToast('Invalid or expired 6-digit code, or account not registered.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendOTP();
  };

  const quickFillUser = () => {
    triggerSwitchSound();
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm clay-card p-6 shadow-2xl flex flex-col relative">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors border border-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand Icon & Live Rate */}
        <div className="flex items-center justify-between gap-2 mb-3 pr-8">
          <div className="flex items-center gap-2">
            <JuspayLogo size="sm" />
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              JUSPAY AUTH
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full border border-slate-200 text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-slate-900">1 USDT = ₹{stats?.realtime_exchange_rate || 109}</span>
            <span className="text-[8px] bg-emerald-100 text-emerald-950 px-1 py-0.2 rounded font-black border border-emerald-300">
              PEG
            </span>
          </div>
        </div>

        <h2 className="text-lg font-extrabold text-slate-800">
          {step === 'email' ? 'Email OTP Authentication' : 'Verify One-Time Passcode'}
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {step === 'email'
            ? 'No passwords or SMS needed. Enter your email to receive an instant 6-digit passcode.'
            : `We sent a 6-digit code to ${email}. Valid for 10 minutes.`}
        </p>

        {/* Step 1: Email Input */}
        {step === 'email' && (
          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full clay-inset px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Email Pre-fill */}
            <div>
              <button
                type="button"
                onClick={quickFillUser}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Use current account email ({currentUser?.email || 'account@juspay.io'})</span>
              </button>
            </div>

            <button
              onClick={handleSendOTP}
              disabled={isSending}
              className="clay-btn-emerald w-full py-3 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Quick Link to Forgot PIN Recovery */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  showToast('Opening 6-Digit PIN recovery flow...');
                  openForgotPinModal(email || currentUser?.email);
                }}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                Forgot or Need to Reset 6-Digit PIN?
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 6-Digit OTP Verification */}
        {step === 'otp' && (
          <div className="mt-5 space-y-4">
            {/* Success notification banner */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900">
              <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>6-digit verification code successfully dispatched to your email. Please check your inbox.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => {
                  triggerTickSound();
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                }}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[12px] font-mono text-xl font-bold clay-inset py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Auto Fill Dispatched OTP Button */}
            {simulatedCode && (
              <div>
                <button
                  type="button"
                  onClick={() => {
                    triggerSwitchSound();
                    setOtpCode(simulatedCode);
                  }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>⚡ Auto-fill Dispatched Code ({simulatedCode})</span>
                </button>
              </div>
            )}

            {/* Resend & Timer */}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => {
                  triggerSwitchSound();
                  setStep('email');
                }}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Change Email
              </button>

              {countdown > 0 ? (
                <span className="text-slate-400 font-medium">
                  Resend in <strong className="text-slate-700 font-mono">{countdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-emerald-700 font-bold hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              )}
            </div>

            <button
              onClick={handleVerify}
              className="clay-btn-emerald w-full py-3 text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Verify & Continue</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
