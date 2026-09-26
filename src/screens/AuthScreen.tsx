import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  User as UserIcon, 
  Sparkles, 
  CheckCircle2, 
  Users, 
  HelpCircle,
  Copy,
  Zap,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  RotateCcw,
  Loader2,
  Smartphone,
  Globe,
  Cpu,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OtpVerificationModal } from '../components/OtpVerificationModal';
import { ForgotPinModal } from '../components/ForgotPinModal';
import { JuspayLogo } from '../components/JuspayLogo';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

export const AuthScreen: React.FC = () => {
  const { 
    setActiveScreen,
    sendEmailOTP, 
    verifyEmailOTP, 
    signupUser, 
    loginWithPin, 
    switchUser,
    showToast,
    stats,
    allUsers,
    setIsChatOpen,
    isForgotPinModalOpen,
    setIsForgotPinModalOpen,
    forgotPinEmail,
    openForgotPinModal
  } = useApp();

  const [pendingOTP, setPendingOTP] = useState<any>('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'pin'>('pin');

  // Login Form States
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginPinError, setLoginPinError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);

  // Signup Form States
  const [signupName, setSignupName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPin, setSignupPin] = useState<string>('');
  const [signupConfirmPin, setSignupConfirmPin] = useState<string>('');
  const [signupReferral, setSignupReferral] = useState<string>('JUS7789');
  const [signupOtp, setSignupOtp] = useState<string>('');
  const [isSignupOtpSent, setIsSignupOtpSent] = useState<boolean>(false);
  const [duplicateEmailError, setDuplicateEmailError] = useState<string | null>(null);

  // Modal States
  const [isOtpModalOpen, setIsOtpModalOpen] = useState<boolean>(false);
  const [modalPurpose, setModalPurpose] = useState<'REGISTRATION' | 'LOGIN'>('REGISTRATION');
  const [modalTargetEmail, setModalTargetEmail] = useState<string>('');
  const [modalApiError, setModalApiError] = useState<string | undefined>(undefined);

  // Clear OTP and errors when switching tabs or modifying email
  useEffect(() => {
    setDuplicateEmailError(null);
    setSignupOtp('');
    setLoginOtp('');
  }, [authMode]);

  // Extract referral code from URL query parameters (e.g. ?ref=JUS7T9P4)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('referral') || params.get('code') || params.get('sponsor');
      if (refCode) {
        setSignupReferral(refCode.toUpperCase().trim());
        setAuthMode('signup');
      }
    } catch {
      // safe fallback
    }
  }, []);

  const handleSignupEmailChange = (val: string) => {
    setSignupEmail(val);
    setDuplicateEmailError(null);
    setSignupOtp('');
  };

  const switchToLoginWithEmail = (emailToFill: string) => {
    setAuthMode('login');
    setLoginEmail(emailToFill);
    setLoginOtp('');
    setDuplicateEmailError(null);
  };

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Handle Send Login OTP
  const handleSendLoginOTP = async () => {
    const userEmail = loginEmail.trim().toLowerCase();
    if (!userEmail || !userEmail.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }

    setIsSendingOtp(true);
    setLoginOtp('');
    setLoginPinError(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, purpose: 'LOGIN' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to dispatch verification code');
      }
      setPendingOTP({ email: userEmail, expiresAt: Date.now() + 10 * 60 * 1000 });
      setOtpCountdown(60);
      showToast(data.message || `Verification code sent to ${userEmail}`);
    } catch (err: any) {
      console.error("OTP send error:", err);
      const msg = err?.message || 'Failed to send OTP';
      setLoginPinError(msg);
      showToast(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Login OTP Submit
  const handleLoginOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginPinError(null);
    if (!loginEmail.trim()) {
      showToast('Please enter your email.');
      return;
    }
    if (!loginOtp.trim()) {
      showToast('Please enter the 6-digit OTP.');
      return;
    }

    triggerConfirmSound();
    const success = await verifyEmailOTP(loginEmail.trim(), loginOtp.trim());
    if (success) {
      triggerSuccessSound();
    } else {
      setLoginPinError('Invalid OTP or account not found. Please register first.');
      showToast('Invalid OTP or account not found.');
    }
  };

  // Handle Login PIN Submit
  const handleLoginPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginPinError(null);
    if (!loginEmail.trim()) {
      showToast('Please enter your email.');
      return;
    }
    if (loginPin.length !== 6) {
      showToast('Security PIN must be exactly 6 digits.');
      return;
    }

    triggerConfirmSound();
    const res = await loginWithPin(loginEmail.trim(), loginPin.trim());
    if (res.success) {
      triggerSuccessSound();
    } else {
      setLoginPinError(res.message);
      showToast(res.message);
    }
  };

  // Handle Signup OTP Send & Open Modal
  const handleSendSignupOTP = async () => {
    const userEmail = signupEmail.trim().toLowerCase();
    if (!signupName.trim()) {
      showToast('Please enter your full legal name.');
      return;
    }
    if (!userEmail || !userEmail.includes('@')) {
      showToast('Please enter a valid email address.');
      return;
    }
    if (signupPin.length !== 6 || !/^\d+$/.test(signupPin)) {
      showToast('Security PIN must be exactly 6 numeric digits.');
      return;
    }
    if (signupPin !== signupConfirmPin) {
      showToast('PIN confirmation does not match.');
      return;
    }

    triggerConfirmSound();
    setIsSendingOtp(true);
    setDuplicateEmailError(null);
    setSignupOtp('');
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, purpose: 'REGISTRATION' })
      });
      const data = await res.json().catch(() => ({}));
      
      // Strictly handle duplicate email detection when backend returns HTTP 409 Conflict or duplicate flag
      if (res.status === 409 || Boolean(data.duplicate || data.isDuplicate)) {
        const errorMsg = data.message || data.error || 'This email is already registered. Please log in instead.';
        setDuplicateEmailError(errorMsg);
        showToast(errorMsg);
        return;
      }

      if (!res.ok) {
        const errorMsg = data.message || data.error || 'Failed to dispatch verification code';
        throw new Error(errorMsg);
      }

      setPendingOTP({ email: userEmail, expiresAt: Date.now() + 10 * 60 * 1000 });
      setIsSignupOtpSent(true);
      setOtpCountdown(60);
      setModalTargetEmail(userEmail);
      setModalPurpose('REGISTRATION');
      setModalApiError(undefined);
      // Only open modal AFTER fetch resolves successfully
      setIsOtpModalOpen(true);
      showToast(data.message || 'Verification code sent to your email');
    } catch (err: any) {
      console.error("OTP send error:", err);
      const errMsg = err?.message || 'Failed to dispatch verification code';
      showToast(errMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle Signup Final Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = signupEmail.trim().toLowerCase();
    if (!signupName.trim() || !cleanEmail || !signupPin) {
      showToast('Please complete all required fields.');
      return;
    }
    if (signupPin.length !== 6) {
      showToast('Security PIN must be 6 digits.');
      return;
    }
    if (signupPin !== signupConfirmPin) {
      showToast('PIN confirmation does not match.');
      return;
    }

    if (!signupOtp.trim()) {
      showToast('Invalid OTP. Please check your email and enter the correct 6-digit code.');
      return;
    }

    triggerConfirmSound();
    const res = await signupUser(
      signupName.trim(),
      cleanEmail,
      signupPin.trim(),
      signupReferral.trim(),
      signupOtp.trim()
    );

    if (res.success) {
      triggerSuccessSound();
    } else {
      if (res.duplicate) {
        setDuplicateEmailError(res.message);
      }
      showToast(res.message || 'Invalid verification code. Please check your email and try again.');
    }
  };

  const handleModalVerified = async (code: string) => {
    setSignupOtp(code);
    if (modalPurpose === 'REGISTRATION') {
      triggerConfirmSound();
      const res = await signupUser(
        signupName.trim(),
        signupEmail.trim(),
        signupPin.trim(),
        signupReferral.trim(),
        code
      );
      if (!res.success) {
        if (res.duplicate) {
          setDuplicateEmailError(res.message);
        }
        showToast(res.message || 'Invalid verification code. Please check your email and try again.');
        return { success: false, message: res.message };
      }
      triggerSuccessSound();
      setIsOtpModalOpen(false);
      return { success: true };
    } else {
      triggerConfirmSound();
      const ok = await verifyEmailOTP(loginEmail.trim(), code, true);
      if (ok) {
        triggerSuccessSound();
      }
      setIsOtpModalOpen(false);
      return { success: ok };
    }
  };

  return (
    <div className="min-h-screen py-5 px-4 flex flex-col justify-between max-w-md mx-auto animate-in fade-in duration-200">
      
      {/* Institutional Top Brand Header */}
      <div className="space-y-3.5">
        
        {/* Top Header: SSL Badge & Live USDT Peg Rate */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono font-bold tracking-wider border border-slate-200/80 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-BIT SSL VAULT</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-slate-800 rounded-full border border-slate-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-extrabold text-[11px] text-slate-900">
              1 USDT = ₹{stats.realtime_exchange_rate || 109}
            </span>
            <span className="text-[9px] bg-emerald-100/90 text-emerald-950 px-1.5 py-0.5 rounded font-black border border-emerald-300">
              PEG
            </span>
          </div>
        </div>

        {/* Brand Banner with Official 3D Emerald & Gold Logo */}
        <div className="login-emerald-card p-5 text-center relative overflow-hidden space-y-3">
          {/* Subtle decorative ambient tint */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center space-y-2">
            
            {/* Hexagonal Logo Container */}
            <div className="relative p-1.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <JuspayLogo size="lg" withGlow={false} />
            </div>

            <div className="space-y-0.5">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5 font-['Space_Grotesk']">
                <span>juspay</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800 font-bold">
                  VAULT
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Institutional Multi-Tier Settlement & Rewards Portal
              </p>
            </div>
          </div>
          
          {/* Institutional Guarantee Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-around text-[10px] text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              100% Backed Reserve
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Daily Audits
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              Instant IMPS / UPI
            </span>
          </div>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="p-1 bg-slate-100 border border-slate-200/80 rounded-2xl grid grid-cols-2 gap-1.5">
          <button
            type="button"
            id="tab-signin-btn"
            onClick={() => {
              triggerSwitchSound();
              setAuthMode('login');
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60 font-extrabold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In (Login)</span>
          </button>

          <button
            type="button"
            id="tab-signup-btn"
            onClick={() => {
              triggerSwitchSound();
              setAuthMode('signup');
            }}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60 font-extrabold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Sign Up (Register)</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-900 border border-amber-200 text-[8px] font-bold rounded">
              +₹100
            </span>
          </button>
        </div>

        {/* LOGIN VIEW */}
        {authMode === 'login' && (
          <div className="login-emerald-card p-5 space-y-4 animate-in zoom-in-98 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Access Your Vault Account</h3>
                <p className="text-[11px] text-slate-500 font-medium">Sign in with your 6-digit PIN or email OTP</p>
              </div>

              {/* Login Method Toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[10px] font-bold">
                <button
                  type="button"
                  id="login-method-pin"
                  onClick={() => {
                    triggerSwitchSound();
                    setLoginMethod('pin');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    loginMethod === 'pin' 
                      ? 'bg-white text-slate-800 font-bold shadow-xs border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  PIN Code
                </button>
                <button
                  type="button"
                  id="login-method-otp"
                  onClick={() => {
                    triggerSwitchSound();
                    setLoginMethod('otp');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    loginMethod === 'otp' 
                      ? 'bg-white text-slate-800 font-bold shadow-xs border border-slate-200/60' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Email OTP
                </button>
              </div>
            </div>

            {/* PIN Login Form */}
            {loginMethod === 'pin' ? (
              <form onSubmit={handleLoginPinSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g., trader@juspay.io"
                      className="w-full login-emerald-input pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      6-Digit Security PIN
                    </label>
                    <button
                      type="button"
                      id="forgot-pin-btn"
                      onClick={() => {
                        showToast('Opening 6-Digit PIN recovery flow...');
                        openForgotPinModal(loginEmail);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-amber-600" />
                      <span>Forgot PIN?</span>
                    </button>
                  </div>

                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-pin-input"
                      name="securityPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={loginPin}
                      onChange={(e) => {
                        setLoginPin(e.target.value.replace(/\D/g, ''));
                        if (loginPinError) setLoginPinError(null);
                      }}
                      placeholder="Enter 6-digit Security PIN"
                      className="w-full login-emerald-input pl-9 pr-3 py-2.5 text-base font-mono tracking-widest font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {loginPinError && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span className="font-semibold">{loginPinError}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-amber-200/60">
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signup');
                            setSignupEmail(loginEmail);
                            setSignupName('');
                            setLoginPinError(null);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Register / Sign Up Now</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!loginEmail || loginPin.length !== 6}
                  className="w-full py-3 login-emerald-btn text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Authenticate With PIN</span>
                </button>
              </form>
            ) : (
              /* OTP Login Form */
              <form onSubmit={handleLoginOtpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g., trader@juspay.io"
                        className="w-full login-emerald-input pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendLoginOTP}
                      disabled={isSendingOtp || otpCountdown > 0}
                      className="login-emerald-btn px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 min-w-[80px]"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : otpCountdown > 0 ? (
                        `${otpCountdown}s`
                      ) : (
                        'Get OTP'
                      )}
                    </button>
                  </div>
                </div>

                {/* Dispatched OTP notification banner */}
                {pendingOTP && pendingOTP.email === loginEmail.toLowerCase().trim() && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>6-digit verification OTP successfully dispatched to your email. Please check your inbox.</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    6-Digit Verification OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-otp-input"
                      name="login-otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit OTP (e.g. 123456)"
                      className="w-full login-emerald-input pl-9 pr-3 py-2.5 text-sm font-mono tracking-widest font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                </div>

                {loginPinError && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                    <div className="flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold">{loginPinError}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-amber-200/60">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setSignupEmail(loginEmail);
                          setSignupName('');
                          setLoginPinError(null);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <UserIcon className="w-3 h-3" />
                        <span>Register / Sign Up Now</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!loginEmail || !loginOtp}
                  className="w-full py-3 login-emerald-btn text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Verify & Sign In to Vault</span>
                </button>

                {/* Quick Recovery Helper on OTP Tab */}
                <div className="pt-1 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                  <span>Need to reset your 6-digit PIN?</span>
                  <button
                    type="button"
                    onClick={() => {
                      showToast('Opening 6-Digit PIN recovery flow...');
                      openForgotPinModal(loginEmail);
                    }}
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                  >
                    Forgot / Reset PIN
                  </button>
                </div>
              </form>
            )}

          </div>
        )}

        {/* SIGNUP VIEW */}
        {authMode === 'signup' && (
          <div className="login-emerald-card p-5 space-y-4 animate-in zoom-in-98 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Create Institutional Account</h3>
                <p className="text-[11px] text-slate-500 font-medium">Includes ₹100 Welcome Bonus & 2-Tier Affiliate Rights</p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded border border-emerald-200">
                Instant KYC
              </span>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-3">
              
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g., Arjun Dev"
                    className="w-full login-emerald-input pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email Address + OTP trigger */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => handleSignupEmailChange(e.target.value)}
                      placeholder="e.g., yourname@domain.com"
                      className={`w-full login-emerald-input pl-9 pr-3 py-2 text-xs rounded-xl focus:outline-none ${
                        duplicateEmailError ? 'border-amber-400 ring-2 ring-amber-100' : ''
                      }`}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendSignupOTP}
                    disabled={isSendingOtp || otpCountdown > 0 || !signupEmail.includes('@') || Boolean(duplicateEmailError)}
                    className="login-emerald-btn px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5 min-w-[85px]"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : otpCountdown > 0 ? (
                      `${otpCountdown}s`
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                </div>
              </div>

              {/* Duplicate Email Warning Alert Banner */}
              {duplicateEmailError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-800">Duplicate Account Detected</p>
                      <p className="text-[11px] text-amber-800 mt-0.5">{duplicateEmailError}</p>
                      
                      <button
                        type="button"
                        onClick={() => switchToLoginWithEmail(signupEmail)}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Switch to Sign In (Login)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Security PIN + Confirm PIN */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Create 6-Digit PIN
                  </label>
                  <input
                    id="signup-pin-input"
                    name="signupPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="new-password"
                    maxLength={6}
                    value={signupPin}
                    onChange={(e) => setSignupPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="6 digits"
                    className="w-full login-emerald-input px-3 py-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm PIN
                  </label>
                  <input
                    id="signup-confirm-pin-input"
                    name="signupConfirmPin"
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="new-password"
                    maxLength={6}
                    value={signupConfirmPin}
                    onChange={(e) => setSignupConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Repeat PIN"
                    className="w-full login-emerald-input px-3 py-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Sponsor Referral Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Sponsor Referral Code (Optional)</span>
                  <span className="text-[10px] text-amber-700 font-semibold">Tier 1: 4% | Tier 2: 2% | Tier 3: 1%</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={signupReferral}
                    onChange={(e) => setSignupReferral(e.target.value.toUpperCase())}
                    placeholder="e.g., JUS7789 or ROHIT99"
                    className="w-full login-emerald-input pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Dispatched OTP notification */}
              {pendingOTP && pendingOTP.email === signupEmail.toLowerCase().trim() && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>6-digit verification OTP successfully dispatched to your email. Please check your inbox.</span>
                </div>
              )}

              {/* OTP Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit Email Verification Code
                </label>
                <input
                  id="signup-otp-input"
                  name="signup-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={signupOtp}
                  onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP received"
                  className="w-full login-emerald-input px-3 py-2.5 text-sm font-mono tracking-widest font-bold text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-none"
                  required
                />
              </div>

              {/* Bonus Announcement */}
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong className="text-amber-800">Welcome Benefit:</strong> ₹100 registration bonus will be instantly deposited into your available vault.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!signupName || !signupEmail || signupPin.length !== 6 || Boolean(duplicateEmailError)}
                className="w-full py-3 login-emerald-btn text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Gmail OTP & Complete Registration</span>
              </button>

            </form>

          </div>
        )}

      </div>

      {/* Default Test Accounts & Fallback Access */}
      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        email={modalTargetEmail}
        purpose={modalPurpose}
        initialApiError={modalApiError}
        onVerified={handleModalVerified}
      />

      {/* Forgot 6-Digit PIN Recovery Workflow Modal */}
      <ForgotPinModal
        isOpen={isForgotPinModalOpen}
        onClose={() => setIsForgotPinModalOpen(false)}
        initialEmail={forgotPinEmail || loginEmail}
        onSuccessRedirect={(resetUserEmail) => {
          setAuthMode('login');
          setLoginMethod('pin');
          setLoginEmail(resetUserEmail);
          setLoginPin('');
        }}
      />

      {/* Institutional Security Footer */}
      <div className="mt-4 pt-2 border-t border-slate-200 text-center space-y-3">
        {/* Quick Links: Download APK & About Us */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('download')}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-1.5 border border-emerald-300/80 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>Download APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('about')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-300/80 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Globe className="w-3.5 h-3.5 text-slate-700" />
            <span>About Us</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-1 hover:text-slate-800 cursor-pointer font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>24/7 Priority Desk</span>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 font-medium">
          © 2026 juspay. All settlements guaranteed under automated multi-tier smart contracts.
        </p>
      </div>

    </div>
  );
};
export default AuthScreen;
