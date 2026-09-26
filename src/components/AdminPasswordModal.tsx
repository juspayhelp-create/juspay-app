import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  ArrowRight, 
  AlertTriangle, 
  X, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { triggerConfirmSound, triggerCancelSound, triggerSwitchSound, triggerSuccessSound } from '../utils/haptics';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { verifyAdminPassword, showToast } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPass = password.trim();
    console.log('[AdminPasswordModal] Submitting password attempt. Length:', trimmedPass.length);

    if (!trimmedPass) {
      setErrorMsg('Please enter the master security credentials.');
      return;
    }

    triggerConfirmSound();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      console.log('[AdminPasswordModal] Before verifyAdminPassword, localStorage juspay_admin_token:', localStorage.getItem('juspay_admin_token'));
      const result = await verifyAdminPassword(trimmedPass);
      console.log('[AdminPasswordModal] After verifyAdminPassword, result:', result);
      console.log('[AdminPasswordModal] Current localStorage juspay_admin_token:', localStorage.getItem('juspay_admin_token'));
      
      if (result.success) {
        triggerSuccessSound();
        console.log('[AdminPasswordModal] Authentication successful. Ensuring token is in localStorage:', result.token || localStorage.getItem('juspay_admin_token'));
        if (result.token) {
          localStorage.setItem('juspay_admin_token', result.token);
        }
        console.log('[AdminPasswordModal] Final confirmed localStorage juspay_admin_token:', localStorage.getItem('juspay_admin_token'));
        
        showToast('Console authorization granted.');
        setPassword('');
        setErrorMsg(null);
        onClose();
        if (onSuccess) {
          try {
            onSuccess();
          } catch (callbackErr) {
            console.warn('[AdminPasswordModal] Warning during onSuccess callback:', callbackErr);
          }
        }
      } else {
        console.warn('[AdminPasswordModal] Authentication failed:', result.error);
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);
        setErrorMsg(result.error || 'Invalid master credentials. Access denied.');
      }
    } catch (err: any) {
      console.error('[AdminPasswordModal] Exception during verification:', err);
      setErrorMsg(err?.message || 'Verification service failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSafety = () => {
    triggerCancelSound();
    setPassword('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div 
      id="admin-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        id="admin-auth-card"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 p-5 text-white relative">
          <button
            type="button"
            onClick={handleBackToSafety}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-wide uppercase">
                  Management Console Access
                </h3>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-mono font-black uppercase rounded text-emerald-300">
                  Protected
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Authentication check required for system management
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-slate-800 text-xs">
            <Lock className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="font-bold block text-slate-900">
                Restricted Operational Zone
              </span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Entering this section permits access to real-time liquidity ledgers, deposit and payout authorizations, and SLA notice management.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-master-password"
                className="block text-xs font-bold text-slate-700 tracking-wide"
              >
                Security Master Key
              </label>

              <div className="relative">
                <input
                  id="admin-master-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Enter master key..."
                  disabled={isLoading}
                  autoFocus
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 pl-10 pr-10 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans transition-all"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                
                <button
                  type="button"
                  onClick={() => {
                    triggerSwitchSound();
                    setShowPassword(!showPassword);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBackToSafety}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold text-xs transition-all active:scale-95 cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                id="admin-verify-btn"
                type="submit"
                disabled={isLoading || !password.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-extrabold text-xs shadow-md disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secure Credential Hint Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Security: SHA-256 JWT Encrypted</span>
            <span className="text-emerald-700 font-bold">Clearance: Level 4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
