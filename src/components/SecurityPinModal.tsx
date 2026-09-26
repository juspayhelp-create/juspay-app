import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, Delete, AlertCircle, Lock, Timer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerHaptic, triggerTickSound, triggerCancelSound, triggerSuccessSound } from '../utils/haptics';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Enter Security PIN',
  description = 'Confirm your 6-digit Security PIN for this sensitive wallet operation.',
}) => {
  const { currentUser, showToast, openForgotPinModal } = useApp();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security Lockout States (3 failed attempts -> 60s lockout)
  const userKey = currentUser?.id || currentUser?.email || 'active_user';
  const lockoutStorageKey = `juspay_pin_lockout_${userKey}`;
  const attemptsStorageKey = `juspay_pin_failed_attempts_${userKey}`;

  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(attemptsStorageKey);
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockSecondsRemaining, setLockSecondsRemaining] = useState<number>(0);

  // Check lockout status upon modal open or userKey change
  useEffect(() => {
    if (!isOpen) return;

    setPin('');
    setError(false);
    setIsShaking(false);

    try {
      const storedLockout = localStorage.getItem(lockoutStorageKey);
      if (storedLockout) {
        const lockoutUntil = parseInt(storedLockout, 10);
        const now = Date.now();
        if (lockoutUntil > now) {
          const remaining = Math.ceil((lockoutUntil - now) / 1000);
          setIsLocked(true);
          setLockSecondsRemaining(remaining);
          setErrorMessage(`Keypad locked due to 3 failed attempts. Try again in ${remaining}s.`);
          return;
        } else {
          // Lockout has expired while closed
          localStorage.removeItem(lockoutStorageKey);
          localStorage.removeItem(attemptsStorageKey);
          setIsLocked(false);
          setLockSecondsRemaining(0);
          setFailedAttempts(0);
          setErrorMessage(null);
        }
      } else {
        setIsLocked(false);
        setLockSecondsRemaining(0);
        setErrorMessage(null);
      }

      const storedAttempts = localStorage.getItem(attemptsStorageKey);
      if (storedAttempts) {
        setFailedAttempts(parseInt(storedAttempts, 10) || 0);
      }
    } catch {
      setIsLocked(false);
      setLockSecondsRemaining(0);
    }
  }, [isOpen, lockoutStorageKey, attemptsStorageKey]);

  // Countdown timer when locked
  useEffect(() => {
    if (!isOpen || !isLocked || lockSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      try {
        const storedLockout = localStorage.getItem(lockoutStorageKey);
        const lockoutUntil = storedLockout ? parseInt(storedLockout, 10) : 0;
        const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));

        if (remaining <= 0) {
          setIsLocked(false);
          setLockSecondsRemaining(0);
          setFailedAttempts(0);
          localStorage.removeItem(lockoutStorageKey);
          localStorage.removeItem(attemptsStorageKey);
          setErrorMessage(null);
          showToast('Keypad unlocked. You may enter your 6-digit PIN.');
          clearInterval(timer);
        } else {
          setLockSecondsRemaining(remaining);
          setErrorMessage(`Keypad locked due to 3 failed attempts. Try again in ${remaining}s.`);
        }
      } catch {
        setLockSecondsRemaining(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isLocked, lockSecondsRemaining, lockoutStorageKey, attemptsStorageKey, showToast]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (isLocked) {
      triggerHaptic('warning');
      showToast(`Keypad locked. Please wait ${lockSecondsRemaining}s before trying again.`);
      return;
    }

    if (pin.length < 6) {
      triggerTickSound();
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);
      setErrorMessage(null);

      if (nextPin.length === 6) {
        // Retrieve current authenticated user's PIN strictly from state / active session
        // Never cast to number so leading zeros (e.g. '012345') remain intact
        const rawUserPin = currentUser?.security_pin || (currentUser as any)?.securityPin;
        let storedPin = rawUserPin !== undefined && rawUserPin !== null && String(rawUserPin).trim() !== ''
          ? String(rawUserPin).trim()
          : '';

        if (!storedPin) {
          try {
            const rawSession = localStorage.getItem('currentUser') || localStorage.getItem('juspay_active_user');
            if (rawSession) {
              const parsedUser = JSON.parse(rawSession);
              const sessionPin = parsedUser?.security_pin || parsedUser?.securityPin;
              if (sessionPin !== undefined && sessionPin !== null && String(sessionPin).trim() !== '') {
                storedPin = String(sessionPin).trim();
              }
            }
          } catch (e) {}
        }

        // Safeguard fallback to '123456' only if security_pin is completely undefined/null
        if (!storedPin) {
          storedPin = '123456';
        }

        const isPinValid = nextPin === storedPin;

        if (isPinValid) {
          // Success: reset failed attempts and lockout keys
          triggerSuccessSound();
          setFailedAttempts(0);
          try {
            localStorage.removeItem(attemptsStorageKey);
            localStorage.removeItem(lockoutStorageKey);
          } catch {}

          setError(false);
          setIsShaking(false);
          setErrorMessage(null);
          setPin('');
          onClose();
          onSuccess(nextPin);
        } else {
          // Incorrect PIN: increment failed attempts
          triggerHaptic('error');
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          try {
            localStorage.setItem(attemptsStorageKey, String(nextAttempts));
          } catch {}

          setPin('');
          setIsShaking(true);
          setError(true);

          if (nextAttempts >= 3) {
            // Lock keypad for 60 seconds
            const lockoutUntil = Date.now() + 60 * 1000;
            try {
              localStorage.setItem(lockoutStorageKey, String(lockoutUntil));
            } catch {}

            setIsLocked(true);
            setLockSecondsRemaining(60);
            const lockMsg = 'Security Lockout: 3 consecutive failed attempts. Keypad is locked for 60 seconds.';
            setErrorMessage(lockMsg);
            showToast(lockMsg);
          } else {
            const remainingAttempts = 3 - nextAttempts;
            const errText = `Incorrect PIN. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining before 60s lockout.`;
            setErrorMessage(errText);
            showToast(errText);
          }

          setTimeout(() => {
            setIsShaking(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isLocked) {
      triggerHaptic('warning');
      return;
    }
    triggerTickSound();
    setPin(prev => prev.slice(0, -1));
    setError(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    triggerCancelSound();
    setPin('');
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xs clay-card p-5 shadow-2xl flex flex-col items-center">
        
        {/* Top Icon & Close */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className={`clay-icon-box w-8 h-8 flex items-center justify-center border transition-colors ${
            isLocked ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isLocked ? <Lock className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <button
            id="close-security-pin-modal"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="font-extrabold text-slate-800 text-base text-center mt-1">{title}</h3>
        <p className="text-[11px] text-slate-500 text-center mt-1 max-w-[240px] leading-relaxed font-medium">
          {description}
        </p>

        {/* Lockout or Error Alert Banner */}
        {isLocked ? (
          <div
            id="keypad-lockout-banner"
            role="alert"
            className="w-full mt-2.5 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Timer className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Keypad Locked: {lockSecondsRemaining}s</span>
            </div>
            <p className="text-[11px] text-amber-700 text-center font-medium leading-tight">
              3 consecutive failed attempts detected. Keypad is locked for 60 seconds to prevent brute-force attacks.
            </p>
          </div>
        ) : errorMessage ? (
          <div
            id="pin-error-banner"
            role="alert"
            className="w-full mt-2.5 p-2 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-tight text-left">{errorMessage}</span>
          </div>
        ) : null}

        {/* 6 PIN Indicator Dots */}
        <div className={`flex items-center gap-3 my-5 ${isShaking ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                isLocked
                  ? 'bg-amber-300 opacity-60'
                  : isShaking
                  ? 'bg-rose-400 scale-110'
                  : pin.length > idx
                  ? 'bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.4)] scale-110'
                  : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Tactile Keypad */}
        <div className={`w-full grid grid-cols-3 gap-2 ${isShaking ? 'animate-shake' : ''}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
            <button
              key={n}
              id={`keypad-digit-${n}`}
              onClick={() => handleKeyPress(n)}
              disabled={isLocked}
              className={`h-12 rounded-2xl font-extrabold text-lg shadow-xs border transition-all flex items-center justify-center ${
                isLocked
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 active:scale-95 cursor-pointer'
              }`}
            >
              {n}
            </button>
          ))}
          <div className="h-12" />
          <button
            id="keypad-digit-0"
            onClick={() => handleKeyPress('0')}
            disabled={isLocked}
            className={`h-12 rounded-2xl font-extrabold text-lg shadow-xs border transition-all flex items-center justify-center ${
              isLocked
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 active:scale-95 cursor-pointer'
            }`}
          >
            0
          </button>
          <button
            id="keypad-delete-btn"
            onClick={handleDelete}
            disabled={isLocked}
            className={`h-12 rounded-2xl shadow-xs border transition-all flex items-center justify-center ${
              isLocked
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed opacity-50'
                : 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-200 active:scale-95 cursor-pointer'
            }`}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Forgot PIN Recovery Link */}
        <div className="mt-3 text-center">
          <button
            type="button"
            id="keypad-forgot-pin-btn"
            onClick={() => {
              handleClose();
              if (openForgotPinModal) {
                openForgotPinModal(currentUser?.email);
              }
            }}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
          >
            Forgot 6-Digit PIN? Recover Account
          </button>
        </div>

      </div>
    </div>
  );
};
