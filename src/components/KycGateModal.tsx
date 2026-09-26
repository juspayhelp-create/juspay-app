import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { triggerConfirmSound, triggerCancelSound } from '../utils/haptics';

export interface KycGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED' | 'VERIFIED' | string;
  onOpenKycForm: () => void;
}

export const KycGateModal: React.FC<KycGateModalProps> = ({
  isOpen,
  onClose,
  kycStatus = 'NOT_SUBMITTED',
  onOpenKycForm
}) => {
  if (!isOpen) return null;

  const normalizedStatus = (kycStatus || 'NOT_SUBMITTED').toUpperCase();

  // Status configuration based on user requirements
  let title = 'KYC Verification Required';
  let body = 'To protect your funds and comply with financial standards, you must complete identity verification before initiating payouts.';
  let primaryButtonText = 'Complete KYC Now';
  let isActionable = true;

  if (normalizedStatus === 'PENDING') {
    title = 'Verification Under Review';
    body = 'Your identity documents are currently pending manual approval by our compliance desk. Withdrawals will unlock immediately after approval.';
    primaryButtonText = 'Got It';
    isActionable = false;
  } else if (normalizedStatus === 'REJECTED') {
    title = 'Verification Incomplete';
    body = 'Your KYC was rejected. Please review your details and resubmit valid documents.';
    primaryButtonText = 'Re-verify KYC';
    isActionable = true;
  }

  const handlePrimaryClick = () => {
    triggerConfirmSound();
    if (isActionable) {
      onClose();
      onOpenKycForm();
    } else {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        triggerCancelSound();
        onClose();
      }}
    >
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-200 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Decorative Top Gradient */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          normalizedStatus === 'PENDING' 
            ? 'bg-amber-500' 
            : normalizedStatus === 'REJECTED' 
              ? 'bg-rose-500' 
              : 'bg-emerald-500'
        }`} />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerCancelSound();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="pt-2">
          {normalizedStatus === 'PENDING' ? (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
          ) : normalizedStatus === 'REJECTED' ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Title & Body */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Withdrawal Security Check
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
            {body}
          </p>
        </div>

        {/* Compliance Footer Note */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Strict KYC compliance safeguards your assets</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handlePrimaryClick}
            className={`w-full py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
              normalizedStatus === 'PENDING'
                ? 'bg-slate-900 hover:bg-slate-800 text-white'
                : normalizedStatus === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>{primaryButtonText}</span>
            {isActionable && <ArrowRight className="w-3.5 h-3.5" />}
          </button>

          {isActionable && (
            <button
              type="button"
              onClick={() => {
                triggerCancelSound();
                onClose();
              }}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
