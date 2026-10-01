import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Mail,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  X,
  Zap,
  Copy,
  ChevronLeft,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JuspayLogo } from './JuspayLogo';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

interface ForgotPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccessRedirect?: (email: string) => void;
}

type Step = 'REQUEST' | 'VERIFY' | 'RESET' | 'SUCCESS';

export const ForgotPinModal: React.FC<ForgotPinModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccessRedirect
}) => {
  const { showToast, allUsers, syncUserPin } = useApp();

  const [step, setStep] = useState<Step>('REQUEST');
  const [email, setEmail] = useState<string>(initialEmail);
  const [otp, setOtp] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Sync initial email when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEmail) {
        setEmail(initialEmail);
      }
      setStep('REQUEST');
      setOtp('');
      setResetToken('');
      setNewPin('');
      setConfirmPin('');
      setErrorMessage(null);
      setSimulatedCode(null);
    }
  }, [isOpen, initialEmail]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // STEP 1: REQUEST PHASE (Send OTP to registered email)
  // -------------------------------------------------------------
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid registered email address.');
      return;
    }

    triggerConfirmSound();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-pin/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        triggerSuccessSound();
        setResendCooldown(60);
        if (data.simulatedCode) {
          setSimulatedCode(data.simulatedCode);
        }
        showToast(data.message || 'Recovery code dispatched to your email.');
        setStep('VERIFY');
      } else {
        setErrorMessage(data.error || 'Failed to dispatch recovery code.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error connecting to security recovery service.');
    }
  };

  // -------------------------------------------------------------
  // STEP 2: VERIFICATION PHASE (Verify OTP code & acquire JWT resetToken)
  // -------------------------------------------------------------
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code received in your email.');
      return;
    }

    triggerConfirmSound();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          otp: cleanOtp
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success && data.resetToken) {
        triggerSuccessSound();
        setResetToken(data.resetToken);
        showToast('Code verified. Set your new 6-digit PIN.');
        setStep('RESET');
      } else {
        setErrorMessage(data.error || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error validating recovery code.');
    }
  };

  // -------------------------------------------------------------
  // STEP 3: RESET PHASE (Bcrypt Hash & Session Invalidation)
  // -------------------------------------------------------------
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const pin = newPin.trim();
    const confirm = confirmPin.trim();

    if (!/^\d{6}$/.test(pin)) {
      setErrorMessage('New PIN must contain exactly 6 numeric digits (0-9).');
      return;
    }

    if (pin !== confirm) {
      setErrorMessage('Confirmation PIN does not match. Please re-enter.');
      return;
    }

    // Prohibit trivial sequential pins
    const sequential = ['012345', '123456', '234567', '345678', '456789', '567890', '987654', '654321', '000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999'];
    if (sequential.includes(pin)) {
      setErrorMessage('For account safety, avoid sequential or identical digits (e.g. 123456, 111111).');
      return;
    }

    triggerConfirmSound();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-pin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          resetToken,
          newPin: pin,
          confirmPin: confirm
        })
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.success) {
        // Synchronize PIN in AppContext state and local storage caches
        if (syncUserPin) {
          syncUserPin(cleanEmail, pin);
        }

        triggerSuccessSound();
        showToast('PIN reset completed successfully!');
        setStep('SUCCESS');
      } else {
        setErrorMessage(data.error || 'Failed to update PIN. Please restart the recovery flow.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage('Network error updating security PIN.');
    }
  };

  const handleFinish = () => {
    triggerConfirmSound();
    onClose();
    if (onSuccessRedirect) {
      onSuccessRedirect(email.trim().toLowerCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md fintech-card bg-white p-6 shadow-2xl rounded-2xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <JuspayLogo size="sm" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>6-Digit PIN Recovery</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  SECURE
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Institutional Cryptographic PIN Reset
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerCancelSound();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Progress Indicator */}
        <div className="py-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5 px-1">
            <span className={step === 'REQUEST' ? 'text-emerald-700 font-extrabold' : 'text-slate-800'}>
              1. Request
            </span>
            <span className={step === 'VERIFY' ? 'text-emerald-700 font-extrabold' : step === 'RESET' || step === 'SUCCESS' ? 'text-slate-800' : ''}>
              2. Verify OTP
            </span>
            <span className={step === 'RESET' ? 'text-emerald-700 font-extrabold' : step === 'SUCCESS' ? 'text-slate-800' : ''}>
              3. New PIN
            </span>
            <span className={step === 'SUCCESS' ? 'text-emerald-700 font-extrabold' : ''}>
              4. Complete
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-300 ${
                step === 'REQUEST' ? 'w-1/4 bg-emerald-600' :
                step === 'VERIFY' ? 'w-2/4 bg-emerald-600' :
                step === 'RESET' ? 'w-3/4 bg-emerald-600' :
                'w-full bg-emerald-600'
              }`}
            />
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: REQUEST PHASE */}
        {/* ------------------------------------------------------------- */}
        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp} className="space-y-4 pt-1">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the registered email address associated with your Juspay vault account. We will send you a single-use 6-digit recovery code.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., trader@juspay.io"
                  className="w-full fintech-inset pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted Recovery Protocol</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                PIN reset codes expire strictly after 10 minutes. Bcrypt hashing with random salt ensures zero plaintext storage.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.includes('@')}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Recovery Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: VERIFY OTP PHASE */}
        {/* ------------------------------------------------------------- */}
        {step === 'VERIFY' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4 pt-1">
            <div className="text-xs text-slate-600">
              A 6-digit recovery code was dispatched to:
              <div className="mt-1 font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded inline-block text-[11px]">
                {email}
              </div>
            </div>

            {/* Dispatched notification */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>6-digit recovery code successfully dispatched to your email. Please check your inbox.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="forgot-pin-otp-input"
                  name="recovery-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g., 847291"
                  className="w-full fintech-inset pl-9 pr-3 py-2.5 text-base font-mono tracking-widest font-bold text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Resend Action */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                <span>Change Email</span>
              </button>

              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={resendCooldown > 0 || loading}
                className="text-emerald-700 font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('REQUEST')}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: RESET NEW PIN PHASE */}
        {/* ------------------------------------------------------------- */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPin} className="space-y-3.5 pt-1">
            <p className="text-xs text-slate-600">
              Choose a new 6-digit numeric PIN for your account. This PIN is required for login and transaction authorizations.
            </p>

            {/* New 6-Digit PIN */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                New 6-Digit Security PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6 numbers"
                  className="w-full fintech-inset pl-9 pr-10 py-2 text-sm font-mono tracking-widest font-bold text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm 6-Digit PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Confirm New 6-Digit PIN
                </label>
                {confirmPin.length === 6 && (
                  <span className={`text-[10px] font-bold flex items-center gap-1 ${
                    newPin === confirmPin ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {newPin === confirmPin ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Pins Match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Mismatch</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Re-enter 6 numbers"
                  className="w-full fintech-inset pl-9 pr-3 py-2 text-sm font-mono tracking-widest font-bold text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Security checklist */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                  newPin.length === 6 ? 'bg-emerald-600' : 'bg-slate-300'
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Must be exactly 6 numeric digits</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${
                  newPin.length === 6 && newPin === confirmPin ? 'bg-emerald-600' : 'bg-slate-300'
                }`}>
                  <Check className="w-2.5 h-2.5" />
                </div>
                <span>Confirmation PIN matches</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep('VERIFY')}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || newPin.length !== 6 || newPin !== confirmPin}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Encrypting & Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Save New PIN</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: SUCCESS PHASE */}
        {/* ------------------------------------------------------------- */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm border border-emerald-300">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                Security PIN Reset Successful
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your new 6-digit PIN has been encrypted with bcrypt (cost factor 10) and saved. All active sessions have been safely terminated.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security Audit Logged</span>
              </div>
              <p className="text-[10px] text-slate-500">
                • Used OTP invalidated.<br />
                • Prior JWT sessions revoked.<br />
                • Ready for instant PIN sign-in.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
